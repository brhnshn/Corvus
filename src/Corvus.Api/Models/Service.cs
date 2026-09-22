namespace Corvus.Api.Models;

public class Service
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Source { get; set; } = "manual"; // 'docker' | 'manual'
    public string? ContainerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Url { get; set; }
    public string? Icon { get; set; }
    public string? Category { get; set; }
    public string? HealthCheckUrl { get; set; }
    public string Status { get; set; } = "unknown"; // 'healthy' | 'degraded' | 'down' | 'unknown'
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
    public string UpdatedAt { get; set; } = DateTime.UtcNow.ToString("o");
}
