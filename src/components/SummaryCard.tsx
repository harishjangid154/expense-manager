import { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  amount: string;
  icon: LucideIcon;
  trend?: string;
  accentColor: 'blue' | 'purple' | 'green';
}

export function SummaryCard({ title, amount, icon: Icon, trend, accentColor }: SummaryCardProps) {
  const glowClass = accentColor === 'blue' 
    ? 'hover:neon-glow-blue' 
    : accentColor === 'purple' 
    ? 'hover:neon-glow-purple' 
    : 'hover:shadow-[0_0_20px_rgba(107,203,119,0.3)]';

  const iconColorClass = accentColor === 'blue'
    ? 'text-[#00FFFF]'
    : accentColor === 'purple'
    ? 'text-[#A259FF]'
    : 'text-[#6BCB77]';

  return (
    <div className={`glass rounded-2xl p-6 transition-all duration-300 ${glowClass} group`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl glass-strong ${iconColorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span className="text-sm text-muted-foreground">{trend}</span>
        )}
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <p className="text-3xl text-foreground tracking-tight">{amount}</p>
      </div>
    </div>
  );
}
