namespace Corvus.Api.Models;

public class ServiceOverride
{
    public string ContainerId { get; set; } = string.Empty;
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Url { get; set; }
    public string? Icon { get; set; }
    public string? Category { get; set; }
}
