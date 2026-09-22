using System.IO.Pipes;
using System.Net.Sockets;
using System.Runtime.InteropServices;
using System.Text.Json;
using Corvus.Api.Models;

namespace Corvus.Api.Services;

public interface IDockerHttpClient
{
    Task<bool> PingAsync(CancellationToken cancellationToken = default);
    Task<DockerVersionInfo?> GetVersionAsync(CancellationToken cancellationToken = default);
    Task<List<DockerContainerInfo>> ListContainersAsync(bool all = true, CancellationToken cancellationToken = default);
    Task<bool> RestartContainerAsync(string containerId, CancellationToken cancellationToken = default);
}

public class DockerHttpClient : IDockerHttpClient, IDisposable
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<DockerHttpClient> _logger;

    public DockerHttpClient(ILogger<DockerHttpClient> logger, IConfiguration configuration)
    {
        _logger = logger;

        string? dockerSocketEnv = Environment.GetEnvironmentVariable("DOCKER_SOCKET")
                                  ?? configuration["Docker:SocketPath"];

        var handler = new SocketsHttpHandler
        {
            ConnectCallback = async (context, cancellationToken) =>
            {
                if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
                {
                    string[] candidatePipes = ["dockerDesktopLinuxEngine", "docker_engine"];
                    foreach (var pipeName in candidatePipes)
                    {
                        try
                        {
                            var pipe = new NamedPipeClientStream(
                                serverName: ".",
                                pipeName: pipeName,
                                direction: PipeDirection.InOut,
                                options: PipeOptions.Asynchronous);

                            using var connectCts = new CancellationTokenSource(TimeSpan.FromSeconds(2));
                            using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, connectCts.Token);
                            await pipe.ConnectAsync(linkedCts.Token);
                            return pipe;
                        }
                        catch
                        {
                            // sonraki pipe adayını dene
                        }
                    }

                    throw new InvalidOperationException("Hiçbir Windows Docker named pipe'ına bağlanılamadı.");
                }
                else
                {
                    string socketPath = !string.IsNullOrWhiteSpace(dockerSocketEnv) 
                        ? dockerSocketEnv 
                        : "/var/run/docker.sock";

                    var endpoint = new UnixDomainSocketEndPoint(socketPath);
                    var socket = new Socket(AddressFamily.Unix, SocketType.Stream, ProtocolType.Unspecified);

                    await socket.ConnectAsync(endpoint, cancellationToken);
                    return new NetworkStream(socket, ownsSocket: true);
                }
            }
        };

        _httpClient = new HttpClient(handler)
        {
            BaseAddress = new Uri("http://localhost"),
            Timeout = TimeSpan.FromSeconds(15)
        };
    }

    public async Task<bool> PingAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _httpClient.GetAsync("/_ping", cancellationToken);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Docker daemon ping başarısız.");
            return false;
        }
    }

    public async Task<DockerVersionInfo?> GetVersionAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _httpClient.GetAsync("/version", cancellationToken);
            if (!response.IsSuccessStatusCode) return null;

            using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            return await JsonSerializer.DeserializeAsync(stream, CorvusJsonSerializerContext.Default.DockerVersionInfo, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Docker version bilgisi alınamadı.");
            return null;
        }
    }

    public async Task<List<DockerContainerInfo>> ListContainersAsync(bool all = true, CancellationToken cancellationToken = default)
    {
        try
        {
            string url = $"/containers/json?all={(all ? "true" : "false")}";
            var response = await _httpClient.GetAsync(url, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Docker containers API hata döndü: {StatusCode}", response.StatusCode);
                return new List<DockerContainerInfo>();
            }

            using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            var result = await JsonSerializer.DeserializeAsync(stream, CorvusJsonSerializerContext.Default.ListDockerContainerInfo, cancellationToken);
            return result ?? new List<DockerContainerInfo>();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Docker container listesi alınamadı.");
            return new List<DockerContainerInfo>();
        }
    }

    public async Task<bool> RestartContainerAsync(string containerId, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _httpClient.PostAsync($"/containers/{containerId}/restart", null, cancellationToken);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Container yeniden başlatılamadı: {ContainerId}", containerId);
            return false;
        }
    }

    public void Dispose()
    {
        _httpClient.Dispose();
    }
}
