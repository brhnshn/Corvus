using Corvus.Api.Data;
using Corvus.Api.Services;

namespace Corvus.Api.BackgroundServices;

public class ContainerDiscoveryService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<ContainerDiscoveryService> _logger;

    public ContainerDiscoveryService(IServiceProvider services, ILogger<ContainerDiscoveryService> logger)
    {
        _services = services;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("ContainerDiscoveryService başlatıldı (Periyot: 10sn).");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _services.CreateScope();
                var docker = scope.ServiceProvider.GetRequiredService<IDockerService>();
                var repo = scope.ServiceProvider.GetRequiredService<IServicesRepository>();

                bool isDockerUp = await docker.IsAvailableAsync(stoppingToken);
                if (isDockerUp)
                {
                    var containers = await docker.GetContainersAsync(stoppingToken);
                    var activeIds = new List<string>();

                    foreach (var c in containers)
                    {
                        if (docker.ShouldIgnoreContainer(c))
                        {
                            continue;
                        }

                        activeIds.Add(c.Id);
                        var service = docker.MapContainerToService(c);
                        await repo.UpsertDockerServiceAsync(service);
                    }

                    await repo.SyncDockerServicesAsync(activeIds);
                }
                else
                {
                    _logger.LogDebug("Docker daemon yanıt vermiyor, container keşfi atlandı.");
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Container keşfi döngüsünde hata oluştu.");
            }

            try
            {
                await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }

        _logger.LogInformation("ContainerDiscoveryService durduruldu.");
    }
}
