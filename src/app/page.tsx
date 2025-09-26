'use client';

import { useState, useEffect, useCallback } from 'react';
import { Spin, message, Row, Col, Modal, Button, Progress } from 'antd';
import { ProCard, StatisticCard } from '@ant-design/pro-components';
import { SyncOutlined, SettingOutlined } from '@ant-design/icons';
// 移除飞书API导入，改用Supabase API
// import { getDailyData, getMonthSummaryData } from '@/lib/feishu-api';
import DailyProfitChart from '@/components/DailyProfitChart';

interface DailyDataItem {
  day: number;
  dayLabel: string;
  currentMonth: number;
  lastMonth: number;
  currentMonthAverage: number; // 每日盈利的平均值
  currentMonthSummary: number; // 每日利润汇总
  lastMonthSummary: number;
  summaryAverage: number; // 每日利润汇总的平均值
}

interface SupabaseDailyRecord {
  date: string;
  profit_summary: number;
  daily_profit: number;
  [key: string]: string | number | null | undefined;
}

interface SupabaseMonthlyRecord {
  month: string;
  month_profit: number;
  claim_amount_sum: number;
  pdd_service_fee: number;
  douyin_service_fee?: number | null;
  payment_expense_sum: number;
  other_expense_sum: number;
  shipping_insurance?: number | null;
  hard_expense?: number | null;
  qianchuan?: number | null;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

interface MonthDataItem {
  month: string;
  month_profit: number;
  claim_amount_sum: number;
  pdd_service_fee: number;
  douyin_service_fee: number;
  payment_expense_sum: number;
  other_expense_sum: number;
  shipping_insurance: number;
}

interface OverviewData {
  dailyProfitSum?: number; // 月度每日利润汇总
  lastMonthDailyProfitSum?: number;
  monthProfit?: number; // 月净利润
  lastMonthProfit?: number;
  hardExpense?: number; // 硬性支出
  lastMonthHardExpense?: number;
  qianchuan?: number; // 千川投流
  lastMonthQianchuan?: number;
  monthClaimAmount?: number; // 当月赔付申请
  lastMonthClaimAmount?: number;
  // 年度数据字段
  yearProfitWithDeposit?: number; // 年度含保证金利润
  yearProfitWithoutDeposit?: number; // 年度不含保证金利润
}

interface ExpenseData {
  payment_expense_sum: number;
  other_expense_sum: number;
  pdd_service_fee: number;
  douyin_service_fee: number;
  shipping_insurance: number;
}

interface YearDataItem {
  id?: number;
  year: string;
  profit_with_deposit: number;
  total_profit_with_deposit: number;
  profit_without_deposit: number;
  net_profit_without_deposit: number;
  created_at?: string;
  updated_at?: string;
}

interface DashboardData {
  dailyData: DailyDataItem[];
  monthData: MonthDataItem[];
  overviewData: OverviewData;
  currentMonthExpense: ExpenseData;
  yearData: YearDataItem[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>({
    dailyData: [],
    monthData: [],
    overviewData: {},
    currentMonthExpense: {
      payment_expense_sum: 0,
      other_expense_sum: 0,
      pdd_service_fee: 0,
      douyin_service_fee: 0,
      shipping_insurance: 0
    },
    yearData: []
  });
  const [loading, setLoading] = useState(true);
  const [syncModalVisible, setSyncModalVisible] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  // 移除chartDataType状态，直接显示daily_profit数据

  // 获取数据
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('开始获取Supabase数据...');
      
      const [overviewResponse, dailyResponse, monthlyResponse, yearResponse] = await Promise.all([
        fetch('/api/data?type=overview'),
        fetch('/api/data?type=daily&startDate=2025-08-01&endDate=2025-09-30'), // 获取8月和9月的数据
        fetch('/api/data?type=monthly&limit=6'),
        fetch('/api/year-profit?limit=1') // 获取最新年度数据
      ]);
      
      const [overviewResult, dailyResult, monthlyResult, yearResult]: [
        ApiResponse<OverviewData>,
        ApiResponse<SupabaseDailyRecord[]>,
        ApiResponse<SupabaseMonthlyRecord[]>,
        ApiResponse<YearDataItem[]>
      ] = await Promise.all([
        overviewResponse.json(),
        dailyResponse.json(),
        monthlyResponse.json(),
        yearResponse.json()
      ]);
      
      if (!overviewResult.success || !dailyResult.success || !monthlyResult.success) {
        throw new Error('获取数据失败');
      }
      
      const dailyData: SupabaseDailyRecord[] = dailyResult.data || [];
      const monthData: SupabaseMonthlyRecord[] = monthlyResult.data || [];
      const overviewData = overviewResult.data || {};
      const yearData = yearResult.success ? (yearResult.data || []) : [];
      
      console.log('获取到的Supabase每日数据:', dailyData);
      console.log('获取到的Supabase月度数据:', monthData);
      console.log('获取到的概览数据:', overviewData);
      console.log('获取到的年度数据:', yearData);

      // 处理Supabase数据为图表格式
      const processSupabaseData = () => {
        // 计算当月平均值（基于每日利润汇总数据）
        const currentMonthData = dailyData.filter((item) => 
          item.date >= '2025-09-01' && item.date <= '2025-09-30' && item.profit_summary > 0
        );
        
        const currentMonthSummaryAverage = currentMonthData.length > 0 
          ? currentMonthData.reduce((sum: number, item: { profit_summary: number }) => sum + item.profit_summary, 0) / currentMonthData.length
          : 3000;
        
        // 计算当月平均值（基于每日盈利数据，用于图表线条）
        const currentMonthProfitData = dailyData.filter((item) => 
          item.date >= '2025-09-01' && item.date <= '2025-09-30' && item.daily_profit > 0
        );
        
        const currentMonthProfitAverage = currentMonthProfitData.length > 0 
          ? currentMonthProfitData.reduce((sum: number, item: { daily_profit: number }) => sum + item.daily_profit, 0) / currentMonthProfitData.length
          : 1800;
        
        console.log(`当月每日盈利平均值: ${currentMonthProfitAverage}`);
        console.log(`当月每日利润汇总平均值: ${currentMonthSummaryAverage}`);
        
        // 生成图表数据（当月vs上月对比）
        const chartData: DailyDataItem[] = [];
        
        // 获取当月每日数据
        const daysInMonth = 30; // 9月有30天
        
        for (let day = 1; day <= daysInMonth; day++) {
          const currentDate = `2025-09-${String(day).padStart(2, '0')}`;
          const lastMonthDate = `2025-08-${String(day).padStart(2, '0')}`;
          
        const currentDayRecord = dailyData.find((item) => item.date === currentDate);
        const lastMonthRecord = dailyData.find((item) => item.date === lastMonthDate);
          
          // 调试信息
          if (day <= 3) {
            console.log(`${day}日数据:`, {
              currentDate,
              lastMonthDate,
              daily_profit_current: currentDayRecord?.daily_profit || 0,
              daily_profit_last: lastMonthRecord?.daily_profit || 0,
              profit_summary_current: currentDayRecord?.profit_summary || 0,
              profit_summary_last: lastMonthRecord?.profit_summary || 0,
              lineValue: currentDayRecord?.daily_profit || 0
            });
          }
          
          // 只显示到当前日期
          const today = new Date().getDate();
          if (day <= today) {
            // 默认使用daily_profit数据显示线条
            chartData.push({
              day: day,
              dayLabel: `${day}日`,
              currentMonth: currentDayRecord?.daily_profit || 0, // 每日盈利
              lastMonth: lastMonthRecord?.daily_profit || 0,
              currentMonthAverage: currentMonthProfitAverage, // 每日盈利的平均值
              // 额外数据用于悬停提示
              currentMonthSummary: currentDayRecord?.profit_summary || 0, // 每日利润汇总
              lastMonthSummary: lastMonthRecord?.profit_summary || 0,
              summaryAverage: currentMonthSummaryAverage, // 每日利润汇总的平均值
            });
          }
        }
        
        return chartData.filter(item => item.currentMonth > 0 || item.lastMonth > 0);
      };
      
      const combinedDailyData = processSupabaseData();

      // 处理当月支出数据
      const currentMonthRecord = monthData.find((item) => item.month === '2025-09');

      setData({
        dailyData: combinedDailyData,
        monthData: monthData.map((item) => ({
          month: item.month,
          month_profit: item.month_profit,
          claim_amount_sum: item.claim_amount_sum,
          pdd_service_fee: Math.abs(item.pdd_service_fee), // 转为正数显示
          douyin_service_fee: Math.abs(item.douyin_service_fee || 0),
          payment_expense_sum: Math.abs(item.payment_expense_sum), // 转为正数显示
          other_expense_sum: Math.abs(item.other_expense_sum),
          shipping_insurance: Math.abs(item.shipping_insurance || 0),
        })),
        overviewData: overviewData,
        currentMonthExpense: {
          payment_expense_sum: Math.abs(currentMonthRecord?.payment_expense_sum || 0),
          other_expense_sum: Math.abs(currentMonthRecord?.other_expense_sum || 0),
          pdd_service_fee: Math.abs(currentMonthRecord?.pdd_service_fee || 0),
          douyin_service_fee: Math.abs(currentMonthRecord?.douyin_service_fee || 0),
          shipping_insurance: Math.abs(currentMonthRecord?.shipping_insurance || 0),
        },
        yearData: yearData
      });

    } catch (error) {
      console.error('获取数据失败:', error);
      message.error('获取数据失败，请检查网络连接或稍后重试');
    } finally {
      setLoading(false);
    }
  }, []);

  // 刷新数据
  // 执行数据同步
  const performSyncRequest = useCallback(async (url: string, actionName: string) => {
    setSyncing(true);
    setSyncProgress(0);
    
    try {
      const progressInterval = setInterval(() => {
        setSyncProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      console.log(`[同步] 执行${actionName}:`, url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      clearInterval(progressInterval);
      setSyncProgress(100);
      
      const result = await response.json();
      
      if (result.success) {
        message.success(`${actionName}成功`);
        const currentTime = new Date().toLocaleString('zh-CN', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        setLastSyncTime(currentTime);
        // 保存到localStorage
        localStorage.setItem('lastSyncTime', currentTime);
        // 同步成功后刷新数据
        await fetchData();
      } else {
        message.error(`${actionName}失败: ${result.error}`);
      }
    } catch (error) {
      message.error(`${actionName}失败，请稍后重试`);
      console.error(`${actionName}错误:`, error);
    } finally {
      setSyncing(false);
      setSyncProgress(0);
    }
  }, [fetchData]);

  // 执行数据同步
  const handleSync = useCallback(async (type: 'daily' | 'monthly' | 'all') => {
    await performSyncRequest(`/api/sync?type=${type}`, '数据同步');
  }, [performSyncRequest]);

  // 执行带日期范围的同步
  const handleSyncWithRange = useCallback(async (type: 'daily', range: string) => {
    await performSyncRequest(`/api/sync?type=${type}&range=${range}`, `${range}数据同步`);
  }, [performSyncRequest]);

  // 执行强制同步
  const handleSyncWithForce = useCallback(async (type: 'force') => {
    await performSyncRequest(`/api/sync?type=${type}`, '强制完整同步');
  }, [performSyncRequest]);

  // 自动同步功能
  useEffect(() => {
    // 每3小时自动同步一次
    const autoSyncInterval = setInterval(() => {
      console.log('执行自动同步...');
      handleSync('all');
    }, 3 * 60 * 60 * 1000); // 3小时 = 3 * 60 * 60 * 1000毫秒

    // 组件卸载时清除定时器
    return () => clearInterval(autoSyncInterval);
  }, [handleSync]);

  // 检查上次同步时间
  useEffect(() => {
    const checkLastSync = async () => {
      try {
        const response = await fetch('/api/sync?action=validate');
        const result = await response.json();
        if (result.success && result.data) {
          // 从API响应中获取实际的同步时间
          if (result.data.lastSyncTime) {
            setLastSyncTime(result.data.lastSyncTime);
          } else {
            // 如果没有同步时间，从localStorage获取
            const storedSyncTime = localStorage.getItem('lastSyncTime');
            if (storedSyncTime) {
              setLastSyncTime(storedSyncTime);
            } else {
              setLastSyncTime('从未同步');
            }
          }
        } else {
          // API失败时从localStorage获取
          const storedSyncTime = localStorage.getItem('lastSyncTime');
          setLastSyncTime(storedSyncTime || '从未同步');
        }
      } catch (error) {
        console.log('获取同步状态失败:', error);
        // 错误时从localStorage获取
        const storedSyncTime = localStorage.getItem('lastSyncTime');
        setLastSyncTime(storedSyncTime || '从未同步');
      }
    };
    
    checkLastSync();
  }, []);

  // 移除时间范围处理函数

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 移除chartDataType监听

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  const formatCurrency = (value: number) => `¥${value.toFixed(2)}`;
  const calculatePercent = (current: number, previous: number) => {
    if (!previous) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  return (
    <>
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
        
        .dashboard-container {
          animation: slideInUp 0.6s ease-out;
        }
        
        .card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.08) !important;
        }
        
        /* 响应式优化 */
        @media (max-width: 1200px) {
          .dashboard-container {
            max-width: 95% !important;
          }
        }
        
        @media (max-width: 768px) {
          .dashboard-container {
            padding: 16px !important;
          }
        }
      `}</style>
      
      <div style={{ 
        background: 'linear-gradient(180deg, #f0f2f5 0%, #f5f7fa 100%)', 
        minHeight: '100vh', 
        padding: '24px 24px 48px 24px' 
      }}>
        <div 
          className="dashboard-container"
          style={{ 
            maxWidth: '1400px', 
            margin: '0 auto',
            transition: 'all 0.3s ease'
          }}
        >
        {/* 页面标题区域 - Pro级别优化 */}
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
                marginBottom: '16px',
                letterSpacing: '-0.5px'
              }}>
                抖音电商数据中心
                <SettingOutlined 
                  style={{ 
                    marginLeft: '16px', 
                    fontSize: '18px', 
                    color: 'rgba(0,0,0,0.15)', 
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    padding: '4px',
                    borderRadius: '4px'
                  }}
                  onClick={() => setSyncModalVisible(true)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'rgba(0,0,0,0.65)';
                    e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'rgba(0,0,0,0.15)';
                    e.currentTarget.style.background = 'transparent';
                  }}
                  title="数据同步管理"
                />
              </h1>
              
              
              <p style={{ 
                margin: 0, 
                fontSize: '14px', 
                color: 'rgba(0,0,0,0.55)',
                fontWeight: '400'
              }}>
                实时监控电商运营数据，智能分析业务趋势
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
                background: '#52c41a',
                marginRight: '8px',
                animation: 'pulse 2s infinite'
              }}></div>
              <span style={{ 
                color: 'rgba(0,0,0,0.65)', 
                fontSize: '13px',
                fontWeight: '500'
              }}>
                实时更新 · {new Date().toLocaleString('zh-CN', { 
                  month: '2-digit', 
                  day: '2-digit', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          </div>
        </div>

        {/* 核心指标卡片区域 - 优化布局和视觉层次 */}
        {/* 页面导航 - 中心位置 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          marginBottom: '32px'
        }}>
          <div style={{
            display: 'inline-flex',
            background: 'rgba(255,255,255,0.9)',
            borderRadius: '8px',
            padding: '4px',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <div style={{
              padding: '8px 24px',
              borderRadius: '6px',
              background: '#1890ff',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 2px 4px rgba(24,144,255,0.3)'
            }}>
              首页
            </div>
            <a 
              href="/reports" 
              style={{
                padding: '8px 24px',
                borderRadius: '6px',
                background: 'transparent',
                color: 'rgba(0,0,0,0.65)',
                fontSize: '14px',
                fontWeight: '500',
                textDecoration: 'none',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(24,144,255,0.08)';
                e.currentTarget.style.color = '#1890ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'rgba(0,0,0,0.65)';
              }}
            >
              月度报表
            </a>
          </div>
        </div>

        {/* 核心指标卡片区域 - Ant Design Pro标准布局 */}
        <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
          {/* 主要指标1 - 月度每日利润汇总 */}
          <Col xs={24} sm={12} md={8} lg={6}>
            <StatisticCard
              title="月度每日利润汇总"
              tooltip="当月每日利润汇总金额"
              statistic={{
                value: data.overviewData.dailyProfitSum || 0,
                valueStyle: { 
                  color: '#52c41a', 
                  fontSize: '24px',
                  fontWeight: '600'
                },
                formatter: (value) => formatCurrency(Number(value)),
                trend: data.overviewData.lastMonthDailyProfitSum ? 
                  (data.overviewData.dailyProfitSum || 0) > (data.overviewData.lastMonthDailyProfitSum || 0) ? 'up' : 'down' : undefined,
              }}
              chart={
                <div style={{ 
                  height: '32px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  fontSize: '12px', 
                  color: 'rgba(0,0,0,0.45)'
                }}>
                  {data.overviewData.lastMonthDailyProfitSum ? (
                    <>
                      <span>较上月</span>
                      <span style={{ 
                        color: (data.overviewData.dailyProfitSum || 0) > (data.overviewData.lastMonthDailyProfitSum || 0) ? '#52c41a' : '#ff4d4f',
                        marginLeft: '4px',
                        fontWeight: '500'
                      }}>
                        {calculatePercent(data.overviewData.dailyProfitSum || 0, data.overviewData.lastMonthDailyProfitSum || 0)}%
                      </span>
                    </>
                  ) : (
                    <span style={{ color: 'rgba(0,0,0,0.25)' }}>暂无对比数据</span>
                  )}
                </div>
              }
            />
          </Col>
          
          {/* 主要指标2 - 月净利润 */}
          <Col xs={24} sm={12} md={8} lg={6}>
            <StatisticCard
              title="月净利润"
              tooltip="当月净利润金额"
              statistic={{
                value: data.overviewData.monthProfit || 0,
                valueStyle: { 
                  color: '#1890ff', 
                  fontSize: '24px',
                  fontWeight: '600'
                },
                formatter: (value) => formatCurrency(Number(value)),
                trend: data.overviewData.lastMonthProfit ? 
                  (data.overviewData.monthProfit || 0) > (data.overviewData.lastMonthProfit || 0) ? 'up' : 'down' : undefined,
              }}
              chart={
                <div style={{ 
                  height: '32px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  fontSize: '12px', 
                  color: 'rgba(0,0,0,0.45)'
                }}>
                  {data.overviewData.lastMonthProfit ? (
                    <>
                      <span>较上月</span>
                      <span style={{ 
                        color: (data.overviewData.monthProfit || 0) > (data.overviewData.lastMonthProfit || 0) ? '#52c41a' : '#ff4d4f',
                        marginLeft: '4px',
                        fontWeight: '500'
                      }}>
                        {calculatePercent(data.overviewData.monthProfit || 0, data.overviewData.lastMonthProfit || 0)}%
                      </span>
                    </>
                  ) : (
                    <span style={{ color: 'rgba(0,0,0,0.25)' }}>暂无对比数据</span>
                  )}
                </div>
              }
            />
          </Col>
          
          {/* 次要指标1 - 硬性支出 */}
          <Col xs={24} sm={12} md={8} lg={4}>
            <StatisticCard
              title="硬性支出"
              tooltip="当月硬性支出金额"
              statistic={{
                value: data.overviewData.hardExpense || 0,
                valueStyle: { 
                  color: 'rgba(0,0,0,0.85)', 
                  fontSize: '20px',
                  fontWeight: '600'
                },
                formatter: (value) => formatCurrency(Number(value)),
              }}
              chart={
                <div style={{ 
                  height: '32px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  fontSize: '12px', 
                  color: 'rgba(0,0,0,0.45)'
                }}>
                  <span>固定支出</span>
                </div>
              }
            />
          </Col>
          
          {/* 次要指标2 - 千川投流 */}
          <Col xs={24} sm={12} md={8} lg={4}>
            <StatisticCard
              title="千川投流"
              tooltip="当月千川投流金额"
              statistic={{
                value: data.overviewData.qianchuan || 0,
                valueStyle: { 
                  color: 'rgba(0,0,0,0.85)', 
                  fontSize: '20px',
                  fontWeight: '600'
                },
                formatter: (value) => formatCurrency(Number(value)),
              }}
              chart={
                <div style={{ 
                  height: '32px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  fontSize: '12px', 
                  color: 'rgba(0,0,0,0.45)'
                }}>
                  <span>投流支出</span>
                </div>
              }
            />
          </Col>
          
          {/* 次要指标3 - 当月赔付申请 */}
          <Col xs={24} sm={12} md={8} lg={4}>
            <StatisticCard
              title="当月赔付申请"
              tooltip="当月总赔付申请金额"
              statistic={{
                value: data.overviewData.monthClaimAmount || 0,
                valueStyle: { 
                  color: '#ff4d4f', 
                  fontSize: '20px',
                  fontWeight: '600'
                },
                formatter: (value) => formatCurrency(Number(value)),
                trend: data.overviewData.lastMonthClaimAmount ? 
                  (data.overviewData.monthClaimAmount || 0) > (data.overviewData.lastMonthClaimAmount || 0) ? 'up' : 'down' : undefined,
              }}
              chart={
                <div style={{ 
                  height: '32px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  fontSize: '12px', 
                  color: 'rgba(0,0,0,0.45)'
                }}>
                  {data.overviewData.lastMonthClaimAmount ? (
                    <>
                      <span>较上月</span>
                      <span style={{ 
                        color: (data.overviewData.monthClaimAmount || 0) > (data.overviewData.lastMonthClaimAmount || 0) ? '#ff4d4f' : '#52c41a',
                        marginLeft: '4px',
                        fontWeight: '500'
                      }}>
                        {calculatePercent(data.overviewData.monthClaimAmount || 0, data.overviewData.lastMonthClaimAmount || 0)}%
                      </span>
                    </>
                  ) : (
                    <span>暂无对比数据</span>
                  )}
                </div>
              }
            />
          </Col>
        </Row>

        {/* 年度利润数据区域 - Pro级别深度优化 */}
        <div style={{ 
          marginBottom: '40px',
          padding: '32px',
          background: 'linear-gradient(135deg, rgba(248,254,255,0.8) 0%, rgba(246,255,237,0.8) 100%)',
          backdropFilter: 'blur(8px)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.6)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* 装饰性元素 */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle, rgba(82,196,26,0.03) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}></div>
          
          <div style={{
            textAlign: 'center',
            marginBottom: '32px',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
            paddingBottom: '20px',
            position: 'relative'
          }}>
            <h3 style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: '700',
              color: 'rgba(0,0,0,0.88)',
              letterSpacing: '-0.3px',
              marginBottom: '6px'
            }}>
              年度利润概览
            </h3>
            <span style={{
              fontSize: '14px',
              color: 'rgba(0,0,0,0.55)',
              fontWeight: '500',
              padding: '4px 12px',
              background: 'rgba(82,196,26,0.08)',
              borderRadius: '12px',
              border: '1px solid rgba(82,196,26,0.12)'
            }}>
              2025年度累计数据
            </span>
          </div>
          
          <Row gutter={[24, 0]} justify="center">
            <Col span={10}>
              <div style={{
                textAlign: 'center',
                padding: '24px 20px',
                background: 'rgba(82, 196, 26, 0.06)',
                borderRadius: '12px',
                border: '1px solid rgba(82, 196, 26, 0.15)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 12px rgba(82, 196, 26, 0.08)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  fontSize: '13px',
                  color: 'rgba(0,0,0,0.65)',
                  marginBottom: '8px',
                  fontWeight: '500'
                }}>
                  含保证金利润
                </div>
                <div style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  color: '#52c41a',
                  lineHeight: '1.1',
                  marginBottom: '6px',
                  textShadow: '0 2px 4px rgba(82, 196, 26, 0.15)'
                }}>
                  {data.yearData.length > 0 
                    ? `¥${data.yearData[0].profit_with_deposit?.toLocaleString() || '0'}`
                    : '¥0'
                  }
                </div>
                <div style={{
                  fontSize: '12px',
                  color: 'rgba(82, 196, 26, 0.75)',
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  年度累计收益
                </div>
              </div>
            </Col>
            
            <Col span={4}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%'
              }}>
                <div style={{
                  width: '1px',
                  height: '60px',
                  background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.06), transparent)'
                }}></div>
              </div>
            </Col>
            
            <Col span={10}>
              <div style={{
                textAlign: 'center',
                padding: '24px 20px',
                background: 'rgba(24, 144, 255, 0.06)',
                borderRadius: '12px',
                border: '1px solid rgba(24, 144, 255, 0.15)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 12px rgba(24, 144, 255, 0.08)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  fontSize: '13px',
                  color: 'rgba(0,0,0,0.65)',
                  marginBottom: '8px',
                  fontWeight: '500'
                }}>
                  不含保证金利润
                </div>
                <div style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  color: '#1890ff',
                  lineHeight: '1.1',
                  marginBottom: '6px',
                  textShadow: '0 2px 4px rgba(24, 144, 255, 0.15)'
                }}>
                  {data.yearData.length > 0 
                    ? `¥${data.yearData[0].profit_without_deposit?.toLocaleString() || '0'}`
                    : '¥0'
                  }
                </div>
                <div style={{
                  fontSize: '12px',
                  color: 'rgba(24, 144, 255, 0.75)',
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  净利润收益
                </div>
              </div>
            </Col>
          </Row>
          
          <div style={{
            textAlign: 'center',
            marginTop: '24px',
            padding: '12px 20px',
            background: 'rgba(0,0,0,0.02)',
            borderRadius: '8px',
            border: '1px solid rgba(0,0,0,0.06)',
            fontSize: '13px',
            color: 'rgba(0,0,0,0.55)',
            fontWeight: '500'
          }}>
            <span style={{ color: 'rgba(0,0,0,0.75)' }}>差额</span>{' '}
            <span style={{ 
              color: '#fa8c16', 
              fontWeight: '600',
              fontSize: '14px'
            }}>
              {data.yearData.length > 0 
                ? `¥${((data.yearData[0].profit_with_deposit || 0) - (data.yearData[0].profit_without_deposit || 0)).toLocaleString()}`
                : '¥0'
              }
            </span>
            {' · '}
            <span style={{ color: 'rgba(0,0,0,0.75)' }}>保证金占比</span>{' '}
            <span style={{ 
              color: '#722ed1', 
              fontWeight: '600',
              fontSize: '14px'
            }}>
              {data.yearData.length > 0 && data.yearData[0].profit_with_deposit > 0
                ? `${((((data.yearData[0].profit_with_deposit || 0) - (data.yearData[0].profit_without_deposit || 0)) / (data.yearData[0].profit_with_deposit || 1)) * 100).toFixed(1)}%`
                : '0%'
              }
            </span>
          </div>
        </div>

        {/* 主要图表区域 - 优化视觉效果 */}
        <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
          <Col xs={24}>
            <ProCard 
              title={
                <span style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'rgba(0,0,0,0.85)'
                }}>
                  当月日盈利趋势对比
                </span>
              }
              headerBordered
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
            >
              <DailyProfitChart data={data.dailyData} loading={loading} />
            </ProCard>
          </Col>
        </Row>


        {/* 数据同步管理Modal - Pro级别优化 */}
        <Modal
          title={
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              padding: '8px 0'
            }}>
              <div style={{
                padding: '8px',
                background: 'linear-gradient(135deg, #1890ff 0%, #13c2c2 100%)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <SyncOutlined style={{ color: 'white', fontSize: '16px' }} />
              </div>
              <div>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: '18px', 
                  fontWeight: '600',
                  color: 'rgba(0,0,0,0.88)'
                }}>
              数据同步管理
                </h3>
                <p style={{ 
                  margin: 0, 
                  fontSize: '13px', 
                  color: 'rgba(0,0,0,0.45)',
                  fontWeight: '400'
                }}>
                  智能同步飞书数据到本地数据库
                </p>
              </div>
            </div>
          }
          open={syncModalVisible}
          onCancel={() => setSyncModalVisible(false)}
          footer={null}
          width={580}
          styles={{
            header: { 
              borderBottom: '1px solid rgba(0,0,0,0.06)',
              paddingBottom: '12px',
              marginBottom: '16px'
            },
            body: { 
              padding: '16px 24px 24px 24px' 
            }
          }}
          style={{
            borderRadius: '12px'
          }}
        >
          <div>
            {/* 同步状态显示 - 优化版 */}
            <div style={{ 
              marginBottom: '20px',
              padding: '16px',
              background: 'linear-gradient(135deg, rgba(24,144,255,0.04) 0%, rgba(19,194,194,0.04) 100%)',
              borderRadius: '8px',
              border: '1px solid rgba(24,144,255,0.08)'
            }}>
              <h4 style={{ 
                margin: '0 0 12px 0',
                fontSize: '14px',
                fontWeight: '600',
                color: 'rgba(0,0,0,0.85)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#52c41a',
                  animation: 'pulse 2s infinite'
                }}></div>
                同步状态
              </h4>
              
              <div style={{ 
                display: 'flex', 
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <div style={{
                  flex: '1',
                  minWidth: '150px',
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.9)',
                  borderRadius: '8px',
                  border: '1px solid rgba(0,0,0,0.06)',
                  textAlign: 'center'
                }}>
                  <div style={{ 
                    fontSize: '12px', 
                    color: 'rgba(0,0,0,0.45)',
                    marginBottom: '6px',
                    fontWeight: '500'
                  }}>
                    上次同步时间
                  </div>
                  <div style={{ 
                    fontSize: '14px',
                    color: '#1890ff',
                    fontWeight: '600',
                    wordBreak: 'keep-all'
                  }}>
                    {lastSyncTime || '从未同步'}
                  </div>
                </div>

                <div style={{
                  flex: '1',
                  minWidth: '150px',
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.9)',
                  borderRadius: '8px',
                  border: '1px solid rgba(0,0,0,0.06)',
                  textAlign: 'center'
                }}>
                  <div style={{ 
                    fontSize: '12px', 
                    color: 'rgba(0,0,0,0.45)',
                    marginBottom: '6px',
                    fontWeight: '500'
                  }}>
                    自动同步
                  </div>
                  <div style={{ 
                    fontSize: '14px',
                    color: '#52c41a',
                    fontWeight: '600'
                  }}>
                    每3小时执行
                  </div>
                </div>
              </div>
            </div>

            {/* 同步进度 - 优化版 */}
            {syncing && (
              <div style={{ 
                marginBottom: '20px',
                padding: '16px',
                background: 'linear-gradient(135deg, rgba(16,142,233,0.04) 0%, rgba(135,208,104,0.04) 100%)',
                borderRadius: '8px',
                border: '1px solid rgba(16,142,233,0.08)'
              }}>
                <h4 style={{ 
                  margin: '0 0 12px 0',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'rgba(0,0,0,0.85)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <SyncOutlined style={{ color: '#1890ff', fontSize: '14px' }} spin />
                  同步进度
                </h4>
                <Progress 
                  percent={syncProgress} 
                  status="active"
                  strokeColor={{ 
                    '0%': '#1890ff', 
                    '50%': '#13c2c2',
                    '100%': '#52c41a' 
                  }}
                  strokeWidth={6}
                  style={{ marginBottom: '6px' }}
                />
                <div style={{
                  fontSize: '12px',
                  color: 'rgba(0,0,0,0.45)',
                  textAlign: 'center'
                }}>
                  正在同步数据，请稍候...
                </div>
              </div>
            )}

            {/* 快速同步按钮 - 重新设计 */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ 
                margin: '0 0 12px 0',
                fontSize: '14px',
                fontWeight: '600',
                color: 'rgba(0,0,0,0.85)'
              }}>
                快速同步
              </h4>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '10px'
              }}>
                <Button 
                  icon={<SyncOutlined />}
                  onClick={() => handleSyncWithRange('daily', '7days')}
                  loading={syncing}
                  style={{
                    height: '36px',
                    borderRadius: '6px',
                    border: '1px solid rgba(0,0,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '500'
                  }}
                >
                  近7天
                </Button>
                <Button 
                  icon={<SyncOutlined />}
                  onClick={() => handleSyncWithRange('daily', '15days')}
                  loading={syncing}
                  style={{
                    height: '36px',
                    borderRadius: '6px',
                    border: '1px solid rgba(0,0,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '500'
                  }}
                >
                  近15天
                </Button>
                <Button 
                  icon={<SyncOutlined />}
                  onClick={() => handleSyncWithRange('daily', '30days')}
                  loading={syncing}
                  style={{
                    height: '36px',
                    borderRadius: '6px',
                    border: '1px solid rgba(0,0,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '500'
                  }}
                >
                  近30天
                </Button>
                <Button 
                  type="primary"
                  icon={<SyncOutlined />}
                  onClick={() => handleSyncWithRange('daily', 'currentMonth')}
                  loading={syncing}
                  style={{
                    height: '36px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #1890ff 0%, #13c2c2 100%)',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(24,144,255,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '600'
                  }}
                >
                  当月数据
                </Button>
              </div>
            </div>

            {/* 完整同步按钮 - 重新设计 */}
            <div>
              <h4 style={{ 
                margin: '0 0 12px 0',
                fontSize: '14px',
                fontWeight: '600',
                color: 'rgba(0,0,0,0.85)'
              }}>
                完整同步
              </h4>
              
              <div style={{ 
                display: 'flex', 
                gap: '10px',
                flexWrap: 'wrap'
              }}>
                <Button 
                  type="primary"
                  icon={<SyncOutlined />}
                  onClick={() => handleSync('all')}
                  loading={syncing}
                  style={{
                    flex: '1',
                    minWidth: '100px',
                    height: '40px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(82,196,26,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                >
                  智能同步
                </Button>
                <Button 
                  icon={<SyncOutlined />}
                  onClick={() => handleSyncWithForce('force')}
                  loading={syncing}
                  danger
                  style={{
                    flex: '1',
                    minWidth: '100px',
                    height: '40px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                >
                  强制同步
                </Button>
                <Button 
                  href="/sync"
                  target="_blank"
                  style={{
                    flex: '1',
                    minWidth: '100px',
                    height: '40px',
                    borderRadius: '6px',
                    border: '1px solid rgba(0,0,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '500',
                    fontSize: '14px'
                  }}
                >
                  高级管理
                </Button>
              </div>
            </div>

            <div style={{ 
              marginTop: '20px', 
              padding: '16px', 
              background: 'linear-gradient(135deg, rgba(250,250,250,0.8) 0%, rgba(246,248,250,0.8) 100%)', 
              borderRadius: '12px',
              border: '1px solid rgba(0,0,0,0.06)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                marginBottom: '12px'
              }}>
                <div style={{
                  padding: '6px',
                  background: 'linear-gradient(135deg, #722ed1 0%, #eb2f96 100%)',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  💡
                </div>
                <div>
                  <h5 style={{
                    margin: '0 0 8px 0',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'rgba(0,0,0,0.85)'
                  }}>
                    使用说明
                  </h5>
                  <div style={{
                    fontSize: '13px',
                    color: 'rgba(0,0,0,0.65)',
                    lineHeight: '1.6'
                  }}>
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ fontWeight: '600', color: '#1890ff' }}>智能同步</span>：自动识别新数据，避免重复同步，推荐日常使用
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ fontWeight: '600', color: '#fa541c' }}>强制同步</span>：完全重新同步所有数据，数据异常时使用
                    </div>
                    <div>
                      <span style={{ fontWeight: '600', color: '#52c41a' }}>自动同步</span>：系统每3小时自动执行智能同步
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
    </>
  );
}