using System.Text;
using System.Text.Json;
using Corvus.Api.Data;
using Corvus.Api.Models;

namespace Corvus.Api.Services;

public interface INotificationService
{
    Task DispatchServiceAlertAsync(string serviceName, string? url, bool isDown, string? errorMessage, CancellationToken ct = default);
    Task<NotificationResult> TestChannelAsync(string channel, string? webhookUrl, string? botToken, string? chatId, CancellationToken ct = default);
}

public class NotificationService : INotificationService
{
    private readonly ISettingsRepository _settings;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        ISettingsRepository settings,
        IHttpClientFactory httpClientFactory,
        ILogger<NotificationService> logger)
    {
        _settings = settings;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task DispatchServiceAlertAsync(string serviceName, string? url, bool isDown, string? errorMessage, CancellationToken ct = default)
    {
        var settings = await _settings.GetAllAsync();
        string title = isDown 
            ? $"🔴 [SERVİS ÇÖKTÜ] {serviceName}" 
            : $"🟢 [SERVİS KURTARILDI] {serviceName}";

        string message = isDown
            ? $"Servis erişilemez durumda!\nURL: {url ?? "Belirtilmedi"}\nHata: {errorMessage ?? "Bilinmiyor"}\nZaman: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC"
            : $"Servis tekrar sağlıklı şekilde yanıt veriyor.\nURL: {url ?? "Belirtilmedi"}\nZaman: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC";

        var tasks = new List<Task>();

        // Discord
        if (settings.TryGetValue("notification_discord_enabled", out var dEnabled) && dEnabled == "true" &&
            settings.TryGetValue("notification_discord_webhook_url", out var dUrl) && !string.IsNullOrWhiteSpace(dUrl))
        {
            tasks.Add(SendDiscordAsync(dUrl, title, message, isDown, ct));
        }

        // Telegram
        if (settings.TryGetValue("notification_telegram_enabled", out var tEnabled) && tEnabled == "true" &&
            settings.TryGetValue("notification_telegram_bot_token", out var tToken) && !string.IsNullOrWhiteSpace(tToken) &&
            settings.TryGetValue("notification_telegram_chat_id", out var tChat) && !string.IsNullOrWhiteSpace(tChat))
        {
            tasks.Add(SendTelegramAsync(tToken, tChat, title, message, ct));
        }

        // Ntfy
        if (settings.TryGetValue("notification_ntfy_enabled", out var nEnabled) && nEnabled == "true" &&
            settings.TryGetValue("notification_ntfy_url", out var nUrl) && !string.IsNullOrWhiteSpace(nUrl))
        {
            tasks.Add(SendNtfyAsync(nUrl, title, message, isDown, ct));
        }

        // Generic Webhook
        if (settings.TryGetValue("notification_webhook_enabled", out var wEnabled) && wEnabled == "true" &&
            settings.TryGetValue("notification_webhook_url", out var wUrl) && !string.IsNullOrWhiteSpace(wUrl))
        {
            tasks.Add(SendGenericWebhookAsync(wUrl, isDown ? "service_down" : "service_up", title, message, ct));
        }

        if (tasks.Count > 0)
        {
            await Task.WhenAll(tasks);
        }
    }

    public async Task<NotificationResult> TestChannelAsync(string channel, string? webhookUrl, string? botToken, string? chatId, CancellationToken ct = default)
    {
        string title = "🚀 Corvus Test Bildirimi";
        string message = "Bu bildirim Corvus System Monitor tarafından başarıyla gönderildi. Bildirim entegrasyonunuz aktif ve çalışıyor!";

        try
        {
            switch (channel.ToLowerInvariant())
            {
                case "discord":
                    if (string.IsNullOrWhiteSpace(webhookUrl))
                        return new NotificationResult(false, "Discord Webhook URL boş olamaz.");
                    await SendDiscordAsync(webhookUrl, title, message, isDown: false, ct);
                    return new NotificationResult(true, "Discord test bildirimi başarıyla gönderildi.");

                case "telegram":
                    if (string.IsNullOrWhiteSpace(botToken) || string.IsNullOrWhiteSpace(chatId))
                        return new NotificationResult(false, "Telegram Bot Token ve Chat ID boş olamaz.");
                    await SendTelegramAsync(botToken, chatId, title, message, ct);
                    return new NotificationResult(true, "Telegram test bildirimi başarıyla gönderildi.");

                case "ntfy":
                    if (string.IsNullOrWhiteSpace(webhookUrl))
                        return new NotificationResult(false, "Ntfy URL / Topic boş olamaz.");
                    await SendNtfyAsync(webhookUrl, title, message, isDown: false, ct);
                    return new NotificationResult(true, "Ntfy test bildirimi başarıyla gönderildi.");

                case "webhook":
                    if (string.IsNullOrWhiteSpace(webhookUrl))
                        return new NotificationResult(false, "Webhook URL boş olamaz.");
                    await SendGenericWebhookAsync(webhookUrl, "test", title, message, ct);
                    return new NotificationResult(true, "Generic Webhook test çağrısı başarıyla yapıldı.");

                default:
                    return new NotificationResult(false, $"Desteklenmeyen bildirim kanalı: {channel}");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "{Channel} test bildirimi başarısız oldu.", channel);
            return new NotificationResult(false, $"Bildirim gönderilemedi: {ex.Message}");
        }
    }

    private async Task SendDiscordAsync(string webhookUrl, string title, string message, bool isDown, CancellationToken ct)
    {
        try
        {
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(8);

            int color = isDown ? 15548997 : 5763719; // Kırmızı (#ED4245) veya Yeşil (#57F287)
            string isoNow = DateTime.UtcNow.ToString("o");

            string json = $$"""
            {
              "username": "Corvus Monitor",
              "embeds": [
                {
                  "title": {{JsonSerializer.Serialize(title, CorvusJsonSerializerContext.Default.String)}},
                  "description": {{JsonSerializer.Serialize(message, CorvusJsonSerializerContext.Default.String)}},
                  "color": {{color}},
                  "timestamp": "{{isoNow}}"
                }
              ]
            }
            """;

            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var res = await client.PostAsync(webhookUrl, content, ct);
            if (!res.IsSuccessStatusCode)
            {
                _logger.LogWarning("Discord webhook hata döndü: {StatusCode}", res.StatusCode);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Discord webhook gönderilemedi.");
        }
    }

    private async Task SendTelegramAsync(string botToken, string chatId, string title, string message, CancellationToken ct)
    {
        try
        {
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(8);

            string fullText = $"*{title}*\n\n{message}";
            string url = $"https://api.telegram.org/bot{botToken}/sendMessage";

            string json = $$"""
            {
              "chat_id": {{JsonSerializer.Serialize(chatId, CorvusJsonSerializerContext.Default.String)}},
              "text": {{JsonSerializer.Serialize(fullText, CorvusJsonSerializerContext.Default.String)}},
              "parse_mode": "Markdown"
            }
            """;

            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var res = await client.PostAsync(url, content, ct);
            if (!res.IsSuccessStatusCode)
            {
                _logger.LogWarning("Telegram bot API hata döndü: {StatusCode}", res.StatusCode);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Telegram bildirimi gönderilemedi.");
        }
    }

    private async Task SendNtfyAsync(string ntfyUrl, string title, string message, bool isDown, CancellationToken ct)
    {
        try
        {
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(8);

            using var req = new HttpRequestMessage(HttpMethod.Post, ntfyUrl);
            req.Headers.Add("Title", title);
            req.Headers.Add("Priority", isDown ? "urgent" : "default");
            req.Headers.Add("Tags", isDown ? "warning,skull" : "white_check_mark,sparkles");
            req.Content = new StringContent(message, Encoding.UTF8, "text/plain");

            var res = await client.SendAsync(req, ct);
            if (!res.IsSuccessStatusCode)
            {
                _logger.LogWarning("Ntfy bildirim isteği hata döndü: {StatusCode}", res.StatusCode);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ntfy bildirimi gönderilemedi.");
        }
    }

    private async Task SendGenericWebhookAsync(string webhookUrl, string eventType, string title, string message, CancellationToken ct)
    {
        try
        {
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(8);

            string isoNow = DateTime.UtcNow.ToString("o");
            string json = $$"""
            {
              "event": {{JsonSerializer.Serialize(eventType, CorvusJsonSerializerContext.Default.String)}},
              "title": {{JsonSerializer.Serialize(title, CorvusJsonSerializerContext.Default.String)}},
              "message": {{JsonSerializer.Serialize(message, CorvusJsonSerializerContext.Default.String)}},
              "timestamp": "{{isoNow}}"
            }
            """;

            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var res = await client.PostAsync(webhookUrl, content, ct);
            if (!res.IsSuccessStatusCode)
            {
                _logger.LogWarning("Generic webhook hata döndü: {StatusCode}", res.StatusCode);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Generic webhook çağrısı başarısız oldu.");
        }
    }
}
