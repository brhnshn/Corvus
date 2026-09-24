using Corvus.Api.Models;
using Corvus.Api.Services;

namespace Corvus.Api.Endpoints;

public static class ContainersEndpoints
{
    public static void MapContainersEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/containers");

        group.MapGet("/", async (IDockerService docker) =>
        {
            var containers = await docker.GetContainersAsync();
            return Results.Ok(containers);
        });

        group.MapPost("/{id}/restart", async (string id, IDockerService docker) =>
        {
            bool success = await docker.RestartContainerAsync(id);
            return success 
                ? Results.Ok(new GenericApiResponse(true, "Container yeniden başlatıldı.")) 
                : Results.Problem("Container yeniden başlatılamadı.");
        });

        group.MapPost("/{id}/start", async (string id, IDockerService docker) =>
        {
            bool success = await docker.StartContainerAsync(id);
            return success 
                ? Results.Ok(new GenericApiResponse(true, "Container başlatıldı.")) 
                : Results.Problem("Container başlatılamadı.");
        });

        group.MapPost("/{id}/stop", async (string id, IDockerService docker) =>
        {
            bool success = await docker.StopContainerAsync(id);
            return success 
                ? Results.Ok(new GenericApiResponse(true, "Container durduruldu.")) 
                : Results.Problem("Container durdurulamadı.");
        });

        group.MapPost("/{id}/pause", async (string id, IDockerService docker) =>
        {
            bool success = await docker.PauseContainerAsync(id);
            return success 
                ? Results.Ok(new GenericApiResponse(true, "Container duraklatıldı.")) 
                : Results.Problem("Container duraklatılamadı.");
        });

        group.MapPost("/{id}/unpause", async (string id, IDockerService docker) =>
        {
            bool success = await docker.UnpauseContainerAsync(id);
            return success 
                ? Results.Ok(new GenericApiResponse(true, "Container devam ettirildi.")) 
                : Results.Problem("Container devam ettirilemedi.");
        });

        group.MapGet("/{id}/stats", async (string id, IDockerService docker, CancellationToken ct) =>
        {
            var stats = await docker.GetContainerStatsAsync(id, ct);
            return stats != null 
                ? Results.Ok(stats) 
                : Results.NotFound(new GenericApiResponse(false, "Stats alınamadı veya container çalışmıyor."));
        });

        group.MapGet("/{id}/logs", async (string id, int? tail, IDockerService docker, CancellationToken ct) =>
        {
            int limit = tail.GetValueOrDefault(100);
            if (limit <= 0) limit = 100;
            if (limit > 1000) limit = 1000;

            var lines = await docker.GetContainerLogsAsync(id, limit, ct);
            return Results.Ok(new ContainerLogsDto(id, lines));
        });

        group.MapGet("/{id}/logs/stream", async (string id, int? tail, HttpContext context, IDockerService docker, CancellationToken ct) =>
        {
            context.Response.Headers.ContentType = "text/event-stream";
            context.Response.Headers.CacheControl = "no-cache";
            context.Response.Headers.Connection = "keep-alive";

            int limit = tail.GetValueOrDefault(50);
            var initialLines = await docker.GetContainerLogsAsync(id, limit, ct);
            foreach (var line in initialLines)
            {
                await context.Response.WriteAsync($"data: {line}\n\n", ct);
            }
            await context.Response.Body.FlushAsync(ct);

            var lastSent = initialLines.LastOrDefault();
            while (!ct.IsCancellationRequested)
            {
                try
                {
                    await Task.Delay(2000, ct);
                    var latest = await docker.GetContainerLogsAsync(id, 20, ct);
                    if (latest.Count > 0)
                    {
                        int index = string.IsNullOrEmpty(lastSent) ? 0 : latest.LastIndexOf(lastSent) + 1;
                        if (index < latest.Count)
                        {
                            for (int i = index; i < latest.Count; i++)
                            {
                                await context.Response.WriteAsync($"data: {latest[i]}\n\n", ct);
                                lastSent = latest[i];
                            }
                            await context.Response.Body.FlushAsync(ct);
                        }
                    }
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }
        });
    }
}
