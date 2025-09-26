'use client';

import { useState } from 'react';
import { Button, Card, Space, Typography, Alert, Progress, Switch, Row, Col } from 'antd';
import { SyncOutlined, DatabaseOutlined, CheckCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface SyncResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
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
    <>
      <style jsx global>{`
        .sync-page-animation {
          animation: slideInUp 0.6s ease-out;
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
        
        .sync-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important;
          transition: all 0.3s ease;
        }
      `}</style>
      
      <div style={{ 
        background: 'linear-gradient(180deg, #f0f2f5 0%, #f5f7fa 100%)', 
        minHeight: '100vh', 
        padding: '24px' 
      }}>
        <div className="sync-page-animation" style={{ 
          maxWidth: '1200px', 
          margin: '0 auto' 
        }}>
        
        {/* 页面标题 - Pro级别优化 */}
        <div style={{ 
          marginBottom: '32px',
          padding: '32px',
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(8px)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.6)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
          textAlign: 'center'
        }}>
          <div style={{
            padding: '12px',
            background: 'linear-gradient(135deg, #1890ff 0%, #13c2c2 100%)',
            borderRadius: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            <DatabaseOutlined style={{ color: 'white', fontSize: '24px' }} />
          </div>
          
          <h1 style={{ 
            margin: '0 0 12px 0',
            fontSize: '28px',
            fontWeight: '700',
            color: 'rgba(0,0,0,0.88)',
            letterSpacing: '-0.5px'
          }}>
            智能数据同步系统
          </h1>
          
          <p style={{
            margin: 0,
            fontSize: '16px',
            color: 'rgba(0,0,0,0.65)',
            fontWeight: '400',
            lineHeight: '1.5'
          }}>
            基于飞书表格真实日期字段的智能同步，支持增量同步和日期范围选择
          </p>
        </div>

        {/* 同步设置 - 优化版 */}
        <div style={{ 
          marginBottom: '32px',
          padding: '24px',
          background: 'rgba(255,255,255,0.8)',
          borderRadius: '12px',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
        }}>
          <h3 style={{
            margin: '0 0 20px 0',
            fontSize: '16px',
            fontWeight: '600',
            color: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '4px',
              height: '16px',
              background: 'linear-gradient(135deg, #1890ff 0%, #13c2c2 100%)',
              borderRadius: '2px'
            }}></div>
            同步设置
          </h3>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '16px 20px',
            background: 'rgba(250,250,250,0.8)',
            borderRadius: '8px',
            border: '1px solid rgba(0,0,0,0.04)'
          }}>
            <div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'rgba(0,0,0,0.85)',
                marginBottom: '4px'
              }}>
                强制覆盖已存在数据
              </div>
              <div style={{
                fontSize: '12px',
                color: 'rgba(0,0,0,0.45)'
              }}>
                {forceSync ? '将覆盖数据库中已存在的数据' : '只同步新数据，跳过已存在的'}
              </div>
            </div>
            <Switch
              checked={forceSync}
              onChange={setForceSync}
              checkedChildren="开启"
              unCheckedChildren="关闭"
              style={{
                background: forceSync ? 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)' : undefined
              }}
            />
          </div>
        </div>

        {/* 快速同步区域 - 全新设计 */}
        <Row gutter={[20, 20]} style={{ marginBottom: '32px' }}>
          <Col span={14}>
            <div className="sync-card" style={{
              padding: '24px',
              background: 'rgba(255,255,255,0.8)',
              borderRadius: '12px',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
              height: '100%'
            }}>
              <h3 style={{
                margin: '0 0 20px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: 'rgba(0,0,0,0.85)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  width: '4px',
                  height: '16px',
                  background: 'linear-gradient(135deg, #fa8c16 0%, #fa541c 100%)',
                  borderRadius: '2px'
                }}></div>
                按日期范围同步
              </h3>
              
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px'
              }}>
                <Button 
                  icon={<SyncOutlined />}
                  onClick={() => performSync('daily', '7days')}
                  loading={syncing}
                  style={{
                    height: '44px',
                    borderRadius: '8px',
                    border: '1px solid rgba(0,0,0,0.15)',
                    fontWeight: '500'
                  }}
                >
                  近7天数据
                </Button>
                <Button 
                  icon={<SyncOutlined />}
                  onClick={() => performSync('daily', '15days')}
                  loading={syncing}
                  style={{
                    height: '44px',
                    borderRadius: '8px',
                    border: '1px solid rgba(0,0,0,0.15)',
                    fontWeight: '500'
                  }}
                >
                  近15天数据
                </Button>
                <Button 
                  icon={<SyncOutlined />}
                  onClick={() => performSync('daily', '30days')}
                  loading={syncing}
                  style={{
                    height: '44px',
                    borderRadius: '8px',
                    border: '1px solid rgba(0,0,0,0.15)',
                    fontWeight: '500'
                  }}
                >
                  近30天数据
                </Button>
                <Button 
                  type="primary"
                  icon={<SyncOutlined />}
                  onClick={() => performSync('daily', 'currentMonth')}
                  loading={syncing}
                  style={{
                    height: '44px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #1890ff 0%, #13c2c2 100%)',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(24,144,255,0.3)',
                    fontWeight: '600'
                  }}
                >
                  当月数据
                </Button>
              </div>
            </div>
          </Col>
          
          <Col span={10}>
            <div className="sync-card" style={{
              padding: '24px',
              background: 'rgba(255,255,255,0.8)',
              borderRadius: '12px',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
              height: '100%'
            }}>
              <h3 style={{
                margin: '0 0 20px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: 'rgba(0,0,0,0.85)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  width: '4px',
                  height: '16px',
                  background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                  borderRadius: '2px'
                }}></div>
                完整同步选项
              </h3>
              
              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <Button 
                  type="primary"
                  icon={<SyncOutlined />}
                  onClick={() => performSync('all')}
                  loading={syncing}
                  style={{
                    height: '48px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(82,196,26,0.3)',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                >
                  智能完整同步
                </Button>
                <Button 
                  icon={<ThunderboltOutlined />}
                  onClick={() => performSync('force')}
                  loading={syncing}
                  danger
                  style={{
                    height: '44px',
                    borderRadius: '8px',
                    fontWeight: '600'
                  }}
                >
                  强制完整同步
                </Button>
                <Button 
                  icon={<SyncOutlined />}
                  onClick={() => performSync('yearly')}
                  loading={syncing}
                  style={{
                    height: '44px',
                    borderRadius: '8px',
                    border: '1px solid rgba(114,46,209,0.3)',
                    color: '#722ed1',
                    fontWeight: '500'
                  }}
                >
                  同步年度数据
                </Button>
                <Button 
                  icon={<CheckCircleOutlined />}
                  onClick={() => {
                    setSyncing(true);
                    fetch('/api/sync?action=validate')
                      .then(r => r.json())
                      .then(result => setSyncResult(result))
                      .finally(() => setSyncing(false));
                  }}
                  loading={syncing}
                  style={{
                    height: '44px',
                    borderRadius: '8px',
                    border: '1px solid rgba(0,0,0,0.15)',
                    fontWeight: '500'
                  }}
                >
                  验证数据完整性
                </Button>
              </div>
            </div>
          </Col>
        </Row>

        {/* 同步进度 - 优化版 */}
        {syncing && (
          <div style={{ 
            marginBottom: '32px',
            padding: '24px',
            background: 'rgba(255,255,255,0.9)',
            borderRadius: '12px',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: 'rgba(0,0,0,0.85)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <SyncOutlined style={{ color: '#1890ff', fontSize: '16px' }} spin />
              同步进度
            </h3>
            
            <Progress 
              percent={syncProgress} 
              status="active"
              strokeColor={{ 
                '0%': '#1890ff', 
                '50%': '#13c2c2',
                '100%': '#52c41a' 
              }}
              strokeWidth={8}
              style={{ marginBottom: '12px' }}
            />
            
            <div style={{
              textAlign: 'center',
              fontSize: '14px',
              color: 'rgba(0,0,0,0.65)',
              fontWeight: '500'
            }}>
              正在同步数据，请稍候...
            </div>
          </div>
        )}

        {/* 同步结果 */}
        {syncResult && (
          <Card 
            title={syncResult.success ? '同步成功' : '同步失败'} 
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
              type={syncResult.success ? 'success' : 'error'}
              showIcon
            />
          </Card>
        )}

        {/* 使用说明 - Pro级别优化 */}
        <div style={{
          marginBottom: '32px',
          padding: '28px',
          background: 'linear-gradient(135deg, rgba(114,46,209,0.04) 0%, rgba(235,47,150,0.04) 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(114,46,209,0.08)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px'
          }}>
            <div style={{
              padding: '10px',
              background: 'linear-gradient(135deg, #722ed1 0%, #eb2f96 100%)',
              borderRadius: '10px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              💡
            </div>
            <h3 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '700',
              color: 'rgba(0,0,0,0.88)'
            }}>
              使用说明
            </h3>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px'
          }}>
            <div style={{
              padding: '16px 20px',
              background: 'rgba(255,255,255,0.8)',
              borderRadius: '10px',
              border: '1px solid rgba(0,0,0,0.04)'
            }}>
              <h4 style={{
                margin: '0 0 8px 0',
                fontSize: '14px',
                fontWeight: '600',
                color: '#1890ff'
              }}>
                智能同步
              </h4>
              <p style={{
                margin: 0,
                fontSize: '13px',
                color: 'rgba(0,0,0,0.65)',
                lineHeight: '1.6'
              }}>
                基于飞书表格的真实日期字段，自动识别新数据，避免重复同步，推荐日常使用
              </p>
            </div>
            
            <div style={{
              padding: '16px 20px',
              background: 'rgba(255,255,255,0.8)',
              borderRadius: '10px',
              border: '1px solid rgba(0,0,0,0.04)'
            }}>
              <h4 style={{
                margin: '0 0 8px 0',
                fontSize: '14px',
                fontWeight: '600',
                color: '#fa541c'
              }}>
                强制同步
              </h4>
              <p style={{
                margin: 0,
                fontSize: '13px',
                color: 'rgba(0,0,0,0.65)',
                lineHeight: '1.6'
              }}>
                完全重新同步所有数据，跳过已存在的记录，数据异常时使用
              </p>
            </div>
            
            <div style={{
              padding: '16px 20px',
              background: 'rgba(255,255,255,0.8)',
              borderRadius: '10px',
              border: '1px solid rgba(0,0,0,0.04)'
            }}>
              <h4 style={{
                margin: '0 0 8px 0',
                fontSize: '14px',
                fontWeight: '600',
                color: '#52c41a'
              }}>
                自动同步
              </h4>
              <p style={{
                margin: 0,
                fontSize: '13px',
                color: 'rgba(0,0,0,0.65)',
                lineHeight: '1.6'
              }}>
                系统每3小时自动执行智能同步
              </p>
            </div>
          </div>
        </div>

        </div>
      </div>
    </>
  );
}