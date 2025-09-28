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
                  value={deep_analysis.healthScore}
                  suffix="/100"
                  valueStyle={{ 
                    color: deep_analysis.healthScore >= 80 ? '#3f8600' : 
                           deep_analysis.healthScore >= 60 ? '#1890ff' : 
                           deep_analysis.healthScore >= 40 ? '#faad14' : '#cf1322'
                  }}
                  prefix={<TrophyOutlined />}
                />
                <div style={{ marginTop: '8px', textAlign: 'center' }}>
                  <Tag color={
                    deep_analysis.healthLevel === 'excellent' ? 'green' :
                    deep_analysis.healthLevel === 'good' ? 'blue' :
                    deep_analysis.healthLevel === 'fair' ? 'orange' : 'red'
                  }>
                    {deep_analysis.healthLevel === 'excellent' ? '优秀' :
                     deep_analysis.healthLevel === 'good' ? '良好' :
                     deep_analysis.healthLevel === 'fair' ? '一般' : '较差'}
                  </Tag>
                </div>
              </ProCard>
            </Col>
            <Col span={6}>
              <ProCard>
                <Statistic
                  title="盈利能力"
                  value={deep_analysis.profitabilityScore}
                  suffix="/30"
                  valueStyle={{ 
                    color: deep_analysis.profitabilityScore >= 25 ? '#3f8600' : 
                           deep_analysis.profitabilityScore >= 20 ? '#1890ff' : '#faad14'
                  }}
                  prefix={<RiseOutlined />}
                />
              </ProCard>
            </Col>
            <Col span={6}>
              <ProCard>
                <Statistic
                  title="风险控制"
                  value={deep_analysis.riskControlScore}
                  suffix="/30"
                  valueStyle={{ 
                    color: deep_analysis.riskControlScore >= 25 ? '#3f8600' : 
                           deep_analysis.riskControlScore >= 20 ? '#1890ff' : '#faad14'
                  }}
                  prefix={<WarningOutlined />}
                />
              </ProCard>
            </Col>
            <Col span={6}>
              <ProCard>
                <Statistic
                  title="成本控制"
                  value={deep_analysis.costControlScore}
                  suffix="/40"
                  valueStyle={{ 
                    color: deep_analysis.costControlScore >= 35 ? '#3f8600' : 
                           deep_analysis.costControlScore >= 30 ? '#1890ff' : '#faad14'
                  }}
                  prefix={<BulbOutlined />}
                />
              </ProCard>
            </Col>
          </Row>
        )}

        {/* 分析结果 - Ant Design Pro风格 */}
        {simple_analysis && (
          <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
            {/* 积极表现 */}
            {simple_analysis.positiveFactors.length > 0 && (
              <Col span={8}>
                <ProCard 
                  title={
                    <Space>
                      <RiseOutlined style={{ color: '#52c41a' }} />
                      <span style={{ color: '#52c41a' }}>积极表现</span>
                    </Space>
                  }
                  bordered
                  headerBordered
                  size="small"
                >
                  {simple_analysis.positiveFactors.map((factor, index) => (
                    <div key={index} style={{ 
                      marginBottom: '8px',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      color: 'rgba(0,0,0,0.85)'
                    }}>
                      <Text style={{ color: '#52c41a', fontWeight: '500' }}>
                        {index + 1}.
                      </Text>
                      <span style={{ marginLeft: '8px' }}>{factor}</span>
                    </div>
                  ))}
                </ProCard>
              </Col>
            )}
            
            {/* 风险警示 */}
            {simple_analysis.riskWarnings.length > 0 && (
              <Col span={8}>
                <ProCard 
                  title={
                    <Space>
                      <WarningOutlined style={{ color: '#ff4d4f' }} />
                      <span style={{ color: '#ff4d4f' }}>风险警示</span>
                    </Space>
                  }
                  bordered
                  headerBordered
                  size="small"
                >
                  {simple_analysis.riskWarnings.map((warning, index) => (
                    <div key={index} style={{ 
                      marginBottom: '8px',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      color: 'rgba(0,0,0,0.85)'
                    }}>
                      <Text style={{ color: '#ff4d4f', fontWeight: '500' }}>
                        {index + 1}.
                      </Text>
                      <span style={{ marginLeft: '8px' }}>{warning}</span>
                    </div>
                  ))}
                </ProCard>
              </Col>
            )}
            
            {/* 深度洞察 */}
            {simple_analysis.keyInsights.length > 0 && (
              <Col span={8}>
                <ProCard 
                  title={
                    <Space>
                      <BulbOutlined style={{ color: '#1890ff' }} />
                      <span style={{ color: '#1890ff' }}>深度洞察</span>
                    </Space>
                  }
                  bordered
                  headerBordered
                  size="small"
                >
                  {simple_analysis.keyInsights.map((insight, index) => (
                    <div key={index} style={{ 
                      marginBottom: '8px',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      color: 'rgba(0,0,0,0.85)'
                    }}>
                      <Text style={{ color: '#1890ff', fontWeight: '500' }}>
                        {index + 1}.
                      </Text>
                      <span style={{ marginLeft: '8px' }}>{insight}</span>
                    </div>
                  ))}
                </ProCard>
              </Col>
            )}
          </Row>
        )}

        {/* 优化建议和预测 - ProCard风格 */}
        {deep_analysis && (
          <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
            {/* 优化建议 */}
            {deep_analysis.optimizationSuggestions.length > 0 && (
              <Col span={16}>
                <ProCard 
                  title={
                    <Space>
                      <BulbOutlined style={{ color: '#fa8c16' }} />
                      <span>优化建议</span>
                    </Space>
                  }
                  bordered
                  headerBordered
                  size="small"
                >
                  {deep_analysis.optimizationSuggestions.map((suggestion, index) => (
                    <div key={index} style={{ 
                      marginBottom: '12px',
                      fontSize: '13px',
                      lineHeight: '1.6',
                      color: 'rgba(0,0,0,0.85)',
                      padding: '8px 12px',
                      background: '#fafafa',
                      borderRadius: '6px',
                      borderLeft: '3px solid #fa8c16'
                    }}>
                      <Text strong style={{ color: '#fa8c16' }}>
                        建议{index + 1}：
                      </Text>
                      <span style={{ marginLeft: '8px' }}>{suggestion}</span>
                    </div>
                  ))}
                </ProCard>
              </Col>
            )}
            
            {/* 下月预测 */}
            <Col span={8}>
              <ProCard 
                title={
                  <Space>
                    <RiseOutlined style={{ color: '#1890ff' }} />
                    <span>下月预测</span>
                  </Space>
                }
                bordered
                headerBordered
                size="small"
              >
                <Statistic
                  title="预计净利润区间"
                  value={`${(deep_analysis.nextMonthPrediction.profitRange[0] / 1000).toFixed(0)}k-${(deep_analysis.nextMonthPrediction.profitRange[1] / 1000).toFixed(0)}k`}
                  prefix="¥"
                  valueStyle={{ color: '#1890ff', fontSize: '18px' }}
                />
                <div style={{ marginTop: '12px', fontSize: '12px', color: '#666' }}>
                  <Text type="secondary">预测依据：</Text>
                  {deep_analysis.nextMonthPrediction.keyFactors.map((factor, index) => (
                    <div key={index} style={{ marginTop: '4px' }}>
                      • {factor}
                    </div>
                  ))}
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
