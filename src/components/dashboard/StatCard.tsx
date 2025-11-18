import React from 'react';
import { Card, Spinner } from 'flowbite-react';

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: number | undefined;
  color: string;
  loading: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, title, value, color, loading }) => {
  const iconStyle = {
    backgroundColor: color,
  };

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {loading ? <Spinner size="sm" /> : value ?? 0}
          </div>
        </div>
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full text-white"
          style={iconStyle}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
};

export default StatCard;
