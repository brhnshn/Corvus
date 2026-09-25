import React from 'react';
import { 
  Terminal, 
  Play, 
  Square, 
  Pause, 
  PlayCircle, 
  RotateCw, 
  Loader2 
} from 'lucide-react';
import type { DockerContainer } from '../../api/client';
import { useI18n } from '../../i18n';

interface ContainerActionButtonsProps {
  container: DockerContainer;
  cleanName: string;
  isRunning: boolean;
  isPaused: boolean;
  actionInProgress: { id: string; action: string } | null;
  onAction: (action: 'start' | 'stop' | 'pause' | 'unpause' | 'restart', id: string, name: string) => void;
  onOpenLogs: (id: string, name: string) => void;
}

export const ContainerActionButtons: React.FC<ContainerActionButtonsProps> = ({
  container,
  cleanName,
  isRunning,
  isPaused,
  actionInProgress,
  onAction,
  onOpenLogs
}) => {
  const { t } = useI18n();
  const isCurrentBusy = actionInProgress?.id === container.Id;
  const currentAction = isCurrentBusy ? actionInProgress?.action : null;

  return (
    <div className="flex items-center gap-1.5">
      {/* Logs button */}
      <button
        onClick={() => onOpenLogs(container.Id, cleanName)}
        disabled={isCurrentBusy}
        className="p-1.5 rounded-lg border border-[#2a2e3f] bg-[#0f1117] text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-[#1e2130] transition-colors disabled:opacity-50 cursor-pointer"
        title={t('containers.inspectLogs')}
      >
        <Terminal className="w-3.5 h-3.5" />
      </button>

      {/* Start / Pause / Resume / Stop buttons */}
      {!isRunning ? (
        <button
          onClick={() => onAction('start', container.Id, cleanName)}
          disabled={isCurrentBusy}
          className="p-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50 cursor-pointer"
          title={t('containers.start')}
        >
          {currentAction === 'start' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
        </button>
      ) : (
        <>
          {isPaused ? (
            <button
              onClick={() => onAction('unpause', container.Id, cleanName)}
              disabled={isCurrentBusy}
              className="p-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50 cursor-pointer"
              title={t('containers.resume')}
            >
              {currentAction === 'unpause' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <PlayCircle className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <button
              onClick={() => onAction('pause', container.Id, cleanName)}
              disabled={isCurrentBusy}
              className="p-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50 cursor-pointer"
              title={t('containers.pause')}
            >
              {currentAction === 'pause' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Pause className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          <button
            onClick={() => onAction('stop', container.Id, cleanName)}
            disabled={isCurrentBusy}
            className="p-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors disabled:opacity-50 cursor-pointer"
            title={t('containers.stop')}
          >
            {currentAction === 'stop' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
          </button>
        </>
      )}

      {/* Restart button */}
      <button
        onClick={() => onAction('restart', container.Id, cleanName)}
        disabled={isCurrentBusy}
        className="p-1.5 rounded-lg border border-[#2a2e3f] bg-[#0f1117] text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-[#1e2130] transition-colors disabled:opacity-50 cursor-pointer"
        title={t('containers.restart')}
      >
        <RotateCw className={`w-3.5 h-3.5 ${currentAction === 'restart' ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
};
