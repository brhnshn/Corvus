using System.Text.Json;
using Corvus.Api.Models;
using Corvus.Api.Services;

namespace Corvus.Api.Endpoints;

public static class StreamEndpoints
{
    public static void MapStreamEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/stream/events", async (HttpContext context, IEventBroadcaster broadcaster, CancellationToken ct) =>
        {
            context.Response.Headers.ContentType = "text/event-stream";
            context.Response.Headers.CacheControl = "no-cache";
            context.Response.Headers.Connection = "keep-alive";

            // İlk bağlantı selamlama sinyali
            await context.Response.WriteAsync("data: {\"eventType\":\"connected\",\"payload\":\"{}\"}\n\n", ct);
            await context.Response.Body.FlushAsync(ct);

            try
            {
                await foreach (var evt in broadcaster.SubscribeAsync(ct))
                {
                    string json = JsonSerializer.Serialize(evt, CorvusJsonSerializerContext.Default.ServerEventDto);
                    await context.Response.WriteAsync($"data: {json}\n\n", ct);
                    await context.Response.Body.FlushAsync(ct);
                }
            }
            catch (OperationCanceledException)
            {
                // İstemci bağlantıyı kapattığında normal sonlanma
            }
        });
    }
}
