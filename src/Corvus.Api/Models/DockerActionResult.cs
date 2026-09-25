namespace Corvus.Api.Models;

public record DockerActionResult(bool Success, string? Message = null, int StatusCode = 200);
