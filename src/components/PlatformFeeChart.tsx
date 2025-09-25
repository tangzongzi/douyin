'use client';

import { Spin } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '@/lib/feishu-api';

interface PlatformFeeData {
  month: string;
  pdd_service_fee: number;
  douyin_service_fee: number;
}

interface PlatformFeeChartProps {
  data: PlatformFeeData[];
  loading?: boolean;
}

export default function PlatformFeeChart({ data, loading = false }: PlatformFeeChartProps) {
  if (loading) {
    return (
      <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  // 处理数据，确保按月份排序
  const processedData = data
    .map(item => ({
      month: item.month,
      pdd: item.pdd_service_fee || 0,
      douyin: item.douyin_service_fee || 0
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6); // 只显示最近6个月

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="font-medium">{`月份: ${label}`}</p>
          {payload.map((entry: { name: string; value: number; color: string }, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${formatCurrency(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ height: '300px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={processedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#d9d9d9' }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#d9d9d9' }}
            tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="pdd" 
            fill="#1890ff" 
            name="拼多多服务费"
            radius={[2, 2, 0, 0]}
          />
          <Bar 
            dataKey="douyin" 
            fill="#fa8c16" 
            name="抖音服务费"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
