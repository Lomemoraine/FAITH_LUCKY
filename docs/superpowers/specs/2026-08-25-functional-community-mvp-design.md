# TFL SafeSpace Functional Community MVP Design

**Date:** 2026-08-25
**Status:** Approved design pending written-spec review

## 1. Purpose

Turn the current client-only SafeSpace prototype into a production-capable anonymous peer-support community. The first release must persist real community data, protect anonymous identities, support human moderation, and handle potential crisis content responsibly.

The first delivery target is a protected Vercel staging deployment backed by a dedicated Supabase project. Public launch is a separate approval after staging acceptance.

## 2. Current State

The existing Next.js application contains the approved support-first design, but all functional behavior is simulated inside `src/app/page.tsx`:

- Posts, replies, and reactions exist only in React state.
- The displayed counselor conversation is scripted.
- M-Pesa checkout and Care Pass generation are simulated.
- There is no durable identity, database, authorization, reporting, or moderation system.
- Refreshing the browser discards user-created state.

The redesign and existing responsive shell remain the visual foundation. This project changes application behavior and architecture rather than reopening the visual design.

## 3. Release Scope

### Included

- Public read access to community rooms and published text posts.
- Device-bound anonymous Supabase accounts with stable public pseudonyms.
- Persistent text posts and one-level text replies.
- One empathy reaction per anonymous profile and post.
- Author deletion of owned posts and replies.
- Community reporting of posts and replies.
- Server-side crisis phrase screening that creates advisory flags.
- Immediate Kenyan crisis resources for an author whose submission triggers the safety policy.
- A protected moderator dashboard with an actionable review queue.
- Moderator hide, restore, remove, suspend, unsuspend, and dismiss actions.
- Append-only, de-identified moderation audit records with 30-day retention after identity deletion.
- Self-service deletion of an anonymous identity and its public content.
- Server-side rate limits without a CAPTCHA or invite requirement.
- Protected Vercel staging deployment and a dedicated Supabase project.

### Excluded

- Voice-note recording, upload, transcription, or moderation.
- Realtime private counselor chat, counselor scheduling, or a counselor portal.
- Product management, order processing, delivery tracking, M-Pesa, or Care Pass generation.
- Automated clinical diagnosis, risk scoring, emergency dispatch, or claims of professional care.
- Automatic removal of content based only on keywords or report count.
- Multi-country crisis directories or legal-policy localization.
- Public production launch.

Counselor, Care Gifts, M-Pesa, and Care Pass areas remain visible only as accurate coming-soon states. They must not simulate successful conversations, payments, bookings, or entitlements. No interest form is included in this release, avoiding unnecessary collection of contact details.

## 4. Architecture

Use one integrated Next.js and Supabase application:

- **Next.js 14 App Router:** pages, server-rendered feed data, server actions or route handlers, moderator routes, validation, safe error responses, and staging access protection.
- **Supabase Auth:** anonymous authentication for community participants and email magic-link authentication for moderators.
- **Supabase PostgreSQL:** profiles, rooms, community content, reports, moderation state, and rate-limit buckets.
- **Supabase Row Level Security:** ownership, public visibility, staff access, and private-table isolation.
- **Vercel:** protected staging hosting and server-side environment configuration.

Public browsing does not create an account. The first write action creates an anonymous Supabase session and profile. The browser restores that session on later visits until the person clears site data or resets the identity.

Authenticated community mutations use a cookie-aware, user-scoped Supabase server client so Row Level Security remains active. Administrative Supabase credentials are server-only and are limited to operations that require them, such as deleting an Auth user. Every privileged operation first verifies the moderator role on the server.

## 5. Module Boundaries

### Identity

Provides anonymous-session creation, profile creation, pseudonym allocation, session restoration, suspension checks, and permanent identity reset. It exposes a public profile projection that never contains an Auth ID, email, IP address, or moderation state.

### Community

Provides cursor-paginated room feeds, post creation, one-level replies, empathy reactions, ownership-aware deletion, and canonical refresh after mutations. It contains no moderation credentials or crisis-policy implementation.

### Safety

Validates text and applies a narrowly defined crisis phrase policy during post and reply submission. A match returns a `showSafetyResources` result to the submitting browser and creates or raises a private moderation case. It does not diagnose the author and does not automatically hide content.

