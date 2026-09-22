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
    }
}
