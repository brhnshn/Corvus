using Dapper;

namespace Corvus.Api.Data;

public interface ISettingsRepository
{
    Task<Dictionary<string, string>> GetAllAsync();
    Task<string?> GetAsync(string key);
    Task SetAsync(string key, string value);
}

public class SettingsRepository : ISettingsRepository
{
    private readonly IDbConnectionFactory _db;

    public SettingsRepository(IDbConnectionFactory db)
    {
        _db = db;
    }

    public record SettingRow(string Key, string Value);

    public async Task<Dictionary<string, string>> GetAllAsync()
    {
        using var conn = _db.CreateConnection();
        var rows = await conn.QueryAsync<SettingRow>("SELECT key AS Key, value AS Value FROM settings");
        var dict = new Dictionary<string, string>();
        foreach (var r in rows)
        {
            dict[r.Key] = r.Value;
        }
        return dict;
    }

    public async Task<string?> GetAsync(string key)
    {
        using var conn = _db.CreateConnection();
        return await conn.QuerySingleOrDefaultAsync<string>("SELECT value FROM settings WHERE key = @key", new { key });
    }

    public async Task SetAsync(string key, string value)
    {
        using var conn = _db.CreateConnection();
        string now = DateTime.UtcNow.ToString("o");
        var sql = @"
            INSERT INTO settings (key, value, updated_at)
            VALUES (@key, @value, @now)
            ON CONFLICT(key) DO UPDATE SET
                value = excluded.value,
                updated_at = excluded.updated_at";

        await conn.ExecuteAsync(sql, new { key, value, now });
    }
}
