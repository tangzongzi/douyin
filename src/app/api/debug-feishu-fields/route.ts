import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { ENV_CONFIG } from '@/config/env';
import { DAILY_FIELD_MAPPING, MONTHLY_FIELD_MAPPING, YEARLY_FIELD_MAPPING, getFieldValue } from '@/config/field-mapping';

// 飞书 API 基础 URL
const FEISHU_BASE_URL = 'https://open.feishu.cn/open-apis';

// 获取访问令牌
async function getAccessToken(): Promise<string> {
  try {
    console.log('[FieldDebug] 正在获取飞书访问令牌...');
    
    const response = await axios.post(`${FEISHU_BASE_URL}/auth/v3/tenant_access_token/internal`, {
      app_id: ENV_CONFIG.FEISHU_APP_ID,
      app_secret: ENV_CONFIG.FEISHU_APP_SECRET,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
    
    if (response.data.code === 0) {
      console.log('[FieldDebug] 访问令牌获取成功');
      return response.data.tenant_access_token;
    }
    throw new Error(`获取访问令牌失败: ${response.data.msg || '未知错误'}`);
  } catch (error) {
    console.error('[FieldDebug] 获取飞书访问令牌失败:', error);
    throw error;
  }
}

// 获取表格数据并分析字段
async function analyzeTableFields(tableId: string, tableName: string, expectedMapping: Record<string, string>) {
  try {
    console.log(`[FieldDebug] 开始分析表格字段: ${tableName} (${tableId})`);
    
    const accessToken = await getAccessToken();
    
    const url = `${FEISHU_BASE_URL}/bitable/v1/apps/${ENV_CONFIG.FEISHU_APP_TOKEN}/tables/${tableId}/records`;
    console.log(`[FieldDebug] 请求URL: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      params: {
        page_size: 5, // 只取前5条记录进行分析
      },
      timeout: 15000,
    });

    if (response.data.code !== 0) {
      throw new Error(`获取表格数据失败: ${response.data.msg || '未知错误'}`);
    }

    const items = response.data.data?.items || [];
    console.log(`[FieldDebug] 获取到 ${items.length} 条记录用于字段分析`);

    // 分析字段结构
    const fieldAnalysis = {
      tableName,
      tableId,
      recordCount: items.length,
      actualFields: [] as string[],
      expectedFields: Object.keys(expectedMapping),
      fieldMatching: {} as Record<string, { found: boolean; actualName?: string; value?: any; type?: string }>,
      sampleData: [] as any[]
    };

    if (items.length > 0) {
      // 获取所有实际存在的字段名
      fieldAnalysis.actualFields = Object.keys(items[0].fields || {});
      
      // 检查每个期望字段的匹配情况
      for (const [expectedField, dbField] of Object.entries(expectedMapping)) {
        const record = items[0];
        const value = getFieldValue(record, expectedField);
        const actualFieldName = fieldAnalysis.actualFields.find(field => 
          field === expectedField || 
          field.includes(expectedField) || 
          expectedField.includes(field)
        );
        
        fieldAnalysis.fieldMatching[expectedField] = {
          found: actualFieldName !== undefined || value !== 0,
          actualName: actualFieldName,
          value: value,
          type: typeof value,
          dbField
        };
      }

      // 保存前3条记录作为样本数据
      fieldAnalysis.sampleData = items.slice(0, 3).map((item, index) => ({
        recordIndex: index,
        recordId: item.record_id,
        allFields: item.fields,
        parsedValues: Object.fromEntries(
          Object.keys(expectedMapping).map(field => [
            field,
            getFieldValue(item, field)
          ])
        )
      }));
    }

    return fieldAnalysis;
  } catch (error) {
    console.error(`[FieldDebug] 分析表格字段失败: ${tableName}`, error);
    return {
      tableName,
      tableId,
      error: error instanceof Error ? error.message : '未知错误',
      errorDetails: axios.isAxiosError(error) ? {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      } : undefined
    };
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table') || 'all';
  const detailed = searchParams.get('detailed') === 'true';
  
  try {
    console.log(`[FieldDebug] 开始字段调试分析，表格: ${table}, 详细模式: ${detailed}`);
    
    const results: any = {
      timestamp: new Date().toISOString(),
      analysis: {},
      summary: {
        totalTables: 0,
        successfulTables: 0,
        failedTables: 0,
        issues: [] as string[]
      }
    };

    const tablesToAnalyze = [];
    
    if (table === 'all' || table === 'daily') {
      tablesToAnalyze.push({
        name: 'daily',
        id: ENV_CONFIG.TABLE_BASE_DAILY,
        mapping: DAILY_FIELD_MAPPING
      });
    }
    
    if (table === 'all' || table === 'monthly') {
      tablesToAnalyze.push({
        name: 'monthly',
        id: ENV_CONFIG.TABLE_MONTH_SUMMARY,
        mapping: MONTHLY_FIELD_MAPPING
      });
    }
    
    if (table === 'all' || table === 'yearly') {
      tablesToAnalyze.push({
        name: 'yearly',
        id: ENV_CONFIG.TABLE_YEAR_PROFIT,
        mapping: YEARLY_FIELD_MAPPING
      });
    }

    results.summary.totalTables = tablesToAnalyze.length;

    // 并行分析所有表格
    const analysisPromises = tablesToAnalyze.map(({ name, id, mapping }) =>
      analyzeTableFields(id, name, mapping)
    );

    const analysisResults = await Promise.all(analysisPromises);

    // 整理分析结果
    for (const result of analysisResults) {
      results.analysis[result.tableName] = result;
      
      if (result.error) {
        results.summary.failedTables++;
        results.summary.issues.push(`${result.tableName}: ${result.error}`);
      } else {
        results.summary.successfulTables++;
        
        // 检查字段匹配问题
        if (result.fieldMatching) {
          const unmatchedFields = Object.entries(result.fieldMatching)
            .filter(([_, match]) => !match.found)
            .map(([field, _]) => field);
          
          if (unmatchedFields.length > 0) {
            results.summary.issues.push(
              `${result.tableName}: 未匹配字段 [${unmatchedFields.join(', ')}]`
            );
          }
        }
      }
    }

    // 如果不是详细模式，移除样本数据以减少响应大小
    if (!detailed) {
      Object.values(results.analysis).forEach((analysis: any) => {
        if (analysis.sampleData) {
          analysis.sampleData = analysis.sampleData.map((sample: any) => ({
            recordIndex: sample.recordIndex,
            recordId: sample.recordId,
            parsedValues: sample.parsedValues
            // 移除 allFields 以减少数据量
          }));
        }
      });
    }

    console.log(`[FieldDebug] 字段分析完成，成功: ${results.summary.successfulTables}/${results.summary.totalTables}`);

    return NextResponse.json({
      success: true,
      message: '字段分析完成',
      ...results
    });
    
  } catch (error) {
    console.error('[FieldDebug] 字段调试失败:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : '字段调试失败',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
