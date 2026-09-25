import React from 'react';
import { Layers, ChevronDown, ChevronRight } from 'lucide-react';
import type { DockerContainer, ContainerStats } from '../../api/client';
import { ContainerList } from './ContainerList';
import { useI18n } from '../../i18n';

interface ComposeStackGroupProps {
  groupedStacks: Record<string, DockerContainer[]>;
  collapsedStacks: Record<string, boolean>;
  statsMap: Record<string, ContainerStats>;
  actionInProgress: { id: string; action: string } | null;
  onToggleCollapse: (stackName: string) => void;
  onAction: (action: 'start' | 'stop' | 'pause' | 'unpause' | 'restart', id: string, name: string) => void;
  onOpenLogs: (id: string, name: string) => void;
}

export const ComposeStackGroup: React.FC<ComposeStackGroupProps> = ({
  groupedStacks,
  collapsedStacks,
  statsMap,
  actionInProgress,
  onToggleCollapse,
  onAction,
  onOpenLogs
}) => {
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      {Object.entries(groupedStacks).map(([stackName, stackContainers]) => {
        const isCollapsed = collapsedStacks[stackName] ?? false;
        const runningCount = stackContainers.filter(c => c.State.toLowerCase() === 'running').length;

        return (
          <div key={stackName} className="rounded-xl border border-[#2a2e3f] bg-[#1a1d29]/60 overflow-hidden">
            <button
              onClick={() => onToggleCollapse(stackName)}
              className="w-full px-5 py-3.5 bg-[#1a1d29] hover:bg-[#1e2130] transition-colors flex items-center justify-between cursor-pointer border-b border-[#2a2e3f]/60"
            >
              <div className="flex items-center gap-3">
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-[#9ca3af]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#9ca3af]" />
                )}
                <span className="font-semibold text-sm text-[#e5e7eb] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  {stackName}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#0f1117] border border-[#2a2e3f] text-[#9ca3af] font-mono">
                  {t('containers.activeInStack', { running: runningCount, total: stackContainers.length })}
                </span>
              </div>
            </button>

            {!isCollapsed && (
              <div className="p-3">
                <ContainerList
                  items={stackContainers}
                  statsMap={statsMap}
                  actionInProgress={actionInProgress}
                  onAction={onAction}
                  onOpenLogs={onOpenLogs}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
