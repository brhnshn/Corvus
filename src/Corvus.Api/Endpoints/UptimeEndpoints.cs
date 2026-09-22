using Corvus.Api.Data;

namespace Corvus.Api.Endpoints;

public static class UptimeEndpoints
{
    public static void MapUptimeEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/uptime");

        group.MapGet("/", async (string service_id, string? range, IUptimeRepository repo) =>
        {
            if (string.IsNullOrWhiteSpace(service_id))
            {
                return Results.BadRequest("service_id parametresi gereklidir.");
            }

            var checks = await repo.GetByServiceAsync(service_id, range ?? "7d");
            return Results.Ok(checks);
        });
    }
}
