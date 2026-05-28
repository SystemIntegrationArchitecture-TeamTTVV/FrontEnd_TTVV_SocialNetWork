// VipBadge — Displays a styled VIP badge based on the user's VIP level
import { Crown, Star, Diamond, Zap } from 'lucide-react';

interface VipBadgeProps {
  vipLevel?: number;
  /** 'sm' for compact inline, 'md' for normal, 'lg' for cards */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const VIP_CONFIG = [
  { label: 'Free', icon: Zap, gradient: '', text: 'text-gray-400', bg: '', border: '' },
  { label: 'VIP 1', icon: Star, gradient: 'from-amber-400 to-yellow-500', text: 'text-amber-100', bg: 'bg-gradient-to-r', border: 'ring-amber-400/30' },
  { label: 'VIP 2', icon: Diamond, gradient: 'from-violet-500 to-purple-600', text: 'text-purple-100', bg: 'bg-gradient-to-r', border: 'ring-purple-400/30' },
  { label: 'VIP 3', icon: Crown, gradient: 'from-rose-500 via-red-500 to-orange-500', text: 'text-orange-100', bg: 'bg-gradient-to-r', border: 'ring-red-400/30' },
] as const;

export default function VipBadge({ vipLevel = 0, size = 'sm', className = '' }: VipBadgeProps) {
  if (vipLevel <= 0) return null; // No badge for free tier

  const config = VIP_CONFIG[vipLevel] || VIP_CONFIG[0];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px] gap-0.5 rounded-md',
    md: 'px-2 py-0.5 text-xs gap-1 rounded-lg',
    lg: 'px-3 py-1 text-sm gap-1.5 rounded-xl',
  };

  const iconSize = { sm: 'w-2.5 h-2.5', md: 'w-3 h-3', lg: 'w-4 h-4' };

  return (
    <span
      className={`
        inline-flex items-center font-bold tracking-wide
        ${config.bg} ${config.gradient} ${config.text}
        ${sizeClasses[size]}
        ring-1 ${config.border}
        shadow-sm select-none shrink-0
        ${className}
      `}
    >
      <Icon className={iconSize[size]} />
      {config.label}
    </span>
  );
}
