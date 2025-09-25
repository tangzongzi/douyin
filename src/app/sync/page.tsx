'use client';

import { useState } from 'react';
import { Button, Card, Space, Typography, Alert, Progress, Select, Switch, Divider, Row, Col } from 'antd';
import { SyncOutlined, DatabaseOutlined, CheckCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

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
  const [forceSync, setForceSync] = useState(false);

  const performSync = async (type: string, range?: string) => {
    setSyncing(true);
    setSyncProgress(0);
    setSyncResult(null);
    
    try {
      const progressInterval = setInterval(() => {
        setSyncProgress(prev => Math.min(prev + 15, 90));
      }, 300);
      
      // 构建API URL
      const params = new URLSearchParams();
      params.append('type', type);
      if (range) params.append('range', range);
      if (forceSync) params.append('force', 'true');
      
      const apiUrl = `/api/sync?${params.toString()}`;
      console.log('[Sync UI] 调用API:', apiUrl);
      
      const response = await fetch(apiUrl, { method: 'POST' });
      
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
      setTimeout(() => setSyncProgress(0), 2000);
    }
  };

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* 页面标题 */}
        <Card style={{ marginBottom: '24px' }}>
          <Title level={2}>
            <DatabaseOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
            智能数据同步系统
          </Title>
          <Text type="secondary">
            基于飞书表格真实日期字段的智能同步，支持增量同步和日期范围选择
          </Text>
        </Card>

        {/* 同步设置 */}
        <Card title="同步设置" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div>
              <Text strong>强制覆盖已存在数据：</Text>
              <Switch
                checked={forceSync}
                onChange={setForceSync}
                style={{ marginLeft: '8px' }}
                checkedChildren="开启"
                unCheckedChildren="关闭"
              />
            </div>
            <Text type="secondary">
              {forceSync ? '将覆盖数据库中已存在的数据' : '只同步新数据，跳过已存在的'}
            </Text>
          </div>
        </Card>

        {/* 快速同步区域 */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col span={12}>
            <Card title="📅 按日期范围同步" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button 
                  block
                  icon={<SyncOutlined />}
                  onClick={() => performSync('daily', '7days')}
                  loading={syncing}
                >
                  近7天数据
                </Button>
                <Button 
                  block
                  icon={<SyncOutlined />}
                  onClick={() => performSync('daily', '15days')}
                  loading={syncing}
                >
                  近15天数据
                </Button>
                <Button 
                  block
                  icon={<SyncOutlined />}
                  onClick={() => performSync('daily', '30days')}
                  loading={syncing}
                >
                  近30天数据
                </Button>
                <Button 
                  block
                  type="primary"
                  icon={<SyncOutlined />}
                  onClick={() => performSync('daily', 'currentMonth')}
                  loading={syncing}
                >
                  当月数据
                </Button>
              </Space>
            </Card>
          </Col>
          
          <Col span={12}>
            <Card title="🔄 完整同步选项" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button 
                  block
                  type="primary"
                  icon={<SyncOutlined />}
                  onClick={() => performSync('all')}
                  loading={syncing}
                  size="large"
                >
                  智能完整同步
                </Button>
                <Button 
                  block
                  icon={<ThunderboltOutlined />}
                  onClick={() => performSync('force')}
                  loading={syncing}
                  danger
                >
                  强制完整同步
                </Button>
                <Button 
                  block
                  icon={<SyncOutlined />}
                  onClick={() => performSync('yearly')}
                  loading={syncing}
                >
                  同步年度数据
                </Button>
                <Button 
                  block
                  icon={<CheckCircleOutlined />}
                  onClick={() => {
                    setSyncing(true);
                    fetch('/api/sync?action=validate')
                      .then(r => r.json())
                      .then(result => setSyncResult(result))
                      .finally(() => setSyncing(false));
                  }}
                  loading={syncing}
                >
                  验证数据完整性
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* 同步进度 */}
        {syncing && (
          <Card title="同步进度" style={{ marginBottom: '24px' }}>
            <Progress 
              percent={syncProgress} 
              status="active"
              strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
            />
            <Text type="secondary" style={{ marginTop: '8px', display: 'block' }}>
              正在同步数据，请稍候...
            </Text>
          </Card>
        )}

        {/* 同步结果 */}
        {syncResult && (
          <Card 
            title={syncResult.success ? "同步成功" : "同步失败"} 
            style={{ marginBottom: '24px' }}
          >
            <Alert
              message={syncResult.message}
              description={
                <div>
                  {syncResult.error && <div>错误：{syncResult.error}</div>}
                  {syncResult.timestamp && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                      时间：{new Date(syncResult.timestamp).toLocaleString('zh-CN')}
                    </div>
                  )}
                  {syncResult.data && (
                    <details style={{ marginTop: '8px' }}>
                      <summary style={{ cursor: 'pointer', color: '#1890ff' }}>
                        查看详细结果
                      </summary>
                      <pre style={{ marginTop: '8px', fontSize: '12px', background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                        {JSON.stringify(syncResult.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              }
              type={syncResult.success ? "success" : "error"}
              showIcon
            />
          </Card>
        )}

        {/* 使用说明 */}
        <Card title="💡 使用说明" style={{ marginBottom: '24px' }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Text><strong>智能同步：</strong> 基于飞书表格的真实日期字段，自动识别和同步数据</Text>
            <Text><strong>增量同步：</strong> 只同步新数据，跳过已存在的记录，提高效率</Text>
            <Text><strong>日期范围：</strong> 可选择同步最近7天、15天、30天或当月的数据</Text>
            <Text><strong>强制同步：</strong> 开启后会覆盖数据库中已存在的数据</Text>
            <Text><strong>建议用法：</strong> 日常使用"当月数据"或"近7天"，数据有误时使用"强制完整同步"</Text>
          </Space>
        </Card>

      </div>
    </div>
  );
}