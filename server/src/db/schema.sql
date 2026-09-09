-- GeoIssue PostgreSQL Database Schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_uid VARCHAR(128) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    display_name VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(32) NOT NULL DEFAULT 'user' CHECK (role IN ('visitor', 'user', 'admin')),
    language VARCHAR(8) NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'ar', 'tr')),
    account_status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'pending')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ISSUES TABLE
CREATE TABLE IF NOT EXISTS issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'in_review', 'accepted', 'in_progress', 'resolved', 'rejected')),
    priority VARCHAR(32) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    report_count INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Preserve existing identities while removing the legacy Firebase-specific name.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'firebase_uid'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'auth_uid'
    ) THEN
        ALTER TABLE users RENAME COLUMN firebase_uid TO auth_uid;
    END IF;
END $$;

ALTER TABLE issues ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;

-- 4. REPORTS TABLE
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    description TEXT NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

ALTER TABLE reports ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 5. ISSUE SUPPORTERS TABLE (Many-to-Many)
CREATE TABLE IF NOT EXISTS issue_supporters (
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (issue_id, user_id)
);

-- 6. ISSUE STATUS HISTORY TABLE
CREATE TABLE IF NOT EXISTS issue_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    changed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    from_status VARCHAR(32) CHECK (from_status IN ('submitted', 'in_review', 'accepted', 'in_progress', 'resolved', 'rejected')),
    to_status VARCHAR(32) NOT NULL CHECK (to_status IN ('submitted', 'in_review', 'accepted', 'in_progress', 'resolved', 'rejected')),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. ISSUE COMMENTS TABLE
CREATE TABLE IF NOT EXISTS issue_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    content TEXT NOT NULL,
    is_official BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues (status);
CREATE INDEX IF NOT EXISTS idx_issues_category ON issues (category_id);
CREATE INDEX IF NOT EXISTS idx_issues_coords ON issues (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_reports_issue ON reports (issue_id);
CREATE INDEX IF NOT EXISTS idx_reports_user ON reports (user_id);
CREATE INDEX IF NOT EXISTS idx_supporters_issue ON issue_supporters (issue_id);
CREATE INDEX IF NOT EXISTS idx_status_history_issue ON issue_status_history (issue_id);
CREATE INDEX IF NOT EXISTS idx_comments_issue ON issue_comments (issue_id);

-- SEED DEFAULT CATEGORIES
INSERT INTO categories (id, name, slug, icon, is_active) VALUES
    ('c1000000-0000-0000-0000-000000000001', 'Road & Potholes', 'road-potholes', 'Construction', true),
    ('c1000000-0000-0000-0000-000000000002', 'Street Lighting', 'street-lighting', 'Lightbulb', true),
    ('c1000000-0000-0000-0000-000000000003', 'Waste & Sanitation', 'waste-sanitation', 'Trash2', true),
    ('c1000000-0000-0000-0000-000000000004', 'Sidewalks & Walkways', 'sidewalks', 'Footprints', true),
    ('c1000000-0000-0000-0000-000000000005', 'Water & Drainage', 'water-drainage', 'Droplets', true),
    ('c1000000-0000-0000-0000-000000000006', 'Public Parks & Trees', 'parks-trees', 'Trees', true)
ON CONFLICT (slug) DO NOTHING;

-- SEED NON-LOGIN DEMO AUTHORS
INSERT INTO users (id, auth_uid, email, display_name, role, language, account_status) VALUES
    ('a1000000-0000-0000-0000-000000000001', 'demo-resident', 'resident@geoissue.local', 'Demo Resident', 'user', 'en', 'active'),
    ('a1000000-0000-0000-0000-000000000002', 'demo-admin', 'admin@geoissue.local', 'Demo Administrator', 'admin', 'en', 'active')
ON CONFLICT (auth_uid) DO NOTHING;
