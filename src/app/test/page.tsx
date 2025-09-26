'use client';

import { useState } from 'react';
import { Button, Card, Space, Typography, Alert, Spin } from 'antd';
import { ApiOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

type LoadingResult = {
  status: 'loading';
  message: string;
};

type SuccessResult = {
  status: 'success';
  message: string;
  details: {
    responseTime: string;
    dataCount: number;
    firstRecord: unknown | null;
  };
  timestamp: string;
};

type ErrorResult = {
  status: 'error';
  message: string;
  details: {
    status?: number;
    statusText?: string;
    responseData?: unknown;
    error?: unknown;
  };
  timestamp: string;
};

type TestResult = LoadingResult | SuccessResult | ErrorResult;

export default function TestPage() {
  const [dailyTest, setDailyTest] = useState<TestResult | null>(null);
  const [monthlyTest, setMonthlyTest] = useState<TestResult | null>(null);

  const testAPI = async (endpoint: string, setResult: (result: TestResult) => void) => {
    setResult({ status: 'loading', message: '正在测试...' });
    
    try {
      const startTime = Date.now();
      const response = await fetch(`/api/feishu?table=${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      const data = await response.json();
      
      if (response.ok && data.code === 0) {
        setResult({
          status: 'success',
          message: `✅ API调用成功！获取到 ${data.data?.length || 0} 条记录`,
          details: {
            responseTime: `${responseTime}ms`,
            dataCount: data.data?.length || 0,
            firstRecord: data.data?.[0] ?? null
          },
          timestamp: new Date().toLocaleString()
        });
      } else {
        setResult({
          status: 'error',
          message: `❌ API调用失败：${data.error || response.statusText}`,
          details: {
            status: response.status,
            statusText: response.statusText,
            responseData: data
          },
          timestamp: new Date().toLocaleString()
        });
      }
    } catch (error) {
      setResult({
        status: 'error',
        message: `❌ 网络错误：${error instanceof Error ? error.message : '未知错误'}`,
        details: { error },
        timestamp: new Date().toLocaleString()
      });
    }
  };

  const renderTestResult = (result: TestResult | null) => {
    if (!result) return null;

    if (result.status === 'loading') {
      return (
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <Spin size="small" />
            <Text>{result.message}</Text>
          </div>
        </div>
      );
    }

    if (result.status === 'success') {
      const { message, details, timestamp } = result;

      return (
        <div className="mt-4">
          <Alert
            message={message}
            type="success"
            icon={<CheckCircleOutlined />}
            description={
              <div className="mt-2">
                <Text strong>响应时间：</Text>{details.responseTime}
                <br />
                <Text strong>数据条数：</Text>{details.dataCount}
                <br />
                <Text strong>测试时间：</Text>{timestamp}
                <br />
                {details.firstRecord && (
                  <>
                    <Text strong>首条记录：</Text>
                    <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
                      {JSON.stringify(details.firstRecord, null, 2)}
                    </pre>
                  </>
                )}
              </div>
            }
          />
        </div>
      );
    }

    const { message, details, timestamp } = result;

    return (
      <div className="mt-4">
        <Alert
          message={message}
          type="error"
          icon={<CloseCircleOutlined />}
          description={
            <div className="mt-2">
              <Text strong>测试时间：</Text>{timestamp}
              <br />
              <Text strong>错误详情：</Text>
              <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
                {JSON.stringify(details, null, 2)}
              </pre>
            </div>
          }
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <Title level={2}>
            <ApiOutlined className="mr-2" />
            飞书API连接测试
          </Title>
          <Paragraph>
            这个页面用于测试飞书API的连接状态和数据获取功能。
            点击下面的按钮来测试不同的数据接口。
          </Paragraph>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="每日基础数据测试" className="h-fit">
            <Paragraph>
              测试从飞书表格获取每日基础数据（daily profit, expenses等）
            </Paragraph>
            <Button 
              type="primary" 
              onClick={() => testAPI('daily', setDailyTest)}
              loading={dailyTest?.status === 'loading'}
              className="mb-4"
            >
              测试每日数据API
            </Button>
            {renderTestResult(dailyTest)}
          </Card>

          <Card title="月度汇总数据测试" className="h-fit">
            <Paragraph>
              测试从飞书表格获取月度汇总数据（monthly summary, cashflow等）
            </Paragraph>
            <Button 
              type="primary" 
              onClick={() => testAPI('monthly', setMonthlyTest)}
              loading={monthlyTest?.status === 'loading'}
              className="mb-4"
            >
              测试月度数据API
            </Button>
            {renderTestResult(monthlyTest)}
          </Card>
        </div>

        <Card className="mt-6">
          <Title level={3}>配置信息</Title>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Text strong>飞书应用ID：</Text>
              <Text code>cli_a85bf6b4153bd013</Text>
            </div>
            <div>
              <Text strong>应用Token：</Text>
              <Text code>R8XfbOXZ2a4fJjsWdpmc1rJOnbm</Text>
            </div>
            <div>
              <Text strong>每日数据表ID：</Text>
              <Text code>tbla2p0tHEBb6Xnj</Text>
            </div>
            <div>
              <Text strong>月度数据表ID：</Text>
              <Text code>tbl5hVlzM1gNVCT2</Text>
            </div>
          </div>
        </Card>

        <Card className="mt-6">
          <Title level={3}>常见问题排查</Title>
          <div className="space-y-4">
            <Alert
              message="如果API调用失败，请检查："
              type="info"
              description={
                <ul className="mt-2 space-y-1">
                  <li>• 飞书应用凭证是否正确</li>
                  <li>• 表格ID是否正确</li>
                  <li>• 应用是否有表格读取权限</li>
                  <li>• 网络连接是否正常</li>
                  <li>• 飞书服务是否可访问</li>
                </ul>
              }
            />
          </div>
        </Card>

        <div className="mt-6 text-center">
          <Space>
            <Button href="/" type="default">
              返回看板
            </Button>
            <Button 
              onClick={() => {
                setDailyTest(null);
                setMonthlyTest(null);
              }}
            >
              清除结果
            </Button>
          </Space>
        </div>
      </div>
    </div>
  );
}