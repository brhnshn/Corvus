-- 003_roadmap_features.sql — Schema updates for extended roadmap features

-- 1. Extend services table with check_type, port, ssl tracking, public status, and display ordering
ALTER TABLE services ADD COLUMN check_type TEXT NOT NULL DEFAULT 'http';
ALTER TABLE services ADD COLUMN port INTEGER;
ALTER TABLE services ADD COLUMN ssl_expiry_days INTEGER;
ALTER TABLE services ADD COLUMN ssl_issuer TEXT;
ALTER TABLE services ADD COLUMN is_public INTEGER NOT NULL DEFAULT 1;
ALTER TABLE services ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_services_display_order ON services(display_order);
CREATE INDEX IF NOT EXISTS idx_services_is_public ON services(is_public);

-- 2. Dead Man's Snitch (push_monitors) table
CREATE TABLE IF NOT EXISTS push_monitors (
    id TEXT PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    expected_interval_minutes INTEGER NOT NULL DEFAULT 1440,
    grace_period_minutes INTEGER NOT NULL DEFAULT 60,
    last_seen_at TEXT,
    status TEXT NOT NULL DEFAULT 'unknown',
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_push_monitors_token ON push_monitors(token);
CREATE INDEX IF NOT EXISTS idx_push_monitors_status ON push_monitors(status);
