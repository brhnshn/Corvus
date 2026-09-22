using Corvus.Api.Data;

namespace Corvus.Api.BackgroundServices;

public class RetentionCleanupService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<RetentionCleanupService> _logger;
    private readonly int _retentionDays;

    public RetentionCleanupService(IServiceProvider services, ILogger<RetentionCleanupService> logger)
    {
        _services = services;
        _logger = logger;

        string? envRetention = Environment.GetEnvironmentVariable("CORVUS_METRICS_RETENTION_DAYS");
        _retentionDays = int.TryParse(envRetention, out int val) && val > 0 ? val : 30;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("RetentionCleanupService başlatıldı (Saklama süresi: {Days} gün).", _retentionDays);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _services.CreateScope();
                var metricsRepo = scope.ServiceProvider.GetRequiredService<IMetricsRepository>();
                var uptimeRepo = scope.ServiceProvider.GetRequiredService<IUptimeRepository>();

                _logger.LogInformation("Eski metrik ve uptime kayıtları temizleniyor...");
                await metricsRepo.CleanupOldAsync(_retentionDays);
                await uptimeRepo.CleanupOldAsync(_retentionDays);
                _logger.LogInformation("Eski kayıtların temizliği tamamlandı.");
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Retention temizliği sırasında hata oluştu.");
            }

            try
            {
                await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }

        _logger.LogInformation("RetentionCleanupService durduruldu.");
    }
}
