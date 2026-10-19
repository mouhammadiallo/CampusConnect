# CampusConnect UASZ

MVP foundation for the UASZ campus community platform. The repository is a modular monolith: one Spring Boot API and one React client, with modules grouped by business capability.

## Workspace status

This workspace began as an empty ChatGPT project mirror (no existing application or Git repository). The `sources/` directory is reference-only and should remain untouched.

## Structure

```text
backend/   Spring Boot API; packages are organized by domain module
frontend/  React + TypeScript + Vite client
```

Initial backend modules should be added under `backend/src/main/java/sn/uasz/campusconnect/` (for example `identity`, `feed`, `resources`, `events`, `messaging`, `moderation`). Keep HTTP controllers, application services, domain types, and persistence adapters inside each module. Share only stable cross-module contracts.

## Prerequisites

- Java 21 and Maven 3.6.3+
- Node.js 20.19+ or 22.12+
- MongoDB 7+ (local or managed)

## Local setup

1. Start MongoDB. The default local URI is `mongodb://localhost:27017/campusconnect`; set `MONGODB_URI` or add it to `.env` to use another instance.
2. Start the API with `./backend/run-local.ps1` from the repository root, or `./run-local.ps1` from `backend/`. The script creates and saves a random `JWT_SECRET` in the Git-ignored root `.env` file when needed, then reuses it on later runs. It locates Maven through `PATH` or a Chocolatey installation and keeps the Maven cache under your Windows profile. It supports Windows PowerShell 5.1.
3. Start the client from `frontend/` with `npm install` then `npm run dev`.
4. Visit `http://localhost:5173`; the API health endpoint is `http://localhost:8080/api/health`, and OpenAPI UI is at `http://localhost:8080/swagger-ui.html`.

PowerShell (Windows) API startup:

```powershell
Set-Location backend
.\run-local.ps1
```

Use this script instead of `mvn spring-boot:run` on Windows: it loads `.env`, validates or creates `JWT_SECRET`, locates Maven, and handles Windows PowerShell's Java version output. If CampusConnect already listens on port 8080, it reports that the API is already running instead of starting a duplicate instance.

## Netlify deployment

The root `netlify.toml` is configured for this repository layout: Netlify builds the React client from `frontend/`, publishes `frontend/dist`, and serves React Router routes through the SPA fallback. Connect the GitHub repository that contains this root file to Netlify; the build settings are read automatically.

CampusConnect's Spring Boot API is a separate service and must be deployed on a Java-capable host. In Netlify, add the build environment variable `VITE_API_BASE_URL` with the API's public HTTPS origin (for example, `https://api.example.com`, without a trailing slash or `/api`). This value is public and must not contain secrets. Redeploy after changing it.

On the API host, configure `MONGODB_URI` and a strong random `JWT_SECRET`, then set `APP_WEB_ALLOWED_ORIGINS` to the exact Netlify site origin (for example, `https://campusconnect-uasz.netlify.app`). This origin enables the API's HTTP CORS policy and the chat WebSocket origin check. Add additional comma-separated origins only when needed. Keep uploads on durable object storage before relying on them in production; the default local upload directory may not persist across host restarts.

Local Vite development keeps `VITE_API_BASE_URL` blank and continues to use the `/api` and `/ws` proxies to `localhost:8080`.

## Security notes

- Never commit `.env`, real JWT keys, database passwords, or production configuration.
- The API is configured for stateless bearer JWT authentication. The starter key is for local development only; production secrets belong in the deployment platform's secret manager.
- Public identity endpoints are `POST /api/auth/register` and `POST /api/auth/login`. Passwords are BCrypt-hashed, new accounts receive only the `STUDENT` role, and successful authentication returns a 12-hour bearer token. Registration accepts email, full name, password (12–72 characters), and optional department/study level. Email verification and password reset are not part of this first slice.
- Configure CORS narrowly for deployed environments; the local Vite origin is allowed for development.
- New accounts cannot choose privileged roles. To assign a moderator or administrator, register that account, add its email to `CAMPUS_MODERATOR_EMAILS` or `CAMPUS_ADMIN_EMAILS`, then restart the API. The role is refreshed into the user's token on the next login.

