using System.Diagnostics;
using System.Runtime.InteropServices;
using Corvus.Api.Data;
using Corvus.Api.Models;

namespace Corvus.Api.BackgroundServices;

public class SystemMetricsCollector : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<SystemMetricsCollector> _logger;
    private TimeSpan _prevCpuTime = TimeSpan.Zero;
    private DateTime _prevCpuCheck = DateTime.UtcNow;

    public SystemMetricsCollector(IServiceProvider services, ILogger<SystemMetricsCollector> logger)
    {
        _services = services;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("SystemMetricsCollector başlatıldı (Periyot: 15sn).");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _services.CreateScope();
                var repo = scope.ServiceProvider.GetRequiredService<IMetricsRepository>();

                var metric = CollectMetrics();
                await repo.InsertAsync(metric);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Sistem metrikleri toplanırken hata oluştu.");
            }

            try
            {
                await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }

        _logger.LogInformation("SystemMetricsCollector durduruldu.");
    }

    private SystemMetric CollectMetrics()
    {
        // CPU hesabı
        double cpuPercent = 0.0;
        try
        {
            using var proc = Process.GetCurrentProcess();
            var curCpuTime = proc.TotalProcessorTime;
            var curTime = DateTime.UtcNow;

            var timeDiff = (curTime - _prevCpuCheck).TotalMilliseconds;
            var cpuDiff = (curCpuTime - _prevCpuTime).TotalMilliseconds;

            if (timeDiff > 0 && _prevCpuTime != TimeSpan.Zero)
            {
                cpuPercent = Math.Round((cpuDiff / (timeDiff * Environment.ProcessorCount)) * 100.0, 1);
            }

            _prevCpuTime = curCpuTime;
            _prevCpuCheck = curTime;
        }
        catch
        {
            // fallback
        }

        // RAM hesabı
        long ramUsedMb = 0;
        long ramTotalMb = 0;

        try
        {
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux) && File.Exists("/proc/meminfo"))
            {
                string[] lines = File.ReadAllLines("/proc/meminfo");
                long memTotalKb = 0;
                long memAvailKb = 0;

                foreach (var line in lines)
                {
                    if (line.StartsWith("MemTotal:"))
                    {
                        memTotalKb = ParseMemInfoKb(line);
                    }
                    else if (line.StartsWith("MemAvailable:"))
                    {
                        memAvailKb = ParseMemInfoKb(line);
                    }
                }

                ramTotalMb = memTotalKb / 1024;
                ramUsedMb = (memTotalKb - memAvailKb) / 1024;
            }
            else
            {
                // Windows fallback
                var gcMemory = GC.GetGCMemoryInfo();
                ramTotalMb = gcMemory.TotalAvailableMemoryBytes / (1024 * 1024);
                ramUsedMb = (gcMemory.TotalAvailableMemoryBytes - gcMemory.MemoryLoadBytes) / (1024 * 1024);
                if (ramUsedMb <= 0)
                {
                    using var curProc = Process.GetCurrentProcess();
                    ramUsedMb = curProc.WorkingSet64 / (1024 * 1024);
                }
            }
        }
        catch
        {
            ramTotalMb = 4096;
            ramUsedMb = 1024;
        }

        // Disk hesabı
        long diskUsedGb = 0;
        long diskTotalGb = 0;

        try
        {
            var drive = DriveInfo.GetDrives().FirstOrDefault(d => d.IsReady && d.DriveType == DriveType.Fixed);
            if (drive != null)
            {
                diskTotalGb = drive.TotalSize / (1024 * 1024 * 1024);
                diskUsedGb = (drive.TotalSize - drive.AvailableFreeSpace) / (1024 * 1024 * 1024);
            }
        }
        catch
        {
            diskTotalGb = 50;
            diskUsedGb = 15;
        }

        return new SystemMetric
        {
            RecordedAt = DateTime.UtcNow.ToString("o"),
            CpuPercent = Math.Clamp(cpuPercent, 0, 100),
            RamUsedMb = ramUsedMb,
            RamTotalMb = ramTotalMb > 0 ? ramTotalMb : 4096,
            DiskUsedGb = diskUsedGb,
            DiskTotalGb = diskTotalGb > 0 ? diskTotalGb : 50,
            NetworkRxBytes = 0,
            NetworkTxBytes = 0
        };
    }

    private static long ParseMemInfoKb(string line)
    {
        var parts = line.Split(':', StringSplitOptions.TrimEntries);
        if (parts.Length > 1)
        {
            var valPart = parts[1].Replace("kB", "").Trim();
            if (long.TryParse(valPart, out long val))
            {
                return val;
            }
        }
        return 0;
    }
}
