using System.Text.Json.Serialization;

namespace Corvus.Api.Models;

public record DashboardSummaryDto(
    int TotalServices,
    int HealthyServices,
    int DegradedServices,
    int DownServices,
    int TotalContainers,
    int RunningContainers,
    BackupEvent? LastBackup,
    SystemMetric? LatestMetrics
);

public record CreateServiceRequest(
    string Name,
    string? Description,
    string? Url,
    string? Icon,
    string? Category,
    string? HealthCheckUrl
);

public record UpdateServiceRequest(
    string Name,
    string? Description,
    string? Url,
    string? Icon,
    string? Category,
    string? HealthCheckUrl
);

public record PushBackupRequest(
    string Status,
    long? SizeBytes,
    string? Message
);

public record AuthLoginRequest(
    string Username,
    string Password
);

public record AuthRegisterRequest(
    string Username,
    string Password
);

public record ToggleRegistrationRequest(
    bool Enabled
);

public record AuthStatusResponse(
    bool AuthEnabled,
    bool IsAuthenticated,
    string? Username,
    bool HasUsers,
    bool RegistrationEnabled
);

public record GenericApiResponse(
    bool Success,
    string? Message
);

[JsonSourceGenerationOptions(
    WriteIndented = false,
    PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase,
    DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull)]
[JsonSerializable(typeof(DockerContainerInfo))]
[JsonSerializable(typeof(List<DockerContainerInfo>))]
[JsonSerializable(typeof(DockerPortInfo))]
[JsonSerializable(typeof(List<DockerPortInfo>))]
[JsonSerializable(typeof(DockerVersionInfo))]
[JsonSerializable(typeof(Service))]
[JsonSerializable(typeof(List<Service>))]
[JsonSerializable(typeof(ServiceOverride))]
[JsonSerializable(typeof(List<ServiceOverride>))]
[JsonSerializable(typeof(SystemMetric))]
[JsonSerializable(typeof(List<SystemMetric>))]
[JsonSerializable(typeof(UptimeCheck))]
[JsonSerializable(typeof(List<UptimeCheck>))]
[JsonSerializable(typeof(BackupEvent))]
[JsonSerializable(typeof(List<BackupEvent>))]
[JsonSerializable(typeof(DashboardSummaryDto))]
[JsonSerializable(typeof(CreateServiceRequest))]
[JsonSerializable(typeof(UpdateServiceRequest))]
[JsonSerializable(typeof(PushBackupRequest))]
[JsonSerializable(typeof(AuthLoginRequest))]
[JsonSerializable(typeof(AuthRegisterRequest))]
[JsonSerializable(typeof(ToggleRegistrationRequest))]
[JsonSerializable(typeof(AuthStatusResponse))]
[JsonSerializable(typeof(GenericApiResponse))]
[JsonSerializable(typeof(Dictionary<string, string>))]
public partial class CorvusJsonSerializerContext : JsonSerializerContext
{
}
