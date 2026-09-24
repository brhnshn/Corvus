using System.Threading.Channels;
using Corvus.Api.Models;

namespace Corvus.Api.Services;

public interface IEventBroadcaster
{
    void Broadcast(string eventType, string payloadJson);
    IAsyncEnumerable<ServerEventDto> SubscribeAsync(CancellationToken cancellationToken);
}

public class EventBroadcaster : IEventBroadcaster
{
    private readonly Channel<ServerEventDto> _channel = Channel.CreateBounded<ServerEventDto>(new BoundedChannelOptions(500)
    {
        FullMode = BoundedChannelFullMode.DropOldest
    });

    public void Broadcast(string eventType, string payloadJson)
    {
        var evt = new ServerEventDto(eventType, payloadJson, DateTime.UtcNow.ToString("o"));
        _channel.Writer.TryWrite(evt);
    }

    public IAsyncEnumerable<ServerEventDto> SubscribeAsync(CancellationToken cancellationToken)
    {
        return _channel.Reader.ReadAllAsync(cancellationToken);
    }
}
