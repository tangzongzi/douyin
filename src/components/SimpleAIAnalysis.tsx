'use client';

import React, { useState, useEffect } from 'react';
import { Button, Alert, Spin, Typography, Space, Tag, Row, Col, Divider } from 'antd';
import { ProCard } from '@ant-design/pro-components';
import { RobotOutlined, ReloadOutlined } from '@ant-design/icons';
import { AIAnalysisReport } from '@/lib/supabase';

const { Text } = Typography;

interface SimpleAIAnalysisPanelProps {
  selectedMonth: string;
  onAnalysisComplete?: (result: AIAnalysisReport) => void;
}

export default function SimpleAIAnalysisPanel({ selectedMonth, onAnalysisComplete }: SimpleAIAnalysisPanelProps) {
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 检查已有分析结果
  const checkExistingAnalysis = async () => {
    try {
      const response = await fetch(`/api/ai-analysis?month=${selectedMonth}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setAnalysisResult(result.data);
        onAnalysisComplete?.(result.data);
      } else {
        setAnalysisResult(null);
      }
    } catch (error) {
      console.log('检查已有分析结果失败:', error);
      setAnalysisResult(null);
    }
  };

  // 生成AI分析
  const generateAnalysis = async (force = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/ai-analysis?month=${selectedMonth}&force=${force}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setAnalysisResult(result.data);
        onAnalysisComplete?.(result.data);
      } else {
        setError(result.error || 'AI分析生成失败');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '网络错误');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkExistingAnalysis();
  }, [selectedMonth]);

  return (
    <ProCard
      title={
        <span style={{ fontSize: '16px', fontWeight: '600' }}>
          AI智能分析
        </span>
      }
      extra={
        <Space>
          <Tag color="blue">{selectedMonth}</Tag>
          {analysisResult ? (
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => generateAnalysis(true)}
              loading={loading}
            >
              重新分析
            </Button>
          ) : (
            <Button
              type="primary"
              size="small"
              icon={<RobotOutlined />}
              onClick={() => generateAnalysis(false)}
              loading={loading}
            >
              生成分析
            </Button>
          )}
        </Space>
      }
      headerBordered
    >
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px', color: '#666', fontSize: '14px' }}>
            正在分析财务数据...
          </div>
        </div>
      )}

      {error && (
        <Alert
          message="分析失败"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => generateAnalysis(false)}>
              重试
            </Button>
          }
        />
      )}

      {!loading && !error && analysisResult && (
        <div>
          {/* 评分概览 */}
          {analysisResult.deep_analysis && (
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
              <Col span={6}>
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: '#1890ff' }}>
                    {analysisResult.deep_analysis.healthScore}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>财务健康度</div>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: 'rgba(0,0,0,0.85)' }}>
                    {analysisResult.deep_analysis.profitabilityScore}/30
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>盈利水平</div>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: 'rgba(0,0,0,0.85)' }}>
                    {analysisResult.deep_analysis.riskControlScore}/30
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>补贴能力</div>
                </div>
              </Col>
              <Col span={6}>
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: 'rgba(0,0,0,0.85)' }}>
                    {analysisResult.deep_analysis.costControlScore}/40
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>成本控制</div>
                </div>
              </Col>
            </Row>
          )}

          <Divider style={{ margin: '24px 0' }} />

          {/* 分析结果 */}
          {analysisResult.simple_analysis && (
            <Row gutter={[24, 24]}>
              {/* 积极表现 */}
              {analysisResult.simple_analysis.positiveFactors.length > 0 && (
                <Col span={8}>
                  <div>
                    <Text strong style={{ fontSize: '14px', color: 'rgba(0,0,0,0.85)' }}>
                      积极表现
                    </Text>
                    <div style={{ marginTop: '12px' }}>
                      {analysisResult.simple_analysis.positiveFactors.map((factor, index) => (
                        <div key={index} style={{ 
                          marginBottom: '12px',
                          fontSize: '13px',
                          lineHeight: '1.6',
                          color: 'rgba(0,0,0,0.65)',
                          padding: '12px',
                          background: '#fafafa',
                          borderRadius: '6px',
                          borderLeft: '3px solid #1890ff'
                        }}>
                          <Text style={{ color: '#1890ff', fontWeight: '500', marginRight: '8px' }}>
                            {index + 1}.
                          </Text>
                          {factor.replace(/[💰📈📊🎯⚡🏆✨]/g, '')}
                        </div>
                      ))}
                    </div>
                  </div>
                </Col>
              )}
              
              {/* 风险警示 */}
              {analysisResult.simple_analysis.riskWarnings.length > 0 && (
                <Col span={8}>
                  <div>
                    <Text strong style={{ fontSize: '14px', color: 'rgba(0,0,0,0.85)' }}>
                      风险警示
                    </Text>
                    <div style={{ marginTop: '12px' }}>
                      {analysisResult.simple_analysis.riskWarnings.map((warning, index) => (
                        <div key={index} style={{ 
                          marginBottom: '12px',
                          fontSize: '13px',
                          lineHeight: '1.6',
                          color: 'rgba(0,0,0,0.65)',
                          padding: '12px',
                          background: '#fafafa',
                          borderRadius: '6px',
                          borderLeft: '3px solid #ff4d4f'
                        }}>
                          <Text style={{ color: '#ff4d4f', fontWeight: '500', marginRight: '8px' }}>
                            {index + 1}.
                          </Text>
                          {warning.replace(/[⚠️📉🚨]/g, '')}
                        </div>
                      ))}
                    </div>
                  </div>
                </Col>
              )}
              
              {/* 深度洞察 */}
              {analysisResult.simple_analysis.keyInsights.length > 0 && (
                <Col span={8}>
                  <div>
                    <Text strong style={{ fontSize: '14px', color: 'rgba(0,0,0,0.85)' }}>
                      深度洞察
                    </Text>
                    <div style={{ marginTop: '12px' }}>
                      {analysisResult.simple_analysis.keyInsights.map((insight, index) => (
                        <div key={index} style={{ 
                          marginBottom: '12px',
                          fontSize: '13px',
                          lineHeight: '1.6',
                          color: 'rgba(0,0,0,0.65)',
                          padding: '12px',
                          background: '#fafafa',
                          borderRadius: '6px',
                          borderLeft: '3px solid #1890ff'
                        }}>
                          <Text style={{ color: '#1890ff', fontWeight: '500', marginRight: '8px' }}>
                            {index + 1}.
                          </Text>
                          {insight.replace(/[💡🔍📊]/g, '')}
                        </div>
                      ))}
                    </div>
                  </div>
                </Col>
              )}
            </Row>
          )}

          {/* 建议和预测 */}
          {analysisResult.deep_analysis && (
            <>
              <Divider style={{ margin: '24px 0' }} />
              <Row gutter={[24, 24]}>
                {/* 优化建议 */}
                {analysisResult.deep_analysis.optimizationSuggestions.length > 0 && (
                  <Col span={16}>
                    <Text strong style={{ fontSize: '14px', color: 'rgba(0,0,0,0.85)' }}>
                      专业优化建议
                    </Text>
                    <div style={{ marginTop: '12px' }}>
                      {analysisResult.deep_analysis.optimizationSuggestions.map((suggestion, index) => (
                        <div key={index} style={{ 
                          marginBottom: '12px',
                          fontSize: '13px',
                          lineHeight: '1.6',
                          color: 'rgba(0,0,0,0.65)',
                          padding: '12px 16px',
                          background: '#fafafa',
                          borderRadius: '6px',
                          position: 'relative',
                          paddingLeft: '40px'
                        }}>
                          <div style={{
                            position: 'absolute',
                            left: '12px',
                            top: '12px',
                            width: '20px',
                            height: '20px',
                            background: '#1890ff',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '11px',
                            fontWeight: '600'
                          }}>
                            {index + 1}
                          </div>
                          {suggestion.replace(/[🎯📈💰🔍💡📊📉💸💳💧]/g, '')}
                        </div>
                      ))}
                    </div>
                  </Col>
                )}
                
                {/* 下月预测 */}
                <Col span={8}>
                  <Text strong style={{ fontSize: '14px', color: 'rgba(0,0,0,0.85)' }}>
                    下月预测
                  </Text>
                  <div style={{ 
                    marginTop: '12px',
                    textAlign: 'center',
                    padding: '20px',
                    background: '#fafafa',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                      预计净利润区间
                    </div>
                    <div style={{ 
                      fontSize: '24px',
                      fontWeight: '700',
                      color: '#1890ff',
                      marginBottom: '4px'
                    }}>
                      ¥{(analysisResult.deep_analysis.nextMonthPrediction.profitRange[0] / 1000).toFixed(0)}k
                    </div>
                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>
                      至
                    </div>
                    <div style={{ 
                      fontSize: '24px',
                      fontWeight: '700',
                      color: '#1890ff'
                    }}>
                      ¥{(analysisResult.deep_analysis.nextMonthPrediction.profitRange[1] / 1000).toFixed(0)}k
                    </div>
                  </div>
                </Col>
              </Row>
            </>
          )}

          {/* 分析时间 */}
          <div style={{ 
            marginTop: '24px',
            padding: '8px 12px',
            background: '#f5f5f5',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#999',
            textAlign: 'center'
          }}>
            分析时间：{new Date(analysisResult.generated_at).toLocaleString('zh-CN')}
          </div>
        </div>
      )}

      {!loading && !error && !analysisResult && (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 40px',
          color: 'rgba(0,0,0,0.45)'
        }}>
          <RobotOutlined style={{ 
            fontSize: '48px', 
            color: '#d9d9d9', 
            marginBottom: '16px' 
          }} />
          <div style={{ 
            fontSize: '14px',
            color: 'rgba(0,0,0,0.45)',
            lineHeight: '1.5'
          }}>
            暂无AI分析报告<br/>
            点击"生成分析"创建智能财务分析
          </div>
        </div>
      )}
    </ProCard>
  );
}
