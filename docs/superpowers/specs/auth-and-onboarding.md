# Auth & Onboarding — Feature Specification

**Date:** 2026-03-28
**Status:** Prototype complete (localStorage). Supabase migration pending.
**Priority:** P0 — blocks production launch

---

## 1. Overview

SprintBrain has two distinct onboarding paths:

| Path | Actor | Entry Point | Outcome |
|------|-------|------------|---------|
| **Admin signup** | First user | `/signup` | Creates workspace + first admin account |
| **Assignee join** | Team member | `/join/[code]` | Joins existing workspace as assignee |

No public registration. All users enter through one of these two paths.

---

## 2. Current Implementation (localStorage Prototype)

### What exists today
- `/signup` — creates workspace + admin in Zustand store (localStorage)
- `/login` — name-only select from existing users (no password)
- `/join/[code]` — joins workspace by matching invite code
- Client-side auth redirect (AppShell checks `currentUser`)
- `_hasHydrated` guard prevents flash of wrong role on role-gated pages

### What's wrong with it
- No real password — anyone can log in as any user
- Auth state lives in localStorage — clears on private browsing / cache clear
- Multi-device = impossible (phone ≠ desktop)
- No server-side session — API routes can't verify identity
- Invite codes never expire

---

## 3. Target Implementation (Supabase Auth)

### 3.1 Signup Flow

```
/signup → Step 1: Workspace name
        → Step 2: Admin email + password + display name
        → Supabase: createUser({ email, password })
        → DB: INSERT workspace, INSERT user (role=admin, workspace_id)
        → Set session cookie
        → Redirect → /dashboard
```

**Validation rules:**
- Workspace name: 3–50 chars, no special characters except `-`
- Email: valid RFC 5322
- Password: min 8 chars, 1 uppercase, 1 number
- Display name: 2–40 chars

**Error states:**
- Email already registered → "An account with this email already exists. [Login →]"
- Weak password → inline feedback per rule
- Network error → "Something went wrong. Try again." + retry button

### 3.2 Login Flow

```
/login → Email + password form
       → Supabase: signInWithPassword({ email, password })
       → Session: stored in httpOnly cookie (Supabase handles)
       → Redirect → intended URL or /dashboard
```

**Features:**
- "Remember me" — extends session from 1 day to 30 days
- Forgot password → email link (Supabase built-in)
- OAuth (post-launch): Google, GitHub buttons below form

**Error states:**
- Wrong credentials → "Incorrect email or password" (no specificity — prevents user enumeration)
- Account not found → same generic message
- Rate limited (5 attempts / 15 min) → "Too many attempts. Try again in X minutes."

### 3.3 Invite + Join Flow

```
Admin: /team → "Invite Member" → POST /api/auth/invite
             → DB: INSERT invite { code, workspace_id, role, expires_at, created_by }
             → Returns: invite URL = /join/[code]
             → Admin copies and shares link

Assignee: /join/[code] → GET → validate code (not expired, not used)
         → Step 1: Email + password + display name
         → Supabase: createUser({ email, password })
         → DB: INSERT user { workspace_id, role='assignee', ... }
         → DB: UPDATE invite { used_at }
         → Set session → Redirect → /dashboard
```

**Invite code rules:**
- Format: 8-char alphanumeric (e.g., `A3F7K2QX`)
- Expires: 7 days from creation
- Single use (marked `used_at` on join)
- Admin can revoke (DELETE)

**Error states:**
- Code expired → "This invite link has expired. Ask your admin for a new one."
- Code already used → same message (don't reveal which)
- Code not found → same message

### 3.4 Session Management

```typescript
// middleware.ts (runs on every request)
export async function middleware(req: NextRequest) {
  const { supabase, response } = createServerClient(req)
  const { data: { session } } = await supabase.auth.getSession()

  const isAuthRoute = ['/login', '/signup'].some(p => req.nextUrl.pathname.startsWith(p))
  const isJoinRoute = req.nextUrl.pathname.startsWith('/join')

  if (!session && !isAuthRoute && !isJoinRoute) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
  return response
}
```

**Session lifetime:**
- Default: 1 hour access token, 7 day refresh token
- "Remember me": 30 day refresh token
- Inactivity timeout: not implemented (post-launch)

### 3.5 Logout

```
POST /api/auth/session (DELETE) or client: supabase.auth.signOut()
→ Clears Supabase session cookie
→ Clears Zustand store (resetAll())
→ Redirect → /login
```

---

## 4. Role System

| Role | Description | Can Do |
|------|-------------|--------|
| `admin` | Workspace owner or designated admin | Everything: manage team, start/end sprints, approve proposals, assign stories, access settings |
| `assignee` | Team member | Move own stories, propose stories, view board, add comments, view results |

**Rules:**
- Role is stored in the `users` DB table — not in the JWT (JWTs are short-lived)
- Every API route fetches `role` from DB on each request (never trusts client-passed role)
- RLS uses `auth.uid()` to look up the role from the `users` table server-side
- Role cannot be changed by the user themselves

**Future:** `observer` role — read-only, no story interaction (stakeholder view).

---

## 5. API Routes

### POST /api/auth/signup
```typescript
// Request
{ workspaceName: string, adminName: string, email: string, password: string }

// Zod schema
z.object({
  workspaceName: z.string().min(3).max(50).regex(/^[\w\s-]+$/),
  adminName: z.string().min(2).max(40),
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[A-Z])(?=.*\d)/),
})

// Response 201
{ userId: string, workspaceId: string }

// Response 409
{ error: 'EMAIL_IN_USE' }
```

### POST /api/auth/invite
```typescript
// Request (admin only)
{ role?: 'assignee' } // only assignee for now

// Response 201
{ inviteCode: string, inviteUrl: string, expiresAt: string }
```

### POST /api/auth/join
```typescript
// Request
{ code: string, name: string, email: string, password: string }

// Response 201
{ userId: string }

// Response 404
{ error: 'INVITE_NOT_FOUND_OR_EXPIRED' }

// Response 409
{ error: 'EMAIL_IN_USE' }
```

---

## 6. Security Requirements

- Passwords hashed by Supabase (bcrypt)
- Sessions: httpOnly Supabase cookies (not accessible to JS)
- Invite codes: cryptographically random (not sequential)
- Rate limit login: 5 attempts / 15 min per IP (Upstash Redis)
- Rate limit invite generation: 10 invites / hour per admin
- Server middleware validates session on EVERY request to `(app)/` routes
- API routes fetch role from DB — never trust `role` from request body/headers

---

## 7. Migration from localStorage

When Supabase is introduced, existing users with localStorage data need a path:

```
Option A (preferred): Fresh start
  - Show banner: "We've upgraded to persistent accounts. Sign up to keep your data."
  - Existing localStorage data can be exported as JSON

Option B: One-time migration script
  - On first login after Supabase launch, offer "import your data"
  - Reads localStorage, POSTs to /api/migrate (one-time endpoint)
```

---

## 8. Test Coverage Required

| Test | Type | Priority |
|------|------|---------|
| Signup → workspace created + admin role | E2E | P0 |
| Login with correct credentials → dashboard | E2E | P0 |
| Login with wrong password → error message | E2E | P0 |
| Invite generation → link copy | E2E | P0 |
| Join via invite → assignee role | E2E | P0 |
| Expired invite → error page | E2E | P1 |
| Unauthenticated → /login redirect | E2E | P0 |
| Admin page → assignee role → redirect | E2E | P0 |
| Session persists across refresh | E2E | P0 |
| Logout → clears session | E2E | P0 |
