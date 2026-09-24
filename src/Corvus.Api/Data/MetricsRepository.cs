using Dapper;
using Corvus.Api.Models;

namespace Corvus.Api.Data;

public interface IMetricsRepository
{
    Task InsertAsync(SystemMetric metric);
    Task<List<SystemMetric>> GetRecentAsync(string range = "24h");
    Task<SystemMetric?> GetLatestAsync();
    Task CleanupOldAsync(int retentionDays);
}

public class MetricsRepository : IMetricsRepository
{
    private readonly IDbConnectionFactory _db;

    public MetricsRepository(IDbConnectionFactory db)
    {
        _db = db;
    }

    public async Task InsertAsync(SystemMetric metric)
    {
        using var conn = _db.CreateConnection();
        var sql = @"
            INSERT INTO system_metrics (recorded_at, cpu_percent, ram_used_mb, ram_total_mb, disk_used_gb, disk_total_gb, network_rx_bytes, network_tx_bytes)
            VALUES (@RecordedAt, @CpuPercent, @RamUsedMb, @RamTotalMb, @DiskUsedGb, @DiskTotalGb, @NetworkRxBytes, @NetworkTxBytes)";

        await conn.ExecuteAsync(sql, metric);
    }

    public async Task<List<SystemMetric>> GetRecentAsync(string range = "24h")
    {
        int hours;
        int step;

        switch (range)
        {
            case "1h":
                hours = 1;
                step = 1; // Tüm noktalar (~240 nokta)
                break;
            case "6h":
                hours = 6;
                step = 4; // her 1 dakikada 1 nokta (~360 nokta)
                break;
            case "12h":
                hours = 12;
                step = 10; // her 2.5 dakikada 1 nokta (~288 nokta)
                break;
            case "24h":
                hours = 24;
                step = 20; // her 5 dakikada 1 nokta (~288 nokta)
                break;
            case "7d":
                hours = 24 * 7;
                step = 120; // her 30 dakikada 1 nokta (~336 nokta)
                break;
            default:
                hours = 24;
                step = 20;
                break;
        }

        string cutoff = DateTime.UtcNow.AddHours(-hours).ToString("o");

        using var conn = _db.CreateConnection();
        var sql = @"
            SELECT id AS Id, recorded_at AS RecordedAt, cpu_percent AS CpuPercent, 
                   ram_used_mb AS RamUsedMb, ram_total_mb AS RamTotalMb, 
                   disk_used_gb AS DiskUsedGb, disk_total_gb AS DiskTotalGb, 
                   network_rx_bytes AS NetworkRxBytes, network_tx_bytes AS NetworkTxBytes
            FROM (
                SELECT *, ROW_NUMBER() OVER (ORDER BY id ASC) AS row_num
                FROM system_metrics
                WHERE recorded_at >= @cutoff
            )
            WHERE (row_num - 1) % @step = 0
            ORDER BY id ASC";

        var rows = await conn.QueryAsync<SystemMetric>(sql, new { cutoff, step });
        return rows.AsList();
    }

    public async Task<SystemMetric?> GetLatestAsync()
    {
        using var conn = _db.CreateConnection();
        var sql = @"
            SELECT id AS Id, recorded_at AS RecordedAt, cpu_percent AS CpuPercent, 
                   ram_used_mb AS RamUsedMb, ram_total_mb AS RamTotalMb, 
                   disk_used_gb AS DiskUsedGb, disk_total_gb AS DiskTotalGb, 
                   network_rx_bytes AS NetworkRxBytes, network_tx_bytes AS NetworkTxBytes
            FROM system_metrics
            ORDER BY id DESC
            LIMIT 1";

        return await conn.QuerySingleOrDefaultAsync<SystemMetric>(sql);
    }

    public async Task CleanupOldAsync(int retentionDays)
    {
        if (retentionDays <= 0) return;
        string cutoff = DateTime.UtcNow.AddDays(-retentionDays).ToString("o");
        using var conn = _db.CreateConnection();
        await conn.ExecuteAsync("DELETE FROM system_metrics WHERE recorded_at < @cutoff", new { cutoff });
    }
}
