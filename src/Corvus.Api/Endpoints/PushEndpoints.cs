using Corvus.Api.Data;
using Corvus.Api.Models;
using Corvus.Api.Services;

namespace Corvus.Api.Endpoints;

public static class PushEndpoints
{
    public static void MapPushEndpoints(this IEndpointRouteBuilder app)
    {
        // Push monitor endpoint (backup.sh vb. harici scriptler ve cron bildirimleri)
        app.MapPost("/api/push/{token}", async (
            string token, 
            PushBackupRequest? body, 
            IBackupRepository repo, 
            IPushMonitorRepository pushRepo,
            IEventBroadcaster broadcaster) =>
        {
            var evt = new BackupEvent
            {
                Token = token,
                ReceivedAt = DateTime.UtcNow.ToString("o"),
                Status = body?.Status?.ToLowerInvariant() == "failure" ? "failure" : "success",
                SizeBytes = body?.SizeBytes,
                Message = body?.Message
            };

            await repo.InsertAsync(evt);
            await pushRepo.RecordPingAsync(token);
            broadcaster.Broadcast("push_received", $"{{\"token\":\"{token}\",\"status\":\"{evt.Status}\"}}");

            return Results.Ok(new GenericApiResponse(true, "Push bildirimi başarıyla kaydedildi."));
        });

        // Alternatif query param ile push GET (örn. curl http://corvus/api/push/token?status=up&msg=OK)
        app.MapGet("/api/push/{token}", async (
            string token, 
            string? status, 
            string? msg, 
            IBackupRepository repo, 
            IPushMonitorRepository pushRepo,
            IEventBroadcaster broadcaster) =>
        {
            var evt = new BackupEvent
            {
                Token = token,
                ReceivedAt = DateTime.UtcNow.ToString("o"),
                Status = status?.ToLowerInvariant() == "failure" ? "failure" : "success",
                Message = msg
            };

            await repo.InsertAsync(evt);
            await pushRepo.RecordPingAsync(token);
            broadcaster.Broadcast("push_received", $"{{\"token\":\"{token}\",\"status\":\"{evt.Status}\"}}");

            return Results.Ok(new GenericApiResponse(true, "Push bildirimi başarıyla kaydedildi."));
        });

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

        // Dead Man's Snitch Monitör Yönetimi
        var snitchGroup = app.MapGroup("/api/push-monitors");

        snitchGroup.MapGet("/", async (IPushMonitorRepository pushRepo) =>
        {
            var monitors = await pushRepo.GetAllAsync();
            return Results.Ok(monitors);
        });

        snitchGroup.MapPost("/", async (CreatePushMonitorRequest request, IPushMonitorRepository pushRepo) =>
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return Results.BadRequest(new GenericApiResponse(false, "Monitör ismi gereklidir."));
            }

            string token = string.IsNullOrWhiteSpace(request.Token)
                ? Guid.NewGuid().ToString("N")[..16]
                : request.Token.Trim();

            var monitor = new PushMonitor
            {
                Id = Guid.NewGuid().ToString(),
                Token = token,
                Name = request.Name.Trim(),
                ExpectedIntervalMinutes = request.ExpectedIntervalMinutes > 0 ? request.ExpectedIntervalMinutes : 1440,
                GracePeriodMinutes = request.GracePeriodMinutes >= 0 ? request.GracePeriodMinutes : 60,
                Status = "unknown",
                CreatedAt = DateTime.UtcNow.ToString("o")
            };

            await pushRepo.CreateAsync(monitor);
            return Results.Ok(monitor);
        });

        snitchGroup.MapPut("/{id}", async (string id, UpdatePushMonitorRequest request, IPushMonitorRepository pushRepo) =>
        {
            var existing = await pushRepo.GetByIdAsync(id);
            if (existing == null) return Results.NotFound(new GenericApiResponse(false, "Monitör bulunamadı."));

            existing.Name = request.Name;
            existing.ExpectedIntervalMinutes = request.ExpectedIntervalMinutes;
            existing.GracePeriodMinutes = request.GracePeriodMinutes;

            await pushRepo.UpdateAsync(existing);
            return Results.Ok(existing);
        });

        snitchGroup.MapDelete("/{id}", async (string id, IPushMonitorRepository pushRepo) =>
        {
            bool deleted = await pushRepo.DeleteAsync(id);
            return deleted 
                ? Results.Ok(new GenericApiResponse(true, "Monitör silindi.")) 
                : Results.NotFound(new GenericApiResponse(false, "Monitör bulunamadı."));
        });
    }
}
