import React from 'react';

interface StatusBadgeProps {
  status: 'healthy' | 'degraded' | 'down' | 'unknown' | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const config = {
    healthy: {
      label: 'Çalışıyor',
      color: 'bg-[#22c55e]',
      text: 'text-[#22c55e]',
      border: 'border-[#22c55e]/30',
      bg: 'bg-[#22c55e]/10'
    },
    degraded: {
      label: 'Uyarı',
      color: 'bg-[#f59e0b]',
      text: 'text-[#f59e0b]',
      border: 'border-[#f59e0b]/30',
      bg: 'bg-[#f59e0b]/10'
    },
    down: {
      label: 'Durduruldu',
      color: 'bg-[#ef4444]',
      text: 'text-[#ef4444]',
      border: 'border-[#ef4444]/30',
      bg: 'bg-[#ef4444]/10'
    },
    unknown: {
      label: 'Bilinmiyor',
      color: 'bg-[#6b7280]',
      text: 'text-[#6b7280]',
      border: 'border-[#6b7280]/30',
      bg: 'bg-[#6b7280]/10'
    }
  }[status.toLowerCase()] || {
    label: status,
    color: 'bg-[#6b7280]',
    text: 'text-[#6b7280]',
    border: 'border-[#6b7280]/30',
    bg: 'bg-[#6b7280]/10'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.border} ${config.text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.color}`} />
      {config.label}
    </span>
  );
};
