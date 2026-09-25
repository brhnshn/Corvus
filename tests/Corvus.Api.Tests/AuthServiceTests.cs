using Corvus.Api.Data;
using Corvus.Api.Models;
using Corvus.Api.Services;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace Corvus.Api.Tests;

public class AuthServiceTests
{
    private class FakeUserRepository : IUserRepository
    {
        private readonly List<User> _users = new();

        public Task<User?> GetByUsernameAsync(string username) =>
            Task.FromResult(_users.FirstOrDefault(u => string.Equals(u.Username, username, StringComparison.OrdinalIgnoreCase)));

        public Task<int> GetCountAsync() => Task.FromResult(_users.Count);

        public Task CreateAsync(User user)
        {
            _users.Add(user);
            return Task.CompletedTask;
        }

        public Task<bool> UpdatePasswordAsync(string username, string newPasswordHash)
        {
            var u = _users.FirstOrDefault(x => string.Equals(x.Username, username, StringComparison.OrdinalIgnoreCase));
            if (u == null) return Task.FromResult(false);
            u.PasswordHash = newPasswordHash;
            return Task.FromResult(true);
        }
    }

    private class FakeSettingsRepository : ISettingsRepository
    {
        private readonly Dictionary<string, string> _dict = new();

        public Task<string?> GetAsync(string key) =>
            Task.FromResult(_dict.TryGetValue(key, out var v) ? v : null);

        public Task SetAsync(string key, string value)
        {
            _dict[key] = value;
            return Task.CompletedTask;
        }

        public Task<Dictionary<string, string>> GetAllAsync() =>
            Task.FromResult(new Dictionary<string, string>(_dict));

        public Task SetBatchAsync(Dictionary<string, string> settings)
        {
            foreach (var (k, v) in settings)
            {
                _dict[k] = v;
            }
            return Task.CompletedTask;
        }
    }

    private static AuthService CreateService(
        FakeUserRepository? userRepo = null, 
        FakeSettingsRepository? settings = null,
        bool authEnabled = true)
    {
        userRepo ??= new FakeUserRepository();
        settings ??= new FakeSettingsRepository();
        
        Environment.SetEnvironmentVariable("CORVUS_AUTH_ENABLED", authEnabled ? "true" : "false");
        var config = new ConfigurationBuilder().Build();
        return new AuthService(userRepo, settings, config);
    }

    [Fact]
    public async Task RegisterAsync_Succeeds_When_Registration_Enabled()
    {
        var authService = CreateService();

        var (success, error) = await authService.RegisterAsync("newadmin", "securePass123");

        Assert.True(success);
        Assert.Null(error);
        Assert.True(await authService.HasUsersAsync());
    }

    [Fact]
    public async Task RegisterAsync_Fails_When_Registration_Disabled()
    {
        var settings = new FakeSettingsRepository();
        await settings.SetAsync("registration_enabled", "false");
        var authService = CreateService(settings: settings);

        var (success, error) = await authService.RegisterAsync("secondadmin", "pass123");

        Assert.False(success);
        Assert.Equal("Yeni kullanıcı kayıtları kapatılmıştır.", error);
    }

    [Fact]
    public async Task RegisterAsync_Fails_On_Duplicate_Username()
    {
        var authService = CreateService();
        await authService.RegisterAsync("sameuser", "pass123");

        var (success, error) = await authService.RegisterAsync("sameuser", "otherpass");

        Assert.False(success);
        Assert.Equal("Bu kullanıcı adı zaten kayıtlı.", error);
    }

    [Fact]
    public async Task ValidateCredentialsAsync_Succeeds_With_Correct_Password()
    {
        var authService = CreateService();
        await authService.RegisterAsync("tester", "mySecret123");

        var (valid, username) = await authService.ValidateCredentialsAsync("tester", "mySecret123");
        Assert.True(valid);
        Assert.Equal("tester", username);

        var (invalid, _) = await authService.ValidateCredentialsAsync("tester", "wrongPassword");
        Assert.False(invalid);
    }

