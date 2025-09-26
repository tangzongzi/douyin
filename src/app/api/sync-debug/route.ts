import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'all';
  const force = searchParams.get('force') === 'true';
  const range = searchParams.get('range');
  
  return NextResponse.json({
    success: true,
    message: '参数调试信息',
    data: {
      receivedParameters: {
        type,
        force,
        range,
        rawForceParam: searchParams.get('force'),
        allParams: Object.fromEntries(searchParams.entries())
      },
      timestamp: new Date().toISOString()
    }
  });
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'all';
  const force = searchParams.get('force') === 'true';
  const range = searchParams.get('range');
  
  // 模拟处理逻辑
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return NextResponse.json({
    success: true,
    message: `调试同步请求已处理 - Force模式: ${force ? '启用' : '禁用'}`,
    data: {
      simulatedSync: {
        type,
        forceMode: force,
        range,
        action: force ? '强制覆盖所有数据' : '只同步新数据',
        affectedLogic: force ? 'DELETE + INSERT 模式' : 'UPSERT 模式'
      },
      parameters: Object.fromEntries(searchParams.entries()),
      timestamp: new Date().toISOString()
    }
  });
}
