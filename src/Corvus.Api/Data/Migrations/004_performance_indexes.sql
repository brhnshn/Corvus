-- 004_performance_indexes.sql — Performance and cleanup indexes

CREATE INDEX IF NOT EXISTS idx_uptime_checks_checked_at ON uptime_checks(checked_at);
