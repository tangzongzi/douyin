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
          background: 'linear-gradient(145deg, #ffffff 0%, #fafbfc 100%)',
          padding: '14px 18px',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)',
          minWidth: '220px',
          maxWidth: '260px'
        }}>
          {/* 优雅的日期标题 */}
          <div style={{ 
            fontSize: '16px',
            fontWeight: '600',
            color: '#1890ff',
            marginBottom: '10px',
            textAlign: 'center',
            paddingBottom: '8px',
            borderBottom: '1px solid rgba(24,144,255,0.1)'
          }}>
            {`${label}`}
          </div>
          
          {/* 多赞利润数据区 */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ 
              fontSize: '11px', 
              color: 'rgba(0,0,0,0.45)', 
              marginBottom: '6px',
              fontWeight: '500',
              textAlign: 'center'
            }}>
              📈 多赞利润
            </div>
            {payload.map((entry, index) => {
              const isMainData = entry.name === '本月';
              return (
                <div key={index} style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  margin: '5px 0',
                  padding: isMainData ? '8px 10px' : '4px 6px',
                  borderRadius: '6px',
                  background: isMainData 
                    ? 'linear-gradient(135deg, rgba(24,144,255,0.08) 0%, rgba(24,144,255,0.04) 100%)'
                    : 'rgba(0,0,0,0.02)',
                  border: isMainData ? '1px solid rgba(24,144,255,0.15)' : '1px solid rgba(0,0,0,0.04)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: isMainData ? '10px' : '7px',
                      height: isMainData ? '10px' : '7px',
                      borderRadius: '50%',
                      backgroundColor: entry.color,
                      border: isMainData ? '2px solid rgba(255,255,255,0.8)' : 'none',
                      boxShadow: isMainData ? `0 2px 6px ${entry.color}40` : 'none'
                    }} />
                    <span style={{ 
                      fontSize: isMainData ? '14px' : '12px',
                      color: isMainData ? 'rgba(0,0,0,0.88)' : 'rgba(0,0,0,0.65)',
                      fontWeight: isMainData ? '600' : '400'
                    }}>
                      {entry.name}
                    </span>
                  </div>
                  <span style={{ 
                    fontSize: isMainData ? '16px' : '13px',
                    fontWeight: isMainData ? '700' : '500',
                    color: entry.color
                  }}>
                    {formatCurrency(entry.value)}
                  </span>
                </div>
              );
            })}
          </div>
          
          {/* 当日总利润 - 精致展示 */}
          {dataPoint && (
            <div style={{ 
              borderTop: '1px solid rgba(24,144,255,0.1)',
              paddingTop: '10px',
              background: 'rgba(250,251,252,0.6)',
              margin: '10px -18px -14px -18px',
              padding: '10px 18px 14px 18px',
              borderRadius: '0 0 8px 8px'
            }}>
              <div style={{ 
                fontSize: '11px', 
                color: 'rgba(0,0,0,0.45)', 
                marginBottom: '6px',
                fontWeight: '500',
                textAlign: 'center'
              }}>
                💰 当日总利润
              </div>
              
              {/* 本月总利润突出 */}
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 8px',
                borderRadius: '4px',
                background: 'rgba(24,144,255,0.08)',
                marginBottom: '6px'
              }}>
                <span style={{ fontSize: '13px', color: 'rgba(0,0,0,0.75)', fontWeight: '500' }}>本月</span>
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#1890ff' }}>
                  {formatCurrency(dataPoint.currentMonthSummary || 0)}
                </span>
              </div>
              
              {/* 对比数据紧凑显示 */}
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: 'rgba(0,0,0,0.45)',
                padding: '2px 4px'
              }}>
                <span>上月: {formatCurrency(dataPoint.lastMonthSummary || 0)}</span>
                <span>平均: {formatCurrency(dataPoint.summaryAverage || 0)}</span>
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
            cursor={false}
          />
          <Legend content={<CustomLegend />} />
          
          {/* 本月数据线 - 主要线条，使用鲜明的蓝色 */}
          <Line
            type="monotone"
            dataKey="currentMonth"
            stroke="#1890ff"
            strokeWidth={2}
            dot={{ fill: '#1890ff', strokeWidth: 2, r: 4 }}
            activeDot={false}
            name="本月"
            connectNulls={false} // 不连接空值，产生断点
          />
          
          {/* 上月数据线 - 对比线条，使用淡灰色 */}
          <Line
            type="monotone"
            dataKey="lastMonth"
            stroke="#d9d9d9"
            strokeWidth={1}
            strokeDasharray="4 4"
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
