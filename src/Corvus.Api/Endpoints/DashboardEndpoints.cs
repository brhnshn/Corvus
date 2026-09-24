using Corvus.Api.Data;
using Corvus.Api.Models;
using Corvus.Api.Services;

namespace Corvus.Api.Endpoints;

public static class DashboardEndpoints
{
    public static void MapDashboardEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/dashboard/summary", async (
            IServicesRepository servicesRepo,
            IDockerService docker,
            IBackupRepository backupRepo,
            IMetricsRepository metricsRepo) =>
        {
            var services = await servicesRepo.GetAllAsync();
            int totalServices = services.Count;
            int healthy = services.Count(s => s.Status == "healthy");
            int degraded = services.Count(s => s.Status == "degraded");
            int down = services.Count(s => s.Status == "down");

            var containers = await docker.GetContainersAsync();
            int totalContainers = containers.Count;
            int runningContainers = containers.Count(c => c.State.Equals("running", StringComparison.OrdinalIgnoreCase));

            var lastBackup = await backupRepo.GetLatestAsync();
            var latestMetrics = await metricsRepo.GetLatestAsync();

            var summary = new DashboardSummaryDto(
                totalServices,
                healthy,
                degraded,
                down,
                totalContainers,
                runningContainers,
                lastBackup,
                latestMetrics
            );

            return Results.Ok(summary);
        });

        app.MapGet("/api/settings", async (ISettingsRepository repo) =>
        {
            var settings = await repo.GetAllAsync();
            return Results.Ok(settings);
        });

        app.MapPut("/api/settings", async (Dictionary<string, string> settings, ISettingsRepository repo) =>
        {
            foreach (var (k, v) in settings)
            {
                await repo.SetAsync(k, v);
            }
            return Results.Ok(new GenericApiResponse(true, "Ayarlar kaydedildi."));
        });

        app.MapGet("/api/settings/db-stats", (IConfiguration config) =>
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

            return Results.Ok(new
            {
                sizeBytes = totalBytes,
                dbSizeBytes = sizeBytes,
                walSizeBytes,
                formattedSize = formatted
            });
        });

        app.MapGet("/api/version", async (IUpdateCheckerService updateChecker, CancellationToken ct) =>
        {
            var info = await updateChecker.GetVersionInfoAsync(ct);
            return Results.Ok(info);
        });
    }
}
