'use client';

import { Card, Spin } from 'antd';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '@/lib/feishu-api';

interface MonthlyData {
  month: string;
  month_profit: number;
  claim_amount_sum: number;
}

interface MonthlyComparisonChartProps {
  data: MonthlyData[];
  loading?: boolean;
}

export default function MonthlyComparisonChart({ data, loading = false }: MonthlyComparisonChartProps) {
  if (loading) {
    return (
      <Card title="月度净利润 vs 总赔付申请" className="h-80">
        <div className="flex justify-center items-center h-full">
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  // 处理数据，确保按月份排序
  console.log('MonthlyComparisonChart 接收到的数据:', data);
  
  const processedData = data
    .map(item => ({
      month: item.month,
      profit: item.month_profit || 0,
      claim: item.claim_amount_sum || 0
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6); // 只显示最近6个月
    
  console.log('MonthlyComparisonChart 处理后的数据:', processedData);

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
    <Card title="月度净利润 vs 总赔付申请" className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={processedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#d9d9d9' }}
          />
          <YAxis 
            yAxisId="profit"
            orientation="left"
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#d9d9d9' }}
            tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
          />
          <YAxis 
            yAxisId="claim"
            orientation="right"
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#d9d9d9' }}
            tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            yAxisId="profit"
            dataKey="profit" 
            fill="#1890ff" 
            name="净利润"
            radius={[2, 2, 0, 0]}
          />
          <Line 
            yAxisId="claim"
            type="monotone" 
            dataKey="claim" 
            stroke="#fa8c16" 
            strokeWidth={2}
            name="赔付申请"
            dot={{ fill: '#fa8c16', strokeWidth: 2, r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  );
}