    [Fact]
    public void SessionToken_LifeCycle_Works()
    {
        var authService = CreateService();
        string token = authService.GenerateSessionToken("testuser");

        var (isValid, user) = authService.ValidateSessionToken(token);
        Assert.True(isValid);
        Assert.Equal("testuser", user);

        authService.InvalidateSessionToken(token);
        var (isInvalidAfter, _) = authService.ValidateSessionToken(token);
        Assert.False(isInvalidAfter);
    }

    [Fact]
    public async Task ToggleRegistration_Updates_Setting_Correctly()
    {
        var authService = CreateService();
        Assert.True(await authService.IsRegistrationEnabledAsync());

        await authService.SetRegistrationEnabledAsync(false);
        Assert.False(await authService.IsRegistrationEnabledAsync());

        await authService.SetRegistrationEnabledAsync(true);
        Assert.True(await authService.IsRegistrationEnabledAsync());
    }

    [Fact]
    public void CheckProxyAuthHeader_Extracts_Identity_From_Trusted_Headers()
    {
        var authService = CreateService();
        var headers = new Microsoft.AspNetCore.Http.HeaderDictionary
        {
            ["Tailscale-User-Login"] = "admin@my-tailscale.ts.net"
        };

        string? user = authService.CheckProxyAuthHeader(headers);
        Assert.Equal("admin@my-tailscale.ts.net", user);

        var headersCf = new Microsoft.AspNetCore.Http.HeaderDictionary
        {
            ["Cf-Access-Authenticated-User-Email"] = "devops@company.com"
        };
        string? userCf = authService.CheckProxyAuthHeader(headersCf);
        Assert.Equal("devops@company.com", userCf);
    }

    [Fact]
    public async Task CorvusAuthFilter_Allows_When_Proxy_Header_Present()
    {
        var authService = CreateService();
        var filter = new CorvusAuthFilter(authService);

        var httpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext();
        httpContext.Request.Headers["Tailscale-User-Login"] = "admin@tailscale";

        var filterContext = Microsoft.AspNetCore.Http.EndpointFilterInvocationContext.Create(httpContext);
        bool nextCalled = false;

        var result = await filter.InvokeAsync(filterContext, _ =>
        {
            nextCalled = true;
            return ValueTask.FromResult<object?>("success");
        });

        Assert.True(nextCalled);
        Assert.Equal("success", result);
    }

    [Fact]
    public async Task CorvusAuthFilter_Allows_When_Valid_Session_Cookie_Present()
    {
        var authService = CreateService();
        var filter = new CorvusAuthFilter(authService);

        string token = authService.GenerateSessionToken("admin");

        var httpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext();
        httpContext.Request.Headers["Cookie"] = $"corvus_session={token}";

        var filterContext = Microsoft.AspNetCore.Http.EndpointFilterInvocationContext.Create(httpContext);
        bool nextCalled = false;

        var result = await filter.InvokeAsync(filterContext, _ =>
        {
            nextCalled = true;
            return ValueTask.FromResult<object?>("success");
        });

        Assert.True(nextCalled);
        Assert.Equal("success", result);
    }

    [Fact]
    public async Task CorvusAuthFilter_Returns_Unauthorized_When_Unauthenticated()
    {
        var authService = CreateService();
        var filter = new CorvusAuthFilter(authService);

        var httpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext();
        var filterContext = Microsoft.AspNetCore.Http.EndpointFilterInvocationContext.Create(httpContext);
        bool nextCalled = false;

        var result = await filter.InvokeAsync(filterContext, _ =>
        {
            nextCalled = true;
            return ValueTask.FromResult<object?>("success");
        });

        Assert.False(nextCalled);
        Assert.NotNull(result);
        Assert.IsAssignableFrom<Microsoft.AspNetCore.Http.IResult>(result);
    }
}
