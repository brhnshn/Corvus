namespace Corvus.Api.Models;

public record DbStatsResponse(
    long SizeBytes,
    long DbSizeBytes,
    long WalSizeBytes,
    string FormattedSize
);
