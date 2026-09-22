using Corvus.Api.Data;
using Corvus.Api.Models;

namespace Corvus.Api.Endpoints;

public static class PushEndpoints
{
    public static void MapPushEndpoints(this IEndpointRouteBuilder app)
    {
        // Push monitor endpoint (backup.sh vb. harici scriptler)
        app.MapPost("/api/push/{token}", async (string token, PushBackupRequest? body, IBackupRepository repo) =>
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
            return Results.Ok(new GenericApiResponse(true, "Backup bildirimi kaydedildi."));
        });

        // Alternatif query param ile push GET (örn. curl http://corvus/api/push/token?status=up&msg=OK)
        app.MapGet("/api/push/{token}", async (string token, string? status, string? msg, IBackupRepository repo) =>
        {
            var evt = new BackupEvent
            {
                Token = token,
                ReceivedAt = DateTime.UtcNow.ToString("o"),
                Status = status?.ToLowerInvariant() == "failure" ? "failure" : "success",
                Message = msg
            };

            await repo.InsertAsync(evt);
            return Results.Ok(new GenericApiResponse(true, "Backup bildirimi kaydedildi."));
        });

        // Backup event listesi
        app.MapGet("/api/backup-events", async (int? limit, IBackupRepository repo) =>
        {
            var events = await repo.GetRecentAsync(limit ?? 10);
            return Results.Ok(events);
        });
    }
}
