using Corvus.Api.Models;
using Corvus.Api.Services;

namespace Corvus.Api.Endpoints;

public static class ContainersEndpoints
{
    public static void MapContainersEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/containers")
            .AddEndpointFilter<CorvusAuthFilter>();

        group.MapGet("/", async (IDockerService docker) =>
        {
            var containers = await docker.GetContainersAsync();
            return Results.Ok(containers);
        });

        group.MapPost("/{id}/restart", async (string id, IDockerService docker) =>
        {
            var result = await docker.RestartContainerAsync(id);
            return result.Success 
                ? Results.Ok(new GenericApiResponse(true, result.Message ?? "Container yeniden başlatıldı.")) 
                : Results.Json(new GenericApiResponse(false, result.Message ?? "Container yeniden başlatılamadı."), 
                               CorvusJsonSerializerContext.Default.GenericApiResponse, 
                               statusCode: result.StatusCode == 200 ? 400 : result.StatusCode);
        });

        group.MapPost("/{id}/start", async (string id, IDockerService docker) =>
        {
            var result = await docker.StartContainerAsync(id);
            return result.Success 
                ? Results.Ok(new GenericApiResponse(true, result.Message ?? "Container başlatıldı.")) 
                : Results.Json(new GenericApiResponse(false, result.Message ?? "Container başlatılamadı."), 
                               CorvusJsonSerializerContext.Default.GenericApiResponse, 
                               statusCode: result.StatusCode == 200 ? 400 : result.StatusCode);
        });

        group.MapPost("/{id}/stop", async (string id, IDockerService docker) =>
        {
            var result = await docker.StopContainerAsync(id);
            return result.Success 
                ? Results.Ok(new GenericApiResponse(true, result.Message ?? "Container durduruldu.")) 
                : Results.Json(new GenericApiResponse(false, result.Message ?? "Container durdurulamadı."), 
                               CorvusJsonSerializerContext.Default.GenericApiResponse, 
                               statusCode: result.StatusCode == 200 ? 400 : result.StatusCode);
        });

        group.MapPost("/{id}/pause", async (string id, IDockerService docker) =>
        {
            var result = await docker.PauseContainerAsync(id);
            return result.Success 
                ? Results.Ok(new GenericApiResponse(true, result.Message ?? "Container duraklatıldı.")) 
                : Results.Json(new GenericApiResponse(false, result.Message ?? "Container duraklatılamadı."), 
                               CorvusJsonSerializerContext.Default.GenericApiResponse, 
                               statusCode: result.StatusCode == 200 ? 400 : result.StatusCode);
        });

        group.MapPost("/{id}/unpause", async (string id, IDockerService docker) =>
        {
            var result = await docker.UnpauseContainerAsync(id);
            return result.Success 
                ? Results.Ok(new GenericApiResponse(true, result.Message ?? "Container devam ettirildi.")) 
                : Results.Json(new GenericApiResponse(false, result.Message ?? "Container devam ettirilemedi."), 
                               CorvusJsonSerializerContext.Default.GenericApiResponse, 
                               statusCode: result.StatusCode == 200 ? 400 : result.StatusCode);
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
