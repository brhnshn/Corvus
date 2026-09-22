using Corvus.Api.Models;

namespace Corvus.Api.Services;

public interface IDockerService
{
    Task<bool> IsAvailableAsync(CancellationToken cancellationToken = default);
    Task<DockerVersionInfo?> GetVersionAsync(CancellationToken cancellationToken = default);
    Task<List<DockerContainerInfo>> GetContainersAsync(CancellationToken cancellationToken = default);
    Task<bool> RestartContainerAsync(string containerId, CancellationToken cancellationToken = default);
    bool ShouldIgnoreContainer(DockerContainerInfo container);
    Service MapContainerToService(DockerContainerInfo container);
}

public class DockerService : IDockerService
{
    private readonly IDockerHttpClient _client;
    private readonly ILogger<DockerService> _logger;

    public DockerService(IDockerHttpClient client, ILogger<DockerService> logger)
    {
        _client = client;
        _logger = logger;
    }

    public Task<bool> IsAvailableAsync(CancellationToken cancellationToken = default) =>
        _client.PingAsync(cancellationToken);

    public Task<DockerVersionInfo?> GetVersionAsync(CancellationToken cancellationToken = default) =>
        _client.GetVersionAsync(cancellationToken);

    public Task<List<DockerContainerInfo>> GetContainersAsync(CancellationToken cancellationToken = default) =>
        _client.ListContainersAsync(all: true, cancellationToken);

    public Task<bool> RestartContainerAsync(string containerId, CancellationToken cancellationToken = default) =>
        _client.RestartContainerAsync(containerId, cancellationToken);

    public bool ShouldIgnoreContainer(DockerContainerInfo container)
    {
        var labels = container.Labels ?? new Dictionary<string, string>();
        if (labels.TryGetValue("corvus.ignore", out var val) && string.Equals(val, "true", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return false;
    }

    public Service MapContainerToService(DockerContainerInfo container)
    {
        // Temiz isim çıkarma: "/web_app" -> "web_app"
        string rawName = container.Names?.FirstOrDefault() ?? container.Id[..12];
        string cleanName = rawName.TrimStart('/');

        // Glance benzeri etiket (label) zenginleştirme
        var labels = container.Labels ?? new Dictionary<string, string>();

        string displayName = labels.TryGetValue("corvus.name", out var lName) && !string.IsNullOrWhiteSpace(lName)
            ? lName
            : cleanName;

        string? description = labels.TryGetValue("corvus.description", out var lDesc)
            ? lDesc
            : null;

        string? icon = labels.TryGetValue("corvus.icon", out var lIcon)
            ? lIcon
            : null;

        string category = labels.TryGetValue("corvus.category", out var lCat) && !string.IsNullOrWhiteSpace(lCat)
            ? lCat
            : "Container'lar";

        string? url = null;
        if (labels.TryGetValue("corvus.url", out var lUrl) && !string.IsNullOrWhiteSpace(lUrl))
        {
            url = lUrl;
        }
        else
        {
            // Port bindings'den varsayılan URL türetme
            var pubPort = container.Ports?.FirstOrDefault(p => p.PublicPort.HasValue && p.PublicPort > 0);
            if (pubPort?.PublicPort != null)
            {
                url = $"http://localhost:{pubPort.PublicPort}";
            }
        }

        string? healthCheckUrl = labels.TryGetValue("corvus.healthcheck", out var lHealth)
            ? lHealth
            : null;

        // Container state -> Corvus status eşleme
        string status = container.State.ToLowerInvariant() switch
        {
            "running" => "healthy",
            "restarting" => "degraded",
            "paused" => "degraded",
            "exited" => "down",
            "dead" => "down",
            _ => "unknown"
        };

        return new Service
        {
            Id = $"docker_{container.Id[..Math.Min(12, container.Id.Length)]}",
            Source = "docker",
            ContainerId = container.Id,
            Name = displayName,
            Description = description,
            Url = url,
            Icon = icon,
            Category = category,
            HealthCheckUrl = healthCheckUrl,
            Status = status,
            CreatedAt = DateTime.UtcNow.ToString("o"),
            UpdatedAt = DateTime.UtcNow.ToString("o")
        };
    }
}
