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
          background: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%)',
          backdropFilter: 'blur(12px)',
          padding: '16px 20px',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
          minWidth: '220px',
          maxWidth: '280px'
        }}>
          <p style={{ 
            marginBottom: '12px', 
            borderBottom: '1px solid rgba(0,0,0,0.08)', 
            paddingBottom: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: 'rgba(0,0,0,0.85)',
            textAlign: 'center'
          }}>
            {`${label}`}
          </p>
          
          {/* 显示线条数据（多赞利润） */}
          <div style={{ marginBottom: '12px' }}>
            <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: 'rgba(0,0,0,0.65)', fontWeight: '500' }}>
              📈 多赞利润
            </p>
            {payload.map((entry, index) => (
              <p key={index} style={{ 
                color: entry.color, 
                margin: '4px 0', 
                fontSize: '13px',
                fontWeight: '500',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>{entry.name}</span>
                <span style={{ fontWeight: '600' }}>{formatCurrency(entry.value)}</span>
              </p>
            ))}
          </div>
          
          {/* 显示额外数据（当日总利润） */}
          {dataPoint && (
            <div style={{ 
              borderTop: '1px solid rgba(0,0,0,0.08)', 
              paddingTop: '12px',
              background: 'linear-gradient(135deg, rgba(24,144,255,0.02) 0%, rgba(82,196,26,0.02) 100%)',
              margin: '12px -20px -16px -20px',
              padding: '12px 20px 16px 20px',
              borderRadius: '0 0 12px 12px'
            }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: 'rgba(0,0,0,0.65)', fontWeight: '500' }}>
                💰 当日总利润
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#1890ff', fontSize: '12px', fontWeight: '500' }}>本月</span>
                  <span style={{ color: '#1890ff', fontSize: '13px', fontWeight: '600' }}>
                    {formatCurrency(dataPoint.currentMonthSummary || 0)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#52c41a', fontSize: '12px', fontWeight: '500' }}>上月</span>
                  <span style={{ color: '#52c41a', fontSize: '13px', fontWeight: '600' }}>
                    {formatCurrency(dataPoint.lastMonthSummary || 0)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#722ed1', fontSize: '12px', fontWeight: '500' }}>当月平均</span>
                  <span style={{ color: '#722ed1', fontSize: '13px', fontWeight: '600' }}>
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

  // 自定义图例
  const CustomLegend = ({ payload }: { payload?: Array<{ value: string; color: string }> }) => {
    return (
      <div style={{ 
        position: 'absolute', 
        top: '12px', 
        right: '24px', 
        display: 'flex', 
        gap: '20px',
        zIndex: 10,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.8) 100%)',
        backdropFilter: 'blur(8px)',
        padding: '8px 16px',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.6)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
      }}>
        {payload?.map((entry, index) => (
          <div key={index} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            padding: '2px 4px',
            borderRadius: '8px',
            transition: 'all 0.2s ease'
          }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: entry.color,
              border: '2px solid rgba(255,255,255,0.8)',
              boxShadow: `0 2px 4px ${entry.color}40`
            }} />
            <span style={{ 
              fontSize: '12px', 
              color: 'rgba(0,0,0,0.75)',
              fontWeight: '500'
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
      position: 'relative',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(250,251,252,0.6) 100%)',
      borderRadius: '8px',
      padding: '12px'
    }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={processedData} margin={{ top: 40, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid 
            strokeDasharray="2 4" 
            stroke="rgba(0,0,0,0.04)" 
            strokeWidth={1}
          />
          <XAxis 
            dataKey="dayLabel" 
            tick={{ fontSize: 12, fill: 'rgba(0,0,0,0.65)' }}
            tickLine={{ stroke: 'rgba(0,0,0,0.15)' }}
            axisLine={{ stroke: 'rgba(0,0,0,0.15)' }}
            interval={2} // 每3天显示一个标签
          />
          <YAxis 
            tick={{ fontSize: 12, fill: 'rgba(0,0,0,0.65)' }}
            tickLine={{ stroke: 'rgba(0,0,0,0.15)' }}
            axisLine={{ stroke: 'rgba(0,0,0,0.15)' }}
            tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip 
            content={<CustomTooltip />}
            cursor={{ 
              stroke: 'rgba(24,144,255,0.2)', 
              strokeWidth: 2, 
              strokeDasharray: '0',
              fill: 'rgba(24,144,255,0.05)'
            }}
            wrapperStyle={{
              outline: 'none',
              border: 'none'
            }}
          />
          <Legend content={<CustomLegend />} />
          
          {/* 本月数据线 */}
          <Line
            type="monotone"
            dataKey="currentMonth"
            stroke="#1890ff"
            strokeWidth={3}
            dot={{ 
              fill: '#ffffff', 
              stroke: '#1890ff', 
              strokeWidth: 2, 
              r: 4,
              filter: 'drop-shadow(0 2px 4px rgba(24,144,255,0.3))'
            }}
            activeDot={{ 
              r: 6, 
              stroke: '#1890ff', 
              strokeWidth: 3, 
              fill: '#ffffff',
              filter: 'drop-shadow(0 4px 8px rgba(24,144,255,0.4))'
            }}
            name="本月"
            connectNulls={false} // 不连接空值，产生断点
          />
          
          {/* 上月数据线 */}
          <Line
            type="monotone"
            dataKey="lastMonth"
            stroke="#52c41a"
            strokeWidth={3}
            dot={{ 
              fill: '#ffffff', 
              stroke: '#52c41a', 
              strokeWidth: 2, 
              r: 4,
              filter: 'drop-shadow(0 2px 4px rgba(82,196,26,0.3))'
            }}
            activeDot={{ 
              r: 6, 
              stroke: '#52c41a', 
              strokeWidth: 3, 
              fill: '#ffffff',
              filter: 'drop-shadow(0 4px 8px rgba(82,196,26,0.4))'
            }}
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
            activeDot={{ 
              r: 5, 
              stroke: '#722ed1', 
              strokeWidth: 2, 
              fill: '#ffffff',
              filter: 'drop-shadow(0 3px 6px rgba(114,46,209,0.4))'
            }}
            name="当月平均"
            connectNulls={true} // 平均线保持连续
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
