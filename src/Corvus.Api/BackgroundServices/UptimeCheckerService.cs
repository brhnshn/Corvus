using System.Diagnostics;
using Corvus.Api.Data;
using Corvus.Api.Models;

namespace Corvus.Api.BackgroundServices;

public class UptimeCheckerService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<UptimeCheckerService> _logger;

    public UptimeCheckerService(
        IServiceProvider services, 
        IHttpClientFactory httpClientFactory,
        ILogger<UptimeCheckerService> logger)
    {
        _services = services;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
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

                var allServices = await servicesRepo.GetAllAsync();
                var httpClient = _httpClientFactory.CreateClient();
                httpClient.Timeout = TimeSpan.FromSeconds(5);

                foreach (var s in allServices)
                {
                    string? targetUrl = !string.IsNullOrWhiteSpace(s.HealthCheckUrl) ? s.HealthCheckUrl : s.Url;
                    if (string.IsNullOrWhiteSpace(targetUrl) || !targetUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }

                    var check = new UptimeCheck
                    {
                        ServiceId = s.Id,
                        CheckedAt = DateTime.UtcNow.ToString("o")
                    };

                    var sw = Stopwatch.StartNew();
                    try
                    {
                        var response = await httpClient.GetAsync(targetUrl, stoppingToken);
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

                    await uptimeRepo.InsertAsync(check);
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
