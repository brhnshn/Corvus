import React, { useEffect, useRef, useState } from 'react';
import { 
  X, 
  Terminal, 
  Search, 
  ArrowDown, 
  Trash2, 
  RefreshCw, 
  Radio
} from 'lucide-react';
import { api } from '../api/client';
import { useI18n } from '../i18n';

interface ContainerLogsModalProps {
  containerId: string;
  containerName: string;
  onClose: () => void;
}

export const ContainerLogsModal: React.FC<ContainerLogsModalProps> = ({
  containerId,
  containerName,
  onClose
}) => {
  const { t } = useI18n();
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [tailCount, setTailCount] = useState<number>(100);
  const [isLive, setIsLive] = useState(true);

  const logsEndRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // İlk snapshot yüklemesi
  const fetchInitialLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getContainerLogs(containerId, tailCount);
      setLogs(data.lines || []);
    } catch (err) {
      console.error('Loglar alınamadı:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialLogs();
  }, [containerId, tailCount]);

  // Server-Sent Events (SSE) ile canlı akış
  useEffect(() => {
    if (!isLive) return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`/api/containers/${containerId}/logs/stream?tail=30`);

      eventSource.onmessage = (event) => {
        if (event.data) {
          setLogs((prev) => {
            // Tekrarlanan son satırı engelle
            if (prev.length > 0 && prev[prev.length - 1] === event.data) {
              return prev;
            }
            // En fazla son 1000 satırı tut
            const next = [...prev, event.data];
            return next.length > 1000 ? next.slice(next.length - 1000) : next;
          });
        }
      };

      eventSource.onerror = () => {
        // SSE bağlantı hatası durumunda sessizce kapat
        eventSource?.close();
      };
    } catch (e) {
      console.warn('SSE bağlantısı kurulamadı:', e);
    }

    return () => {
      eventSource?.close();
    };
  }, [containerId, isLive]);

  // Otomatik aşağı kaydırma
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  // Filtreleme
  const filteredLogs = search.trim()
    ? logs.filter((line) => line.toLowerCase().includes(search.toLowerCase()))
    : logs;

  const formatLogLine = (line: string) => {
    const isError = /error|fatal|fail|panic|exception/i.test(line);
    const isWarn = /warn|warning/i.test(line);

    let textColor = 'text-[#d4d4d8]';
    if (isError) textColor = 'text-[#ef4444] font-semibold';
    else if (isWarn) textColor = 'text-[#f59e0b]';

    return <span className={textColor}>{line}</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs select-none">
      <div className="bg-[#0f1117] border border-[#2a2e3f] rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-200">
        
        {/* Terminal Header */}
        <div className="h-14 px-4 sm:px-6 bg-[#1a1d29] border-b border-[#2a2e3f] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0f1117] border border-[#2a2e3f] flex items-center justify-center text-[#d4d4d8]">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[#e5e7eb] truncate max-w-[180px] sm:max-w-xs">
                  {containerName}
                </span>
                <span className="text-[11px] font-mono text-[#9ca3af]">
                  ({containerId.slice(0, 12)})
                </span>
                <button
                  type="button"
                  onClick={() => setIsLive(!isLive)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-mono cursor-pointer transition-colors ${
                    isLive 
                      ? 'bg-[#22c55e]/15 text-[#22c55e] border-[#22c55e]/30 animate-pulse' 
                      : 'bg-[#6b7280]/15 text-[#9ca3af] border-[#2a2e3f]'
                  }`}
                  title={isLive ? t('logsModal.pausedBadge') : t('logsModal.liveBadge')}
                >
                  <Radio className="w-2.5 h-2.5" />
                  {isLive ? t('logsModal.liveBadge') : t('logsModal.pausedBadge')}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#9ca3af] hover:text-[#e5e7eb] p-1.5 rounded-lg hover:bg-[#2a2e3f]/60 transition-colors cursor-pointer"
            title={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-3 bg-[#13151f] border-b border-[#2a2e3f] flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Arama */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-3.5 h-3.5 text-[#9ca3af] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={t('logsModal.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0a0c10] border border-[#2a2e3f] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#e5e7eb] placeholder-[#9ca3af] focus:outline-none focus:border-[#d4d4d8]"
            />
          </div>

          {/* Kontroller */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Satır Sayısı Seçici */}
            <select
              value={tailCount}
              onChange={(e) => setTailCount(Number(e.target.value))}
              className="bg-[#0a0c10] border border-[#2a2e3f] rounded-lg px-2.5 py-1.5 text-xs text-[#9ca3af] focus:outline-none focus:border-[#d4d4d8] cursor-pointer"
            >
              <option value={50}>{t('logsModal.lines50')}</option>
              <option value={100}>{t('logsModal.lines100')}</option>
              <option value={250}>{t('logsModal.lines250')}</option>
              <option value={500}>{t('logsModal.lines500')}</option>
            </select>

            {/* Otomatik Kaydırma */}
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                autoScroll
                  ? 'bg-[#d4d4d8] text-[#0f1117] font-semibold border-transparent'
                  : 'bg-[#0a0c10] border-[#2a2e3f] text-[#9ca3af] hover:text-[#e5e7eb]'
              }`}
            >
              <ArrowDown className="w-3 h-3" />
              <span>{t('logsModal.autoScroll')}</span>
            </button>

            {/* Temizle */}
            <button
              onClick={() => setLogs([])}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#2a2e3f] bg-[#0a0c10] text-[#9ca3af] hover:text-[#ef4444] transition-colors cursor-pointer"
              title={t('logsModal.clearTooltip')}
            >
              <Trash2 className="w-3 h-3" />
            </button>

            {/* Yenile */}
            <button
              onClick={fetchInitialLogs}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#2a2e3f] bg-[#0a0c10] text-[#9ca3af] hover:text-[#e5e7eb] transition-colors cursor-pointer"
              title={t('logsModal.refreshTooltip')}
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Terminal Body */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 p-4 overflow-y-auto bg-[#0a0c10] font-mono text-xs leading-relaxed space-y-1 select-text"
        >
          {loading && logs.length === 0 && (
            <div className="flex items-center justify-center h-48 text-[#9ca3af]">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />
              {t('logsModal.loading')}
            </div>
          )}

          {!loading && filteredLogs.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-[#9ca3af]/60">
              <Terminal className="w-8 h-8 mb-2 opacity-40" />
              <span>{t('logsModal.noLogs')}</span>
            </div>
          )}

          {filteredLogs.map((line, idx) => (
            <div key={idx} className="hover:bg-[#1a1d29]/40 py-0.5 px-1 rounded break-all whitespace-pre-wrap">
              {formatLogLine(line)}
            </div>
          ))}

          <div ref={logsEndRef} />
        </div>

        {/* Footer */}
        <div className="h-8 px-4 bg-[#13151f] border-t border-[#2a2e3f] flex items-center justify-between text-[11px] text-[#9ca3af] font-mono">
          <span>{t('logsModal.showingLines', { count: filteredLogs.length })}</span>
          <span>{t('logsModal.bufferStatus', { current: logs.length, max: 1000 })}</span>
        </div>
      </div>
    </div>
  );
};
