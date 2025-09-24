'use client';

import { Card, Spin } from 'antd';
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

  const CustomTooltip = ({ active, payload, label }: { 
    active?: boolean; 
    payload?: Array<{ name: string; value: number; color: string; payload?: any }>; 
    label?: string 
  }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0]?.payload; // 获取完整的数据点
      
      // 检测是否为移动端
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg" style={{ 
          minWidth: isMobile ? '160px' : '200px',
          maxWidth: isMobile ? '280px' : '400px',
          fontSize: isMobile ? '12px' : '13px'
        }}>
          <p className="font-medium" style={{ 
            marginBottom: '8px', 
            borderBottom: '1px solid #f0f0f0', 
            paddingBottom: '4px',
            fontSize: isMobile ? '13px' : '14px'
          }}>
            {`${label}`}
          </p>
          
          {/* 显示线条数据（多赞利润） */}
          <div style={{ marginBottom: '8px' }}>
            <p style={{ margin: '2px 0', fontSize: '12px', color: '#666', fontWeight: '500' }}>多赞利润</p>
            {payload.map((entry, index) => (
              <p key={index} style={{ color: entry.color, margin: '2px 0', fontSize: '13px' }}>
                {`${entry.name}: ${formatCurrency(entry.value)}`}
              </p>
            ))}
          </div>
          
          {/* 显示额外数据（当日总利润） */}
          {dataPoint && (
            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '8px' }}>
              <p style={{ margin: '2px 0', fontSize: '12px', color: '#666', fontWeight: '500' }}>当日总利润</p>
              <p style={{ color: '#1890ff', margin: '2px 0', fontSize: '13px' }}>
                本月: {formatCurrency(dataPoint.currentMonthSummary || 0)}
              </p>
              <p style={{ color: '#52c41a', margin: '2px 0', fontSize: '13px' }}>
                上月: {formatCurrency(dataPoint.lastMonthSummary || 0)}
              </p>
              <p style={{ color: '#722ed1', margin: '2px 0', fontSize: '13px' }}>
                当月平均: {formatCurrency(dataPoint.summaryAverage || 0)}
              </p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // 自定义图例
  const CustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <div style={{ 
        position: 'absolute', 
        top: '10px', 
        right: '20px', 
        display: 'flex', 
        gap: '16px',
        zIndex: 10
      }}>
        {payload.map((entry: any, index: number) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: entry.color
            }} />
            <span style={{ fontSize: '12px', color: '#666' }}>{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  // 检测屏幕尺寸
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const chartHeight = isMobile ? '300px' : '400px';
  const chartMargin = isMobile 
    ? { top: 20, right: 10, left: 10, bottom: 10 }
    : { top: 40, right: 30, left: 20, bottom: 20 };
  const fontSize = isMobile ? 10 : 12;
  const intervalStep = isMobile ? 4 : 2; // 手机端显示更少标签

  return (
    <div style={{ height: chartHeight, position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={processedData} margin={chartMargin}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="dayLabel" 
            tick={{ fontSize }}
            tickLine={{ stroke: '#d9d9d9' }}
            axisLine={{ stroke: '#d9d9d9' }}
            interval={intervalStep}
            angle={isMobile ? -45 : 0}
            textAnchor={isMobile ? 'end' : 'middle'}
            height={isMobile ? 60 : 30}
          />
          <YAxis 
            tick={{ fontSize }}
            tickLine={{ stroke: '#d9d9d9' }}
            axisLine={{ stroke: '#d9d9d9' }}
            tickFormatter={(value) => isMobile ? `¥${(value / 1000).toFixed(0)}k` : `¥${(value / 1000).toFixed(0)}k`}
            width={isMobile ? 50 : 60}
          />
          <Tooltip 
            content={<CustomTooltip />}
            cursor={{ stroke: '#ccc', strokeWidth: 1, strokeDasharray: '3 3' }}
          />
          <Legend content={<CustomLegend />} />
          
          {/* 本月数据线 */}
          <Line
            type="monotone"
            dataKey="currentMonth"
            stroke="#1890ff"
            strokeWidth={isMobile ? 3 : 2}
            dot={{ fill: '#1890ff', strokeWidth: 1, r: isMobile ? 4 : 3 }}
            activeDot={{ r: isMobile ? 8 : 4, stroke: '#1890ff', strokeWidth: 1, fill: '#1890ff' }}
            name="本月"
            connectNulls={false} // 不连接空值，产生断点
          />
          
          {/* 上月数据线 */}
          <Line
            type="monotone"
            dataKey="lastMonth"
            stroke="#52c41a"
            strokeWidth={isMobile ? 3 : 2}
            dot={{ fill: '#52c41a', strokeWidth: 1, r: isMobile ? 4 : 3 }}
            activeDot={{ r: isMobile ? 8 : 4, stroke: '#52c41a', strokeWidth: 1, fill: '#52c41a' }}
            name="上月"
            connectNulls={false} // 不连接空值，产生断点
          />
          
          {/* 当月平均线 */}
          <Line
            type="monotone"
            dataKey="currentMonthAverage"
            stroke="#722ed1"
            strokeWidth={isMobile ? 2 : 2}
            dot={false}
            activeDot={{ r: isMobile ? 6 : 4, stroke: '#722ed1', strokeWidth: 1, fill: '#722ed1' }}
            name="当月平均"
            connectNulls={true} // 平均线保持连续
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
