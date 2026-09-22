namespace Corvus.Api.Models;

public class BackupEvent
{
    public long Id { get; set; }
    public string Token { get; set; } = string.Empty;
    public string ReceivedAt { get; set; } = DateTime.UtcNow.ToString("o");
    public string Status { get; set; } = "success"; // 'success' | 'failure'
    public long? SizeBytes { get; set; }
    public string? Message { get; set; }
}
