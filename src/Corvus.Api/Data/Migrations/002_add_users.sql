-- 002_add_users.sql — Add users table and registration setting
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Default settings for registration if not already present
INSERT OR IGNORE INTO settings (key, value, updated_at) 
VALUES ('registration_enabled', 'true', datetime('now'));
