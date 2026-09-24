using System.Buffers.Binary;
using System.Text;
using Corvus.Api.Services;
using Xunit;

namespace Corvus.Api.Tests;

public class DockerLogDemuxerTests
{
    [Fact]
    public void Demux_WithDockerMultiplexedHeader_ExtractsLinesCorrectly()
    {
        // 2 frame oluştur: 1 stdout, 1 stderr
        string stdoutMsg = "2026-09-24T12:00:00Z Application started successfully\n";
        string stderrMsg = "2026-09-24T12:00:05Z Warning: High memory pressure\n";

        byte[] stdoutBytes = Encoding.UTF8.GetBytes(stdoutMsg);
        byte[] stderrBytes = Encoding.UTF8.GetBytes(stderrMsg);

        byte[] buffer = new byte[8 + stdoutBytes.Length + 8 + stderrBytes.Length];

        // Frame 1: stdout (streamType = 1)
        buffer[0] = 1;
        BinaryPrimitives.WriteUInt32BigEndian(buffer.AsSpan(4, 4), (uint)stdoutBytes.Length);
        stdoutBytes.CopyTo(buffer, 8);

        // Frame 2: stderr (streamType = 2)
        int offset2 = 8 + stdoutBytes.Length;
        buffer[offset2] = 2;
        BinaryPrimitives.WriteUInt32BigEndian(buffer.AsSpan(offset2 + 4, 4), (uint)stderrBytes.Length);
        stderrBytes.CopyTo(buffer, offset2 + 8);

        var lines = DockerLogDemuxer.Demux(buffer);

        Assert.Equal(2, lines.Count);
        Assert.Equal("2026-09-24T12:00:00Z Application started successfully", lines[0]);
        Assert.Equal("2026-09-24T12:00:05Z Warning: High memory pressure", lines[1]);
    }

    [Fact]
    public void Demux_WithRawPlainText_ExtractsLinesCorrectly()
    {
        string rawLogs = "Server running on port 8080\nDatabase connected\nReady for traffic";
        byte[] bytes = Encoding.UTF8.GetBytes(rawLogs);

        var lines = DockerLogDemuxer.Demux(bytes);

        Assert.Equal(3, lines.Count);
        Assert.Equal("Server running on port 8080", lines[0]);
        Assert.Equal("Database connected", lines[1]);
        Assert.Equal("Ready for traffic", lines[2]);
    }

    [Fact]
    public void Demux_WithEmptyBuffer_ReturnsEmptyList()
    {
        var lines = DockerLogDemuxer.Demux(Array.Empty<byte>());
        Assert.Empty(lines);
    }
}
