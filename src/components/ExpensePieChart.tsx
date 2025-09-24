'use client';

import { Card, Spin } from 'antd';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency } from '@/lib/feishu-api';

interface ExpenseData {
  payment_expense_sum: number;
  other_expense_sum: number;
  pdd_service_fee: number;
  douyin_service_fee: number;
  shipping_insurance: number;
}

interface ExpensePieChartProps {
  data: ExpenseData;
  loading?: boolean;
}

const COLORS = ['#1890ff', '#52c41a', '#fa8c16', '#722ed1', '#8c8c8c'];

export default function ExpensePieChart({ data, loading = false }: ExpensePieChartProps) {
  if (loading) {
    return (
      <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  // 处理数据
  console.log('ExpensePieChart 接收到的数据:', data);
  
  const pieData = [
    { name: '货款支出', value: data.payment_expense_sum || 0, color: COLORS[0] },
    { name: '其他支出', value: data.other_expense_sum || 0, color: COLORS[1] },
    { name: '拼多多服务费', value: data.pdd_service_fee || 0, color: COLORS[2] },
    { name: '抖音服务费', value: data.douyin_service_fee || 0, color: COLORS[3] },
    { name: '运费保险', value: data.shipping_insurance || 0, color: COLORS[4] },
  ].filter(item => item.value > 0); // 只显示有值的项目
  
  console.log('ExpensePieChart 处理后的数据:', pieData);

  const total = pieData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / total) * 100).toFixed(1);
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p style={{ color: data.color }}>
            {`金额: ${formatCurrency(data.value)}`}
          </p>
          <p className="text-gray-600">
            {`占比: ${percentage}%`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ height: '300px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
