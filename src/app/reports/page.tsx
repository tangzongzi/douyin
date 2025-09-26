'use client';

import { useState, useEffect, useCallback } from 'react';
import { Spin, message, Row, Col, Radio, Alert } from 'antd';
import { ProCard, StatisticCard } from '@ant-design/pro-components';
import { 
  RiseOutlined, 
  DollarCircleOutlined, 
  WarningOutlined,
  BarChartOutlined,
  PieChartOutlined,
  DashboardOutlined
} from '@ant-design/icons';

// 复用现有的数据接口类型
interface ReportsData {
  kpiData: {
    yesterdayProfit: number;
    monthTotal: number;
    monthGrowthRate: number;
    targetCompletion: number;
    healthScore: number;
  };
  alertData: {
    profitAlert: 'success' | 'warning' | 'error';
    costAlert: 'success' | 'warning' | 'error';
    cashflowAlert: 'success' | 'warning' | 'error';
    trendAlert: 'success' | 'warning' | 'error';
  };
  trendsData: Array<{
    date: string;
    dailyProfit: number;
    cumulativeProfit: number;
    predictedProfit?: number;
  }>;
  analysisData: {
    roi: number;
    costStructure: Array<{ name: string; value: number; color: string }>;
    riskLevel: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export default function ReportsPage() {
  // 复用现有的状态管理模式
  const [data, setData] = useState<ReportsData>({
    kpiData: {
      yesterdayProfit: 0,
      monthTotal: 0,
      monthGrowthRate: 0,
      targetCompletion: 0,
      healthScore: 0
    },
    alertData: {
      profitAlert: 'success',
      costAlert: 'success', 
      cashflowAlert: 'success',
      trendAlert: 'success'
    },
    trendsData: [],
    analysisData: {
      roi: 0,
      costStructure: [],
      riskLevel: 0
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');

  // 复用现有的数据获取模式
  const fetchReportsData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('开始获取报表数据...');
      
      // 使用扩展的reports API
      const reportsResponse = await fetch(`/api/data?type=reports&startDate=2025-08-01&endDate=2025-09-30`);
      const reportsResult: ApiResponse<any> = await reportsResponse.json();
      
      if (!reportsResult.success) {
        throw new Error('获取报表数据失败');
      }
      
      // 直接使用API返回的聚合数据
      setData(reportsResult.data);

    } catch (error) {
      console.error('获取报表数据失败:', error);
      message.error('获取报表数据失败，请检查网络连接或稍后重试');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchReportsData();
  }, [fetchReportsData]);

  // 格式化函数
  const formatCurrency = (value: number) => `¥${value.toLocaleString()}`;
  const getAlertColor = (alert: 'success' | 'warning' | 'error') => {
    return alert === 'error' ? '#ff4d4f' : alert === 'warning' ? '#faad14' : '#52c41a';
  };
  const getAlertText = (alert: 'success' | 'warning' | 'error') => {
    return alert === 'error' ? '异常' : alert === 'warning' ? '预警' : '正常';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      {/* 复用现有页面的样式系统 */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .reports-container {
          animation: slideInUp 0.6s ease-out;
        }
        
        .alert-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.08) !important;
        }
      `}</style>
      
      {/* 复用现有页面的背景和容器 */}
      <div style={{ 
        background: 'linear-gradient(180deg, #f0f2f5 0%, #f5f7fa 100%)', 
        minHeight: '100vh', 
        padding: '24px 24px 48px 24px' 
      }}>
        <div 
          className="reports-container"
          style={{ 
            maxWidth: '1400px', 
            margin: '0 auto',
            transition: 'all 0.3s ease'
          }}
        >
        
        {/* 页面标题区域 - 复用现有设计 */}
        <div style={{ 
          marginBottom: '32px',
          padding: '24px 32px',
          background: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(8px)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.4)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ 
                fontSize: '28px', 
                fontWeight: '700', 
                color: 'rgba(0,0,0,0.88)', 
                marginBottom: '4px',
                letterSpacing: '-0.5px'
              }}>
                <BarChartOutlined style={{ marginRight: '12px', color: '#1890ff' }} />
                CEO经营报表
              </h1>
              <p style={{ 
                margin: 0, 
                fontSize: '14px', 
                color: 'rgba(0,0,0,0.55)',
                fontWeight: '400'
              }}>
                实时监控经营状况，智能分析增长趋势，辅助决策制定
              </p>
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              padding: '8px 12px',
              background: 'rgba(0,0,0,0.02)',
              borderRadius: '6px',
              border: '1px solid rgba(0,0,0,0.06)'
            }}>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: data.alertData.profitAlert === 'success' ? '#52c41a' : 
                           data.alertData.profitAlert === 'warning' ? '#faad14' : '#ff4d4f',
                marginRight: '8px',
                animation: 'pulse 2s infinite'
              }}></div>
              <span style={{ 
                color: 'rgba(0,0,0,0.65)', 
                fontSize: '13px',
                fontWeight: '500'
              }}>
                健康度 {data.kpiData.healthScore}/100 · {new Date().toLocaleString('zh-CN', { 
                  month: '2-digit', 
                  day: '2-digit', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          </div>
        </div>

        {/* 🚨 实时预警中心 - 复用StatisticCard */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={6}>
            <StatisticCard
              className="alert-card"
              title="盈利预警"
              statistic={{
                value: getAlertText(data.alertData.profitAlert),
                valueStyle: { 
                  color: getAlertColor(data.alertData.profitAlert),
                  fontSize: '16px',
                  fontWeight: '600'
                },
                prefix: data.alertData.profitAlert === 'error' ? 
                  <WarningOutlined style={{ color: '#ff4d4f' }} /> : 
                  <RiseOutlined style={{ color: getAlertColor(data.alertData.profitAlert) }} />
              }}
              chart={
                <div style={{ fontSize: '11px', color: 'rgba(0,0,0,0.45)', marginTop: '4px' }}>
                  {data.alertData.profitAlert === 'error' ? '月增长率 < -10%' :
                   data.alertData.profitAlert === 'warning' ? '低于平均线' : '增长健康'}
                </div>
              }
            />
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <StatisticCard
              className="alert-card"
              title="成本预警"
              statistic={{
                value: getAlertText(data.alertData.costAlert),
                valueStyle: { 
                  color: getAlertColor(data.alertData.costAlert),
                  fontSize: '16px',
                  fontWeight: '600'
                }
              }}
              chart={
                <div style={{ fontSize: '11px', color: 'rgba(0,0,0,0.45)', marginTop: '4px' }}>
                  {data.alertData.costAlert === 'warning' ? '支出异常增长' : '成本控制良好'}
                </div>
              }
            />
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <StatisticCard
              className="alert-card"
              title="现金流"
              statistic={{
                value: getAlertText(data.alertData.cashflowAlert),
                valueStyle: { 
                  color: getAlertColor(data.alertData.cashflowAlert),
                  fontSize: '16px',
                  fontWeight: '600'
                }
              }}
              chart={
                <div style={{ fontSize: '11px', color: 'rgba(0,0,0,0.45)', marginTop: '4px' }}>
                  {data.alertData.cashflowAlert === 'warning' ? '赔付较高' : '现金流稳定'}
                </div>
              }
            />
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <StatisticCard
              className="alert-card"
              title="趋势预警"
              statistic={{
                value: getAlertText(data.alertData.trendAlert),
                valueStyle: { 
                  color: getAlertColor(data.alertData.trendAlert),
                  fontSize: '16px',
                  fontWeight: '600'
                }
              }}
              chart={
                <div style={{ fontSize: '11px', color: 'rgba(0,0,0,0.45)', marginTop: '4px' }}>
                  综合评分 {data.kpiData.healthScore}/100
                </div>
              }
            />
          </Col>
        </Row>

        {/* 📊 核心KPI监控 - 复用现有StatisticCard样式 */}
        <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
          <Col xs={24} sm={12} md={6}>
            <StatisticCard
              title="昨日盈利"
              tooltip="T+1数据，每日23:59更新"
              statistic={{
                value: data.kpiData.yesterdayProfit,
                valueStyle: { 
                  color: '#1890ff', 
                  fontSize: '24px',
                  fontWeight: '600'
                },
                formatter: (value) => formatCurrency(Number(value)),
                suffix: <span style={{ fontSize: '12px', color: 'rgba(0,0,0,0.45)' }}>(T+1)</span>
              }}
              chart={
                <div style={{ 
                  height: '32px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  fontSize: '12px', 
                  color: 'rgba(0,0,0,0.45)'
                }}>
                  <span>数据更新：昨日23:59</span>
                </div>
              }
            />
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <StatisticCard
              title="本月累计"
              tooltip="实时数据，每小时更新"
              statistic={{
                value: data.kpiData.monthTotal,
                valueStyle: { 
                  color: '#52c41a', 
                  fontSize: '24px',
                  fontWeight: '600'
                },
                formatter: (value) => formatCurrency(Number(value)),
                suffix: <span style={{ fontSize: '12px', color: 'rgba(0,0,0,0.45)' }}>实时</span>
              }}
              chart={
                <div style={{ 
                  height: '32px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  fontSize: '12px', 
                  color: 'rgba(0,0,0,0.45)'
                }}>
                  <span>实时更新 · 每小时同步</span>
                </div>
              }
            />
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <StatisticCard
              title="月增长率"
              tooltip="本月相比上月的增长情况"
              statistic={{
                value: data.kpiData.monthGrowthRate,
                valueStyle: { 
                  color: data.kpiData.monthGrowthRate >= 0 ? '#52c41a' : '#ff4d4f', 
                  fontSize: '24px',
                  fontWeight: '600'
                },
                formatter: (value) => `${Number(value).toFixed(1)}%`,
                trend: data.kpiData.monthGrowthRate >= 0 ? 'up' : 'down'
              }}
              chart={
                <div style={{ 
                  height: '32px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  fontSize: '12px', 
                  color: 'rgba(0,0,0,0.45)'
                }}>
                  <span>{data.kpiData.monthGrowthRate >= 0 ? '增长健康' : '需要关注'}</span>
                </div>
              }
            />
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <StatisticCard
              title="目标完成度"
              tooltip="本月目标完成进度"
              statistic={{
                value: data.kpiData.targetCompletion,
                valueStyle: { 
                  color: data.kpiData.targetCompletion >= 80 ? '#52c41a' : 
                         data.kpiData.targetCompletion >= 60 ? '#faad14' : '#ff4d4f', 
                  fontSize: '24px',
                  fontWeight: '600'
                },
                formatter: (value) => `${Number(value).toFixed(0)}%`
              }}
              chart={
                <div style={{ 
                  height: '32px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  fontSize: '12px', 
                  color: 'rgba(0,0,0,0.45)'
                }}>
                  <span>月度目标: ¥50,000</span>
                </div>
              }
            />
          </Col>
        </Row>

        {/* 📈 增长趋势分析 - 复用ProCard + Chart模式 */}
        <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
          <Col span={24}>
            <ProCard 
              title="盈利增长趋势分析"
              headerBordered
              // 复用现有ProCard样式
              style={{
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                border: '1px solid rgba(0,0,0,0.08)',
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(8px)'
              }}
              bodyStyle={{
                padding: '32px',
                background: 'linear-gradient(145deg, #ffffff 0%, #fafbfc 100%)',
                borderRadius: '0 0 12px 12px'
              }}
              extra={
                <Radio.Group 
                  value={timeRange} 
                  onChange={(e) => setTimeRange(e.target.value)}
                  size="small"
                >
                  <Radio.Button value="week">7天</Radio.Button>
                  <Radio.Button value="month">30天</Radio.Button>
                  <Radio.Button value="quarter">90天</Radio.Button>
                </Radio.Group>
              }
            >
              {/* 临时图表占位，后续会创建专门的报表图表组件 */}
              <div style={{ 
                height: '300px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: 'rgba(24,144,255,0.02)',
                borderRadius: '8px',
                border: '2px dashed rgba(24,144,255,0.2)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <BarChartOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
                  <div style={{ fontSize: '16px', color: 'rgba(0,0,0,0.65)', marginBottom: '8px' }}>
                    盈利增长趋势图表
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.45)' }}>
                    双轴显示：每日盈利趋势 + 累计盈利进度
                  </div>
                </div>
              </div>
            </ProCard>
          </Col>
        </Row>

        {/* 🎛️ 决策分析矩阵 - 复用现有卡片布局 */}
        <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
          <Col xs={24} md={8}>
            <ProCard 
              title="投入产出分析" 
              headerBordered
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                border: '1px solid rgba(0,0,0,0.06)'
              }}
            >
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#52c41a', marginBottom: '8px' }}>
                  {data.analysisData.roi.toFixed(1)}
                </div>
                <div style={{ fontSize: '14px', color: 'rgba(0,0,0,0.65)', marginBottom: '16px' }}>
                  投入产出比 (ROI)
                </div>
                <div style={{ 
                  height: '120px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  background: 'rgba(82,196,26,0.02)',
                  borderRadius: '6px',
                  border: '1px dashed rgba(82,196,26,0.2)'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <PieChartOutlined style={{ fontSize: '32px', color: '#52c41a', marginBottom: '8px' }} />
                    <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.45)' }}>
                      ROI趋势分析图
                    </div>
                  </div>
                </div>
              </div>
            </ProCard>
          </Col>
          
          <Col xs={24} md={8}>
            <ProCard 
              title="成本结构分析" 
              headerBordered
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                border: '1px solid rgba(0,0,0,0.06)'
              }}
            >
              <div style={{ padding: '20px 0' }}>
                {data.analysisData.costStructure.map((item, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    margin: '8px 0',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    background: `${item.color}08`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: item.color
                      }} />
                      <span style={{ fontSize: '13px', color: 'rgba(0,0,0,0.75)' }}>
                        {item.name}
                      </span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: item.color }}>
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                ))}
                
                <div style={{ 
                  height: '80px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  background: 'rgba(250,140,22,0.02)',
                  borderRadius: '6px',
                  border: '1px dashed rgba(250,140,22,0.2)',
                  marginTop: '12px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <PieChartOutlined style={{ fontSize: '24px', color: '#fa8c16', marginBottom: '4px' }} />
                    <div style={{ fontSize: '11px', color: 'rgba(0,0,0,0.45)' }}>
                      成本占比饼图
                    </div>
                  </div>
                </div>
              </div>
            </ProCard>
          </Col>
          
          <Col xs={24} md={8}>
            <ProCard 
              title="风险监控" 
              headerBordered
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                border: '1px solid rgba(0,0,0,0.06)'
              }}
            >
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ 
                  fontSize: '32px', 
                  fontWeight: '700', 
                  color: data.analysisData.riskLevel < 5 ? '#52c41a' : 
                         data.analysisData.riskLevel < 10 ? '#faad14' : '#ff4d4f',
                  marginBottom: '8px' 
                }}>
                  {data.analysisData.riskLevel.toFixed(1)}%
                </div>
                <div style={{ fontSize: '14px', color: 'rgba(0,0,0,0.65)', marginBottom: '16px' }}>
                  风险指数
                </div>
                <div style={{ 
                  height: '120px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  background: 'rgba(255,77,79,0.02)',
                  borderRadius: '6px',
                  border: '1px dashed rgba(255,77,79,0.2)'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <DashboardOutlined style={{ fontSize: '32px', color: '#ff4d4f', marginBottom: '8px' }} />
                    <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.45)' }}>
                      风险雷达图
                    </div>
                  </div>
                </div>
              </div>
            </ProCard>
          </Col>
        </Row>

        {/* 💡 智能决策建议区 */}
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <ProCard 
              title="智能经营建议"
              headerBordered
              style={{
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                border: '1px solid rgba(0,0,0,0.08)',
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(8px)'
              }}
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <div style={{ 
                    padding: '16px',
                    borderRadius: '8px',
                    background: 'rgba(82,196,26,0.04)',
                    border: '1px solid rgba(82,196,26,0.1)'
                  }}>
                    <h4 style={{ color: '#52c41a', marginBottom: '8px' }}>📈 增长机会</h4>
                    <p style={{ fontSize: '13px', color: 'rgba(0,0,0,0.65)', margin: 0 }}>
                      {data.kpiData.monthGrowthRate >= 0 
                        ? '保持当前增长策略，可适当扩大投流规模'
                        : '重点关注成本控制，优化投流效率'}
                    </p>
                  </div>
                </Col>
                
                <Col xs={24} md={8}>
                  <div style={{ 
                    padding: '16px',
                    borderRadius: '8px',
                    background: 'rgba(24,144,255,0.04)',
                    border: '1px solid rgba(24,144,255,0.1)'
                  }}>
                    <h4 style={{ color: '#1890ff', marginBottom: '8px' }}>⚙️ 优化建议</h4>
                    <p style={{ fontSize: '13px', color: 'rgba(0,0,0,0.65)', margin: 0 }}>
                      {data.analysisData.roi > 2 
                        ? 'ROI表现优秀，可考虑增加投入规模'
                        : 'ROI偏低，建议优化投流策略和成本结构'}
                    </p>
                  </div>
                </Col>
                
                <Col xs={24} md={8}>
                  <div style={{ 
                    padding: '16px',
                    borderRadius: '8px',
                    background: 'rgba(255,77,79,0.04)',
                    border: '1px solid rgba(255,77,79,0.1)'
                  }}>
                    <h4 style={{ color: '#ff4d4f', marginBottom: '8px' }}>⚠️ 风险提醒</h4>
                    <p style={{ fontSize: '13px', color: 'rgba(0,0,0,0.65)', margin: 0 }}>
                      {data.analysisData.riskLevel > 10 
                        ? '赔付率较高，建议加强质量控制'
                        : '风险控制良好，继续保持'}
                    </p>
                  </div>
                </Col>
              </Row>
            </ProCard>
          </Col>
        </Row>

        </div>
      </div>
    </>
  );
}