## Git branch guidance

Initialize Git if needed, then use `main` for reviewed stable work and short-lived branches such as `feat/identity-registration`, `feat/campus-feed`, and `fix/jwt-config`. Commit one coherent change at a time and merge through review. Do not develop directly on `main`.

## MVP implementation sequence

1. ✅ Identity: account registration, roles, profile basics, password hashing, and access-token issuance.
2. ✅ Feed: posts, comments, and likes with MongoDB persistence.
3. ✅ Resources and campus events, including resource search and event RSVPs.
4. ✅ Moderation: reports, review queue, warnings, and time-limited account suspensions.
5. ✅ Messaging: direct and group conversations with MongoDB history and authenticated WebSocket delivery. Redis is deferred until multi-instance delivery is needed.
6. ✅ Campus classifieds: searchable listings for rides, housing, sales, and lost/found; owners can close listings and members can report them.
7. ✅ Student profile: edit name, department, study level, bio, avatar URL, skills, and public links.
8. ✅ Campus directory: search members by name and view their public profile details.
9. ✅ Quick polls: create questions with 2–6 options, collect one vote per member, and close polls as their author.

## Student profile

`GET /api/profile/me` reads the authenticated user's profile. `PUT /api/profile/me` updates the same profile with `fullName`, `department`, `studyLevel`, `bio`, `avatarUrl`, `skills` (up to 10), and `socialLinks` (`website`, `linkedin`, `github`, `instagram`). Avatar and social links must use HTTP(S). The API returns a safe profile DTO and never returns the password hash. Image upload is deferred; provide an existing image URL for now.

The authenticated campus directory uses `GET /api/profiles?q=awa` to search by name (minimum two characters; at most 30 results) and `GET /api/profiles/{userId}` to view a public profile. Public profiles omit email, role, and account status.

## Quick polls

All poll routes require a bearer token. `GET /api/polls?page=0&size=50` lists polls with the current member's vote and per-option totals. `POST /api/polls` accepts `{ "question": "...", "options": ["Choice A", "Choice B"] }` (2–6 unique choices). Members vote once using `POST /api/polls/{pollId}/votes` with `{ "optionId": "0" }`; option IDs are zero-based indexes in the options array. The poll author can close a poll using `POST /api/polls/{pollId}/close`.

## Feed API

All feed endpoints require `Authorization: Bearer <accessToken>`:

- `GET /api/posts?page=0&size=20` — newest posts first (page size capped at 100).
- `POST /api/posts` — create `{ "content": "...", "mediaUrl": "https://..." }`; `mediaUrl` is optional.
- `GET /api/posts/{postId}/comments?page=0&size=50` and `POST /api/posts/{postId}/comments` with `{ "content": "..." }`.
- `POST /api/posts/{postId}/likes` and `DELETE /api/posts/{postId}/likes` — add/remove the current user's like.

## Resources and events API

All routes require a bearer token. Resources are catalog entries that point to an HTTP(S) link; direct file upload is deferred until a storage service is selected.

- `GET /api/resources?q=algebra&ufr=Sciences&mention=Mathematiques&studyLevel=L2&page=0&size=20` — search resources; filters are optional.
- `POST /api/resources` — add `{ "title": "...", "description": "...", "type": "COURSE", "ufr": "...", "mention": "...", "studyLevel": "...", "url": "https://..." }`.
- `GET /api/events?page=0&size=20` — upcoming events in start-time order.
- `POST /api/events` — add `{ "title": "...", "description": "...", "location": "...", "startsAt": "2030-01-01T10:00:00Z" }`.
- `POST /api/events/{eventId}/rsvp` and `DELETE /api/events/{eventId}/rsvp` — RSVP or cancel attendance.

## Moderation API

