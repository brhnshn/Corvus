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
    Task SyncDockerBatchAsync(List<Service> services, List<string> activeContainerIds);
    Task ReorderAsync(List<string> orderedServiceIds);
    Task<List<Service>> GetPublicServicesAsync();
    Task UpdateSslInfoAsync(string serviceId, int sslExpiryDays, string? sslIssuer);
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
        string? check_type,
        int? port,
        int? ssl_expiry_days,
        string? ssl_issuer,
        int? is_public,
        int? display_order,
        string? OverrideName,
        string? OverrideDescription,
        string? OverrideUrl,
        string? OverrideIcon,
        string? OverrideCategory
    );

    private static Service MapRowToService(ServiceDbRow r) => new Service
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
        UpdatedAt = r.updated_at,
        CheckType = r.check_type ?? "http",
        Port = r.port,
        SslExpiryDays = r.ssl_expiry_days,
        SslIssuer = r.ssl_issuer,
        IsPublic = (r.is_public ?? 1) == 1,
        DisplayOrder = r.display_order ?? 0
    };

    public async Task<List<Service>> GetAllAsync()
    {
        using var conn = _db.CreateConnection();
        var sql = @"
            SELECT s.id, s.source, s.container_id, s.name, s.description, s.url, s.icon, s.category, s.health_check_url, s.status, s.created_at, s.updated_at,
                   s.check_type, s.port, s.ssl_expiry_days, s.ssl_issuer, s.is_public, s.display_order,
                   o.name AS OverrideName, 
                   o.description AS OverrideDescription, 
                   o.url AS OverrideUrl, 
                   o.icon AS OverrideIcon, 
                   o.category AS OverrideCategory
            FROM services s
            LEFT JOIN service_overrides o ON s.container_id = o.container_id
            ORDER BY s.display_order ASC, s.category ASC, s.name ASC";

        var rows = await conn.QueryAsync<ServiceDbRow>(sql);
        return rows.Select(MapRowToService).ToList();
    }

    public async Task<List<Service>> GetPublicServicesAsync()
    {
        using var conn = _db.CreateConnection();
        var sql = @"
            SELECT s.id, s.source, s.container_id, s.name, s.description, s.url, s.icon, s.category, s.health_check_url, s.status, s.created_at, s.updated_at,
                   s.check_type, s.port, s.ssl_expiry_days, s.ssl_issuer, s.is_public, s.display_order,
                   o.name AS OverrideName, 
                   o.description AS OverrideDescription, 
                   o.url AS OverrideUrl, 
                   o.icon AS OverrideIcon, 
                   o.category AS OverrideCategory
            FROM services s
            LEFT JOIN service_overrides o ON s.container_id = o.container_id
            WHERE s.is_public = 1
            ORDER BY s.display_order ASC, s.category ASC, s.name ASC";

        var rows = await conn.QueryAsync<ServiceDbRow>(sql);
        return rows.Select(MapRowToService).ToList();
    }

    public async Task<Service?> GetByIdAsync(string id)
    {
        using var conn = _db.CreateConnection();
        var sql = @"
            SELECT s.id, s.source, s.container_id, s.name, s.description, s.url, s.icon, s.category, s.health_check_url, s.status, s.created_at, s.updated_at,
                   s.check_type, s.port, s.ssl_expiry_days, s.ssl_issuer, s.is_public, s.display_order,
                   o.name AS OverrideName, 
                   o.description AS OverrideDescription, 
                   o.url AS OverrideUrl, 
                   o.icon AS OverrideIcon, 
                   o.category AS OverrideCategory
            FROM services s
            LEFT JOIN service_overrides o ON s.container_id = o.container_id
            WHERE s.id = @id";

        var r = await conn.QuerySingleOrDefaultAsync<ServiceDbRow>(sql, new { id });
        return r == null ? null : MapRowToService(r);
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
            UpdatedAt = DateTime.UtcNow.ToString("o"),
            CheckType = request.CheckType ?? "http",
            Port = request.Port,
            IsPublic = request.IsPublic ?? true
        };

        var sql = @"
            INSERT INTO services (id, source, container_id, name, description, url, icon, category, health_check_url, status, created_at, updated_at, check_type, port, is_public, display_order)
            VALUES (@Id, @Source, @ContainerId, @Name, @Description, @Url, @Icon, @Category, @HealthCheckUrl, @Status, @CreatedAt, @UpdatedAt, @CheckType, @Port, @IsPublicInt, @DisplayOrder)";

        await conn.ExecuteAsync(sql, new {
            service.Id,
            service.Source,
            service.ContainerId,
            service.Name,
            service.Description,
            service.Url,
            service.Icon,
            service.Category,
            service.HealthCheckUrl,
            service.Status,
            service.CreatedAt,
            service.UpdatedAt,
            service.CheckType,
            service.Port,
            IsPublicInt = service.IsPublic ? 1 : 0,
            service.DisplayOrder
        });
        return service;
    }

    public async Task<Service?> UpdateAsync(string id, UpdateServiceRequest request)
    {
        var existing = await GetByIdAsync(id);
        if (existing == null) return null;

        using var conn = _db.CreateConnection();
        string now = DateTime.UtcNow.ToString("o");
        int isPublicInt = (request.IsPublic ?? existing.IsPublic) ? 1 : 0;
        string checkType = request.CheckType ?? existing.CheckType;
        int? port = request.Port ?? existing.Port;

        if (existing.Source == "manual")
        {
            var sql = @"
                UPDATE services 
                SET name = @Name, description = @Description, url = @Url, icon = @Icon, 
                    category = @Category, health_check_url = @HealthCheckUrl, updated_at = @now,
                    check_type = @checkType, port = @port, is_public = @isPublicInt
                WHERE id = @id";

            await conn.ExecuteAsync(sql, new { 
                request.Name, 
                request.Description, 
                request.Url, 
                request.Icon, 
                request.Category, 
                request.HealthCheckUrl, 
                now, 
                checkType, 
                port, 
                isPublicInt, 
                id 
            });
        }
        else if (!string.IsNullOrEmpty(existing.ContainerId))
        {
            // Update base service public/check_type and override name/desc/icon/cat
            await conn.ExecuteAsync("UPDATE services SET check_type = @checkType, port = @port, is_public = @isPublicInt, updated_at = @now WHERE id = @id",
                new { checkType, port, isPublicInt, now, id });

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

    public async Task ReorderAsync(List<string> orderedServiceIds)
    {
        using var conn = _db.CreateConnection();
        for (int i = 0; i < orderedServiceIds.Count; i++)
        {
            await conn.ExecuteAsync("UPDATE services SET display_order = @order WHERE id = @id", new { order = i, id = orderedServiceIds[i] });
        }
    }

    public async Task UpdateSslInfoAsync(string serviceId, int sslExpiryDays, string? sslIssuer)
    {
        using var conn = _db.CreateConnection();
        await conn.ExecuteAsync("UPDATE services SET ssl_expiry_days = @sslExpiryDays, ssl_issuer = @sslIssuer WHERE id = @serviceId",
            new { sslExpiryDays, sslIssuer, serviceId });
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

    public async Task SyncDockerBatchAsync(List<Service> services, List<string> activeContainerIds)
    {
        using var conn = (Microsoft.Data.Sqlite.SqliteConnection)_db.CreateConnection();
        using var tx = conn.BeginTransaction();

        var upsertSql = @"
            INSERT INTO services (id, source, container_id, name, description, url, icon, category, health_check_url, status, created_at, updated_at)
            VALUES (@Id, 'docker', @ContainerId, @Name, @Description, @Url, @Icon, @Category, @HealthCheckUrl, @Status, @CreatedAt, @UpdatedAt)
            ON CONFLICT(id) DO UPDATE SET
                status = excluded.status,
                url = COALESCE(services.url, excluded.url),
                updated_at = excluded.updated_at";

        foreach (var s in services)
        {
            await conn.ExecuteAsync(upsertSql, s, tx);
        }

        if (activeContainerIds.Count == 0)
        {
            await conn.ExecuteAsync("DELETE FROM services WHERE source = 'docker'", transaction: tx);
        }
        else
        {
            await conn.ExecuteAsync(
                "DELETE FROM services WHERE source = 'docker' AND container_id NOT IN @activeContainerIds",
                new { activeContainerIds },
                tx);
        }

        tx.Commit();
    }
}
