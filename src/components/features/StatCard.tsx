import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  color: string;
  trend?: string;
  trendUp?: boolean;
}

const StatCard = ({ label, value, icon, color, trend, trendUp }: StatCardProps) => (
  <div className={`glass-card-light rounded-2xl p-5 border-r-4 ${color} hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-default`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-muted-foreground text-sm font-medium">{label}</p>
        <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
        {trend && (
          <p className={`text-xs mt-2 font-medium ${trendUp ? 'text-green-600' : 'text-red-500'}`}>
            {trendUp ? '↑' : '↓'} {trend}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-xl ${color.replace('border-', 'bg-').replace('-500', '-50').replace('-600', '-50')}`}>
        {icon}
      </div>
    </div>
  </div>
);

export default StatCard;
