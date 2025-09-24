'use client';

import { Card, Statistic } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

interface StatCardProps {
  title: string;
  value: number;
  previousValue?: number;
  prefix?: string;
  suffix?: string;
  precision?: number;
  color?: string;
}

export default function StatCard({
  title,
  value,
  previousValue,
  prefix = '¥',
  suffix = '',
  precision = 2,
  color = '#1890ff'
}: StatCardProps) {
  const calculateChange = () => {
    if (!previousValue || previousValue === 0) return null;
    const change = ((value - previousValue) / previousValue) * 100;
    return {
      value: Math.abs(change),
      isPositive: change >= 0
    };
  };

  const change = calculateChange();

  return (
    <Card className="h-full rounded-2xl shadow-sm border-0 hover:shadow-md transition-shadow">
      <div className="p-2">
        <Statistic
          title={<span className="text-gray-600 text-sm font-medium">{title}</span>}
          value={value}
          precision={precision}
          valueStyle={{ color, fontSize: '28px', fontWeight: '700' }}
          prefix={prefix}
          suffix={suffix}
        />
        {change && (
          <div className="mt-3 flex items-center justify-between">
            <span className={`flex items-center text-sm font-medium ${change.isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {change.isPositive ? <ArrowUpOutlined className="mr-1" /> : <ArrowDownOutlined className="mr-1" />}
              {change.value.toFixed(1)}%
            </span>
            <span className="text-gray-400 text-xs">
              上期：{prefix}{previousValue?.toFixed(precision)}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
