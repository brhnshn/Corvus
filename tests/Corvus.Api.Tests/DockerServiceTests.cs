using Corvus.Api.Models;
using Corvus.Api.Services;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Corvus.Api.Tests;

public class DockerServiceTests
{
    private class FakeDockerHttpClient : IDockerHttpClient
    {
        public Task<bool> PingAsync(CancellationToken cancellationToken = default) => Task.FromResult(true);
        public Task<DockerVersionInfo?> GetVersionAsync(CancellationToken cancellationToken = default) => Task.FromResult<DockerVersionInfo?>(new DockerVersionInfo { Version = "27.0.0" });
        public Task<List<DockerContainerInfo>> ListContainersAsync(bool all = true, CancellationToken cancellationToken = default) => Task.FromResult(new List<DockerContainerInfo>());
        public Task<bool> RestartContainerAsync(string containerId, CancellationToken cancellationToken = default) => Task.FromResult(true);
        public Task<bool> StartContainerAsync(string containerId, CancellationToken cancellationToken = default) => Task.FromResult(true);
        public Task<bool> StopContainerAsync(string containerId, CancellationToken cancellationToken = default) => Task.FromResult(true);
        public Task<bool> PauseContainerAsync(string containerId, CancellationToken cancellationToken = default) => Task.FromResult(true);
        public Task<bool> UnpauseContainerAsync(string containerId, CancellationToken cancellationToken = default) => Task.FromResult(true);
        public Task<ContainerStatsDto?> GetContainerStatsAsync(string containerId, CancellationToken cancellationToken = default) =>
            Task.FromResult<ContainerStatsDto?>(new ContainerStatsDto(containerId, 12.5, 104857600, 1073741824, 9.77, 2048, 4096));
        public Task<List<string>> GetContainerLogsAsync(string containerId, int tail = 100, CancellationToken cancellationToken = default) => Task.FromResult(new List<string> { "log line 1", "log line 2" });
    }

    [Fact]
    public void MapContainerToService_ExtractsLabelsAndDefaultsCorrectly()
    {
        var dockerService = new DockerService(new FakeDockerHttpClient(), NullLogger<DockerService>.Instance);

        var container = new DockerContainerInfo
        {
            Id = "abcdef1234567890",
            Names = new List<string> { "/my_awesome_app" },
            State = "running",
            Status = "Up 2 hours",
            Labels = new Dictionary<string, string>
            {
                ["corvus.name"] = "My Production App",
                ["corvus.category"] = "Web Applications",
                ["corvus.description"] = "Main client dashboard",
                ["corvus.url"] = "https://app.example.com",
                ["corvus.healthcheck"] = "https://app.example.com/health"
            }
        };

        var service = dockerService.MapContainerToService(container);

        Assert.Equal("docker_abcdef123456", service.Id);
        Assert.Equal("My Production App", service.Name);
        Assert.Equal("Web Applications", service.Category);
        Assert.Equal("Main client dashboard", service.Description);
        Assert.Equal("https://app.example.com", service.Url);
        Assert.Equal("https://app.example.com/health", service.HealthCheckUrl);
        Assert.Equal("healthy", service.Status);
    }

    [Fact]
    public void MapContainerToService_DerivesUrlFromPortBindingWhenNoLabel()
    {
        var dockerService = new DockerService(new FakeDockerHttpClient(), NullLogger<DockerService>.Instance);

        var container = new DockerContainerInfo
        {
            Id = "1234567890abcdef",
            Names = new List<string> { "/redis_cache" },
            State = "running",
            Ports = new List<DockerPortInfo>
            {
                new DockerPortInfo { IP = "0.0.0.0", PrivatePort = 6379, PublicPort = 6380, Type = "tcp" }
            }
        };

        var service = dockerService.MapContainerToService(container);

        Assert.Equal("redis_cache", service.Name);
        Assert.Equal("http://localhost:6380", service.Url);
        Assert.Equal("Container'lar", service.Category);
        Assert.Equal("healthy", service.Status);
    }

    [Theory]
    [InlineData("running", "healthy")]
    [InlineData("restarting", "degraded")]
    [InlineData("paused", "degraded")]
    [InlineData("exited", "down")]
    [InlineData("dead", "down")]
    [InlineData("random", "unknown")]
    public void MapContainerToService_MapsContainerStateToCorvusStatus(string state, string expectedStatus)
    {
        var dockerService = new DockerService(new FakeDockerHttpClient(), NullLogger<DockerService>.Instance);

        var container = new DockerContainerInfo
        {
            Id = "1122334455667788",
            Names = new List<string> { "/test" },
            State = state
        };

        var service = dockerService.MapContainerToService(container);
        Assert.Equal(expectedStatus, service.Status);
    }

    [Theory]
    [InlineData("/my_custom_service", "custom-image:latest", null, false)]
    [InlineData("/ignored_service", "generic-image:latest", "true", true)]
    [InlineData("/active_service", "generic-image:latest", "false", false)]
    public void ShouldIgnoreContainer_IdentifiesIgnoredContainersCorrectly(
        string containerName, 
        string imageName, 
        string? ignoreLabel, 
        bool expectedIgnore)
    {
        var dockerService = new DockerService(new FakeDockerHttpClient(), NullLogger<DockerService>.Instance);

        var labels = new Dictionary<string, string>();
        if (ignoreLabel != null)
        {
            labels["corvus.ignore"] = ignoreLabel;
        }

        var container = new DockerContainerInfo
        {
            Id = "testcontainer123",
            Names = new List<string> { containerName },
            Image = imageName,
            Labels = labels
        };

        bool actual = dockerService.ShouldIgnoreContainer(container);
        Assert.Equal(expectedIgnore, actual);
    }

    [Fact]
    public async Task ContainerLifecycleMethods_ExecuteSuccessfully()
    {
        var dockerService = new DockerService(new FakeDockerHttpClient(), NullLogger<DockerService>.Instance);

        bool started = await dockerService.StartContainerAsync("c1");
        bool stopped = await dockerService.StopContainerAsync("c1");
        bool paused = await dockerService.PauseContainerAsync("c1");
        bool unpaused = await dockerService.UnpauseContainerAsync("c1");

        Assert.True(started);
        Assert.True(stopped);
        Assert.True(paused);
        Assert.True(unpaused);
    }

    [Fact]
    public async Task GetContainerStats_ReturnsValidStats()
    {
        var dockerService = new DockerService(new FakeDockerHttpClient(), NullLogger<DockerService>.Instance);
        var stats = await dockerService.GetContainerStatsAsync("c1");

        Assert.NotNull(stats);
        Assert.Equal("c1", stats.ContainerId);
        Assert.Equal(12.5, stats.CpuPercent);
        Assert.Equal(9.77, stats.MemoryPercent);
        Assert.Equal(2048, stats.NetworkRxBytes);
        Assert.Equal(4096, stats.NetworkTxBytes);
    }
}
