'use client';

import { Spin } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '@/lib/feishu-api';

interface DailyProfitData {
  day: number;
  dayLabel: string;
  currentMonth: number;
  lastMonth: number;
  currentMonthAverage: number; // 每日盈利的平均值
  currentMonthSummary: number; // 每日利润汇总
  lastMonthSummary: number;
  summaryAverage: number; // 每日利润汇总的平均值
}

interface DailyProfitChartProps {
  data: DailyProfitData[];
  loading?: boolean;
}

export default function DailyProfitChart({ data, loading = false }: DailyProfitChartProps) {
  if (loading) {
    return (
      <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  // 处理数据，按天排序，并处理空数据点
  console.log('DailyProfitChart 接收到的数据:', data);
  
  const processedData = data
    .sort((a, b) => a.day - b.day)
    .map(item => ({
      ...item,
      // 如果值为0，设置为null，这样就不会在图表上显示点
      currentMonth: item.currentMonth > 0 ? item.currentMonth : null,
      lastMonth: item.lastMonth > 0 ? item.lastMonth : null,
      currentMonthAverage: item.currentMonthAverage > 0 ? item.currentMonthAverage : null,
    }));
    
  console.log('DailyProfitChart 处理后的数据:', processedData);

  // CustomTooltip 已完全移除 - 实现零交互干扰

  // 自定义图例 - Ant Design Pro风格
  const CustomLegend = ({ payload }: { payload?: Array<{ value: string; color: string }> }) => {
    return (
      <div style={{ 
        position: 'absolute', 
        top: '16px', 
        right: '20px', 
        display: 'flex', 
        gap: '16px',
        zIndex: 10
      }}>
        {payload?.map((entry, index) => (
          <div key={index} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: entry.color
            }} />
            <span style={{ 
              fontSize: '12px', 
              color: 'rgba(0,0,0,0.65)',
              fontWeight: '400'
            }}>
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ 
      height: '400px', 
      position: 'relative'
    }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={processedData} margin={{ top: 40, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#f0f0f0"
          />
          <XAxis 
            dataKey="dayLabel" 
            tick={{ fontSize: 12, fill: 'rgba(0,0,0,0.65)' }}
            tickLine={{ stroke: '#d9d9d9' }}
            axisLine={{ stroke: '#d9d9d9' }}
            interval={2} // 每3天显示一个标签
          />
          <YAxis 
            tick={{ fontSize: 12, fill: 'rgba(0,0,0,0.65)' }}
            tickLine={{ stroke: '#d9d9d9' }}
            axisLine={{ stroke: '#d9d9d9' }}
            tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
          />
          <Legend content={<CustomLegend />} />
          
          {/* 本月数据线 - 主要线条，使用鲜明的蓝色 */}
          <Line
            type="monotone"
            dataKey="currentMonth"
            stroke="#1890ff"
            strokeWidth={3}
            dot={{ fill: '#1890ff', strokeWidth: 2, r: 4 }}
            activeDot={false}
            name="本月"
            connectNulls={false} // 不连接空值，产生断点
          />
          
          {/* 上月数据线 - 对比线条，使用淡灰色 */}
          <Line
            type="monotone"
            dataKey="lastMonth"
            stroke="#8c8c8c"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#8c8c8c', strokeWidth: 1, r: 3 }}
            activeDot={false}
            name="上月"
            connectNulls={false} // 不连接空值，产生断点
          />
          
          {/* 当月平均线 - 参考线，使用更淡的色彩 */}
          <Line
            type="monotone"
            dataKey="currentMonthAverage"
            stroke="#d9d9d9"
            strokeWidth={1}
            strokeDasharray="2 2"
            dot={false}
            activeDot={false}
            name="当月平均"
            connectNulls={true} // 平均线保持连续
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