All authenticated users may report posts, comments, resources, and events via `POST /api/reports` with `{ "contentType": "POST", "contentId": "...", "reason": "SPAM", "details": "..." }`. A user cannot report their own content or submit duplicate reports for the same item. Users configured as moderators or admins see the moderation tab and can review `GET /api/moderation/reports`, then resolve a report via `POST /api/moderation/reports/{reportId}/resolve` with `{ "action": "WARN", "note": "..." }`. Actions are `DISMISS`, `WARN`, or `SUSPEND`; suspensions last 1–720 hours. Decisions are recorded in the moderation audit collection. Suspensions invalidate the user's existing access token on the next protected API request.

## Messaging

All HTTP routes require a bearer token. Search contacts by name or email using `GET /api/conversations/contacts?q=di`; create a direct or group conversation using `POST /api/conversations` with `{ "participantIds": ["user-id-1", "user-id-2"], "title": "Groupe de TD" }`. For a direct conversation, pass one other participant and omit `title`; for a group, pass at least two others and a title (up to 100 characters). `GET /api/conversations` lists the current user's conversations, and `GET /api/conversations/{conversationId}/messages?size=50` returns recent history (maximum 100).

The browser connects to `/ws/chat` and sends an `AUTH` JSON frame with its JWT, then `SUBSCRIBE` with a conversation ID. Messages use `SEND` frames with `conversationId` and `content`; saved messages are delivered to connected members as `MESSAGE` frames. The API checks membership before history reads, subscriptions, and sends, and checks account suspension on each frame. Local Vite development proxies `/ws` to the API. In deployment, serve the application over HTTPS so the browser uses secure WebSockets (`wss://`).

## Campus classifieds

All routes require a bearer token. `GET /api/classifieds?q=Ziguinchor&category=CARPOOL&page=0&size=20` searches active listings; `q` and `category` are optional. Categories: `CARAVAN`, `CARPOOL`, `HOUSING`, `SALE`, `LOST_FOUND`, `OTHER`. `POST /api/classifieds` accepts `{ "title": "...", "description": "...", "category": "CARPOOL", "price": 5000, "location": "..." }`; price and location are optional. Prices are in FCFA. Owners can close a listing with `POST /api/classifieds/{id}/close`. Any other member can report a listing with `POST /api/reports` using `contentType: "CLASSIFIED"`.

### Try messaging with two accounts

1. Keep MongoDB running. In a PowerShell window at `backend`, start the API with `./run-local.ps1`.
2. In another PowerShell window at `frontend`, start the client with `node 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' run dev` (or `npm run dev` if that command works there).
3. Open `http://localhost:5173` and sign in with the first account. Open a private browser window (or another browser) and sign in with a second account.
4. In the first window, open **Messages**, search for the second account by name or email, and click it. In the second window, open **Messages** and select the new conversation.
5. Send a message from either window. It should appear in the other window immediately. Refresh either page and reopen the conversation to confirm the history was saved.
6. To try a group, search for several accounts, tick their checkboxes, enter a group name, and choose **Créer le groupe**. A group contains its creator plus at least two selected accounts.

## Current starter scope

The API has a public health endpoint, MongoDB configuration, registration/login, JWT issuance and validation, editable student profiles and a campus directory, quick polls, a paginated feed with comments, likes and authenticated file attachments, searchable academic resources with optional PDF uploads, upcoming campus events with RSVPs, a report/sanction moderation workflow, direct/group messaging with WebSocket delivery, and searchable campus classifieds. The React client includes sign-in, the feed, profiles, the member directory, polls, resources, events, messaging, classifieds, reporting controls, and a role-restricted moderation queue.

## Media and resource uploads

Authenticated members can attach JPEG, PNG, or PDF files up to 10 MB to posts, or upload a PDF (up to 10 MB) as an academic resource instead of providing a link. Uploads are stored in `APP_UPLOAD_DIR` (default `./uploads` relative to the backend working directory); metadata stays in MongoDB. The API serves files only to authenticated members. For production, point `APP_UPLOAD_DIR` to durable storage or replace the local adapter with object storage before using multiple API instances.
