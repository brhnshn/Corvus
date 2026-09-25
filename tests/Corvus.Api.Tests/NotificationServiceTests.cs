using Corvus.Api.Data;
using Corvus.Api.Services;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Corvus.Api.Tests;

public class NotificationServiceTests
{
    private class FakeSettingsRepository : ISettingsRepository
    {
        private readonly Dictionary<string, string> _dict = new();

        public Task<Dictionary<string, string>> GetAllAsync() => Task.FromResult(new Dictionary<string, string>(_dict));
        public Task<string?> GetAsync(string key) => Task.FromResult(_dict.TryGetValue(key, out var v) ? v : null);
        public Task SetAsync(string key, string value)
        {
            _dict[key] = value;
            return Task.CompletedTask;
        }

        public Task SetBatchAsync(Dictionary<string, string> settings)
        {
            foreach (var (k, v) in settings)
            {
                _dict[k] = v;
            }
            return Task.CompletedTask;
        }
    }

    private class FakeHttpClientFactory : IHttpClientFactory
    {
        public HttpClient CreateClient(string name)
        {
            return new HttpClient();
        }
    }

    [Fact]
    public async Task TestChannelAsync_WithMissingDiscordUrl_ReturnsFailure()
    {
        var service = new NotificationService(new FakeSettingsRepository(), new FakeHttpClientFactory(), NullLogger<NotificationService>.Instance);

        var result = await service.TestChannelAsync("discord", webhookUrl: "", botToken: null, chatId: null);

        Assert.False(result.Success);
        Assert.Contains("Discord Webhook URL", result.Message);
    }

    [Fact]
    public async Task TestChannelAsync_WithMissingTelegramCredentials_ReturnsFailure()
    {
        var service = new NotificationService(new FakeSettingsRepository(), new FakeHttpClientFactory(), NullLogger<NotificationService>.Instance);

        var result = await service.TestChannelAsync("telegram", webhookUrl: null, botToken: "", chatId: "");

        Assert.False(result.Success);
        Assert.Contains("Telegram Bot Token", result.Message);
    }

    [Fact]
    public async Task TestChannelAsync_WithInvalidChannel_ReturnsFailure()
    {
        var service = new NotificationService(new FakeSettingsRepository(), new FakeHttpClientFactory(), NullLogger<NotificationService>.Instance);

        var result = await service.TestChannelAsync("unknown_channel", webhookUrl: null, botToken: null, chatId: null);

        Assert.False(result.Success);
        Assert.Contains("Unsupported notification channel", result.Message);
    }

    [Fact]
    public async Task TestChannelAsync_WithTurkishLanguage_ReturnsTurkishFailure()
    {
        var repo = new FakeSettingsRepository();
        await repo.SetAsync("system_language", "tr");
        var service = new NotificationService(repo, new FakeHttpClientFactory(), NullLogger<NotificationService>.Instance);

        var result = await service.TestChannelAsync("unknown_channel", webhookUrl: null, botToken: null, chatId: null);

        Assert.False(result.Success);
        Assert.Contains("Desteklenmeyen bildirim kanalı", result.Message);
    }

    [Theory]
    [InlineData("http://127.0.0.1:8080/webhook")]
    [InlineData("http://localhost/webhook")]
    [InlineData("http://169.254.169.254/latest/meta-data")]
    [InlineData("http://169.254.170.2/v2/metadata")]
    [InlineData("http://[::1]:8080/webhook")]
    [InlineData("http://[::ffff:127.0.0.1]:8080/webhook")]
    [InlineData("ftp://evil.com/payload")]
    [InlineData("file:///etc/passwd")]
    public async Task TestChannelAsync_WithSsrfUrl_ReturnsFailure(string ssrfUrl)
    {
        var service = new NotificationService(new FakeSettingsRepository(), new FakeHttpClientFactory(), NullLogger<NotificationService>.Instance);

        var result = await service.TestChannelAsync("discord", webhookUrl: ssrfUrl, botToken: null, chatId: null);

        Assert.False(result.Success);
        Assert.True(result.Message.Contains("SSRF") || result.Message.Contains("protokol") || result.Message.Contains("protocol"));
    }
}
