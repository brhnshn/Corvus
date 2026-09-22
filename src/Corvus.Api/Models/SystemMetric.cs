namespace Corvus.Api.Models;

public class SystemMetric
{
    public long Id { get; set; }
    public string RecordedAt { get; set; } = DateTime.UtcNow.ToString("o");
    public double CpuPercent { get; set; }
    public long RamUsedMb { get; set; }
    public long RamTotalMb { get; set; }
    public long DiskUsedGb { get; set; }
    public long DiskTotalGb { get; set; }
    public long NetworkRxBytes { get; set; }
    public long NetworkTxBytes { get; set; }
}
