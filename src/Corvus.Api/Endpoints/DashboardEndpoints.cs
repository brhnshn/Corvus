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
    }
}
