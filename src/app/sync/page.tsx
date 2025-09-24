'use client';

import { useState } from 'react';
import { Button, Card, Space, Typography, Alert, Spin, Progress, Timeline } from 'antd';
import { SyncOutlined, DatabaseOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface SyncResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  timestamp?: string;
}

export default function SyncPage() {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [syncProgress, setSyncProgress] = useState(0);

  const performSync = async (type: 'all' | 'daily' | 'monthly') => {
    setSyncing(true);
    setSyncProgress(0);
    setSyncResult(null);
    
    try {
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setSyncProgress(prev => Math.min(prev + 10, 90));
      }, 200);
      
      const response = await fetch(`/api/sync?type=${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      clearInterval(progressInterval);
      setSyncProgress(100);
      
      const result = await response.json();
      setSyncResult(result);
      
    } catch (error) {
      setSyncResult({
        success: false,
        message: '同步失败',
        error: error instanceof Error ? error.message : '网络错误',
        timestamp: new Date().toISOString()
      });
    } finally {
      setSyncing(false);
    }
  };

  const validateData = async () => {
    try {
      const response = await fetch('/api/sync?action=validate');
      const result = await response.json();
      
      setSyncResult({
        success: result.success,
        message: result.data?.message || '验证完成',
        data: result.data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setSyncResult({
        success: false,
        message: '验证失败',
        error: error instanceof Error ? error.message : '网络错误',
        timestamp: new Date().toISOString()
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <Title level={2}>
            <DatabaseOutlined className="mr-2" />
            数据同步管理
          </Title>
          <Paragraph>
            管理飞书表格数据到Supabase数据库的同步。建议每天同步一次，或在数据更新后手动同步。
          </Paragraph>
        </Card>

        {/* 同步操作区域 */}
        <Card title="同步操作" className="mb-6">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Text strong>选择同步类型：</Text>
              <div className="mt-2">
                <Space wrap>
                  <Button 
                    type="primary"
                    icon={<SyncOutlined />}
                    onClick={() => performSync('all')}
                    loading={syncing}
                    size="large"
                  >
                    完整同步
                  </Button>
                  <Button 
                    icon={<SyncOutlined />}
                    onClick={() => performSync('daily')}
                    loading={syncing}
                  >
                    同步每日数据
                  </Button>
                  <Button 
                    icon={<SyncOutlined />}
                    onClick={() => performSync('monthly')}
                    loading={syncing}
                  >
                    同步月度数据
                  </Button>
                  <Button 
                    icon={<CheckCircleOutlined />}
                    onClick={validateData}
                    disabled={syncing}
                  >
                    验证数据
                  </Button>
                </Space>
              </div>
            </div>

            {/* 同步进度 */}
            {syncing && (
              <div>
                <Text strong>同步进度：</Text>
                <Progress 
                  percent={syncProgress} 
                  status="active"
                  strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                />
              </div>
            )}
          </Space>
        </Card>

        {/* 同步结果 */}
        {syncResult && (
          <Card title="同步结果">
            <Alert
              message={syncResult.message}
              type={syncResult.success ? 'success' : 'error'}
              icon={syncResult.success ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
              description={
                <div className="mt-2">
                  <Text strong>时间：</Text>{syncResult.timestamp}<br/>
                  {syncResult.data && (
                    <>
                      <Text strong>详情：</Text>
                      <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
                        {JSON.stringify(syncResult.data, null, 2)}
                      </pre>
                    </>
                  )}
                  {syncResult.error && (
                    <>
                      <Text strong>错误：</Text>
                      <Text type="danger">{syncResult.error}</Text>
                    </>
                  )}
                </div>
              }
            />
          </Card>
        )}

        {/* 使用说明 */}
        <Card title="使用说明" className="mt-6">
          <Timeline
            items={[
              {
                color: 'blue',
                children: (
                  <div>
                    <Text strong>1. 配置Supabase</Text>
                    <br />
                    <Text type="secondary">
                      在Supabase中创建项目，执行schema.sql创建表结构，配置环境变量
                    </Text>
                  </div>
                ),
              },
              {
                color: 'green',
                children: (
                  <div>
                    <Text strong>2. 首次同步</Text>
                    <br />
                    <Text type="secondary">
                      点击"完整同步"按钮，将飞书表格数据同步到Supabase数据库
                    </Text>
                  </div>
                ),
              },
              {
                color: 'orange',
                children: (
                  <div>
                    <Text strong>3. 定期同步</Text>
                    <br />
                    <Text type="secondary">
                      建议每天或数据更新后手动同步，保持数据最新
                    </Text>
                  </div>
                ),
              },
              {
                color: 'purple',
                children: (
                  <div>
                    <Text strong>4. 验证数据</Text>
                    <br />
                    <Text type="secondary">
                      使用"验证数据"功能检查同步状态和数据完整性
                    </Text>
                  </div>
                ),
              },
            ]}
          />
        </Card>

        <div className="mt-6 text-center">
          <Space>
            <Button href="/" type="default">
              返回看板
            </Button>
            <Button href="/test" type="default">
              API测试
            </Button>
          </Space>
        </div>
      </div>
    </div>
  );
}
