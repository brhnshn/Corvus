using Corvus.Api.Data;
using Corvus.Api.Models;
using Corvus.Api.Services;

namespace Corvus.Api.Endpoints;

public static class SettingsEndpoints
{
    public static void MapSettingsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api")
            .AddEndpointFilter<CorvusAuthFilter>();

        group.MapGet("/settings", async (ISettingsRepository repo) =>
        {
            var settings = await repo.GetAllAsync();
            return Results.Ok(settings);
        });

        group.MapPut("/settings", async (Dictionary<string, string> settings, ISettingsRepository repo) =>
        {
            await repo.SetBatchAsync(settings);
            return Results.Ok(new GenericApiResponse(true, "Ayarlar kaydedildi."));
        });

        group.MapGet("/settings/db-stats", (IConfiguration config) =>
        {
            var dataDir = config["Database:DataDir"] ?? AppDomain.CurrentDomain.BaseDirectory;
            var dbPath = Path.Combine(dataDir, "corvus.db");
            var walPath = Path.Combine(dataDir, "corvus.db-wal");

            long sizeBytes = File.Exists(dbPath) ? new FileInfo(dbPath).Length : 0;
            long walSizeBytes = File.Exists(walPath) ? new FileInfo(walPath).Length : 0;
            long totalBytes = sizeBytes + walSizeBytes;

            string formatted = totalBytes switch
            {
                >= 1024 * 1024 * 1024 => $"{(double)totalBytes / (1024 * 1024 * 1024):F2} GB",
                >= 1024 * 1024 => $"{(double)totalBytes / (1024 * 1024):F1} MB",
                >= 1024 => $"{(double)totalBytes / 1024:F0} KB",
                _ => $"{totalBytes} B"
            };

            return Results.Ok(new DbStatsResponse(
                totalBytes,
                sizeBytes,
                walSizeBytes,
                formatted
            ));
        });

        group.MapGet("/version", async (IUpdateCheckerService updateChecker, CancellationToken ct) =>
        {
            var info = await updateChecker.GetVersionInfoAsync(ct);
            return Results.Ok(info);
        });
    }
}
