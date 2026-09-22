namespace Corvus.Api.Models;

public class User
{
    public required string Id { get; set; }
    public required string Username { get; set; }
    public required string PasswordHash { get; set; }
    public string Role { get; set; } = "admin";
    public required string CreatedAt { get; set; }
}
