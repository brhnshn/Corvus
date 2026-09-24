using System.Buffers.Binary;
using System.Text;

namespace Corvus.Api.Services;

public static class DockerLogDemuxer
{
    public static List<string> Demux(ReadOnlySpan<byte> buffer)
    {
        var lines = new List<string>();
        int offset = 0;
        bool detectedMultiplexed = false;

        while (offset + 8 <= buffer.Length)
        {
            byte streamType = buffer[offset];
            byte b1 = buffer[offset + 1];
            byte b2 = buffer[offset + 2];
            byte b3 = buffer[offset + 3];

            // Docker 8-byte frame header kontrolü (streamType: 1=stdout, 2=stderr)
            if ((streamType == 1 || streamType == 2) && b1 == 0 && b2 == 0 && b3 == 0)
            {
                int payloadSize = (int)BinaryPrimitives.ReadUInt32BigEndian(buffer.Slice(offset + 4, 4));

                if (payloadSize >= 0 && offset + 8 + payloadSize <= buffer.Length)
                {
                    detectedMultiplexed = true;
                    var payloadSpan = buffer.Slice(offset + 8, payloadSize);
                    string text = Encoding.UTF8.GetString(payloadSpan);
                    using var reader = new StringReader(text);
                    string? line;
                    while ((line = reader.ReadLine()) != null)
                    {
                        if (!string.IsNullOrWhiteSpace(line))
                        {
                            lines.Add(line);
                        }
                    }
                    offset += 8 + payloadSize;
                    continue;
                }
            }

            break;
        }

        // Multiplexed başlık bulunamadıysa (TTY aktif konteynerler) veya doğrudan metin akışı ise:
        if (!detectedMultiplexed && buffer.Length > 0)
        {
            string raw = Encoding.UTF8.GetString(buffer);
            using var reader = new StringReader(raw);
            string? line;
            while ((line = reader.ReadLine()) != null)
            {
                if (!string.IsNullOrWhiteSpace(line))
                {
                    lines.Add(line);
                }
            }
        }

        return lines;
    }
}
