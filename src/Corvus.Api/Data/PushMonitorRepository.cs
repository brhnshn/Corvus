using Dapper;
using Corvus.Api.Models;

namespace Corvus.Api.Data;

public interface IPushMonitorRepository
{
    Task<List<PushMonitor>> GetAllAsync();
    Task<PushMonitor?> GetByTokenAsync(string token);
    Task<PushMonitor?> GetByIdAsync(string id);
    Task CreateAsync(PushMonitor monitor);
    Task<bool> UpdateAsync(PushMonitor monitor);
    Task<bool> DeleteAsync(string id);
    Task RecordPingAsync(string token);
    Task UpdateStatusAsync(string id, string status);
}

public class PushMonitorRepository : IPushMonitorRepository
{
    private readonly IDbConnectionFactory _db;

    public PushMonitorRepository(IDbConnectionFactory db)
    {
        _db = db;
    }

    public record PushMonitorDbRow(
        string id,
        string token,
        string name,
        int expected_interval_minutes,
        int grace_period_minutes,
        string? last_seen_at,
        string status,
        string created_at
    );

    public async Task<List<PushMonitor>> GetAllAsync()
    {
        using var conn = _db.CreateConnection();
        var sql = @"
            SELECT id, token, name, expected_interval_minutes, grace_period_minutes, 
                   last_seen_at, status, created_at
            FROM push_monitors
            ORDER BY created_at DESC";

        var rows = await conn.QueryAsync<PushMonitorDbRow>(sql);
        var list = new List<PushMonitor>();
        foreach (var r in rows)
        {
            list.Add(new PushMonitor
            {
                Id = r.id,
                Token = r.token,
                Name = r.name,
                ExpectedIntervalMinutes = r.expected_interval_minutes,
                GracePeriodMinutes = r.grace_period_minutes,
                LastSeenAt = r.last_seen_at,
                Status = r.status,
                CreatedAt = r.created_at
            });
        }
        return list;
    }

    public async Task<PushMonitor?> GetByTokenAsync(string token)
    {
        using var conn = _db.CreateConnection();
        var sql = @"
            SELECT id, token, name, expected_interval_minutes, grace_period_minutes, 
                   last_seen_at, status, created_at
            FROM push_monitors
            WHERE token = @token";

        var r = await conn.QuerySingleOrDefaultAsync<PushMonitorDbRow>(sql, new { token });
        if (r == null) return null;

        return new PushMonitor
        {
            Id = r.id,
            Token = r.token,
            Name = r.name,
            ExpectedIntervalMinutes = r.expected_interval_minutes,
            GracePeriodMinutes = r.grace_period_minutes,
            LastSeenAt = r.last_seen_at,
            Status = r.status,
            CreatedAt = r.created_at
        };
    }

    public async Task<PushMonitor?> GetByIdAsync(string id)
    {
        using var conn = _db.CreateConnection();
        var sql = @"
            SELECT id, token, name, expected_interval_minutes, grace_period_minutes, 
                   last_seen_at, status, created_at
            FROM push_monitors
            WHERE id = @id";

        var r = await conn.QuerySingleOrDefaultAsync<PushMonitorDbRow>(sql, new { id });
        if (r == null) return null;

        return new PushMonitor
        {
            Id = r.id,
            Token = r.token,
            Name = r.name,
            ExpectedIntervalMinutes = r.expected_interval_minutes,
            GracePeriodMinutes = r.grace_period_minutes,
            LastSeenAt = r.last_seen_at,
            Status = r.status,
            CreatedAt = r.created_at
        };
    }

    public async Task CreateAsync(PushMonitor monitor)
    {
        using var conn = _db.CreateConnection();
        var sql = @"
            INSERT INTO push_monitors (id, token, name, expected_interval_minutes, grace_period_minutes, last_seen_at, status, created_at)
            VALUES (@Id, @Token, @Name, @ExpectedIntervalMinutes, @GracePeriodMinutes, @LastSeenAt, @Status, @CreatedAt)";

        await conn.ExecuteAsync(sql, monitor);
    }

    public async Task<bool> UpdateAsync(PushMonitor monitor)
    {
        using var conn = _db.CreateConnection();
        var sql = @"
            UPDATE push_monitors
            SET name = @Name, expected_interval_minutes = @ExpectedIntervalMinutes,
                grace_period_minutes = @GracePeriodMinutes
            WHERE id = @Id";

        int affected = await conn.ExecuteAsync(sql, monitor);
        return affected > 0;
    }

    public async Task<bool> DeleteAsync(string id)
    {
        using var conn = _db.CreateConnection();
        int affected = await conn.ExecuteAsync("DELETE FROM push_monitors WHERE id = @id", new { id });
        return affected > 0;
    }

    public async Task RecordPingAsync(string token)
    {
        using var conn = _db.CreateConnection();
        string now = DateTime.UtcNow.ToString("o");
        var sql = @"
            UPDATE push_monitors 
            SET last_seen_at = @now, status = 'healthy' 
            WHERE token = @token";

        await conn.ExecuteAsync(sql, new { token, now });
    }

    public async Task UpdateStatusAsync(string id, string status)
    {
        using var conn = _db.CreateConnection();
        await conn.ExecuteAsync("UPDATE push_monitors SET status = @status WHERE id = @id", new { id, status });
    }
}
