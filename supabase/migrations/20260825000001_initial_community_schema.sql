-- Supabase initial community schema migration
-- Date: 2026-08-25
-- Spec: docs/superpowers/specs/2026-08-25-functional-community-mvp-design.md

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    public_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    anonymous_handle TEXT UNIQUE NOT NULL,
    avatar_id TEXT NOT NULL DEFAULT 'lotus',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleting')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. ROOMS TABLE
CREATE TABLE IF NOT EXISTS public.rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. POSTS TABLE
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    room_id TEXT NOT NULL REFERENCES public.rooms(id) ON DELETE RESTRICT,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. REPLIES TABLE
CREATE TABLE IF NOT EXISTS public.replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. REACTIONS TABLE (Empathy reaction, 1 per post per user)
CREATE TABLE IF NOT EXISTS public.reactions (
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (post_id, profile_id)
);

-- 6. REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    reply_id UUID REFERENCES public.replies(id) ON DELETE CASCADE,
    reason TEXT NOT NULL CHECK (reason IN ('harassment', 'hate', 'dangerous_advice', 'privacy', 'spam', 'crisis_concern', 'other')),
    context TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT report_target_check CHECK (
        (post_id IS NOT NULL AND reply_id IS NULL) OR
        (post_id IS NULL AND reply_id IS NOT NULL)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_unique_post ON public.reports (reporter_id, post_id) WHERE post_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_unique_reply ON public.reports (reporter_id, reply_id) WHERE reply_id IS NOT NULL;

-- 7. STAFF ROLES TABLE
CREATE TABLE IF NOT EXISTS public.staff_roles (
    auth_user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'moderator' CHECK (role IN ('moderator', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    revoked_at TIMESTAMPTZ
);

-- 8. MODERATION CASES TABLE
CREATE TABLE IF NOT EXISTS public.moderation_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL CHECK (source IN ('safety_policy', 'user_report')),
    severity TEXT NOT NULL CHECK (severity IN ('standard', 'priority', 'critical')),
    target_kind TEXT NOT NULL CHECK (target_kind IN ('post', 'reply')),
    post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
    reply_id UUID REFERENCES public.replies(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'dismissed')),
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    resolved_at TIMESTAMPTZ
);

-- 9. MODERATION ACTIONS TABLE (Append-only audit trail)
CREATE TABLE IF NOT EXISTS public.moderation_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES public.moderation_cases(id) ON DELETE CASCADE,
    moderator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('hide', 'restore', 'remove', 'suspend', 'unsuspend', 'dismiss')),
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at TIMESTAMPTZ
);

