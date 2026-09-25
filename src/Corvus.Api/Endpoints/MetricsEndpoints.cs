using Corvus.Api.Data;
using Corvus.Api.Services;

namespace Corvus.Api.Endpoints;

public static class MetricsEndpoints
{
    public static void MapMetricsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/metrics")
            .AddEndpointFilter<CorvusAuthFilter>();

        group.MapGet("/system", async (string? range, IMetricsRepository repo) =>
        {
            var metrics = await repo.GetRecentAsync(range ?? "24h");
            return Results.Ok(metrics);
        });

        group.MapGet("/latest", async (IMetricsRepository repo) =>
        {
            var latest = await repo.GetLatestAsync();
            return latest != null ? Results.Ok(latest) : Results.NotFound();
        });
    }
}
