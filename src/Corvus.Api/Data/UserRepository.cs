using Dapper;
using Corvus.Api.Models;

namespace Corvus.Api.Data;

public interface IUserRepository
{
    Task<User?> GetByUsernameAsync(string username);
    Task<int> GetCountAsync();
    Task CreateAsync(User user);
    Task<bool> UpdatePasswordAsync(string username, string newPasswordHash);
}

public class UserRepository : IUserRepository
{
    private readonly IDbConnectionFactory _db;

    public UserRepository(IDbConnectionFactory db)
    {
        _db = db;
    }

    public record UserDbRow(
        string id,
        string username,
        string password_hash,
        string role,
        string created_at);

    public async Task<User?> GetByUsernameAsync(string username)
    {
        using var conn = _db.CreateConnection();
        const string sql = "SELECT id, username, password_hash, role, created_at FROM users WHERE username = @Username COLLATE NOCASE LIMIT 1;";
        var row = await conn.QueryFirstOrDefaultAsync<UserDbRow>(sql, new { Username = username });
        if (row == null) return null;

        return new User
        {
            Id = row.id,
            Username = row.username,
            PasswordHash = row.password_hash,
            Role = row.role,
            CreatedAt = row.created_at
        };
    }

    public async Task<int> GetCountAsync()
    {
        using var conn = _db.CreateConnection();
        const string sql = "SELECT COUNT(*) FROM users;";
        return await conn.ExecuteScalarAsync<int>(sql);
    }

    public async Task CreateAsync(User user)
    {
        using var conn = _db.CreateConnection();
        const string sql = @"
            INSERT INTO users (id, username, password_hash, role, created_at)
            VALUES (@Id, @Username, @PasswordHash, @Role, @CreatedAt);";
        await conn.ExecuteAsync(sql, new
        {
            user.Id,
            user.Username,
            user.PasswordHash,
            user.Role,
            user.CreatedAt
        });
    }

    public async Task<bool> UpdatePasswordAsync(string username, string newPasswordHash)
    {
        using var conn = _db.CreateConnection();
        const string sql = "UPDATE users SET password_hash = @Hash WHERE username = @Username COLLATE NOCASE;";
        int affected = await conn.ExecuteAsync(sql, new { Hash = newPasswordHash, Username = username });
        return affected > 0;
    }
}
