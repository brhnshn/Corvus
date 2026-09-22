-- 001_init.sql — Corvus initial SQLite schema

CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL, -- 'docker' | 'manual'
    container_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    url TEXT,
    icon TEXT,
    category TEXT,
    health_check_url TEXT,
    status TEXT NOT NULL DEFAULT 'unknown', -- 'healthy' | 'degraded' | 'down' | 'unknown'
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_services_container_id ON services(container_id);
CREATE INDEX IF NOT EXISTS idx_services_source ON services(source);

CREATE TABLE IF NOT EXISTS service_overrides (
    container_id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    url TEXT,
    icon TEXT,
    category TEXT
);

CREATE TABLE IF NOT EXISTS system_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recorded_at TEXT NOT NULL,
    cpu_percent REAL NOT NULL,
    ram_used_mb INTEGER NOT NULL,
    ram_total_mb INTEGER NOT NULL,
    disk_used_gb INTEGER NOT NULL,
    disk_total_gb INTEGER NOT NULL,
    network_rx_bytes INTEGER NOT NULL,
    network_tx_bytes INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_system_metrics_recorded_at ON system_metrics(recorded_at);

CREATE TABLE IF NOT EXISTS uptime_checks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id TEXT NOT NULL,
    checked_at TEXT NOT NULL,
    status TEXT NOT NULL, -- 'up' | 'down'
    response_time_ms INTEGER,
    error_message TEXT,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_uptime_checks_service_time ON uptime_checks(service_id, checked_at);

CREATE TABLE IF NOT EXISTS backup_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT NOT NULL,
    received_at TEXT NOT NULL,
    status TEXT NOT NULL, -- 'success' | 'failure'
    size_bytes INTEGER,
    message TEXT
);

CREATE INDEX IF NOT EXISTS idx_backup_events_token ON backup_events(token);
CREATE INDEX IF NOT EXISTS idx_backup_events_received_at ON backup_events(received_at);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
