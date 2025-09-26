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
          padding: '20px 24px',
          border: '1px solid #e8e8e8',
          borderRadius: '8px',
          boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
          minWidth: '300px',
          maxWidth: '350px'
        }}>
          {/* 超大日期 - 第一视觉焦点 */}
          <div style={{ 
            textAlign: 'center',
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '2px solid #f0f0f0'
          }}>
            <div style={{ 
              fontSize: '28px',
              fontWeight: '700',
              color: '#1890ff',
              lineHeight: '1.1',
              marginBottom: '6px',
              letterSpacing: '-0.5px'
            }}>
              {`${label}`}
            </div>
            <div style={{ 
              fontSize: '12px',
              color: 'rgba(0,0,0,0.45)',
              fontWeight: '400',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Daily Profit Details
            </div>
          </div>
          
          {/* 主要数据展示 - 卡片式布局 */}
          <div style={{ marginBottom: '20px' }}>
            {payload.map((entry, index) => {
              const isMainData = entry.name === '本月';
              
              if (isMainData) {
                // 本月数据 - 超大显示
                return (
                  <div key={index} style={{ 
                    textAlign: 'center',
                    padding: '16px 20px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, rgba(24,144,255,0.08) 0%, rgba(24,144,255,0.04) 100%)',
                    border: '2px solid rgba(24,144,255,0.15)',
                    marginBottom: '12px'
                  }}>
                    <div style={{ 
                      fontSize: '14px',
                      color: 'rgba(0,0,0,0.65)',
                      marginBottom: '8px',
                      fontWeight: '500',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      {entry.name} 多赞利润
                    </div>
                    <div style={{ 
                      fontSize: '32px',
                      fontWeight: '700',
                      color: '#1890ff',
                      lineHeight: '1.1',
                      textShadow: '0 2px 4px rgba(24,144,255,0.15)'
                    }}>
                      {formatCurrency(entry.value)}
                    </div>
                  </div>
                );
              } else {
                // 对比数据 - 小尺寸显示
                return (
                  <div key={index} style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 12px',
                    margin: '4px 0',
                    borderRadius: '4px',
                    background: 'rgba(0,0,0,0.02)',
                    border: '1px solid rgba(0,0,0,0.04)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: entry.color
                      }} />
                      <span style={{ 
                        fontSize: '13px',
                        color: 'rgba(0,0,0,0.65)',
                        fontWeight: '500'
                      }}>
                        {entry.name}
                      </span>
                    </div>
                    <span style={{ 
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'rgba(0,0,0,0.75)'
                    }}>
                      {formatCurrency(entry.value)}
                    </span>
                  </div>
                );
              }
            })}
          </div>
          
          {/* 当日总利润 - 次要信息区 */}
          {dataPoint && (
            <div style={{ 
              borderTop: '2px solid rgba(0,0,0,0.08)',
              paddingTop: '16px',
              background: 'rgba(250,250,250,0.6)',
              margin: '20px -24px -20px -24px',
              padding: '16px 24px 20px 24px',
              borderRadius: '0 0 8px 8px'
            }}>
              <div style={{ 
                fontSize: '12px', 
                color: 'rgba(0,0,0,0.45)', 
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontWeight: '600',
                textAlign: 'center'
              }}>
                💰 当日总利润详情
              </div>
              
              {/* 本月总利润 - 突出显示 */}
              <div style={{ 
                textAlign: 'center',
                padding: '12px 16px',
                marginBottom: '12px',
                borderRadius: '6px',
                background: 'rgba(24,144,255,0.08)',
                border: '1px solid rgba(24,144,255,0.2)'
              }}>
                <div style={{ 
                  fontSize: '12px',
                  color: 'rgba(0,0,0,0.65)',
                  marginBottom: '4px',
                  fontWeight: '500'
                }}>
                  本月总利润
                </div>
                <div style={{ 
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#1890ff',
                  lineHeight: '1.2'
                }}>
                  {formatCurrency(dataPoint.currentMonthSummary || 0)}
                </div>
              </div>
              
              {/* 对比数据 - 网格布局 */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '8px'
              }}>
                <div style={{ 
                  textAlign: 'center',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  background: 'rgba(0,0,0,0.02)',
                  border: '1px solid rgba(0,0,0,0.06)'
                }}>
                  <div style={{ fontSize: '11px', color: 'rgba(0,0,0,0.45)', marginBottom: '2px' }}>
                    上月
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'rgba(0,0,0,0.75)' }}>
                    {formatCurrency(dataPoint.lastMonthSummary || 0)}
                  </div>
                </div>
                <div style={{ 
                  textAlign: 'center',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  background: 'rgba(0,0,0,0.02)',
                  border: '1px solid rgba(0,0,0,0.06)'
                }}>
                  <div style={{ fontSize: '11px', color: 'rgba(0,0,0,0.45)', marginBottom: '2px' }}>
                    平均
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'rgba(0,0,0,0.75)' }}>
                    {formatCurrency(dataPoint.summaryAverage || 0)}
                  </div>
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
