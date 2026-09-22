using Dapper;
using Corvus.Api.Models;

namespace Corvus.Api.Data;

public interface IServicesRepository
{
    Task<List<Service>> GetAllAsync();
    Task<Service?> GetByIdAsync(string id);
    Task<Service> CreateManualAsync(CreateServiceRequest request);
    Task<Service?> UpdateAsync(string id, UpdateServiceRequest request);
    Task<bool> DeleteAsync(string id);
    Task UpsertDockerServiceAsync(Service service);
    Task SyncDockerServicesAsync(List<string> activeContainerIds);
}

public class ServicesRepository : IServicesRepository
{
    private readonly IDbConnectionFactory _db;

    public ServicesRepository(IDbConnectionFactory db)
    {
        _db = db;
    }

    public record ServiceDbRow(
        string id,
        string source,
        string? container_id,
        string name,
        string? description,
        string? url,
        string? icon,
        string? category,
        string? health_check_url,
        string status,
        string created_at,
        string updated_at,
        string? OverrideName,
        string? OverrideDescription,
        string? OverrideUrl,
        string? OverrideIcon,
        string? OverrideCategory
    );

    public async Task<List<Service>> GetAllAsync()
    {
        using var conn = _db.CreateConnection();
        var sql = @"
            SELECT s.id, s.source, s.container_id, s.name, s.description, s.url, s.icon, s.category, s.health_check_url, s.status, s.created_at, s.updated_at,
                   o.name AS OverrideName, 
                   o.description AS OverrideDescription, 
                   o.url AS OverrideUrl, 
                   o.icon AS OverrideIcon, 
                   o.category AS OverrideCategory
            FROM services s
            LEFT JOIN service_overrides o ON s.container_id = o.container_id
            ORDER BY s.category ASC, s.name ASC";

        var rows = await conn.QueryAsync<ServiceDbRow>(sql);
        var list = new List<Service>();

        foreach (var r in rows)
        {
            var s = new Service
            {
                Id = r.id,
                Source = r.source,
                ContainerId = r.container_id,
                Name = r.OverrideName ?? r.name,
                Description = r.OverrideDescription ?? r.description,
                Url = r.OverrideUrl ?? r.url,
                Icon = r.OverrideIcon ?? r.icon,
                Category = r.OverrideCategory ?? r.category,
                HealthCheckUrl = r.health_check_url,
                Status = r.status,
                CreatedAt = r.created_at,
                UpdatedAt = r.updated_at
            };
            list.Add(s);
        }

        return list;
    }

    public async Task<Service?> GetByIdAsync(string id)
    {
        using var conn = _db.CreateConnection();
        var sql = @"
            SELECT s.id, s.source, s.container_id, s.name, s.description, s.url, s.icon, s.category, s.health_check_url, s.status, s.created_at, s.updated_at,
                   o.name AS OverrideName, 
                   o.description AS OverrideDescription, 
                   o.url AS OverrideUrl, 
                   o.icon AS OverrideIcon, 
                   o.category AS OverrideCategory
            FROM services s
            LEFT JOIN service_overrides o ON s.container_id = o.container_id
            WHERE s.id = @id";

        var r = await conn.QuerySingleOrDefaultAsync<ServiceDbRow>(sql, new { id });
        if (r == null) return null;

        return new Service
        {
            Id = r.id,
            Source = r.source,
            ContainerId = r.container_id,
            Name = r.OverrideName ?? r.name,
            Description = r.OverrideDescription ?? r.description,
            Url = r.OverrideUrl ?? r.url,
            Icon = r.OverrideIcon ?? r.icon,
            Category = r.OverrideCategory ?? r.category,
            HealthCheckUrl = r.health_check_url,
            Status = r.status,
            CreatedAt = r.created_at,
            UpdatedAt = r.updated_at
        };
    }

