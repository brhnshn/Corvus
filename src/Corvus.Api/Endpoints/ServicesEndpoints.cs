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

        // 1.6: Halka Açık / Şifresiz Durum Sayfası Uç Noktası
        app.MapGet("/api/status-page", async (IServicesRepository repo, IUptimeRepository uptimeRepo) =>
        {
            var publicServices = await repo.GetPublicServicesAsync();
            var serviceDtos = new List<PublicServiceDto>();

            int downCount = 0;
            int degradedCount = 0;

            foreach (var s in publicServices)
            {
                var recentChecks = await uptimeRepo.GetByServiceAsync(s.Id, "24h");
                double uptimePct = 100.0;
                if (recentChecks.Count > 0)
                {
                    int upCount = recentChecks.Count(c => c.Status == "up");
                    uptimePct = Math.Round((double)upCount / recentChecks.Count * 100.0, 1);
                }

                if (s.Status == "down") downCount++;
                else if (s.Status == "degraded") degradedCount++;

                serviceDtos.Add(new PublicServiceDto(
                    Id: s.Id,
                    Name: s.Name,
                    Description: s.Description,
                    Url: s.Url,
                    Icon: s.Icon,
                    Category: s.Category,
                    Status: s.Status,
                    SslExpiryDays: s.SslExpiryDays,
                    UptimePercentage: uptimePct,
                    RecentChecks: recentChecks
                ));
            }

            string overallStatus = "all_operational";
            if (downCount > 0) overallStatus = "major_outage";
            else if (degradedCount > 0) overallStatus = "some_degraded";

            var result = new PublicStatusPageDto(
                SystemStatus: overallStatus,
                Services: serviceDtos,
                GeneratedAt: DateTime.UtcNow.ToString("o")
            );

            return Results.Ok(result);
        });
    }
}
