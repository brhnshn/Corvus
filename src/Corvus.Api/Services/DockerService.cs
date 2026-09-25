using System.Collections.Concurrent;
using Corvus.Api.Models;

namespace Corvus.Api.Services;

public interface IDockerService
{
    Task<bool> IsAvailableAsync(CancellationToken cancellationToken = default);
    Task<DockerVersionInfo?> GetVersionAsync(CancellationToken cancellationToken = default);
    Task<List<DockerContainerInfo>> GetContainersAsync(CancellationToken cancellationToken = default);
    Task<DockerActionResult> RestartContainerAsync(string containerId, CancellationToken cancellationToken = default);
    Task<DockerActionResult> StartContainerAsync(string containerId, CancellationToken cancellationToken = default);
    Task<DockerActionResult> StopContainerAsync(string containerId, CancellationToken cancellationToken = default);
    Task<DockerActionResult> PauseContainerAsync(string containerId, CancellationToken cancellationToken = default);
    Task<DockerActionResult> UnpauseContainerAsync(string containerId, CancellationToken cancellationToken = default);
    Task<ContainerStatsDto?> GetContainerStatsAsync(string containerId, CancellationToken cancellationToken = default);
    Task<List<string>> GetContainerLogsAsync(string containerId, int tail = 100, CancellationToken cancellationToken = default);
    bool ShouldIgnoreContainer(DockerContainerInfo container);
    Service MapContainerToService(DockerContainerInfo container);
}

public class DockerService : IDockerService
{
    private readonly IDockerHttpClient _client;
    private readonly ILogger<DockerService> _logger;
    private readonly ConcurrentDictionary<string, (DateTime Expiry, ContainerStatsDto Stats)> _statsCache = new();

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

    public Task<DockerActionResult> RestartContainerAsync(string containerId, CancellationToken cancellationToken = default) =>
        _client.RestartContainerAsync(containerId, cancellationToken);

    public Task<DockerActionResult> StartContainerAsync(string containerId, CancellationToken cancellationToken = default) =>
        _client.StartContainerAsync(containerId, cancellationToken);

    public Task<DockerActionResult> StopContainerAsync(string containerId, CancellationToken cancellationToken = default) =>
        _client.StopContainerAsync(containerId, cancellationToken);

    public Task<DockerActionResult> PauseContainerAsync(string containerId, CancellationToken cancellationToken = default) =>
        _client.PauseContainerAsync(containerId, cancellationToken);

    public Task<DockerActionResult> UnpauseContainerAsync(string containerId, CancellationToken cancellationToken = default) =>
        _client.UnpauseContainerAsync(containerId, cancellationToken);

    public async Task<ContainerStatsDto?> GetContainerStatsAsync(string containerId, CancellationToken cancellationToken = default)
    {
        if (_statsCache.TryGetValue(containerId, out var cached) && DateTime.UtcNow < cached.Expiry)
        {
            return cached.Stats;
        }

        var stats = await _client.GetContainerStatsAsync(containerId, cancellationToken);
        if (stats != null)
        {
            _statsCache[containerId] = (DateTime.UtcNow.AddSeconds(3), stats);
        }

        return stats;
    }

    public Task<List<string>> GetContainerLogsAsync(string containerId, int tail = 100, CancellationToken cancellationToken = default) =>
        _client.GetContainerLogsAsync(containerId, tail, cancellationToken);

