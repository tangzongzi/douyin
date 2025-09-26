'use client';

import { useState, useEffect, useCallback } from 'react';
import { Spin, Row, Col, Table, Select, Button, Radio, Space, Typography } from 'antd';
import { ProCard } from '@ant-design/pro-components';
import { FileTextOutlined, DownloadOutlined, PrinterOutlined, BarChartOutlined, TableOutlined } from '@ant-design/icons';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

// 复用现有接口
interface MonthlyReportData {
  month: string;
  daily_profit_sum: number;
  month_profit: number;
  net_cashflow: number;
  claim_amount_sum: number;
  pdd_service_fee: number;
  douyin_service_fee: number;
  payment_expense_sum: number;
  other_expense_sum: number;
  shipping_insurance: number;
  hard_expense: number;
  qianchuan: number;
  deposit: number;
  initial_fund: number;
}

interface ReportState {
  currentMonth: MonthlyReportData | null;
  lastMonth: MonthlyReportData | null;
  historicalData: MonthlyReportData[];
  loading: boolean;
  selectedMonth: string;
}

export default function MonthlyReportsPage() {
  const [reportData, setReportData] = useState<ReportState>({
    currentMonth: null,
    lastMonth: null,
    historicalData: [],
    loading: true,
    selectedMonth: '2025-09'
  });
  
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  // 复用现有的数据获取模式
  const fetchReportData = useCallback(async () => {
    try {
      setReportData(prev => ({ ...prev, loading: true }));
      
      // 复用现有API
      const response = await fetch('/api/data?type=monthly&limit=12');
      const result = await response.json();
      
      if (result.success) {
        const monthlyData = result.data || [];
        const current = monthlyData.find((item: MonthlyReportData) => item.month === reportData.selectedMonth);
        const last = monthlyData.find((item: MonthlyReportData) => 
          item.month === dayjs(reportData.selectedMonth).subtract(1, 'month').format('YYYY-MM')
        );
        
        setReportData(prev => ({
          ...prev,
          currentMonth: current || null,
          lastMonth: last || null,
          historicalData: monthlyData.slice(0, 6),
          loading: false
        }));
      }
    } catch (error) {
      console.error('获取报表数据失败:', error);
      setReportData(prev => ({ ...prev, loading: false }));
    }
  }, [reportData.selectedMonth]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // 格式化货币
  const formatCurrency = (value: number) => `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
  
  // 计算增长率
  const calculateGrowthRate = (current: number, previous: number) => {
    if (!previous) return current > 0 ? '+∞' : '0.0%';
    const rate = ((current - previous) / Math.abs(previous) * 100).toFixed(1);
    return `${rate > 0 ? '+' : ''}${rate}%`;
  };

  // 获取增长率颜色
  const getGrowthColor = (rate: string) => {
    if (rate.includes('+')) return '#52c41a';
    if (rate.includes('-')) return '#ff4d4f';
    return 'rgba(0,0,0,0.65)';
  };

  if (reportData.loading) {
    return (
      <div style={{ 
        background: 'linear-gradient(180deg, #f0f2f5 0%, #f5f7fa 100%)', 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  const { currentMonth, lastMonth, historicalData } = reportData;

  // 收入数据表格 - 只保留净利润
  const incomeData = currentMonth ? [
    {
      key: '1', 
      item: '月净利润',
      currentAmount: currentMonth.month_profit,
      lastAmount: lastMonth?.month_profit || 0,
      category: '核心收入'
    }
  ] : [];

  // 支出数据表格
  const expenseData = currentMonth ? [
    {
      key: '1',
      item: '总货款支出',
      currentAmount: Math.abs(currentMonth.payment_expense_sum),
      lastAmount: Math.abs(lastMonth?.payment_expense_sum || 0),
      category: '主要支出'
    },
    {
      key: '2',
      item: '千川投流',
      currentAmount: Math.abs(currentMonth.qianchuan),
      lastAmount: Math.abs(lastMonth?.qianchuan || 0),
      category: '营销支出'
    },
    {
      key: '3',
      item: '硬性支出',
      currentAmount: Math.abs(currentMonth.hard_expense),
      lastAmount: Math.abs(lastMonth?.hard_expense || 0),
      category: '固定支出'
    },
    {
      key: '4',
      item: '总其他支出',
      currentAmount: Math.abs(currentMonth.other_expense_sum),
      lastAmount: Math.abs(lastMonth?.other_expense_sum || 0),
      category: '其他支出'
    },
    {
      key: '5',
      item: '拼多多技术服务费',
      currentAmount: Math.abs(currentMonth.pdd_service_fee),
      lastAmount: Math.abs(lastMonth?.pdd_service_fee || 0),
      category: '平台费用'
    },
    {
      key: '6',
      item: '抖音技术服务费',
      currentAmount: Math.abs(currentMonth.douyin_service_fee || 0),
      lastAmount: Math.abs(lastMonth?.douyin_service_fee || 0),
      category: '平台费用'
    },
    {
      key: '7',
      item: '运费保险',
      currentAmount: Math.abs(currentMonth.shipping_insurance),
      lastAmount: Math.abs(lastMonth?.shipping_insurance || 0),
      category: '保险费用'
    },
    {
      key: '8',
      item: '店铺保证金',
      currentAmount: Math.abs(currentMonth.deposit),
      lastAmount: Math.abs(lastMonth?.deposit || 0),
      category: '资金占用'
    }
  ] : [];

  // 表格列定义 - Ant Design Pro标准，确保对齐
  const incomeColumns = [
    {
      title: '收入项目',
      dataIndex: 'item',
      key: 'item',
      width: 200,
      render: (text: string) => <Text strong style={{ fontSize: '14px' }}>{text}</Text>
    },
    {
      title: '本月金额(元)',
      dataIndex: 'currentAmount',
      key: 'current',
      width: 150,
      align: 'right' as const,
      render: (value: number) => (
        <div className="amount-cell" style={{ textAlign: 'right' }}>
          {formatCurrency(value)}
        </div>
      )
    },
    {
      title: '上月金额(元)',
      dataIndex: 'lastAmount', 
      key: 'last',
      width: 150,
      align: 'right' as const,
      render: (value: number) => (
        <div style={{ textAlign: 'right' }}>
          <span style={{ color: 'rgba(0,0,0,0.65)' }}>
            {formatCurrency(value)}
          </span>
        </div>
      )
    },
    {
      title: '增长率',
      key: 'growth',
      width: 100,
      align: 'right' as const,
      render: (_: any, record: any) => {
        const rate = calculateGrowthRate(record.currentAmount, record.lastAmount);
        return (
          <div style={{ textAlign: 'right' }}>
            <span className={
              rate.includes('+') ? 'growth-positive' : 
              rate.includes('-') ? 'growth-negative' : 'growth-neutral'
            }>
              {rate}
            </span>
          </div>
        );
      }
    }
  ];

  const expenseColumns = [
    {
      title: '支出项目',
      dataIndex: 'item',
      key: 'item', 
      width: 200,
      render: (text: string) => <Text strong style={{ fontSize: '14px' }}>{text}</Text>
    },
    {
      title: '本月金额(元)',
      dataIndex: 'currentAmount',
      key: 'current',
      width: 150,
      align: 'right' as const,
      render: (value: number) => (
        <div className="amount-cell" style={{ textAlign: 'right' }}>
          {formatCurrency(value)}
        </div>
      )
    },
    {
      title: '上月金额(元)',
      dataIndex: 'lastAmount',
      key: 'last', 
      width: 150,
      align: 'right' as const,
      render: (value: number) => (
        <div style={{ textAlign: 'right' }}>
          <span style={{ color: 'rgba(0,0,0,0.65)' }}>
            {formatCurrency(value)}
          </span>
        </div>
      )
    },
    {
      title: '变动率',
      key: 'change',
      width: 100,
      align: 'right' as const,
      render: (_: any, record: any) => {
        const rate = calculateGrowthRate(record.currentAmount, record.lastAmount);
        return (
          <div style={{ textAlign: 'right' }}>
            <span className={
              rate.includes('+') ? 'growth-positive' : 
              rate.includes('-') ? 'growth-negative' : 'growth-neutral'
            }>
              {rate}
            </span>
          </div>
        );
      }
    }
  ];

  // 历史对比数据 - 调整列顺序
  const historicalColumns = [
    { 
      title: '月份', 
      dataIndex: 'month', 
      key: 'month', 
      width: 120,
      render: (text: string) => <Text strong style={{ fontSize: '14px' }}>{text}</Text>
    },
    { 
      title: '净利润(元)', 
      dataIndex: 'month_profit', 
      key: 'profit',
      width: 180,
      align: 'right' as const,
      render: (value: number) => (
        <div className="primary-amount" style={{ textAlign: 'right' }}>
          {formatCurrency(value)}
        </div>
      )
    },
    { 
      title: '累计净利润(元)', 
      key: 'cumulative',
      width: 180,
      align: 'right' as const,
      render: (_: any, record: MonthlyReportData, index: number) => {
        // 计算从4月到当前月的累计净利润
        const cumulative = historicalData.slice(index).reduce((sum, item) => sum + item.month_profit, 0);
        return (
          <div className="cumulative-amount" style={{ textAlign: 'right' }}>
            {formatCurrency(cumulative)}
          </div>
        );
      }
    },
    { 
      title: '环比增长', 
      key: 'monthGrowth',
      width: 120,
      align: 'right' as const,
      render: (_: any, record: MonthlyReportData, index: number) => {
        if (index === historicalData.length - 1) return '-'; // 最早月份无对比
        const prevRecord = historicalData[index + 1];
        const rate = calculateGrowthRate(record.month_profit, prevRecord?.month_profit || 0);
        return (
          <div style={{ textAlign: 'right' }}>
            <span className={
              rate.includes('+') ? 'growth-positive' : 
              rate.includes('-') ? 'growth-negative' : 'growth-neutral'
            }>
              {rate}
            </span>
          </div>
        );
      }
    }
  ];

  return (
    <>
      {/* 复用现有页面的全局样式 */}
      <style jsx global>{`
        .reports-table .ant-table-thead > tr > th {
          background: #fafafa;
          font-weight: 500;
          color: rgba(0,0,0,0.75);
          font-size: 13px;
        }
        
        .reports-table .ant-table-tbody > tr > td {
          color: rgba(0,0,0,0.85);
          font-weight: 400;
          font-size: 14px;
          padding: 12px 16px;
        }
        
        .reports-table .ant-table-tbody > tr:hover > td {
          background: #f9f9f9;
        }
        
        .reports-table .ant-table-tbody > tr > td .ant-typography {
          color: rgba(0,0,0,0.85);
          font-weight: 400;
        }
        
        /* 主要数据突出 */
        .reports-table .primary-amount {
          font-weight: 500;
          color: rgba(0,0,0,0.88);
        }
        
        /* 累计数据柔和显示 */
        .reports-table .cumulative-amount {
          color: rgba(0,0,0,0.65);
          font-weight: 400;
        }
        
        /* 金额数字特殊样式 */
        .reports-table .amount-cell {
          font-variant-numeric: tabular-nums;
          letter-spacing: 0.3px;
        }
        
        /* 增长率颜色优化 - 更柔和 */
        .growth-positive { color: #389e0d !important; font-weight: 500; }
        .growth-negative { color: #cf1322 !important; font-weight: 500; }
        .growth-neutral { color: rgba(0,0,0,0.65) !important; }
        
        @media print {
          .no-print { display: none; }
          .reports-container { 
            background: white !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* 复用现有页面的背景和容器样式 */}
      <div style={{ 
        background: 'linear-gradient(180deg, #f0f2f5 0%, #f5f7fa 100%)', 
        minHeight: '100vh', 
        padding: '24px 24px 48px 24px' 
      }}>
        <div className="reports-container" style={{ 
          maxWidth: '1400px', 
          margin: '0 auto'
        }}>
          
          {/* 报表头部 - 复用现有标题区域样式 */}
          <div style={{ 
            marginBottom: '32px',
            padding: '24px 32px',
            background: 'rgba(255,255,255,0.9)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.4)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Title level={2} style={{ 
                  margin: 0, 
                  color: 'rgba(0,0,0,0.88)',
                  fontSize: '28px',
                  fontWeight: '700'
                }}>
                  <FileTextOutlined style={{ marginRight: '12px', color: '#1890ff' }} />
                  月度经营数据报表
                </Title>
                <Text style={{ 
                  color: 'rgba(0,0,0,0.55)',
                  fontSize: '14px'
                }}>
                  基于净利润的完整经营数据分析 · 数据来源：飞书多维表格
                </Text>
              </div>
              
              {/* 控制区域 - 添加视图切换 */}
              <Space size="large" className="no-print">
                {/* 视图切换器 - 主要功能 */}
                <div style={{ 
                  padding: '4px',
                  background: 'rgba(0,0,0,0.04)',
                  borderRadius: '6px',
                  border: '1px solid rgba(0,0,0,0.06)'
                }}>
                  <Radio.Group 
                    value={viewMode} 
                    onChange={(e) => setViewMode(e.target.value)}
                    size="small"
                    buttonStyle="solid"
                  >
                    <Radio.Button value="table">
                      <TableOutlined style={{ marginRight: '4px' }} />
                      表格视图
                    </Radio.Button>
                    <Radio.Button value="chart">
                      <BarChartOutlined style={{ marginRight: '4px' }} />
                      图表视图
                    </Radio.Button>
                  </Radio.Group>
                </div>
                
                {/* 月份选择 */}
                <Select
                  value={reportData.selectedMonth}
                  onChange={(value) => setReportData(prev => ({ ...prev, selectedMonth: value }))}
                  style={{ width: 120 }}
                  size="small"
                >
                  <Option value="2025-09">2025年09月</Option>
                  <Option value="2025-08">2025年08月</Option>
                  <Option value="2025-07">2025年07月</Option>
                  <Option value="2025-06">2025年06月</Option>
                  <Option value="2025-05">2025年05月</Option>
                  <Option value="2025-04">2025年04月</Option>
                </Select>
                
                {/* 操作按钮 */}
                <Space size="small">
                  <Button icon={<DownloadOutlined />} type="primary" size="small">导出</Button>
                  <Button icon={<PrinterOutlined />} size="small" onClick={() => window.print()}>打印</Button>
                </Space>
              </Space>
            </div>
          </div>

          {/* 页面导航 - 中心位置，与首页保持一致 */}
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
              <a 
                href="/" 
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
                首页
              </a>
              <div style={{
                padding: '8px 24px',
                borderRadius: '6px',
                background: '#1890ff',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 2px 4px rgba(24,144,255,0.3)'
              }}>
                月度报表
              </div>
            </div>
          </div>

          {/* 报表基本信息 */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col span={24}>
              <ProCard>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  padding: '16px 0',
                  borderBottom: '1px solid #f0f0f0',
                  marginBottom: '16px'
                }}>
                  <div>
                    <Text strong style={{ fontSize: '16px' }}>
                      报表期间：{dayjs(reportData.selectedMonth).format('YYYY年MM月DD日')} - {dayjs(reportData.selectedMonth).endOf('month').format('YYYY年MM月DD日')}
                    </Text>
                  </div>
                  <div>
                    <Text type="secondary">
                      生成时间：{dayjs().format('YYYY年MM月DD日 HH:mm:ss')}
                    </Text>
                  </div>
                </div>
              </ProCard>
            </Col>
          </Row>

          {/* 视图切换渲染 */}
          {viewMode === 'table' ? (
            <>
              {/* 收入数据表格 */}
              <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col span={24}>
                  <ProCard 
                    title={
                      <span style={{ fontSize: '16px', fontWeight: '600' }}>
                        收入情况分析
                      </span>
                    }
                    headerBordered
                  >
                    <Table
                      className="reports-table"
                      dataSource={incomeData}
                      columns={incomeColumns}
                      pagination={false}
                      size="middle"
                    />
                  </ProCard>
                </Col>
              </Row>

              {/* 支出数据表格 */}
              <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col span={24}>
                  <ProCard 
                    title={
                      <span style={{ fontSize: '16px', fontWeight: '600' }}>
                        支出情况分析
                      </span>
                    }
                    headerBordered
                  >
                    <Table
                      className="reports-table"
                      dataSource={expenseData}
                      columns={expenseColumns}
                      pagination={false}
                      size="middle"
                    />
                  </ProCard>
                </Col>
              </Row>

               {/* 历史对比表格 */}
               <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                 <Col span={24}>
                   <ProCard 
                     title={
                       <span style={{ fontSize: '16px', fontWeight: '600' }}>
                         最近6个月历史对比
                       </span>
                     }
                     headerBordered
                   >
                     <Table
                       className="reports-table"
                       dataSource={historicalData}
                       columns={historicalColumns}
                       pagination={false}
                       size="middle"
                     />
                   </ProCard>
                 </Col>
               </Row>

               {/* 赔付金额明细表格 */}
               <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                 <Col span={24}>
                   <ProCard 
                     title={
                       <span style={{ fontSize: '16px', fontWeight: '600' }}>
                         赔付金额明细 (按月排序)
                       </span>
                     }
                     headerBordered
                   >
                     <Table
                       className="reports-table"
                       dataSource={historicalData
                         .map(item => ({
                           key: item.month,
                           month: item.month,
                           claimAmount: item.claim_amount_sum
                         }))
                         .sort((a, b) => b.claimAmount - a.claimAmount) // 按金额大到小排序
                       }
                       columns={[
                         { 
                           title: '月份', 
                           dataIndex: 'month', 
                           key: 'month',
                           width: 200,
                           render: (text: string) => <Text strong style={{ fontSize: '14px' }}>{text}</Text>
                         },
                         { 
                           title: '赔付金额(元)', 
                           dataIndex: 'claimAmount', 
                           key: 'claim',
                           width: 200,
                           align: 'right' as const,
                           render: (value: number) => (
                             <div className="amount-cell" style={{ textAlign: 'right' }}>
                               {formatCurrency(value)}
                             </div>
                           )
                         }
                       ]}
                       pagination={false}
                       size="middle"
                     />
                   </ProCard>
                 </Col>
               </Row>
             </>
           ) : (
            <>
              {/* 图表视图 */}
              <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                {/* 净利润趋势图 */}
                <Col span={16}>
                  <ProCard 
                    title="净利润趋势分析"
                    headerBordered
                    style={{ height: '400px' }}
                  >
                     <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={historicalData.slice().reverse()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="month" 
                          tick={{ fontSize: 12, fill: 'rgba(0,0,0,0.65)' }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          tick={{ fontSize: 12, fill: 'rgba(0,0,0,0.65)' }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip 
                          formatter={(value: number) => [formatCurrency(value), '净利润']}
                          labelStyle={{ color: 'rgba(0,0,0,0.85)' }}
                          contentStyle={{ 
                            background: '#fff',
                            border: '1px solid #d9d9d9',
                            borderRadius: '4px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          }}
                          cursor={false}
                        />
                        <Bar 
                          dataKey="month_profit" 
                          fill="#1890ff"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ProCard>
                </Col>
                
                {/* 支出结构饼图 */}
                <Col span={8}>
                  <ProCard 
                    title="本月支出结构"
                    headerBordered
                    style={{ height: '400px' }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                         <Pie
                           data={[
                             { name: '千川投流', value: Math.abs(currentMonth?.qianchuan || 0), color: '#1890ff' },
                             { name: '硬性支出', value: Math.abs(currentMonth?.hard_expense || 0), color: '#52c41a' },
                             { name: '其他支出', value: Math.abs(currentMonth?.other_expense_sum || 0), color: '#fa8c16' },
                             { name: '保证金', value: Math.abs(currentMonth?.deposit || 0), color: '#722ed1' },
                             { name: '技术服务费', value: Math.abs(currentMonth?.pdd_service_fee || 0) + Math.abs(currentMonth?.douyin_service_fee || 0), color: '#eb2f96' }
                           ].filter(item => item.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                         >
                           {[
                             { name: '千川投流', value: Math.abs(currentMonth?.qianchuan || 0), color: '#1890ff' },
                             { name: '硬性支出', value: Math.abs(currentMonth?.hard_expense || 0), color: '#52c41a' },
                             { name: '其他支出', value: Math.abs(currentMonth?.other_expense_sum || 0), color: '#fa8c16' },
                             { name: '保证金', value: Math.abs(currentMonth?.deposit || 0), color: '#722ed1' },
                             { name: '技术服务费', value: Math.abs(currentMonth?.pdd_service_fee || 0) + Math.abs(currentMonth?.douyin_service_fee || 0), color: '#eb2f96' }
                           ].filter(item => item.value > 0).map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.color} />
                           ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{ 
                            background: '#fff',
                            border: '1px solid #d9d9d9',
                            borderRadius: '4px'
                          }}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          wrapperStyle={{ fontSize: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </ProCard>
                </Col>
              </Row>

              {/* 收入vs支出对比图 */}
              <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col span={24}>
                   <ProCard 
                     title="收入与运营支出对比分析"
                     headerBordered
                     style={{ height: '300px' }}
                     extra={
                       <div style={{ 
                         fontSize: '12px', 
                         color: 'rgba(0,0,0,0.45)',
                         fontWeight: '400'
                       }}>
                         运营支出 = 千川投流 + 硬性支出 + 其他支出 + 保证金 + 技术服务费
                       </div>
                     }
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={historicalData.slice().reverse().map(item => ({
                          month: item.month,
                          收入: item.month_profit,
                          运营支出: Math.abs(item.qianchuan) + Math.abs(item.hard_expense) + 
                                  Math.abs(item.other_expense_sum) + Math.abs(item.deposit) +
                                  Math.abs(item.pdd_service_fee) + Math.abs(item.douyin_service_fee || 0),
                          净利润: item.month_profit
                        }))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="month"
                          tick={{ fontSize: 12, fill: 'rgba(0,0,0,0.65)' }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          tick={{ fontSize: 12, fill: 'rgba(0,0,0,0.65)' }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip 
                          formatter={(value: number, name: string) => [formatCurrency(value), name]}
                          contentStyle={{ 
                            background: '#fff',
                            border: '1px solid #d9d9d9',
                            borderRadius: '4px'
                          }}
                          cursor={false}
                        />
                        <Legend />
                        <Bar dataKey="收入" fill="#1890ff" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="运营支出" fill="#ff4d4f" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ProCard>
                </Col>
              </Row>

              {/* 赔付金额图表 */}
              <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col span={24}>
                  <ProCard 
                    title="赔付金额趋势 (按月排序)"
                    headerBordered
                    style={{ height: '300px' }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={historicalData.slice().reverse().map(item => ({
                          month: item.month,
                          赔付金额: item.claim_amount_sum
                        }))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="month"
                          tick={{ fontSize: 12, fill: 'rgba(0,0,0,0.65)' }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          tick={{ fontSize: 12, fill: 'rgba(0,0,0,0.65)' }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip 
                          formatter={(value: number) => [formatCurrency(value), '赔付金额']}
                          contentStyle={{ 
                            background: '#fff',
                            border: '1px solid #d9d9d9',
                            borderRadius: '4px'
                          }}
                          cursor={false}
                        />
                        <Bar 
                          dataKey="赔付金额" 
                          fill="#fa8c16"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ProCard>
                </Col>
              </Row>
            </>
          )}

          {/* 经营分析建议 */}
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <ProCard 
                title={
                  <span style={{ fontSize: '16px', fontWeight: '600' }}>
                    经营分析与决策建议
                  </span>
                }
                headerBordered
              >
                {currentMonth && lastMonth && (
                  <div style={{ padding: '16px 0' }}>
                    {/* 自动生成的分析建议 */}
                    <div style={{ marginBottom: '16px' }}>
                      <Text strong style={{ color: '#ff4d4f', fontSize: '14px' }}>
                        关键风险：
                      </Text>
                      <div style={{ marginLeft: '20px', marginTop: '8px' }}>
                        {currentMonth.month_profit < lastMonth.month_profit && (
                          <div style={{ marginBottom: '4px' }}>
                            净利润环比下降{Math.abs(((currentMonth.month_profit - lastMonth.month_profit) / lastMonth.month_profit * 100)).toFixed(1)}%，需要立即关注
                          </div>
                        )}
                        {currentMonth.qianchuan > 0 && (currentMonth.month_profit / Math.abs(currentMonth.qianchuan)) < 1.5 && (
                          <div style={{ marginBottom: '4px' }}>
                            千川投流ROI仅{(currentMonth.month_profit / Math.abs(currentMonth.qianchuan)).toFixed(2)}，投入产出比过低
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <Text strong style={{ color: '#fa8c16', fontSize: '14px' }}>
                        重点关注：
                      </Text>
                      <div style={{ marginLeft: '20px', marginTop: '8px' }}>
                        {currentMonth.hard_expense > lastMonth.hard_expense && (
                          <div style={{ marginBottom: '4px' }}>
                            硬性支出增长{((Math.abs(currentMonth.hard_expense) / Math.abs(lastMonth.hard_expense) - 1) * 100).toFixed(1)}%，需要成本控制
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <Text strong style={{ color: '#52c41a', fontSize: '14px' }}>
                        积极因素：
                      </Text>
                      <div style={{ marginLeft: '20px', marginTop: '8px' }}>
                        {currentMonth.claim_amount_sum < lastMonth.claim_amount_sum && (
                          <div style={{ marginBottom: '4px' }}>
                            赔付申请金额减少{Math.abs(((currentMonth.claim_amount_sum - lastMonth.claim_amount_sum) / lastMonth.claim_amount_sum * 100)).toFixed(1)}%，风险控制改善
                          </div>
                        )}
                        {Math.abs(currentMonth.deposit) < Math.abs(lastMonth.deposit) && (
                          <div style={{ marginBottom: '4px' }}>
                            保证金占用减少{Math.abs(((Math.abs(currentMonth.deposit) - Math.abs(lastMonth.deposit)) / Math.abs(lastMonth.deposit) * 100)).toFixed(1)}%，资金效率提升
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </ProCard>
            </Col>
          </Row>

          {/* 报表页脚 */}
          <div style={{ 
            marginTop: '32px',
            padding: '16px 24px',
            background: 'rgba(255,255,255,0.8)',
            borderRadius: '8px',
            border: '1px solid rgba(0,0,0,0.06)',
            textAlign: 'center'
          }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              数据来源：飞书多维表格 (实时同步) | 
              生成时间：{dayjs().format('YYYY年MM月DD日 HH:mm:ss')} | 
              系统版本：v1.0.0
            </Text>
          </div>
        </div>
      </div>
    </>
  );
}
