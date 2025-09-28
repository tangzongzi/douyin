'use client';

import React, { useState, useEffect } from 'react';
import { Button, Alert, Spin, Typography, Space, Tag, Progress, Row, Col, Statistic } from 'antd';
import { ProCard } from '@ant-design/pro-components';
import { RobotOutlined, ReloadOutlined, TrophyOutlined, WarningOutlined, BulbOutlined, RiseOutlined } from '@ant-design/icons';
import { AIAnalysisReport } from '@/lib/supabase';

const { Title, Text, Paragraph } = Typography;

interface AIAnalysisPanelProps {
  selectedMonth: string;
  onAnalysisComplete?: (result: AIAnalysisReport) => void;
}

export default function AIAnalysisPanel({ selectedMonth, onAnalysisComplete }: AIAnalysisPanelProps) {
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 组件加载时检查是否已有分析结果
  useEffect(() => {
    checkExistingAnalysis();
  }, [selectedMonth]);

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

  // 渲染健康度评分
  const renderHealthScore = (score: number, level: string) => {
    const getColor = () => {
      if (score >= 85) return '#52c41a';
      if (score >= 70) return '#1890ff';
      if (score >= 55) return '#faad14';
      return '#ff4d4f';
    };

    const getLevelText = () => {
      switch (level) {
        case 'excellent': return '优秀';
        case 'good': return '良好';
        case 'fair': return '一般';
        case 'poor': return '较差';
        default: return level;
      }
    };

    return (
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <Progress
          type="circle"
          percent={score}
          format={() => `${score}分`}
          strokeColor={getColor()}
          size={80}
        />
        <div style={{ marginTop: '8px' }}>
          <Tag color={getColor()} style={{ fontSize: '14px', padding: '4px 12px' }}>
            {getLevelText()}
          </Tag>
        </div>
      </div>
    );
  };

  // 渲染分析内容
  const renderAnalysisContent = () => {
    if (!analysisResult) return null;

    const { simple_analysis, deep_analysis, ai_enhanced_text } = analysisResult;

    return (
      <div>
        {/* AI增强分析（如果有） - ProCard风格 */}
        {ai_enhanced_text && (
          <ProCard 
            title={
              <Space>
                <RobotOutlined style={{ color: '#722ed1' }} />
                <span>EdgeOne AI深度分析</span>
                <Tag color="purple">DeepSeek-V3</Tag>
              </Space>
            }
            bordered
            headerBordered
            style={{ marginBottom: '16px' }}
          >
            <div style={{ 
              whiteSpace: 'pre-wrap', 
              lineHeight: 1.6,
              fontSize: '14px',
              color: 'rgba(0,0,0,0.85)',
              padding: '8px 0'
            }}>
              {ai_enhanced_text}
            </div>
          </ProCard>
        )}

        {/* 财务健康度评分 - Ant Design Pro风格 */}
        {deep_analysis && (
          <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
            <Col span={6}>
              <ProCard>
                <Statistic
                  title="财务健康度"
                  value={
                    deep_analysis.healthLevel === 'excellent' ? '优秀经营' :
                    deep_analysis.healthLevel === 'good' ? '良好状态' :
                    deep_analysis.healthLevel === 'fair' ? '一般水平' : '需要改进'
                  }
                  valueStyle={{ 
                    color: '#1890ff',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}
                  prefix={<TrophyOutlined style={{ color: '#1890ff' }} />}
                />
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                  综合评分：{deep_analysis.healthScore}/100分
                </div>
              </ProCard>
            </Col>
            <Col span={6}>
              <ProCard>
                <Statistic
                  title="盈利水平"
                  value={
                    deep_analysis.profitabilityScore >= 25 ? '盈利优秀' :
                    deep_analysis.profitabilityScore >= 20 ? '盈利良好' :
                    deep_analysis.profitabilityScore >= 15 ? '盈利一般' : '需要提升'
                  }
                  valueStyle={{ 
                    color: '#1890ff',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}
                  prefix={<RiseOutlined style={{ color: '#1890ff' }} />}
                />
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                  评估得分：{deep_analysis.profitabilityScore}/30分
                </div>
              </ProCard>
            </Col>
            <Col span={6}>
              <ProCard>
                <Statistic
                  title="补贴能力"
                  value={
                    deep_analysis.riskControlScore >= 25 ? '获取优秀' :
                    deep_analysis.riskControlScore >= 20 ? '获取良好' :
                    deep_analysis.riskControlScore >= 15 ? '获取一般' : '有待提升'
                  }
                  valueStyle={{ 
                    color: '#1890ff',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}
                  prefix={<WarningOutlined style={{ color: '#1890ff' }} />}
                />
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                  能力评分：{deep_analysis.riskControlScore}/30分
                </div>
              </ProCard>
            </Col>
            <Col span={6}>
              <ProCard>
                <Statistic
                  title="成本控制"
                  value={
                    deep_analysis.costControlScore >= 35 ? '控制优秀' :
                    deep_analysis.costControlScore >= 30 ? '控制良好' :
                    deep_analysis.costControlScore >= 25 ? '控制一般' : '需要优化'
                  }
                  valueStyle={{ 
                    color: '#1890ff',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}
                  prefix={<BulbOutlined style={{ color: '#1890ff' }} />}
                />
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                  控制评分：{deep_analysis.costControlScore}/40分
                </div>
              </ProCard>
            </Col>
          </Row>
        )}

        {/* 分析结果 - 企业级专业风格 */}
        {simple_analysis && (
          <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
            {/* 积极表现 */}
            {simple_analysis.positiveFactors.length > 0 && (
              <Col span={8}>
                <ProCard 
                  title="积极表现"
                  bordered
                  headerBordered
                  size="small"
                  headStyle={{ 
                    background: 'linear-gradient(135deg, #f6ffed 0%, #f0f9ff 100%)',
                    borderBottom: '1px solid #b7eb8f'
                  }}
                >
                  {simple_analysis.positiveFactors.map((factor, index) => (
                    <div key={index} style={{ 
                      marginBottom: '12px',
                      fontSize: '13px',
                      lineHeight: '1.6',
                      color: 'rgba(0,0,0,0.85)',
                      padding: '8px 12px',
                      background: '#fafafa',
                      borderRadius: '6px',
                      borderLeft: '3px solid #52c41a'
                    }}>
                      <Text strong style={{ color: '#52c41a', marginRight: '8px' }}>
                        {index + 1}
                      </Text>
                      <span>{factor.replace(/[💰📈📊🎯⚡🏆✨]/g, '')}</span>
                    </div>
                  ))}
                </ProCard>
              </Col>
            )}
            
            {/* 风险警示 */}
            {simple_analysis.riskWarnings.length > 0 && (
              <Col span={8}>
                <ProCard 
                  title="风险警示"
                  bordered
                  headerBordered
                  size="small"
                  headStyle={{ 
                    background: 'linear-gradient(135deg, #fff2e8 0%, #fff1f0 100%)',
                    borderBottom: '1px solid #ffccc7'
                  }}
                >
                  {simple_analysis.riskWarnings.map((warning, index) => (
                    <div key={index} style={{ 
                      marginBottom: '12px',
                      fontSize: '13px',
                      lineHeight: '1.6',
                      color: 'rgba(0,0,0,0.85)',
                      padding: '8px 12px',
                      background: '#fafafa',
                      borderRadius: '6px',
                      borderLeft: '3px solid #ff4d4f'
                    }}>
                      <Text strong style={{ color: '#ff4d4f', marginRight: '8px' }}>
                        {index + 1}
                      </Text>
                      <span>{warning.replace(/[⚠️📉🚨]/g, '')}</span>
                    </div>
                  ))}
                </ProCard>
              </Col>
            )}
            
            {/* 深度洞察 */}
            {simple_analysis.keyInsights.length > 0 && (
              <Col span={8}>
                <ProCard 
                  title="深度洞察"
                  bordered
                  headerBordered
                  size="small"
                  headStyle={{ 
                    background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%)',
                    borderBottom: '1px solid #91d5ff'
                  }}
                >
                  {simple_analysis.keyInsights.map((insight, index) => (
                    <div key={index} style={{ 
                      marginBottom: '12px',
                      fontSize: '13px',
                      lineHeight: '1.6',
                      color: 'rgba(0,0,0,0.85)',
                      padding: '8px 12px',
                      background: '#fafafa',
                      borderRadius: '6px',
                      borderLeft: '3px solid #1890ff'
                    }}>
                      <Text strong style={{ color: '#1890ff', marginRight: '8px' }}>
                        {index + 1}
                      </Text>
                      <span>{insight.replace(/[💡🔍📊]/g, '')}</span>
                    </div>
                  ))}
                </ProCard>
              </Col>
            )}
          </Row>
        )}

        {/* 专业建议与预测 - 企业级风格 */}
        {deep_analysis && (
          <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
            {/* 优化建议 */}
            {deep_analysis.optimizationSuggestions.length > 0 && (
              <Col span={16}>
                <ProCard 
                  title="专业优化建议"
                  bordered
                  headerBordered
                  size="small"
                  headStyle={{ 
                    background: 'linear-gradient(135deg, #fffbe6 0%, #fff7e6 100%)',
                    borderBottom: '1px solid #ffd666'
                  }}
                >
                  <div style={{ padding: '8px 0' }}>
                    {deep_analysis.optimizationSuggestions.map((suggestion, index) => (
                      <div key={index} style={{ 
                        marginBottom: '16px',
                        fontSize: '14px',
                        lineHeight: '1.7',
                        color: 'rgba(0,0,0,0.85)'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px'
                        }}>
                          <div style={{
                            minWidth: '24px',
                            height: '24px',
                            background: '#fa8c16',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: '600',
                            marginTop: '2px'
                          }}>
                            {index + 1}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              padding: '12px 16px',
                              background: 'rgba(255,255,255,0.8)',
                              borderRadius: '8px',
                              border: '1px solid #f0f0f0'
                            }}>
                              {suggestion.replace(/[🎯📈💰🔍💡📊📉💸💳💧]/g, '')}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ProCard>
              </Col>
            )}
            
            {/* 下月预测 */}
            <Col span={8}>
              <ProCard 
                title="趋势预测"
                bordered
                headerBordered
                size="small"
                headStyle={{ 
                  background: 'linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%)',
                  borderBottom: '1px solid #adc6ff'
                }}
              >
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      预计净利润区间
                    </Text>
                  </div>
                  
                  <div style={{ 
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#1890ff',
                    marginBottom: '8px'
                  }}>
                    ¥{(deep_analysis.nextMonthPrediction.profitRange[0] / 1000).toFixed(0)}k
                  </div>
                  
                  <div style={{ 
                    fontSize: '12px',
                    color: '#999',
                    marginBottom: '8px'
                  }}>
                    至
                  </div>
                  
                  <div style={{ 
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#1890ff',
                    marginBottom: '20px'
                  }}>
                    ¥{(deep_analysis.nextMonthPrediction.profitRange[1] / 1000).toFixed(0)}k
                  </div>
                  
                  <div style={{ 
                    fontSize: '12px',
                    color: '#666',
                    lineHeight: '1.5',
                    textAlign: 'left',
                    padding: '12px',
                    background: '#fafafa',
                    borderRadius: '6px'
                  }}>
                    <div style={{ fontWeight: '600', marginBottom: '8px' }}>
                      预测依据：
                    </div>
                    {deep_analysis.nextMonthPrediction.keyFactors.map((factor, index) => (
                      <div key={index} style={{ marginBottom: '4px' }}>
                        {index + 1}. {factor}
                      </div>
                    ))}
                  </div>
                </div>
              </ProCard>
            </Col>
          </Row>
        )}

        {/* 分析信息 */}
        <div style={{ 
          marginTop: '12px', 
          padding: '8px', 
          background: '#fafafa', 
          borderRadius: '4px',
          fontSize: '12px',
          color: '#666'
        }}>
          分析时间：{new Date(analysisResult.generated_at).toLocaleString('zh-CN')}
          {ai_enhanced_text && <span> | 已启用EdgeOne AI增强</span>}
        </div>
      </div>
    );
  };

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
          {analysisResult && (
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => generateAnalysis(true)}
              loading={loading}
            >
              重新分析
            </Button>
          )}
          {!analysisResult && (
            <Button
              type="primary"
              size="small"
              icon={<RobotOutlined />}
              onClick={() => generateAnalysis(false)}
              loading={loading}
            >
              生成AI分析
            </Button>
          )}
        </Space>
      }
      headerBordered
      style={{ marginBottom: '24px' }}
    >
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px', color: '#666' }}>
            正在分析财务数据，请稍候...
          </div>
        </div>
      )}

      {error && (
        <Alert
          message="AI分析失败"
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

      {!loading && !error && analysisResult && renderAnalysisContent()}

      {!loading && !error && !analysisResult && (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 40px',
          color: 'rgba(0,0,0,0.45)'
        }}>
          <RobotOutlined style={{ 
            fontSize: '64px', 
            color: '#d9d9d9', 
            marginBottom: '16px' 
          }} />
          <div style={{ 
            fontSize: '16px', 
            fontWeight: '500',
            color: 'rgba(0,0,0,0.65)',
            marginBottom: '8px'
          }}>
            该月份暂无AI分析报告
          </div>
          <div style={{ 
            fontSize: '14px', 
            color: 'rgba(0,0,0,0.45)',
            lineHeight: '1.5'
          }}>
            点击"生成AI分析"按钮创建专业的财务智能分析报告<br/>
            包含风险评估、优化建议和趋势预测
          </div>
        </div>
      )}
    </ProCard>
  );
}