-- 10. RATE LIMIT BUCKETS TABLE
CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
    subject_hash TEXT NOT NULL,
    action TEXT NOT NULL,
    window_start TIMESTAMPTZ NOT NULL,
    count INT NOT NULL DEFAULT 1,
    expires_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (subject_hash, action, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_expires_at ON public.rate_limit_buckets (expires_at);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_posts_room_created ON public.posts (room_id, created_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts (author_id);
CREATE INDEX IF NOT EXISTS idx_replies_post_created ON public.replies (post_id, created_at ASC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_replies_author ON public.replies (author_id);
CREATE INDEX IF NOT EXISTS idx_moderation_cases_queue ON public.moderation_cases (status, severity, created_at DESC);

-- HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.is_moderator(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff_roles
    WHERE auth_user_id = user_id
      AND revoked_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.is_active_profile(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id
      AND status = 'active'
  );
$$;

-- ATOMIC RATE LIMIT INCREMENT FUNCTION
CREATE OR REPLACE FUNCTION public.increment_rate_limit(
    p_subject_hash TEXT,
    p_action TEXT,
    p_window_start TIMESTAMPTZ,
    p_expires_at TIMESTAMPTZ,
    p_max_count INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INT;
    v_allowed BOOLEAN;
BEGIN
    INSERT INTO public.rate_limit_buckets (subject_hash, action, window_start, count, expires_at)
    VALUES (p_subject_hash, p_action, p_window_start, 1, p_expires_at)
    ON CONFLICT (subject_hash, action, window_start)
    DO UPDATE SET count = public.rate_limit_buckets.count + 1
    RETURNING count INTO v_count;

    IF v_count <= p_max_count THEN
        v_allowed := true;
    ELSE
        v_allowed := false;
    END IF;

    RETURN jsonb_build_object(
        'allowed', v_allowed,
        'current_count', v_count,
        'max_count', p_max_count,
        'reset_at', p_expires_at
    );
END;
$$;

-- CLEANUP EXPIRED RATE LIMITS
CREATE OR REPLACE FUNCTION public.cleanup_expired_rate_limits()
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM public.rate_limit_buckets
  WHERE expires_at < timezone('utc'::text, now());
$$;

-- ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;

-- Profiles:
-- Anyone can view non-suspended public projection data
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (status != 'suspended' OR id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile" ON public.profiles
    FOR DELETE USING (auth.uid() = id);

-- Rooms:
-- Public read for active rooms
CREATE POLICY "Active rooms are viewable by everyone" ON public.rooms
    FOR SELECT USING (is_active = true OR public.is_moderator(auth.uid()));

-- Posts:
-- Public can read published posts
CREATE POLICY "Published posts are viewable by everyone" ON public.posts
    FOR SELECT USING (status = 'published' OR author_id = auth.uid() OR public.is_moderator(auth.uid()));

CREATE POLICY "Active users can insert posts" ON public.posts
    FOR INSERT WITH CHECK (
        auth.uid() = author_id AND
        public.is_active_profile(auth.uid())
    );

CREATE POLICY "Authors can delete their own posts" ON public.posts
    FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Moderators can update post status" ON public.posts
    FOR UPDATE USING (public.is_moderator(auth.uid()))
    WITH CHECK (public.is_moderator(auth.uid()));

-- Replies:
-- Public can read published replies
CREATE POLICY "Published replies are viewable by everyone" ON public.replies
    FOR SELECT USING (status = 'published' OR author_id = auth.uid() OR public.is_moderator(auth.uid()));

CREATE POLICY "Active users can insert replies" ON public.replies
    FOR INSERT WITH CHECK (
        auth.uid() = author_id AND
        public.is_active_profile(auth.uid())
    );

CREATE POLICY "Authors can delete their own replies" ON public.replies
    FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Moderators can update reply status" ON public.replies
    FOR UPDATE USING (public.is_moderator(auth.uid()))
    WITH CHECK (public.is_moderator(auth.uid()));

-- Reactions:
CREATE POLICY "Reactions are viewable by everyone" ON public.reactions
    FOR SELECT USING (true);

CREATE POLICY "Active users can insert reactions" ON public.reactions
    FOR INSERT WITH CHECK (
        auth.uid() = profile_id AND
        public.is_active_profile(auth.uid())
    );

CREATE POLICY "Users can delete their own reactions" ON public.reactions
    FOR DELETE USING (auth.uid() = profile_id);

-- Reports:
CREATE POLICY "Active users can create reports" ON public.reports
    FOR INSERT WITH CHECK (
        auth.uid() = reporter_id AND
        public.is_active_profile(auth.uid())
    );

CREATE POLICY "Moderators can read reports" ON public.reports
    FOR SELECT USING (public.is_moderator(auth.uid()));

-- Staff roles:
CREATE POLICY "Staff can view staff_roles" ON public.staff_roles
    FOR SELECT USING (auth.uid() = auth_user_id OR public.is_moderator(auth.uid()));

-- Moderation cases & actions:
CREATE POLICY "Moderators can view moderation cases" ON public.moderation_cases
    FOR SELECT USING (public.is_moderator(auth.uid()));

CREATE POLICY "Moderators can update moderation cases" ON public.moderation_cases
    FOR UPDATE USING (public.is_moderator(auth.uid()))
    WITH CHECK (public.is_moderator(auth.uid()));

CREATE POLICY "Moderators can view moderation actions" ON public.moderation_actions
    FOR SELECT USING (public.is_moderator(auth.uid()));

CREATE POLICY "Moderators can insert moderation actions" ON public.moderation_actions
    FOR INSERT WITH CHECK (public.is_moderator(auth.uid()));

-- Rate limit buckets:
CREATE POLICY "No public access to rate limits" ON public.rate_limit_buckets
    FOR ALL USING (false);
