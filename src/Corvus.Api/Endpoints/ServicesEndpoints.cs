using Corvus.Api.Data;
using Corvus.Api.Models;

namespace Corvus.Api.Endpoints;

public static class ServicesEndpoints
{
    public static void MapServicesEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/services");

        group.MapGet("/", async (IServicesRepository repo) =>
        {
            var services = await repo.GetAllAsync();
            return Results.Ok(services);
        });

        group.MapGet("/{id}", async (string id, IServicesRepository repo) =>
        {
            var service = await repo.GetByIdAsync(id);
            return service != null ? Results.Ok(service) : Results.NotFound();
        });

        group.MapPost("/", async (CreateServiceRequest request, IServicesRepository repo) =>
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return Results.BadRequest(new GenericApiResponse(false, "Servis adı boş olamaz."));
            }

            var created = await repo.CreateManualAsync(request);
            return Results.Created($"/api/services/{created.Id}", created);
        });

        group.MapPut("/{id}", async (string id, UpdateServiceRequest request, IServicesRepository repo) =>
        {
            var updated = await repo.UpdateAsync(id, request);
            return updated != null ? Results.Ok(updated) : Results.NotFound();
        });

        group.MapDelete("/{id}", async (string id, IServicesRepository repo) =>
        {
            bool success = await repo.DeleteAsync(id);
            return success ? Results.Ok(new GenericApiResponse(true, "Servis silindi veya override kaldırıldı.")) : Results.NotFound();
        });

        group.MapPut("/reorder", async (ReorderServicesRequest request, IServicesRepository repo) =>
        {
            if (request.ServiceIds == null || request.ServiceIds.Count == 0)
            {
                return Results.BadRequest(new GenericApiResponse(false, "Sıralanacak servis listesi boş olamaz."));
            }

            await repo.ReorderAsync(request.ServiceIds);
            return Results.Ok(new GenericApiResponse(true, "Servis sıralaması güncellendi."));
        });
    }
}
