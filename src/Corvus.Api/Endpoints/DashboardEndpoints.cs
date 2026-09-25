using Corvus.Api.Data;
using Corvus.Api.Models;
using Corvus.Api.Services;

namespace Corvus.Api.Endpoints;

public static class DashboardEndpoints
{
    private static (DateTime Expiry, DashboardSummaryDto? Summary) _cachedSummary;
    private static readonly object _summaryLock = new();

    public static void MapDashboardEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/dashboard")
            .AddEndpointFilter<CorvusAuthFilter>();

        group.MapGet("/summary", async (
            IServicesRepository servicesRepo,
            IDockerService docker,
            IBackupRepository backupRepo,
            IMetricsRepository metricsRepo) =>
        {
            var now = DateTime.UtcNow;
            lock (_summaryLock)
            {
                if (_cachedSummary.Summary != null && now < _cachedSummary.Expiry)
                {
                    return Results.Ok(_cachedSummary.Summary);
                }
            }

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

            lock (_summaryLock)
            {
                _cachedSummary = (DateTime.UtcNow.AddSeconds(2.5), summary);
            }

            return Results.Ok(summary);
        });
    }
}
