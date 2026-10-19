package sn.uasz.campusconnect.moderation;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ResolveReportRequest(
        @NotNull ResolutionAction action,
        @Size(max = 1000) String note,
        @Min(1) @Max(720) Integer suspensionHours) {}
