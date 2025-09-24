'use client';

import { useState, useEffect } from 'react';
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
}

interface ExpenseData {
  payment_expense_sum: number;
  other_expense_sum: number;
  pdd_service_fee: number;
  douyin_service_fee: number;
  shipping_insurance: number;
}

interface DashboardData {
  dailyData: DailyDataItem[];
  monthData: MonthDataItem[];
  overviewData: OverviewData;
  currentMonthExpense: ExpenseData;
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
    }
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncModalVisible, setSyncModalVisible] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  // 移除chartDataType状态，直接显示daily_profit数据

  // 获取数据
  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('开始获取Supabase数据...');
      
      const [overviewResponse, dailyResponse, monthlyResponse] = await Promise.all([
        fetch('/api/data?type=overview'),
        fetch('/api/data?type=daily&startDate=2025-08-01&endDate=2025-09-30'), // 获取8月和9月的数据
        fetch('/api/data?type=monthly&limit=6')
      ]);
      
      const [overviewResult, dailyResult, monthlyResult] = await Promise.all([
        overviewResponse.json(),
        dailyResponse.json(),
        monthlyResponse.json()
      ]);
      
      if (!overviewResult.success || !dailyResult.success || !monthlyResult.success) {
        throw new Error('获取数据失败');
      }
      
      const dailyData = dailyResult.data || [];
      const monthData = monthlyResult.data || [];
      const overviewData = overviewResult.data || {};
      
      console.log('获取到的Supabase每日数据:', dailyData);
      console.log('获取到的Supabase月度数据:', monthData);
      console.log('获取到的概览数据:', overviewData);

      // 处理Supabase数据为图表格式
      const processSupabaseData = () => {
        // 计算当月平均值（基于每日利润汇总数据）
        const currentMonthData = dailyData.filter((item: any) => 
          item.date >= '2025-09-01' && item.date <= '2025-09-30' && item.profit_summary > 0
        );
        
        const currentMonthSummaryAverage = currentMonthData.length > 0 
          ? currentMonthData.reduce((sum: number, item: any) => sum + item.profit_summary, 0) / currentMonthData.length
          : 3000;
        
        // 计算当月平均值（基于每日盈利数据，用于图表线条）
        const currentMonthProfitData = dailyData.filter((item: any) => 
          item.date >= '2025-09-01' && item.date <= '2025-09-30' && item.daily_profit > 0
        );
        
        const currentMonthProfitAverage = currentMonthProfitData.length > 0 
          ? currentMonthProfitData.reduce((sum: number, item: any) => sum + item.daily_profit, 0) / currentMonthProfitData.length
          : 1800;
        
        console.log(`当月每日盈利平均值: ${currentMonthProfitAverage}`);
        console.log(`当月每日利润汇总平均值: ${currentMonthSummaryAverage}`);
        
        // 生成图表数据（当月vs上月对比）
        const chartData: DailyDataItem[] = [];
        
        // 获取当月每日数据
        const currentMonth = 9; // 9月
        const daysInMonth = 30; // 9月有30天
        
        for (let day = 1; day <= daysInMonth; day++) {
          const currentDate = `2025-09-${String(day).padStart(2, '0')}`;
          const lastMonthDate = `2025-08-${String(day).padStart(2, '0')}`;
          
          const currentDayRecord = dailyData.find((item: any) => item.date === currentDate);
          const lastMonthRecord = dailyData.find((item: any) => item.date === lastMonthDate);
          
          // 调试信息
          if (day <= 3) {
            console.log(`${day}日数据:`, {
              currentDate,
              lastMonthDate,
              daily_profit_current: currentDayRecord?.daily_profit || 0,
              daily_profit_last: lastMonthRecord?.daily_profit || 0,
              profit_summary_current: currentDayRecord?.profit_summary || 0,
              profit_summary_last: lastMonthRecord?.profit_summary || 0,
              使用的线条数据: currentDayRecord?.daily_profit || 0
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
      const currentMonthRecord = monthData.find((item: any) => item.month === '2025-09');

      setData({
        dailyData: combinedDailyData,
        monthData: monthData.map((item: any) => ({
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
        }
      });

    } catch (error) {
      console.error('获取数据失败:', error);
      message.error('获取数据失败，请检查网络连接或稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 刷新数据
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // 执行数据同步
  const handleSync = async (type: 'daily' | 'monthly' | 'all') => {
    setSyncing(true);
    setSyncProgress(0);
    
    try {
      const progressInterval = setInterval(() => {
        setSyncProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      const response = await fetch(`/api/sync?type=${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      clearInterval(progressInterval);
      setSyncProgress(100);
      
      const result = await response.json();
      
      if (result.success) {
        message.success('数据同步成功');
        setLastSyncTime(new Date().toLocaleString('zh-CN'));
        // 同步成功后刷新数据
        await fetchData();
      } else {
        message.error(`同步失败: ${result.error}`);
      }
    } catch (error) {
      message.error('同步失败，请稍后重试');
      console.error('同步错误:', error);
    } finally {
      setSyncing(false);
      setSyncProgress(0);
    }
  };

  // 自动同步功能
  useEffect(() => {
    // 每3小时自动同步一次
    const autoSyncInterval = setInterval(() => {
      console.log('执行自动同步...');
      handleSync('all');
    }, 3 * 60 * 60 * 1000); // 3小时 = 3 * 60 * 60 * 1000毫秒

    // 组件卸载时清除定时器
    return () => clearInterval(autoSyncInterval);
  }, []);

  // 检查上次同步时间
  useEffect(() => {
    const checkLastSync = async () => {
      try {
        const response = await fetch('/api/sync?action=validate');
        const result = await response.json();
        if (result.success && result.data) {
          // 这里可以设置上次同步时间
          setLastSyncTime('自动获取中...');
        }
      } catch (error) {
        console.log('获取同步状态失败:', error);
      }
    };
    
    checkLastSync();
  }, []);

  // 移除时间范围处理函数

  useEffect(() => {
    fetchData();
  }, []);

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
    <div style={{ background: '#f0f2f5', minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* 页面标题区域 */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '600', color: 'rgba(0,0,0,0.85)', marginBottom: '8px' }}>
                抖音电商
                {/* 隐藏式同步入口 */}
                <SettingOutlined 
                  style={{ 
                    marginLeft: '12px', 
                    fontSize: '16px', 
                    color: 'rgba(0,0,0,0.25)', 
                    cursor: 'pointer',
                    transition: 'color 0.3s'
                  }}
                  onClick={() => setSyncModalVisible(true)}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(0,0,0,0.65)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(0,0,0,0.25)'}
                  title="数据同步管理"
                />
              </h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: 'rgba(0,0,0,0.45)', fontSize: '12px' }}>
                数据更新: {new Date().toLocaleString('zh-CN')}
              </span>
            </div>
          </div>
        </div>

        {/* 核心指标卡片区域 - 所有卡片在一行，统一高度 */}
        <Row gutter={[12, 16]} style={{ marginBottom: '24px', display: 'flex', alignItems: 'stretch' }}>
          {/* 大卡片1 - 月度每日利润汇总 */}
          <Col span={6} style={{ display: 'flex' }}>
            <StatisticCard
              style={{ width: '100%', minHeight: '120px' }}
              title="月度每日利润汇总"
              tooltip="当月每日利润汇总金额"
              statistic={{
                value: data.overviewData.dailyProfitSum || 0,
                valueStyle: { color: '#3f8600', fontSize: '24px' },
                formatter: (value) => formatCurrency(Number(value)),
                trend: data.overviewData.lastMonthDailyProfitSum ? 
                  (data.overviewData.dailyProfitSum || 0) > (data.overviewData.lastMonthDailyProfitSum || 0) ? 'up' : 'down' : undefined,
              }}
              chart={
                <div style={{ height: '40px', display: 'flex', alignItems: 'center', fontSize: '12px', color: 'rgba(0,0,0,0.45)' }}>
                  {data.overviewData.lastMonthDailyProfitSum && (
                    <>
                      <span>较上月</span>
                      <span style={{ 
                        color: (data.overviewData.dailyProfitSum || 0) > (data.overviewData.lastMonthDailyProfitSum || 0) ? '#3f8600' : '#cf1322',
                        marginLeft: '4px'
                      }}>
                        {calculatePercent(data.overviewData.dailyProfitSum || 0, data.overviewData.lastMonthDailyProfitSum || 0)}%
                      </span>
                    </>
                  )}
                </div>
              }
            />
          </Col>
          
          {/* 大卡片2 - 月净利润 */}
          <Col span={6} style={{ display: 'flex' }}>
            <StatisticCard
              style={{ width: '100%', minHeight: '120px' }}
              title="月净利润"
              tooltip="当月净利润金额"
              statistic={{
                value: data.overviewData.monthProfit || 0,
                valueStyle: { color: '#1890ff', fontSize: '24px' },
                formatter: (value) => formatCurrency(Number(value)),
                trend: data.overviewData.lastMonthProfit ? 
                  (data.overviewData.monthProfit || 0) > (data.overviewData.lastMonthProfit || 0) ? 'up' : 'down' : undefined,
              }}
              chart={
                <div style={{ height: '40px', display: 'flex', alignItems: 'center', fontSize: '12px', color: 'rgba(0,0,0,0.45)' }}>
                  {data.overviewData.lastMonthProfit && (
                    <>
                      <span>较上月</span>
                      <span style={{ 
                        color: (data.overviewData.monthProfit || 0) > (data.overviewData.lastMonthProfit || 0) ? '#3f8600' : '#cf1322',
                        marginLeft: '4px'
                      }}>
                        {calculatePercent(data.overviewData.monthProfit || 0, data.overviewData.lastMonthProfit || 0)}%
                      </span>
                    </>
                  )}
                </div>
              }
            />
          </Col>
          
          {/* 小卡片1 - 硬性支出 */}
          <Col span={4} style={{ display: 'flex' }}>
            <StatisticCard
              style={{ width: '100%', minHeight: '120px' }}
              title="硬性支出"
              tooltip="当月硬性支出金额"
              statistic={{
                value: data.overviewData.hardExpense || 0,
                valueStyle: { color: '#722ed1', fontSize: '18px' },
                formatter: (value) => formatCurrency(Number(value)),
              }}
              chart={
                <div style={{ height: '40px', display: 'flex', alignItems: 'center', fontSize: '11px', color: 'rgba(0,0,0,0.45)' }}>
                  <span>固定支出</span>
                </div>
              }
            />
          </Col>
          
          {/* 小卡片2 - 千川投流 */}
          <Col span={4} style={{ display: 'flex' }}>
            <StatisticCard
              style={{ width: '100%', minHeight: '120px' }}
              title="千川投流"
              tooltip="当月千川投流金额"
              statistic={{
                value: data.overviewData.qianchuan || 0,
                valueStyle: { color: '#52c41a', fontSize: '18px' },
                formatter: (value) => formatCurrency(Number(value)),
              }}
              chart={
                <div style={{ height: '40px', display: 'flex', alignItems: 'center', fontSize: '11px', color: 'rgba(0,0,0,0.45)' }}>
                  <span>投流支出</span>
                </div>
              }
            />
          </Col>
          
          {/* 小卡片3 - 当月赔付申请 */}
          <Col span={4} style={{ display: 'flex' }}>
            <StatisticCard
              style={{ width: '100%', minHeight: '120px' }}
              title="当月赔付申请"
              tooltip="当月总赔付申请金额"
              statistic={{
                value: data.overviewData.monthClaimAmount || 0,
                valueStyle: { color: '#fa8c16', fontSize: '18px' },
                formatter: (value) => formatCurrency(Number(value)),
                trend: data.overviewData.lastMonthClaimAmount ? 
                  (data.overviewData.monthClaimAmount || 0) > (data.overviewData.lastMonthClaimAmount || 0) ? 'up' : 'down' : undefined,
              }}
              chart={
                <div style={{ height: '40px', display: 'flex', alignItems: 'center', fontSize: '11px', color: 'rgba(0,0,0,0.45)' }}>
                  {data.overviewData.lastMonthClaimAmount && (
                    <>
                      <span>较上月</span>
                      <span style={{ 
                        color: (data.overviewData.monthClaimAmount || 0) > (data.overviewData.lastMonthClaimAmount || 0) ? '#cf1322' : '#3f8600',
                        marginLeft: '4px'
                      }}>
                        {calculatePercent(data.overviewData.monthClaimAmount || 0, data.overviewData.lastMonthClaimAmount || 0)}%
                      </span>
                    </>
                  )}
                </div>
              }
            />
          </Col>
        </Row>

        {/* 累计数据区域 */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col span={12}>
            <StatisticCard
              style={{ width: '100%', minHeight: '100px' }}
              title="含保证金利润"
              tooltip="累计含保证金利润总额"
              statistic={{
                value: data.overviewData.profitWithDeposit || 0,
                valueStyle: { color: '#722ed1', fontSize: '20px' },
                formatter: (value) => formatCurrency(Number(value)),
              }}
              chart={
                <div style={{ height: '30px', display: 'flex', alignItems: 'center', fontSize: '11px', color: 'rgba(0,0,0,0.45)' }}>
                  <span>累计总额</span>
                </div>
              }
            />
          </Col>
          <Col span={12}>
            <StatisticCard
              style={{ width: '100%', minHeight: '100px' }}
              title="不含保证金利润"
              tooltip="累计不含保证金利润总额"
              statistic={{
                value: data.overviewData.profitWithoutDeposit || 0,
                valueStyle: { color: '#13c2c2', fontSize: '20px' },
                formatter: (value) => formatCurrency(Number(value)),
              }}
              chart={
                <div style={{ height: '30px', display: 'flex', alignItems: 'center', fontSize: '11px', color: 'rgba(0,0,0,0.45)' }}>
                  <span>累计总额</span>
                </div>
              }
            />
          </Col>
        </Row>

        {/* 主要图表区域 */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24}>
            <ProCard title="当月日盈利趋势对比" headerBordered>
              <DailyProfitChart data={data.dailyData} loading={loading} />
            </ProCard>
          </Col>
        </Row>


        {/* 隐藏式同步管理Modal */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SyncOutlined />
              数据同步管理
            </div>
          }
          open={syncModalVisible}
          onCancel={() => setSyncModalVisible(false)}
          footer={null}
          width={600}
        >
          <div style={{ padding: '16px 0' }}>
            {/* 同步状态显示 */}
            <div style={{ marginBottom: '24px' }}>
              <h4>同步状态</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>上次同步时间:</span>
                <span style={{ color: '#1890ff' }}>{lastSyncTime || '未知'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>自动同步:</span>
                <span style={{ color: '#52c41a' }}>每3小时执行</span>
              </div>
            </div>

            {/* 同步进度 */}
            {syncing && (
              <div style={{ marginBottom: '24px' }}>
                <h4>同步进度</h4>
                <Progress 
                  percent={syncProgress} 
                  status="active"
                  strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                />
              </div>
            )}

            {/* 同步操作按钮 */}
            <div>
              <h4>手动同步</h4>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <Button 
                  type="primary"
                  icon={<SyncOutlined />}
                  onClick={() => handleSync('all')}
                  loading={syncing}
                  size="middle"
                  style={{ height: '36px' }}
                >
                  完整同步
                </Button>
                <Button 
                  icon={<SyncOutlined />}
                  onClick={() => handleSync('daily')}
                  loading={syncing}
                  size="middle"
                  style={{ height: '36px' }}
                >
                  同步每日数据
                </Button>
                <Button 
                  icon={<SyncOutlined />}
                  onClick={() => handleSync('monthly')}
                  loading={syncing}
                  size="middle"
                  style={{ height: '36px' }}
                >
                  同步月度数据
                </Button>
                <Button 
                  href="/sync"
                  target="_blank"
                  size="middle"
                  style={{ height: '36px' }}
                >
                  高级管理
                </Button>
              </div>
            </div>

            <div style={{ marginTop: '24px', padding: '12px', backgroundColor: '#f6f8fa', borderRadius: '6px' }}>
              <p style={{ margin: 0, fontSize: '12px', color: 'rgba(0,0,0,0.45)' }}>
                💡 <strong>提示:</strong> 系统每3小时自动同步一次数据，确保数据保持最新。
                如需立即更新，可点击"完整同步"按钮。
              </p>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}