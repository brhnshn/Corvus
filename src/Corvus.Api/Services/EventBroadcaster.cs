using System.Collections.Concurrent;
using System.Runtime.CompilerServices;
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
    private readonly ConcurrentDictionary<Guid, Channel<ServerEventDto>> _subscribers = new();
    private readonly LinkedList<ServerEventDto> _replayBuffer = new();
    private readonly object _bufferLock = new();
    private const int MaxReplayBufferSize = 50;

    public void Broadcast(string eventType, string payloadJson)
    {
        var evt = new ServerEventDto(eventType, payloadJson, DateTime.UtcNow.ToString("o"));

        lock (_bufferLock)
        {
            if (_replayBuffer.Count >= MaxReplayBufferSize)
            {
                _replayBuffer.RemoveFirst();
            }
            _replayBuffer.AddLast(evt);

            foreach (var sub in _subscribers.Values)
            {
                sub.Writer.TryWrite(evt);
            }
        }
    }

    public async IAsyncEnumerable<ServerEventDto> SubscribeAsync([EnumeratorCancellation] CancellationToken cancellationToken)
    {
        var subId = Guid.NewGuid();
        var channel = Channel.CreateBounded<ServerEventDto>(new BoundedChannelOptions(200)
        {
            FullMode = BoundedChannelFullMode.DropOldest,
            SingleWriter = false,
            SingleReader = true
        });

        lock (_bufferLock)
        {
            foreach (var evt in _replayBuffer)
            {
                channel.Writer.TryWrite(evt);
            }
            _subscribers.TryAdd(subId, channel);
        }

        try
        {
            await foreach (var evt in channel.Reader.ReadAllAsync(cancellationToken))
            {
                yield return evt;
            }
        }
        finally
        {
            _subscribers.TryRemove(subId, out _);
            channel.Writer.TryComplete();
        }
    }
}
