using System.Net;
using System.Text.Json;
using Corvus.Api.Models;
using Corvus.Api.Services;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Corvus.Api.Tests;

public class UpdateCheckerTests
{
    [Theory]
    [InlineData("v1.0.0", "1.0.0")]
    [InlineData("V2.1.3", "2.1.3")]
    [InlineData("1.0.5-beta", "1.0.5")]
    [InlineData("  v3.0.0  ", "3.0.0")]
    [InlineData("", "1.0.0")]
    public void CleanVersionString_StripsPrefixesAndBuildLabels(string input, string expected)
    {
        var cleaned = UpdateCheckerService.CleanVersionString(input);
        Assert.Equal(expected, cleaned);
    }

    [Theory]
    [InlineData("1.0.1", "1.0.0", true)]
    [InlineData("1.1.0", "1.0.9", true)]
    [InlineData("2.0.0", "1.9.9", true)]
    [InlineData("v1.0.2", "v1.0.1", true)]
    [InlineData("1.0.0", "1.0.0", false)]
    [InlineData("0.9.9", "1.0.0", false)]
    [InlineData("1.0.0", "1.0.1", false)]
    public void IsNewerVersion_CorrectlyComparesSemVer(string latest, string current, bool expected)
    {
        var result = UpdateCheckerService.IsNewerVersion(latest, current);
        Assert.Equal(expected, result);
    }

    [Fact]
    public async Task GetVersionInfoAsync_ReturnsCurrentAndLatest_WhenGitHubReturnsRelease()
    {
        var mockRelease = new GitHubReleaseDto
        {
            tag_name = "v1.2.0",
            html_url = "https://github.com/brhnshn/corvus/releases/tag/v1.2.0",
            name = "Corvus v1.2.0"
        };

        var handler = new MockHttpMessageHandler(new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(
                JsonSerializer.Serialize(mockRelease, CorvusJsonSerializerContext.Default.GitHubReleaseDto),
                System.Text.Encoding.UTF8,
                "application/json"
            )
        });

        var httpClient = new HttpClient(handler);
        var service = new UpdateCheckerService(httpClient, NullLogger<UpdateCheckerService>.Instance);

        var info = await service.GetVersionInfoAsync();

        Assert.NotNull(info);
        Assert.Equal("1.2.0", info.LatestVersion);
        Assert.True(info.IsUpdateAvailable);
        Assert.Equal("https://github.com/brhnshn/corvus/releases/tag/v1.2.0", info.ReleaseUrl);
    }

    [Fact]
    public async Task GetVersionInfoAsync_GracefullyHandlesOfflineOrError()
    {
        var handler = new MockHttpMessageHandler(new HttpResponseMessage(HttpStatusCode.ServiceUnavailable));
        var httpClient = new HttpClient(handler);
        var service = new UpdateCheckerService(httpClient, NullLogger<UpdateCheckerService>.Instance);

        var info = await service.GetVersionInfoAsync();

        Assert.NotNull(info);
        Assert.Equal(service.CurrentVersion, info.CurrentVersion);
        Assert.Equal(service.CurrentVersion, info.LatestVersion);
        Assert.False(info.IsUpdateAvailable);
    }

    private class MockHttpMessageHandler : HttpMessageHandler
    {
        private readonly HttpResponseMessage _response;

        public MockHttpMessageHandler(HttpResponseMessage response)
        {
            _response = response;
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            return Task.FromResult(_response);
        }
    }
}
