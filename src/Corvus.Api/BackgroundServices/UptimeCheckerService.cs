using System.Collections.Concurrent;
using System.Diagnostics;
using System.Net.Sockets;
using Corvus.Api.Data;
using Corvus.Api.Models;
using Corvus.Api.Services;

namespace Corvus.Api.BackgroundServices;

public class UptimeCheckerService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<UptimeCheckerService> _logger;
    private readonly IEventBroadcaster _eventBroadcaster;
    private readonly ConcurrentDictionary<string, string> _lastKnownStatus = new();

    public UptimeCheckerService(
        IServiceProvider services, 
        ILogger<UptimeCheckerService> logger,
        IEventBroadcaster eventBroadcaster)
    {
        _services = services;
        _logger = logger;
        _eventBroadcaster = eventBroadcaster;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("UptimeCheckerService başlatıldı (Periyot: 60sn).");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _services.CreateScope();
                var servicesRepo = scope.ServiceProvider.GetRequiredService<IServicesRepository>();
                var uptimeRepo = scope.ServiceProvider.GetRequiredService<IUptimeRepository>();
                var notifService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                var pushRepo = scope.ServiceProvider.GetRequiredService<IPushMonitorRepository>();

                var allServices = await servicesRepo.GetAllAsync();

                foreach (var s in allServices)
                {
                    string? targetUrl = !string.IsNullOrWhiteSpace(s.HealthCheckUrl) ? s.HealthCheckUrl : s.Url;
                    bool isTcp = string.Equals(s.CheckType, "tcp", StringComparison.OrdinalIgnoreCase) ||
                                (!string.IsNullOrWhiteSpace(targetUrl) && targetUrl.StartsWith("tcp://", StringComparison.OrdinalIgnoreCase));

                    if (string.IsNullOrWhiteSpace(targetUrl) && !isTcp)
                    {
                        continue;
                    }

                    var check = new UptimeCheck
                    {
                        ServiceId = s.Id,
                        CheckedAt = DateTime.UtcNow.ToString("o")
                    };

                    var sw = Stopwatch.StartNew();

                    if (isTcp)
                    {
                        // 1.4: TCP Port Ping Check
                        string host = "localhost";
                        int port = s.Port ?? 80;

                        if (!string.IsNullOrWhiteSpace(targetUrl))
                        {
                            try
                            {
                                var cleanUrl = targetUrl.StartsWith("tcp://", StringComparison.OrdinalIgnoreCase)
                                    ? targetUrl.Replace("tcp://", "http://", StringComparison.OrdinalIgnoreCase)
                                    : (targetUrl.Contains("://") ? targetUrl : $"http://{targetUrl}");
                                var uri = new Uri(cleanUrl);
                                host = uri.Host;
                                if (uri.Port > 0) port = uri.Port;
                            }
                            catch
                            {
                                host = targetUrl.Split(':')[0];
                            }
                        }

                        try
                        {
                            using var tcp = new TcpClient();
                            using var cts = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
                            cts.CancelAfter(TimeSpan.FromSeconds(5));
                            await tcp.ConnectAsync(host, port, cts.Token);
                            sw.Stop();
                            check.ResponseTimeMs = (int)sw.ElapsedMilliseconds;
                            check.Status = "up";
                        }
                        catch (Exception ex)
                        {
                            sw.Stop();
                            check.ResponseTimeMs = (int)sw.ElapsedMilliseconds;
                            check.Status = "down";
                            check.ErrorMessage = $"TCP bağlantı hatası ({host}:{port}): {ex.Message}";
                        }
                    }
                    else
                    {
                        // 1.4: HTTP / HTTPS Check & SSL Expiration Tracking
                        int? sslDays = null;
                        string? sslIssuer = null;

                        var handler = new HttpClientHandler
                        {
                            ServerCertificateCustomValidationCallback = (message, cert, chain, errors) =>
                            {
                                if (cert != null)
                                {
                                    sslDays = (int)Math.Max(0, (cert.NotAfter - DateTime.UtcNow).TotalDays);
                                    sslIssuer = cert.Issuer;
                                }
                                return true;
                            }
                        };

                        using var httpClient = new HttpClient(handler) { Timeout = TimeSpan.FromSeconds(5) };

                        try
                        {
                            var response = await httpClient.GetAsync(targetUrl!, stoppingToken);
                            sw.Stop();
                            check.ResponseTimeMs = (int)sw.ElapsedMilliseconds;

                            if (response.IsSuccessStatusCode)
                            {
                                check.Status = "up";
                            }
                            else
                            {
                                check.Status = "down";
                                check.ErrorMessage = $"HTTP {(int)response.StatusCode}";
                            }
                        }
                        catch (Exception ex)
                        {
                            sw.Stop();
                            check.ResponseTimeMs = (int)sw.ElapsedMilliseconds;
                            check.Status = "down";
                            check.ErrorMessage = ex.Message;
                        }

                        if (sslDays.HasValue)
                        {
                            await servicesRepo.UpdateSslInfoAsync(s.Id, sslDays.Value, sslIssuer);
                            if (sslDays.Value <= 14)
                            {
                                _logger.LogWarning("SSL sertifikası yakında bitiyor: Servis {ServiceName}, Kalan Gün: {Days}", s.Name, sslDays.Value);
                            }
                        }
                    }

                    await uptimeRepo.InsertAsync(check);

                    // Durum değişimi tespiti ve bildirim fırlatma
                    if (_lastKnownStatus.TryGetValue(s.Id, out var previousStatus))
                    {
                        if (previousStatus == "up" && check.Status == "down")
                        {
                            _ = notifService.DispatchServiceAlertAsync(s.Name, targetUrl ?? $"Port:{s.Port}", isDown: true, check.ErrorMessage, stoppingToken);
                            _eventBroadcaster.Broadcast("service_status_changed", $"{{\"id\":\"{s.Id}\",\"status\":\"down\"}}");
                        }
                        else if (previousStatus == "down" && check.Status == "up")
                        {
                            _ = notifService.DispatchServiceAlertAsync(s.Name, targetUrl ?? $"Port:{s.Port}", isDown: false, null, stoppingToken);
                            _eventBroadcaster.Broadcast("service_status_changed", $"{{\"id\":\"{s.Id}\",\"status\":\"healthy\"}}");
                        }
                    }

                    _lastKnownStatus[s.Id] = check.Status;
                }

                // 1.5: Dead Man's Snitch — Beklenen Periyot Kontrolü
                var pushMonitors = await pushRepo.GetAllAsync();
                foreach (var pm in pushMonitors)
                {
                    if (!string.IsNullOrEmpty(pm.LastSeenAt) && 
                        DateTime.TryParse(pm.LastSeenAt, null, System.Globalization.DateTimeStyles.RoundtripKind, out var lastSeen))
                    {
                        var allowedTime = TimeSpan.FromMinutes(pm.ExpectedIntervalMinutes + pm.GracePeriodMinutes);
                        if (DateTime.UtcNow - lastSeen.ToUniversalTime() > allowedTime && pm.Status != "down")
                        {
                            await pushRepo.UpdateStatusAsync(pm.Id, "down");
                            _ = notifService.DispatchServiceAlertAsync(
                                $"Dead Man's Snitch: {pm.Name}",
                                $"Token: {pm.Token}",
                                isDown: true,
                                $"Periyot süresi aşıldı! Son sinyal: {pm.LastSeenAt}",
                                stoppingToken);

                            _eventBroadcaster.Broadcast("snitch_status_changed", $"{{\"id\":\"{pm.Id}\",\"status\":\"down\"}}");
                        }
                    }
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Uptime kontrolü döngüsünde hata oluştu.");
            }

            try
            {
                await Task.Delay(TimeSpan.FromSeconds(60), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }

        _logger.LogInformation("UptimeCheckerService durduruldu.");
    }
}
