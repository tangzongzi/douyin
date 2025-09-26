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

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string; payload?: DailyProfitData }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0]?.payload; // 获取完整的数据点
      
      return (
        <div style={{ 
          background: '#ffffff',
          padding: '12px 16px',
          border: '1px solid #f0f0f0',
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          minWidth: '200px'
        }}>
          <p style={{ 
            marginBottom: '8px', 
            borderBottom: '1px solid #f0f0f0', 
            paddingBottom: '4px',
            fontSize: '14px',
            fontWeight: '500',
            color: 'rgba(0,0,0,0.85)'
          }}>
            {`${label}`}
          </p>
          
          {/* 显示线条数据（多赞利润） */}
          <div style={{ marginBottom: '8px' }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: 'rgba(0,0,0,0.45)', fontWeight: '400' }}>
              多赞利润
            </p>
            {payload.map((entry, index) => (
              <p key={index} style={{ 
                color: entry.color, 
                margin: '2px 0', 
                fontSize: '13px',
                fontWeight: '400',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>{entry.name}</span>
                <span style={{ fontWeight: '500' }}>{formatCurrency(entry.value)}</span>
              </p>
            ))}
          </div>
          
          {/* 显示额外数据（当日总利润） */}
          {dataPoint && (
            <div style={{ 
              borderTop: '1px solid #f0f0f0', 
              paddingTop: '8px'
            }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: 'rgba(0,0,0,0.45)', fontWeight: '400' }}>
                当日总利润
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'rgba(0,0,0,0.65)', fontSize: '12px' }}>本月</span>
                  <span style={{ color: '#1890ff', fontSize: '13px', fontWeight: '500' }}>
                    {formatCurrency(dataPoint.currentMonthSummary || 0)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'rgba(0,0,0,0.65)', fontSize: '12px' }}>上月</span>
                  <span style={{ color: '#52c41a', fontSize: '13px', fontWeight: '500' }}>
                    {formatCurrency(dataPoint.lastMonthSummary || 0)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'rgba(0,0,0,0.65)', fontSize: '12px' }}>当月平均</span>
                  <span style={{ color: '#722ed1', fontSize: '13px', fontWeight: '500' }}>
                    {formatCurrency(dataPoint.summaryAverage || 0)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

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
          <Tooltip 
            content={<CustomTooltip />}
            cursor={{ 
              stroke: '#ccc', 
              strokeWidth: 1, 
              strokeDasharray: '3 3'
            }}
          />
          <Legend content={<CustomLegend />} />
          
          {/* 本月数据线 */}
          <Line
            type="monotone"
            dataKey="currentMonth"
            stroke="#1890ff"
            strokeWidth={2}
            dot={{ fill: '#1890ff', strokeWidth: 2, r: 3 }}
            activeDot={{ r: 4, stroke: '#1890ff', strokeWidth: 2, fill: '#1890ff' }}
            name="本月"
            connectNulls={false} // 不连接空值，产生断点
          />
          
          {/* 上月数据线 */}
          <Line
            type="monotone"
            dataKey="lastMonth"
            stroke="#52c41a"
            strokeWidth={2}
            dot={{ fill: '#52c41a', strokeWidth: 2, r: 3 }}
            activeDot={{ r: 4, stroke: '#52c41a', strokeWidth: 2, fill: '#52c41a' }}
            name="上月"
            connectNulls={false} // 不连接空值，产生断点
          />
          
          {/* 当月平均线 */}
          <Line
            type="monotone"
            dataKey="currentMonthAverage"
            stroke="#722ed1"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            activeDot={{ r: 4, stroke: '#722ed1', strokeWidth: 2, fill: '#722ed1' }}
            name="当月平均"
            connectNulls={true} // 平均线保持连续
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
