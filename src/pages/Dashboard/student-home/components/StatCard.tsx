import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  iconWrapperClassName: string;
  isLoading?: boolean;
}

const StatCard = ({ title, value, icon, iconWrapperClassName, isLoading }: StatCardProps) => (
  <div className="rounded-xl border border-blue-main bg-white p-5">
    <div className="flex items-center">
      <div className={`rounded-lg p-3 ${iconWrapperClassName}`}>{icon}</div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {isLoading ? (
          <div className="mt-2 h-6 w-12 rounded-full bg-gray-200 animate-pulse" />
        ) : (
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        )}
      </div>
    </div>
  </div>
);

export default StatCard;