### Reporting

Accepts one report per reporter and target. Report reasons are fixed values: `harassment`, `hate`, `dangerous_advice`, `privacy`, `spam`, `crisis_concern`, and `other`. Optional context is private and visible only to moderators.

### Moderation

Provides the protected queue, case details, target history, case status changes, content visibility actions, profile suspension, and an append-only audit trail. It never exposes private reports or crisis flags to public clients.

### Deferred Services

Owns honest coming-soon states for counseling and commerce. The module contains no fake timers, scripted therapist responses, mock payment approvals, or generated voucher codes.

## 6. Data Model

All primary keys are UUIDs unless noted. All timestamps use UTC `timestamptz`.

### `profiles`

- `id`: Auth user ID, primary key, never exposed publicly.
- `public_id`: random UUID used by safe public projections.
- `anonymous_handle`: unique generated pseudonym.
- `avatar_id`: identifier from the approved avatar set.
- `status`: `active`, `suspended`, or `deleting`.
- `created_at`, `updated_at`.

### `rooms`

- `id`: stable text slug, primary key.
- `name`, `description`, `sort_order`, `is_active`.
- Seeded with the approved community topics.

### `posts`

- `id`, `author_id`, `room_id`, `content`.
- `status`: `published` or `hidden`.
- `created_at`, `updated_at`.
- Author deletion hard-deletes the row. Related replies, reactions, and target references follow the foreign-key behavior defined below.

### `replies`

- `id`, `post_id`, `author_id`, `content`.
- `status`: `published` or `hidden`.
- `created_at`, `updated_at`.
- Replies are one level deep; replies cannot target other replies.

### `reactions`

- `post_id`, `profile_id`, `created_at`.
- Composite primary key on `post_id, profile_id` enforces one empathy reaction per person.

### `reports`

- `id`, `reporter_id`, nullable `post_id`, nullable `reply_id`, `reason`, `context`, `created_at`.
- A check constraint requires exactly one of `post_id` or `reply_id`.
- Partial unique indexes on `reporter_id, post_id` and `reporter_id, reply_id` prevent duplicate reports.
- Target foreign keys use `ON DELETE CASCADE`, so reports never outlive the reported content.
- Reports are private and cannot be read by community users.

### `moderation_cases`

- `id`, `source`, `severity`, `target_kind`, nullable `post_id`, nullable `reply_id`, `status`.
- `source`: `safety_policy` or `user_report`.
- `severity`: `standard`, `priority`, or `critical`.
- `status`: `open`, `in_review`, `resolved`, or `dismissed`.
- `assigned_to`, `created_at`, `updated_at`, `resolved_at`.
- A database trigger requires the matching `post_id` or `reply_id` when a case is created. The nonmatching field must be null.
- Target foreign keys use `ON DELETE SET NULL`. `target_kind` remains available for audit classification while the case finishes its retention period without retaining deleted content.

### `moderation_actions`

- `id`, `case_id`, `moderator_id`, `action`, `reason`, `created_at`, `expires_at`.
- `action`: `hide`, `restore`, `remove`, `suspend`, `unsuspend`, or `dismiss`.
- Rows are append-only. They contain identifiers and reasons, not copies of post or reply text.

### `staff_roles`

- `auth_user_id`, `role`, `created_at`, `revoked_at`.
- Initial role is `moderator`; the schema permits `admin` for later controlled use.
- Staff tables and policies are inaccessible to anonymous community clients.

### `rate_limit_buckets`

- `subject_hash`, `action`, `window_start`, `count`, `expires_at`.
- Composite primary key on `subject_hash, action, window_start`.
- Community-write buckets use an HMAC of the profile ID. Anonymous-account-creation buckets use a daily rotating HMAC of the request IP. Raw IP addresses are never stored or logged.
- Expired buckets are deleted automatically.

## 7. Row Level Security

RLS is enabled on every application table.

- Anyone may read active rooms and published posts and replies through public projections.
- Public projections expose `public_id`, handle, avatar, content, room, aggregate counts, and timestamps only.
- An authenticated anonymous profile may create content only as itself.
- Authors may delete their own posts and replies but may not update authorship or ownership fields.
- Active profiles may create and remove only their own empathy reactions.
- Active profiles may create reports but may not read reports or moderation state.
- Suspended profiles retain public read access but cannot create posts, replies, reactions, or reports.
- Moderator access requires a current `staff_roles` row and server-side role verification.
- Community clients cannot query staff roles, rate-limit data, reports, moderation cases, moderation actions, Auth IDs, or internal profile status.
- No browser receives the Supabase service-role key.

