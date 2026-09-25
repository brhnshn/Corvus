using Corvus.Api.Data;
using Corvus.Api.Models;
using Corvus.Api.Services;

namespace Corvus.Api.Endpoints;

public static class BackupEndpoints
{
    public static void MapBackupEndpoints(this IEndpointRouteBuilder app)
    {
        // Corvus Veritabanı Yedek İndirme (Dahili Sıcak Yedek Snapshot)
        app.MapGet("/api/backup/download", async (
            IDbConnectionFactory db,
            IBackupRepository repo,
            IEventBroadcaster broadcaster) =>
        {
            string dbPath = db.DatabasePath;
            if (!File.Exists(dbPath))
            {
                return Results.NotFound(new GenericApiResponse(false, "Veritabanı dosyası bulunamadı."));
            }

            string tempDir = Path.GetTempPath();
            string tempFile = Path.Combine(tempDir, $"corvus-backup-{Guid.NewGuid():N}.db");

            try
            {
                // SQLite VACUUM INTO ile tutarlı, fragmentasyonsuz anlık snapshot oluştur
                using (var conn = db.CreateConnection())
                {
                    using var cmd = conn.CreateCommand();
                    cmd.CommandText = $"VACUUM INTO '{tempFile.Replace("'", "''")}';";
                    cmd.ExecuteNonQuery();
                }

                long sizeBytes = new FileInfo(tempFile).Length;

                // Dahili yedekleme kaydını sisteme işle
                var evt = new BackupEvent
                {
                    Token = "internal_corvus_db",
                    ReceivedAt = DateTime.UtcNow.ToString("o"),
                    Status = "success",
                    SizeBytes = sizeBytes,
                    Message = "Corvus veritabanı yedeği alındı"
                };
                await repo.InsertAsync(evt);
                broadcaster.Broadcast("push_received", $"{{\"token\":\"internal_corvus_db\",\"status\":\"success\"}}");

                byte[] fileBytes = await File.ReadAllBytesAsync(tempFile);
                string fileName = $"corvus-backup-{DateTime.UtcNow:yyyyMMdd-HHmmss}.db";
                return Results.File(fileBytes, "application/x-sqlite3", fileName);
            }
            finally
            {
                if (File.Exists(tempFile))
                {
                    try { File.Delete(tempFile); } catch { }
                }
            }
        });

        // Backup event listesi
        app.MapGet("/api/backup-events", async (int? limit, IBackupRepository repo) =>
        {
            var events = await repo.GetRecentAsync(limit ?? 10);
            return Results.Ok(events);
        });
    }
}
