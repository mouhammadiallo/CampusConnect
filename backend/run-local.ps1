param(
    [switch]$CompileOnly
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $projectRoot '.env'

function Get-DotEnvValue([string]$Name) {
    if (-not (Test-Path -LiteralPath $envFile)) { return $null }
    foreach ($line in Get-Content -LiteralPath $envFile) {
        if ($line -match ('^\s*' + [regex]::Escape($Name) + '\s*=\s*(.*?)\s*$')) {
            $value = $Matches[1]
            if ($value.Length -ge 2 -and (($value[0] -eq '"' -and $value[-1] -eq '"') -or ($value[0] -eq "'" -and $value[-1] -eq "'"))) {
                $value = $value.Substring(1, $value.Length - 2)
            }
            return $value
        }
    }
    return $null
}

function Set-DotEnvValue([string]$Name, [string]$Value) {
    $lines = @()
    if (Test-Path -LiteralPath $envFile) {
        $lines = @(Get-Content -LiteralPath $envFile | Where-Object { $_ -notmatch ('^\s*' + [regex]::Escape($Name) + '\s*=') })
    }
    $lines += "$Name=$Value"
    $encoding = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllLines($envFile, [string[]]$lines, $encoding)
}

$jwtSecret = $env:JWT_SECRET
if ([string]::IsNullOrWhiteSpace($jwtSecret) -or [System.Text.Encoding]::UTF8.GetByteCount($jwtSecret) -lt 32) {
    $jwtSecret = Get-DotEnvValue 'JWT_SECRET'
}

if ([string]::IsNullOrWhiteSpace($jwtSecret) -or [System.Text.Encoding]::UTF8.GetByteCount($jwtSecret) -lt 32) {
    $secretBytes = New-Object byte[] 32
    $rng = New-Object System.Security.Cryptography.RNGCryptoServiceProvider
    try { $rng.GetBytes($secretBytes) } finally { $rng.Dispose() }
    $jwtSecret = [Convert]::ToBase64String($secretBytes)
    Set-DotEnvValue 'JWT_SECRET' $jwtSecret
    Write-Host 'Clé JWT locale créée dans .env (fichier ignoré par Git).'
}
$env:JWT_SECRET = $jwtSecret

if ([string]::IsNullOrWhiteSpace($env:MONGODB_URI)) {
    $mongoUri = Get-DotEnvValue 'MONGODB_URI'
    if ([string]::IsNullOrWhiteSpace($mongoUri)) { $mongoUri = 'mongodb://localhost:27017/campusconnect' }
    $env:MONGODB_URI = $mongoUri
}

$mavenCommand = Get-Command mvn -ErrorAction SilentlyContinue
if ($mavenCommand) {
    $mavenExecutable = $mavenCommand.Source
} else {
    # Chocolatey installations are sometimes available by absolute path even
    # when its shim or Maven bin directory has not reached the current PATH.
    if ($env:ChocolateyInstall) {
        $mavenRoot = Join-Path $env:ChocolateyInstall 'lib\maven'
    } else {
        $mavenRoot = 'C:\ProgramData\chocolatey\lib\maven'
    }
    $mavenExecutable = Get-ChildItem -Path $mavenRoot -Filter mvn.cmd -File -Recurse -ErrorAction SilentlyContinue |
        Where-Object { $_.Directory.Name -eq 'bin' } |
        Sort-Object FullName -Descending |
        Select-Object -First 1 -ExpandProperty FullName
}

if (-not $mavenExecutable) {
    throw 'Maven est introuvable. Installe Maven avec Chocolatey ou ajoute son dossier bin à PATH, puis relance ce script.'
}

$javaCommand = Get-Command java -ErrorAction SilentlyContinue
if (-not $javaCommand) { throw 'Java est introuvable. Installe un JDK puis configure JAVA_HOME et PATH.' }

# Windows PowerShell 5.1 treats Java's normal version output on stderr as an
# error record. Temporarily continue so the version check does not abort startup.
$previousErrorActionPreference = $ErrorActionPreference
try {
    $ErrorActionPreference = 'Continue'
    $javaVersion = (& $javaCommand.Source -version 2>&1 | Select-Object -First 1 | ForEach-Object { $_.ToString() })
} finally {
    $ErrorActionPreference = $previousErrorActionPreference
}
if ($javaVersion -notmatch '21') {
    Write-Warning "Le projet cible Java 21. Java détecté : $javaVersion. Si le build échoue, sélectionne un JDK 21 via JAVA_HOME."
}

# Some Windows/JDK installations resolve the Maven cache to C:\.m2 and fail
# with LocalRepositoryNotAccessibleException. Keep the cache in the user's profile.
if ($env:MAVEN_OPTS -notmatch 'maven\.repo\.local=') {
    $mavenRepository = Join-Path $env:USERPROFILE '.m2\repository'
    $env:MAVEN_OPTS = (($env:MAVEN_OPTS + ' -Dmaven.repo.local=' + $mavenRepository).Trim())
}

if (-not $CompileOnly) {
    $existingApi = $null
    try {
        $existingApi = Invoke-WebRequest -Uri 'http://127.0.0.1:8080/api/health' -UseBasicParsing -TimeoutSec 2
    } catch {
        # A connection failure means the port may be free; inspect the listener below.
    }
    if ($existingApi -and $existingApi.StatusCode -eq 200 -and $existingApi.Content -match 'campusconnect-api') {
        Write-Host 'CampusConnect API fonctionne déjà sur le port 8080.'
        return
    }

    $portListeners = @(Get-NetTCPConnection -State Listen -LocalPort 8080 -ErrorAction SilentlyContinue)
    if ($portListeners.Count -gt 0) {
        $processIds = ($portListeners | Select-Object -ExpandProperty OwningProcess -Unique) -join ', '
        throw "Le port 8080 est occupé par le processus $processIds. Arrête ce processus ou libère le port, puis relance le script."
    }
}

if ($CompileOnly) {
    Push-Location $PSScriptRoot
    $previousErrorActionPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        & $mavenExecutable -DskipTests compile
        $mavenExitCode = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $previousErrorActionPreference
        Pop-Location
    }
} else {
    Push-Location $PSScriptRoot
    $previousErrorActionPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        & $mavenExecutable spring-boot:run
        $mavenExitCode = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $previousErrorActionPreference
        Pop-Location
    }
}

$global:LASTEXITCODE = $mavenExitCode
if ($mavenExitCode -ne 0) {
    throw "Maven s'est arrêté avec le code $mavenExitCode. Consulte les messages ci-dessus pour la cause."
}
