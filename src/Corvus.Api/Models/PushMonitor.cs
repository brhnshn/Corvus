namespace Corvus.Api.Models;

public class PushMonitor
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Token { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int ExpectedIntervalMinutes { get; set; } = 1440;
    public int GracePeriodMinutes { get; set; } = 60;
    public string? LastSeenAt { get; set; }
    public string Status { get; set; } = "unknown"; // 'healthy' | 'down' | 'unknown'
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");
}
