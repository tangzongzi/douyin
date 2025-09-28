'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Spin, Typography, Space, Tag, Progress, Divider } from 'antd';
import { RobotOutlined, ReloadOutlined, FileTextOutlined, TrophyOutlined } from '@ant-design/icons';
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
        {/* AI增强分析（如果有） */}
        {ai_enhanced_text && (
          <Card 
            size="small" 
            title={
              <Space>
                <RobotOutlined style={{ color: '#1890ff' }} />
                <span>EdgeOne AI深度分析</span>
                <Tag color="blue">DeepSeek-R1</Tag>
              </Space>
            }
            style={{ marginBottom: '16px' }}
          >
            <div style={{ 
              whiteSpace: 'pre-wrap', 
              lineHeight: 1.6,
              fontSize: '14px'
            }}>
              {ai_enhanced_text}
            </div>
          </Card>
        )}

        {/* 财务健康度评分 */}
        {deep_analysis && (
          <Card size="small" title="财务健康度评估" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              {renderHealthScore(deep_analysis.healthScore, deep_analysis.healthLevel)}
              <div style={{ flex: 1 }}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div>
                    <Text strong>盈利能力：</Text>
                    <Progress 
                      percent={(deep_analysis.profitabilityScore / 30) * 100} 
                      size="small" 
                      format={() => `${deep_analysis.profitabilityScore}/30`}
                    />
                  </div>
                  <div>
                    <Text strong>风险控制：</Text>
                    <Progress 
                      percent={(deep_analysis.riskControlScore / 30) * 100} 
                      size="small"
                      format={() => `${deep_analysis.riskControlScore}/30`}
                    />
                  </div>
                  <div>
                    <Text strong>成本控制：</Text>
                    <Progress 
                      percent={(deep_analysis.costControlScore / 40) * 100} 
                      size="small"
                      format={() => `${deep_analysis.costControlScore}/40`}
                    />
                  </div>
                </Space>
              </div>
            </div>
          </Card>
        )}

        {/* 简单分析结果 */}
        {simple_analysis && (
          <Card size="small" title="关键指标分析" style={{ marginBottom: '16px' }}>
            {simple_analysis.positiveFactors.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <Text strong style={{ color: '#52c41a' }}>✅ 积极因素：</Text>
                <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                  {simple_analysis.positiveFactors.map((factor, index) => (
                    <li key={index} style={{ color: '#52c41a', fontSize: '13px' }}>{factor}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {simple_analysis.riskWarnings.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <Text strong style={{ color: '#ff4d4f' }}>⚠️ 风险提醒：</Text>
                <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                  {simple_analysis.riskWarnings.map((warning, index) => (
                    <li key={index} style={{ color: '#ff4d4f', fontSize: '13px' }}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {simple_analysis.keyInsights.length > 0 && (
              <div>
                <Text strong style={{ color: '#1890ff' }}>💡 关键洞察：</Text>
                <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                  {simple_analysis.keyInsights.map((insight, index) => (
                    <li key={index} style={{ color: '#1890ff', fontSize: '13px' }}>{insight}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        )}

        {/* 优化建议和预测 */}
        {deep_analysis && (
          <Card size="small" title="优化建议与预测">
            {deep_analysis.optimizationSuggestions.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <Text strong>🎯 优化建议：</Text>
                <ol style={{ margin: '4px 0', paddingLeft: '20px' }}>
                  {deep_analysis.optimizationSuggestions.map((suggestion, index) => (
                    <li key={index} style={{ fontSize: '13px', marginBottom: '4px' }}>{suggestion}</li>
                  ))}
                </ol>
              </div>
            )}
            
            <div>
              <Text strong>📈 下月预测：</Text>
              <div style={{ marginTop: '8px', padding: '8px', background: '#f6ffed', borderRadius: '4px' }}>
                <Text>
                  预计净利润区间：¥{deep_analysis.nextMonthPrediction.profitRange[0].toLocaleString()} - 
                  ¥{deep_analysis.nextMonthPrediction.profitRange[1].toLocaleString()}
                </Text>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  {deep_analysis.nextMonthPrediction.keyFactors.join(' | ')}
                </div>
              </div>
            </div>
          </Card>
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
    <Card
      title={
        <Space>
          <RobotOutlined style={{ color: '#1890ff' }} />
          <span>AI智能分析</span>
          <Tag color="blue">{selectedMonth}</Tag>
        </Space>
      }
      extra={
        <Space>
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
          padding: '40px',
          color: '#666'
        }}>
          <RobotOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
          <div>该月份暂无AI分析报告</div>
          <div style={{ fontSize: '12px', marginTop: '8px' }}>
            点击"生成AI分析"按钮创建智能分析报告
          </div>
        </div>
      )}
    </Card>
  );
}
