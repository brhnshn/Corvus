using Corvus.Api.Data;
using Corvus.Api.Models;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using System.Data;
using Xunit;

namespace Corvus.Api.Tests;

public class DatabaseMigrationAndRepositoryTests : IDisposable
{
    private readonly string _tempDbDir;
    private readonly IDbConnectionFactory _dbFactory;

    public DatabaseMigrationAndRepositoryTests()
    {
        _tempDbDir = Path.Combine(Path.GetTempPath(), "corvus_test_" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(_tempDbDir);

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Database:DataDir"] = _tempDbDir
            })
            .Build();

        _dbFactory = new DbConnectionFactory(config);

        // Run migrations
        DatabaseMigrator.Migrate(_dbFactory, NullLogger.Instance);
    }

    [Fact]
    public async Task Migrations_And_ServicesRepository_Work_EndToEnd()
    {
        var repo = new ServicesRepository(_dbFactory);

        // 1. Create manual service
        var req = new CreateServiceRequest(
            Name: "Test Web App",
            Description: "A test web app",
            Url: "https://test.local",
            Icon: "🌐",
            Category: "Testing",
            HealthCheckUrl: "https://test.local/health",
            CheckType: "http",
            Port: 443,
            IsPublic: true
        );

        var created = await repo.CreateManualAsync(req);
        Assert.NotNull(created);
        Assert.Equal("Test Web App", created.Name);
        Assert.True(created.IsPublic);
        Assert.Equal("http", created.CheckType);

        // 2. Update SSL Info
        await repo.UpdateSslInfoAsync(created.Id, 25, "Let's Encrypt Authority");
        var fetched = await repo.GetByIdAsync(created.Id);
        Assert.NotNull(fetched);
        Assert.Equal(25, fetched.SslExpiryDays);
        Assert.Equal("Let's Encrypt Authority", fetched.SslIssuer);

        // 3. Test Public Services query
        var publicList = await repo.GetPublicServicesAsync();
        Assert.Contains(publicList, s => s.Id == created.Id);

        // 4. Test Reordering
        await repo.ReorderAsync([created.Id]);
        var all = await repo.GetAllAsync();
        Assert.NotEmpty(all);

        // 5. Delete service
        bool deleted = await repo.DeleteAsync(created.Id);
        Assert.True(deleted);

        var afterDelete = await repo.GetByIdAsync(created.Id);
        Assert.Null(afterDelete);
    }

    [Fact]
    public async Task PushMonitorRepository_Lifecycle_Works()
    {
        var repo = new PushMonitorRepository(_dbFactory);

        var monitor = new PushMonitor
        {
            Id = Guid.NewGuid().ToString("N"),
            Token = "snitch_token_123",
            Name = "Nightly Backup",
            ExpectedIntervalMinutes = 1440,
            GracePeriodMinutes = 60,
            Status = "unknown",
            CreatedAt = DateTime.UtcNow.ToString("o")
        };

        // Create
        await repo.CreateAsync(monitor);

        // Fetch
        var fetched = await repo.GetByTokenAsync("snitch_token_123");
        Assert.NotNull(fetched);
        Assert.Equal("Nightly Backup", fetched.Name);
        Assert.Equal("unknown", fetched.Status);

        // Record ping
        await repo.RecordPingAsync("snitch_token_123");
        var pinged = await repo.GetByTokenAsync("snitch_token_123");
        Assert.NotNull(pinged);
        Assert.Equal("healthy", pinged.Status);
        Assert.NotNull(pinged.LastSeenAt);

        // Update status to down
        await repo.UpdateStatusAsync(monitor.Id, "down");
        var downed = await repo.GetByIdAsync(monitor.Id);
        Assert.NotNull(downed);
        Assert.Equal("down", downed.Status);

        // Delete
        bool deleted = await repo.DeleteAsync(monitor.Id);
        Assert.True(deleted);

        var afterDelete = await repo.GetByIdAsync(monitor.Id);
        Assert.Null(afterDelete);
    }

    public void Dispose()
    {
        try
        {
            if (Directory.Exists(_tempDbDir))
            {
                Directory.Delete(_tempDbDir, recursive: true);
            }
        }
        catch
        {
            // best-effort cleanup on windows temp
        }
    }
}
