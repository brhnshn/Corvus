namespace Corvus.Api.Models;

public record VersionInfoDto(
    string CurrentVersion,
    string LatestVersion,
    bool IsUpdateAvailable,
    string ReleaseUrl
);

public class GitHubReleaseDto
{
    public string tag_name { get; set; } = string.Empty;
    public string html_url { get; set; } = string.Empty;
    public string name { get; set; } = string.Empty;
}