    public async Task<Service> CreateManualAsync(CreateServiceRequest request)
    {
        using var conn = _db.CreateConnection();
        var service = new Service
        {
            Id = Guid.NewGuid().ToString(),
            Source = "manual",
            ContainerId = null,
            Name = request.Name,
            Description = request.Description,
            Url = request.Url,
            Icon = request.Icon,
            Category = request.Category ?? "Diğer",
            HealthCheckUrl = request.HealthCheckUrl,
            Status = "unknown",
            CreatedAt = DateTime.UtcNow.ToString("o"),
            UpdatedAt = DateTime.UtcNow.ToString("o")
        };

        var sql = @"
            INSERT INTO services (id, source, container_id, name, description, url, icon, category, health_check_url, status, created_at, updated_at)
            VALUES (@Id, @Source, @ContainerId, @Name, @Description, @Url, @Icon, @Category, @HealthCheckUrl, @Status, @CreatedAt, @UpdatedAt)";

        await conn.ExecuteAsync(sql, service);
        return service;
    }

    public async Task<Service?> UpdateAsync(string id, UpdateServiceRequest request)
    {
        var existing = await GetByIdAsync(id);
        if (existing == null) return null;

        using var conn = _db.CreateConnection();
        string now = DateTime.UtcNow.ToString("o");

        if (existing.Source == "manual")
        {
            var sql = @"
                UPDATE services 
                SET name = @Name, description = @Description, url = @Url, icon = @Icon, 
                    category = @Category, health_check_url = @HealthCheckUrl, updated_at = @now
                WHERE id = @id";

            await conn.ExecuteAsync(sql, new { request.Name, request.Description, request.Url, request.Icon, request.Category, request.HealthCheckUrl, now, id });
        }
        else if (!string.IsNullOrEmpty(existing.ContainerId))
        {
            // Docker container için service_overrides tablosuna yaz
            var sql = @"
                INSERT INTO service_overrides (container_id, name, description, url, icon, category)
                VALUES (@ContainerId, @Name, @Description, @Url, @Icon, @Category)
                ON CONFLICT(container_id) DO UPDATE SET
                    name = excluded.name,
                    description = excluded.description,
                    url = excluded.url,
                    icon = excluded.icon,
                    category = excluded.category";

            await conn.ExecuteAsync(sql, new { existing.ContainerId, request.Name, request.Description, request.Url, request.Icon, request.Category });
        }

        return await GetByIdAsync(id);
    }

    public async Task<bool> DeleteAsync(string id)
    {
        var existing = await GetByIdAsync(id);
        if (existing == null) return false;

        using var conn = _db.CreateConnection();
        if (existing.Source == "manual")
        {
            int count = await conn.ExecuteAsync("DELETE FROM services WHERE id = @id", new { id });
            return count > 0;
        }
        else if (!string.IsNullOrEmpty(existing.ContainerId))
        {
            // Docker servisi silinmez, override'ı temizlenir
            await conn.ExecuteAsync("DELETE FROM service_overrides WHERE container_id = @ContainerId", new { existing.ContainerId });
            return true;
        }

        return false;
    }

    public async Task UpsertDockerServiceAsync(Service service)
    {
        using var conn = _db.CreateConnection();
        var sql = @"
            INSERT INTO services (id, source, container_id, name, description, url, icon, category, health_check_url, status, created_at, updated_at)
            VALUES (@Id, 'docker', @ContainerId, @Name, @Description, @Url, @Icon, @Category, @HealthCheckUrl, @Status, @CreatedAt, @UpdatedAt)
            ON CONFLICT(id) DO UPDATE SET
                status = excluded.status,
                url = COALESCE(services.url, excluded.url),
                updated_at = excluded.updated_at";

        await conn.ExecuteAsync(sql, service);
    }

    public async Task SyncDockerServicesAsync(List<string> activeContainerIds)
    {
        using var conn = _db.CreateConnection();

        if (activeContainerIds.Count == 0)
        {
            // Docker daemon üzerinde hiç container yoksa Docker servislerini temizle
            await conn.ExecuteAsync("DELETE FROM services WHERE source = 'docker'");
        }
        else
        {
            // Docker'dan tamamen kaldırılmış (artık listede olmayan) hayalet container'ları veritabanından sil
            var sql = @"
                DELETE FROM services 
                WHERE source = 'docker' AND container_id NOT IN @activeContainerIds";

            await conn.ExecuteAsync(sql, new { activeContainerIds });
        }
    }
}
