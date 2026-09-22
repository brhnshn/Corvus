using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using Corvus.Api.Data;
using Corvus.Api.Models;

namespace Corvus.Api.Services;

public interface IAuthService
{
    bool IsAuthEnabled { get; }
    Task<bool> HasUsersAsync();
    Task<bool> IsRegistrationEnabledAsync();
    Task SetRegistrationEnabledAsync(bool enabled);
    Task<(bool Success, string? ErrorMessage)> RegisterAsync(string username, string password);
    Task<(bool Success, string? Username)> ValidateCredentialsAsync(string username, string password);
    string GenerateSessionToken(string username);
    (bool IsValid, string? Username) ValidateSessionToken(string? token);
    void InvalidateSessionToken(string? token);
}

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepo;
    private readonly ISettingsRepository _settings;
    private readonly bool _authEnabled;
    private readonly string _defaultUser;
    private readonly string _defaultPassHash;
    private static readonly ConcurrentDictionary<string, string> ActiveSessions = new();

    public bool IsAuthEnabled => _authEnabled;

    public AuthService(IUserRepository userRepo, ISettingsRepository settings, IConfiguration configuration)
    {
        _userRepo = userRepo;
        _settings = settings;

        string? envEnabled = Environment.GetEnvironmentVariable("CORVUS_AUTH_ENABLED");
        _authEnabled = envEnabled == null || !string.Equals(envEnabled, "false", StringComparison.OrdinalIgnoreCase);

        _defaultUser = Environment.GetEnvironmentVariable("CORVUS_AUTH_USER") ?? "admin";
        string rawPass = Environment.GetEnvironmentVariable("CORVUS_AUTH_PASS") ?? "corvus123";
        _defaultPassHash = HashPassword(rawPass);
    }

    public async Task<bool> HasUsersAsync()
    {
        int count = await _userRepo.GetCountAsync();
        return count > 0;
    }

    public async Task<bool> IsRegistrationEnabledAsync()
    {
        string? val = await _settings.GetAsync("registration_enabled");
        // Varsayılan olarak açıktır ("true")
        return val == null || string.Equals(val, "true", StringComparison.OrdinalIgnoreCase);
    }

    public async Task SetRegistrationEnabledAsync(bool enabled)
    {
        await _settings.SetAsync("registration_enabled", enabled ? "true" : "false");
    }

    public async Task<(bool Success, string? ErrorMessage)> RegisterAsync(string username, string password)
    {
        bool allowed = await IsRegistrationEnabledAsync();
        if (!allowed)
        {
            return (false, "Yeni kullanıcı kayıtları kapatılmıştır.");
        }

        string cleanUser = username?.Trim() ?? string.Empty;
        if (cleanUser.Length < 3)
        {
            return (false, "Kullanıcı adı en az 3 karakter olmalıdır.");
        }

        if (string.IsNullOrWhiteSpace(password) || password.Length < 4)
        {
            return (false, "Şifre en az 4 karakter olmalıdır.");
        }

        var existing = await _userRepo.GetByUsernameAsync(cleanUser);
        if (existing != null)
        {
            return (false, "Bu kullanıcı adı zaten kayıtlı.");
        }

        var user = new User
        {
            Id = Guid.NewGuid().ToString("N"),
            Username = cleanUser,
            PasswordHash = HashPassword(password),
            Role = "admin",
            CreatedAt = DateTime.UtcNow.ToString("o")
        };

        await _userRepo.CreateAsync(user);
        return (true, null);
    }

    public async Task<(bool Success, string? Username)> ValidateCredentialsAsync(string username, string password)
    {
        if (!_authEnabled) return (true, "anonymous");
        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
        {
            return (false, null);
        }

        string cleanUser = username.Trim();
        var user = await _userRepo.GetByUsernameAsync(cleanUser);
        if (user != null)
        {
            string inputHash = HashPassword(password);
            bool match = CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(inputHash),
                Encoding.UTF8.GetBytes(user.PasswordHash));

            return match ? (true, user.Username) : (false, null);
        }

        // Eğer veritabanında hiç kullanıcı yoksa, ortam değişkenindeki varsayılan kullanıcı geçerlidir
        int userCount = await _userRepo.GetCountAsync();
        if (userCount == 0 && string.Equals(cleanUser, _defaultUser, StringComparison.Ordinal))
        {
            string inputHash = HashPassword(password);
            bool match = CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(inputHash),
                Encoding.UTF8.GetBytes(_defaultPassHash));

            return match ? (true, _defaultUser) : (false, null);
        }

        return (false, null);
    }

    public string GenerateSessionToken(string username)
    {
        byte[] bytes = new byte[32];
        RandomNumberGenerator.Fill(bytes);
        string token = Convert.ToHexString(bytes);
        ActiveSessions[token] = username;
        return token;
    }

    public (bool IsValid, string? Username) ValidateSessionToken(string? token)
    {
        if (!_authEnabled) return (true, "anonymous");
        if (string.IsNullOrWhiteSpace(token)) return (false, null);

        if (ActiveSessions.TryGetValue(token, out var username))
        {
            return (true, username);
        }

        return (false, null);
    }

    public void InvalidateSessionToken(string? token)
    {
        if (!string.IsNullOrWhiteSpace(token))
        {
            ActiveSessions.TryRemove(token, out _);
        }
    }

    private static string HashPassword(string password)
    {
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        return Convert.ToHexString(hash);
    }
}
