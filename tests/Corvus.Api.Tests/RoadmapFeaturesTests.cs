using Corvus.Api.Models;
using Corvus.Api.Services;
using Microsoft.AspNetCore.Http;
using Xunit;

namespace Corvus.Api.Tests;

public class RoadmapFeaturesTests
{
    [Fact]
    public async Task EventBroadcaster_Broadcasts_And_Subscribers_Receive_Events()
    {
        var broadcaster = new EventBroadcaster();
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(2));

        broadcaster.Broadcast("service_status_changed", "{\"id\":\"svc1\",\"status\":\"down\"}");

        var stream = broadcaster.SubscribeAsync(cts.Token);
        var enumerator = stream.GetAsyncEnumerator(cts.Token);

        bool hasItem = await enumerator.MoveNextAsync();
        Assert.True(hasItem);
        Assert.Equal("service_status_changed", enumerator.Current.EventType);
        Assert.Contains("svc1", enumerator.Current.PayloadJson);
    }

    [Theory]
    [InlineData("Tailscale-User-Login", "alice@tailscale.com", "alice@tailscale.com")]
    [InlineData("Cf-Access-Authenticated-User-Email", "bob@cloudflare.com", "bob@cloudflare.com")]
    [InlineData("Remote-User", "charlie_sso", "charlie_sso")]
    [InlineData("X-Forwarded-User", "dave_proxy", "dave_proxy")]
    public void ProxyAuthHeaders_ResolvedCorrectly(string headerKey, string headerValue, string expectedUsername)
    {
        var headers = new HeaderDictionary
        {
            [headerKey] = headerValue
        };

        var authService = new AuthService(new FakeUserRepo(), new FakeSettingsRepo(), new Microsoft.Extensions.Configuration.ConfigurationBuilder().Build());
        string? result = authService.CheckProxyAuthHeader(headers);

        Assert.Equal(expectedUsername, result);
    }

    [Fact]
    public void DeadMansSnitch_Threshold_Calculation_Works()
    {
        var monitor = new PushMonitor
        {
            Id = "snitch-1",
            Token = "backup-token",
            Name = "Daily DB Backup",
            ExpectedIntervalMinutes = 1440,
            GracePeriodMinutes = 60,
            LastSeenAt = DateTime.UtcNow.AddMinutes(-1550).ToString("o"),
            Status = "healthy"
        };

        var lastSeen = DateTime.Parse(monitor.LastSeenAt, null, System.Globalization.DateTimeStyles.RoundtripKind).ToUniversalTime();
        var allowed = TimeSpan.FromMinutes(monitor.ExpectedIntervalMinutes + monitor.GracePeriodMinutes);
        bool isOverdue = (DateTime.UtcNow - lastSeen) > allowed;

        Assert.True(isOverdue);
    }

    private class FakeUserRepo : Corvus.Api.Data.IUserRepository
    {
        public Task<User?> GetByUsernameAsync(string username) => Task.FromResult<User?>(null);
        public Task<int> GetCountAsync() => Task.FromResult(0);
        public Task CreateAsync(User user) => Task.CompletedTask;
        public Task<bool> UpdatePasswordAsync(string username, string newPasswordHash) => Task.FromResult(true);
    }

    private class FakeSettingsRepo : Corvus.Api.Data.ISettingsRepository
    {
        public Task<string?> GetAsync(string key) => Task.FromResult<string?>(null);
        public Task SetAsync(string key, string value) => Task.CompletedTask;
        public Task<Dictionary<string, string>> GetAllAsync() => Task.FromResult(new Dictionary<string, string>());
    }
}