Database tests must prove each rule, including denial of cross-user deletes and direct private-table reads.

## 8. Moderator Authentication

The server-only `MODERATOR_EMAILS` environment variable contains normalized, comma-separated approved email addresses. A moderator requests a Supabase magic link from the private sign-in page. The authentication callback verifies the email against that allowlist before creating or refreshing the `staff_roles` row.

Removing an address from the environment allowlist and revoking its `staff_roles` row blocks future moderator access. Community participants never use email authentication in this release.

## 9. Community Workflows

### Browse

The initial feed is server-rendered. Filters request cursor-paginated room data. Pagination uses `(created_at, id)` cursors and stable descending order; it does not use an unbounded client-side array.

### First Write

When an unauthenticated visitor starts a write action, the app creates an anonymous Auth session and profile, then resumes the intended action. Failed identity creation leaves the draft in place and provides a retry action.

### Create Post Or Reply

1. Normalize whitespace and validate length.
2. Enforce account status and rate limits.
3. Evaluate the server-side safety policy.
4. Insert the content under the authenticated profile through RLS.
5. Create or prioritize a moderation case when required.
6. Return canonical content plus `showSafetyResources`.
7. Refresh the feed and show Kenyan safety resources when instructed.

### React

Reaction writes are idempotent. Creating an existing reaction is treated as success; removing a missing reaction is treated as success. Counts come from canonical database data.

### Report

The reporter chooses a fixed reason and may add private context. A duplicate report returns a neutral success response to avoid encouraging repeated submissions. Report count may raise queue priority but never hides content automatically.

### Delete Content

Authors confirm deletion. The server verifies ownership and hard-deletes the target. Post deletion cascades to replies and reactions. Reports are deleted with the target; associated moderation cases retain no content and set the target reference to null.

### Delete Identity

Identity reset requires an explicit confirmation step. The server marks the profile `deleting`, removes owned posts, replies, reactions, reports, and profile data in a transaction, de-identifies active moderation records, then deletes the Supabase Auth user. If Auth deletion fails, the nonpublic `deleting` profile blocks all activity and an idempotent retry completes removal. The client clears local session data only after the server confirms deletion, then returns to public read-only mode with a fresh-identity option.

## 10. Safety Behavior

The safety policy is a versioned, tested set of high-confidence phrase patterns. It is intentionally advisory and must be described in product copy as automated screening, not clinical assessment.

- A match does not prevent submission.
- A match does not label the author publicly.
- A match shows verified Kenyan crisis resources immediately after submission.
- A match creates a private moderation case.
- Critical patterns set case severity to `critical`; other matches use `priority`.
- The moderator dashboard sorts critical open cases first.
- Reports with reason `crisis_concern` create or prioritize a case.
- No email, SMS, or third-party alert is sent in this MVP; moderators monitor the dashboard queue.

Urgent help remains accessible from every primary view. Safety copy states that SafeSpace offers peer support and is not emergency care, a diagnostic service, or a substitute for a qualified professional.

The resource list is Kenya-only for this release and must be verified before staging acceptance. Resource phone links must work on mobile and display their organization and purpose.

## 11. Rate Limits

Limits are server-enforced and configurable without editing UI code. Initial defaults are:

- Posts: 3 per profile per rolling hour.
- Replies: 10 per profile per rolling hour.
- Reports: 5 per profile per rolling 24 hours.
- Reactions: 60 state changes per profile per rolling hour.
- Anonymous account creation: 5 per daily rotating request-IP hash per rolling 24 hours.

The database increments buckets atomically. Rate-limit responses include a safe retry time and do not disclose other account or network activity. No CAPTCHA or invite code is included.

## 12. Error Handling And Observability

- Server inputs use shared schemas and return typed success or error results.
- User-facing messages explain the next action without exposing database, policy, or authentication details.
- Optimistic reactions roll back on failure.
- Post and reply drafts remain intact after recoverable failures.
- Duplicate submissions use idempotency keys where retries could create extra content.
- Application logs use internal error codes and operation names only.
- Logs never contain post text, reply text, report context, Auth tokens, anonymous profile IDs, raw IP addresses, or moderator magic links.
- Unknown failures render a stable recovery state rather than silently discarding input.