    public bool ShouldIgnoreContainer(DockerContainerInfo container)
    {
        var labels = container.Labels ?? new Dictionary<string, string>();
        if (labels.TryGetValue("corvus.ignore", out var val) && string.Equals(val, "true", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return false;
    }

    private static string? ExtractDomainFromLabels(IReadOnlyDictionary<string, string> labels)
    {
        // 1. Traefik Router Host rule (örn: "Host(`app.example.com`)" veya "Host(`api.example.com`, `admin.example.com`)")
        foreach (var kvp in labels)
        {
            if (kvp.Key.StartsWith("traefik.http.routers.", StringComparison.OrdinalIgnoreCase) &&
                kvp.Key.EndsWith(".rule", StringComparison.OrdinalIgnoreCase))
            {
                var match = System.Text.RegularExpressions.Regex.Match(
                    kvp.Value, 
                    @"Host\s*\(\s*[`""](?<domain>[^`"",\s]+)[`""]", 
                    System.Text.RegularExpressions.RegexOptions.IgnoreCase);

                if (match.Success)
                {
                    string domain = match.Groups["domain"].Value.Trim();
                    if (!string.IsNullOrWhiteSpace(domain))
                    {
                        return $"https://{domain}";
                    }
                }
            }
        }

        // 2. Caddy etiketi (örn: caddy="example.com" veya caddy.reverse_proxy)
        if (labels.TryGetValue("caddy", out var caddyHost) && !string.IsNullOrWhiteSpace(caddyHost))
        {
            string host = caddyHost.Trim().Split(' ', ',')[0];
            if (!string.IsNullOrWhiteSpace(host))
            {
                return host.StartsWith("http", StringComparison.OrdinalIgnoreCase) ? host : $"https://{host}";
            }
        }

        // 3. Virtual Host etiketi (Nginx proxy / Docker-gen: VIRTUAL_HOST=app.example.com)
        if (labels.TryGetValue("VIRTUAL_HOST", out var vHost) && !string.IsNullOrWhiteSpace(vHost))
        {
            string host = vHost.Trim().Split(',')[0].Trim();
            if (!string.IsNullOrWhiteSpace(host))
            {
                return host.StartsWith("http", StringComparison.OrdinalIgnoreCase) ? host : $"http://{host}";
            }
        }

        return null;
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

        string category;
        if (labels.TryGetValue("corvus.category", out var lCat) && !string.IsNullOrWhiteSpace(lCat))
        {
            category = lCat;
        }
        else if (labels.TryGetValue("com.docker.compose.project", out var composeProj) && !string.IsNullOrWhiteSpace(composeProj))
        {
            category = $"{char.ToUpperInvariant(composeProj[0])}{composeProj[1..]}";
        }
        else
        {
            category = DeriveCategoryFromName(cleanName);
        }

        string? url = null;
        if (labels.TryGetValue("corvus.url", out var lUrl) && !string.IsNullOrWhiteSpace(lUrl))
        {
            url = lUrl;
        }
        else
        {
            // Ters Proxy (Traefik, Caddy, VIRTUAL_HOST) etiketlerinden otomatik domain çıkarımı
            url = ExtractDomainFromLabels(labels);

            // Port bindings'den varsayılan URL türetme
            if (string.IsNullOrWhiteSpace(url))
            {
                var pubPort = container.Ports?.FirstOrDefault(p => p.PublicPort.HasValue && p.PublicPort > 0);
                if (pubPort?.PublicPort != null)
                {
                    string host = Environment.GetEnvironmentVariable("CORVUS_PUBLIC_HOST") ?? "localhost";
                    url = $"http://{host}:{pubPort.PublicPort}";
                }
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

    public static string DeriveCategoryFromName(string name)
    {
        if (string.IsNullOrWhiteSpace(name)) return "General";
        string lower = name.Trim().ToLowerInvariant();

        if (lower.StartsWith("internal-") || lower.StartsWith("internal_"))
            return "Internal";
        if (lower.StartsWith("core-") || lower.StartsWith("core_"))
            return "Core";
        if (lower.EndsWith("_web") || lower.EndsWith("-web") || lower.StartsWith("web-") || lower.StartsWith("web_"))
            return "Web";
        if (lower.Contains("postgres") || lower.Contains("mysql") || lower.Contains("mariadb") || lower.Contains("redis") || lower.Contains("mongo") || lower.Contains("-db") || lower.Contains("_db"))
            return "Database";
        if (lower.Contains("mail") || lower.Contains("stalwart") || lower.Contains("postfix"))
            return "Mail";

        return "General";
    }
}
