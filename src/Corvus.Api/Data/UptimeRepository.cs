using Dapper;
using Corvus.Api.Models;

namespace Corvus.Api.Data;

public interface IUptimeRepository
{
    Task InsertAsync(UptimeCheck check);
    Task<List<UptimeCheck>> GetByServiceAsync(string serviceId, string range = "7d");
    Task<Dictionary<string, double>> Get24hUptimePercentagesAsync();
    Task CleanupOldAsync(int retentionDays);
}

public class UptimeRepository : IUptimeRepository
{
    private readonly IDbConnectionFactory _db;

    public UptimeRepository(IDbConnectionFactory db)
    {
        _db = db;
    }

    public async Task InsertAsync(UptimeCheck check)
    {
        using var conn = _db.CreateConnection();
        var sql = @"
            INSERT INTO uptime_checks (service_id, checked_at, status, response_time_ms, error_message)
            VALUES (@ServiceId, @CheckedAt, @Status, @ResponseTimeMs, @ErrorMessage)";

        await conn.ExecuteAsync(sql, check);
    }

    public async Task<List<UptimeCheck>> GetByServiceAsync(string serviceId, string range = "7d")
    {
        int days = range switch
        {
            "24h" => 1,
            "7d" => 7,
            "30d" => 30,
            _ => 7
        };

        string cutoff = DateTime.UtcNow.AddDays(-days).ToString("o");

        using var conn = _db.CreateConnection();
        var sql = @"
            SELECT id AS Id, service_id AS ServiceId, checked_at AS CheckedAt, 
                   status AS Status, response_time_ms AS ResponseTimeMs, error_message AS ErrorMessage
            FROM uptime_checks
            WHERE service_id = @serviceId AND checked_at >= @cutoff
            ORDER BY checked_at ASC";

        var rows = await conn.QueryAsync<UptimeCheck>(sql, new { serviceId, cutoff });
        return rows.AsList();
    }

    public async Task<Dictionary<string, double>> Get24hUptimePercentagesAsync()
    {
        string cutoff = DateTime.UtcNow.AddHours(-24).ToString("o");
        using var conn = _db.CreateConnection();
        var sql = @"
            SELECT service_id AS ServiceId, 
                   COUNT(*) AS TotalCount, 
                   SUM(CASE WHEN status = 'up' THEN 1 ELSE 0 END) AS UpCount
            FROM uptime_checks
            WHERE checked_at >= @cutoff
            GROUP BY service_id";

        var rows = await conn.QueryAsync<ServiceUptimeAggRow>(sql, new { cutoff });
        var dict = new Dictionary<string, double>(StringComparer.OrdinalIgnoreCase);
        foreach (var r in rows)
        {
            double pct = r.TotalCount > 0 
                ? Math.Round((double)r.UpCount / r.TotalCount * 100.0, 1) 
                : 100.0;
            dict[r.ServiceId] = pct;
        }
        return dict;
    }

    public async Task CleanupOldAsync(int retentionDays)
    {
        if (retentionDays <= 0) return;
        string cutoff = DateTime.UtcNow.AddDays(-retentionDays).ToString("o");
        using var conn = _db.CreateConnection();
        await conn.ExecuteAsync("DELETE FROM uptime_checks WHERE checked_at < @cutoff", new { cutoff });
    }
}

public record ServiceUptimeAggRow(string ServiceId, int TotalCount, int UpCount);