## 13. Retention And Privacy

- Published content remains until its author or a moderator removes it.
- Rate-limit buckets expire automatically after their enforcement window.
- Identity deletion removes public content and authentication data immediately.
- De-identified moderation actions related to a deleted identity expire 30 days after deletion.
- No marketing analytics, advertising identifiers, or contact details are collected in this release.
- Privacy and community-guideline copy must accurately describe device-bound anonymous sessions, moderation, automated screening, retention, and the limits of anonymity.

This design is an engineering privacy baseline, not legal advice. Public launch requires review of the final privacy and community-policy text against applicable Kenyan requirements.

## 14. Testing Strategy

### Unit

- Input normalization and length validation.
- Pseudonym generation and collision retries.
- Safety-policy matching and severity mapping.
- Rate-limit window calculations.
- Moderation state transitions.
- Safe public-data projections.

### Database And RLS

- Migration application to a fresh local database.
- Anonymous ownership and cross-user denial.
- Public-read and private-table isolation.
- Reaction uniqueness and report uniqueness.
- Suspension enforcement.
- Moderator-only queue and actions.
- Delete and cascade behavior.
- Atomic rate-limit increments.

### Integration

- Anonymous session and profile creation.
- Post, reply, reaction, report, and deletion flows.
- Safety resource response and case creation.
- Identity reset and Auth-user removal.
- Moderator magic-link callback and allowlist denial.
- Moderation action and audit creation.

### End To End

- Browse without an account.
- Create the first anonymous identity during a write.
- Create, filter, react to, reply to, report, and delete content.
- Trigger and dismiss the safety-resource presentation.
- Reset identity.
- Sign in as an allowlisted moderator and process each case action.
- Confirm non-allowlisted staff access is denied.
- Confirm counselor and commerce areas show only coming-soon behavior.
- Verify keyboard access, focus handling, mobile layouts, and reduced motion.

### Security Acceptance

- No service-role credential appears in browser assets or responses.
- Cross-user mutations fail even when called directly.
- Suspended identities cannot write.
- Private reports and case data are not queryable by community clients.
- Staff role escalation cannot be performed by the browser.
- Raw IP addresses and sensitive community text do not appear in logs.
- Rate limits cannot be bypassed by repeating the same authenticated request.

## 15. Deployment And Configuration

Repository-managed Supabase migrations and seed data live under `supabase/`. Seed data contains rooms and clearly marked demonstration posts only.

Required environment values are:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MODERATOR_EMAILS`
- `RATE_LIMIT_HMAC_SECRET`
- `STAGING_ACCESS_PASSWORD`
- `NEXT_PUBLIC_SITE_URL`

The staging deployment uses middleware password protection controlled by `STAGING_ACCESS_PASSWORD`. Supabase Auth redirect URLs include only approved localhost and staging origins. Development and staging use separate data configuration; production values are not introduced during this release.

Migrations must support a clean apply from an empty dedicated Supabase project. Setup instructions cover project creation, Auth configuration, environment values, moderator provisioning, migration application, seed application, and rollback.

## 16. Acceptance Criteria

The functional community MVP is complete when:

1. A visitor can browse published posts without an account.
2. The first write creates and retains a device-bound anonymous identity.
3. Posts, replies, reactions, reports, and deletions persist in shared storage; the same anonymous identity is restored across refreshes on its original device.
4. RLS and server validation prevent unauthorized reads and mutations.
5. Safety matches show Kenyan resources and enter the private queue without automatically hiding content.
6. An allowlisted moderator can review, hide, restore, remove, suspend, unsuspend, and dismiss cases with an audit entry.
7. Identity reset removes authentication data and owned public content.
8. Rate limits return understandable retry states.
9. Counselor and commerce simulations are removed and replaced by honest coming-soon states.
10. Unit, database, integration, Playwright, accessibility, and security acceptance checks pass.
11. Migrations apply cleanly to a fresh dedicated Supabase project.
12. The protected Vercel staging deployment passes the complete acceptance journey.

Public launch, real counseling, voice content, commerce, M-Pesa, and Care Passes require separate approved specifications.
