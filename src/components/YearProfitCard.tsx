'use client';

import { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, Spin, Alert, Button } from 'antd';
import { CalendarOutlined, DollarOutlined, SyncOutlined } from '@ant-design/icons';

interface YearProfit {
  id?: number;
  year: string;
  profit_with_deposit: number;
  total_profit_with_deposit: number;
  profit_without_deposit: number;
  net_profit_without_deposit: number;
  created_at?: string;
  updated_at?: string;
}

interface YearProfitCardProps {
  className?: string;
}

export default function YearProfitCard({ className }: YearProfitCardProps) {
  const [data, setData] = useState<YearProfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  // 获取年度利润数据
  const fetchYearProfits = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/year-profit?limit=5');
      const result = await response.json();
      
      if (result.success) {
        setData(result.data || []);
      } else {
        throw new Error(result.message || '获取数据失败');
      }
    } catch (err) {
      console.error('获取年度利润数据失败:', err);
      setError(err instanceof Error ? err.message : '获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 同步年度数据
  const syncYearData = async () => {
    try {
      setSyncing(true);
      
      const response = await fetch('/api/sync?type=yearly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        // 同步成功后重新获取数据
        await fetchYearProfits();
      } else {
        throw new Error(result.message || '同步失败');
      }
    } catch (err) {
      console.error('同步年度数据失败:', err);
      setError(err instanceof Error ? err.message : '同步失败');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchYearProfits();
  }, []);

  if (loading) {
    return (
      <Card title="年度利润统计" className={className}>
        <div className="flex justify-center items-center h-32">
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="年度利润统计" className={className}>
        <Alert
          message="数据加载失败"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={fetchYearProfits}>
              重试
            </Button>
          }
        />
      </Card>
    );
  }

  const currentYear = data[0]; // 最新年度数据
  const previousYear = data[1]; // 前一年数据

  return (
    <Card 
      title={
        <div className="flex justify-between items-center">
          <span>
            <CalendarOutlined className="mr-2" />
            年度利润统计
          </span>
          <Button
            icon={<SyncOutlined />}
            onClick={syncYearData}
            loading={syncing}
            size="small"
          >
            同步数据
          </Button>
        </div>
      }
      className={className}
    >
      {data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          暂无年度利润数据
        </div>
      ) : (
        <div className="space-y-4">
          {/* 当前年度概览 */}
          {currentYear && (
            <div>
              <h4 className="text-lg font-semibold mb-3 text-center">
                {currentYear.year}年度利润概览
              </h4>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title="含保证金利润"
                    value={currentYear.profit_with_deposit}
                    precision={2}
                    prefix={<DollarOutlined />}
                    suffix="元"
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="不含保证金利润"
                    value={currentYear.profit_without_deposit}
                    precision={2}
                    prefix={<DollarOutlined />}
                    suffix="元"
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="含保证金总利润"
                    value={currentYear.total_profit_with_deposit}
                    precision={2}
                    prefix={<DollarOutlined />}
                    suffix="元"
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="不含保证金余利润"
                    value={currentYear.net_profit_without_deposit}
                    precision={2}
                    prefix={<DollarOutlined />}
                    suffix="元"
                    valueStyle={{ color: '#eb2f96' }}
                  />
                </Col>
              </Row>
            </div>
          )}

          {/* 历史年度数据 */}
          {data.length > 1 && (
            <div className="mt-6">
              <h4 className="text-md font-medium mb-3">历史年度数据</h4>
              <div className="space-y-2">
                {data.slice(1).map((yearData) => (
                  <div key={yearData.year} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-medium">{yearData.year}年</span>
                    <div className="text-right">
                      <div className="text-sm text-green-600">
                        含保证金: ¥{yearData.profit_with_deposit.toLocaleString()}
                      </div>
                      <div className="text-sm text-blue-600">
                        不含保证金: ¥{yearData.profit_without_deposit.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
