using Dapper;
using Corvus.Api.Models;

namespace Corvus.Api.Data;

public interface IBackupRepository
{
    Task InsertAsync(BackupEvent backupEvent);
    Task<List<BackupEvent>> GetRecentAsync(int limit = 10);
    Task<BackupEvent?> GetLatestAsync();
}

public class BackupRepository : IBackupRepository
{
    private readonly IDbConnectionFactory _db;

    public BackupRepository(IDbConnectionFactory db)
    {
        _db = db;
    }

    public async Task InsertAsync(BackupEvent backupEvent)
    {
        using var conn = _db.CreateConnection();
        var sql = @"
            INSERT INTO backup_events (token, received_at, status, size_bytes, message)
            VALUES (@Token, @ReceivedAt, @Status, @SizeBytes, @Message)";

        await conn.ExecuteAsync(sql, backupEvent);
    }

    public async Task<List<BackupEvent>> GetRecentAsync(int limit = 10)
    {
        using var conn = _db.CreateConnection();
        var sql = @"
            SELECT id AS Id, token AS Token, received_at AS ReceivedAt, 
                   status AS Status, size_bytes AS SizeBytes, message AS Message
            FROM backup_events
            ORDER BY id DESC
            LIMIT @limit";

        var rows = await conn.QueryAsync<BackupEvent>(sql, new { limit });
        return rows.AsList();
    }

    public async Task<BackupEvent?> GetLatestAsync()
    {
        using var conn = _db.CreateConnection();
        var sql = @"
            SELECT id AS Id, token AS Token, received_at AS ReceivedAt, 
                   status AS Status, size_bytes AS SizeBytes, message AS Message
            FROM backup_events
            ORDER BY id DESC
            LIMIT 1";

        return await conn.QuerySingleOrDefaultAsync<BackupEvent>(sql);
    }
}
