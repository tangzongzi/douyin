import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    env_check: {
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '已设置' : '未设置',
      SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '已设置' : '未设置',
      SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '已设置' : '未设置',
      FEISHU_APP_ID: process.env.FEISHU_APP_ID ? '已设置' : '未设置',
      FEISHU_APP_SECRET: process.env.FEISHU_APP_SECRET ? '已设置' : '未设置',
    },
    actual_values: {
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'undefined',
      SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'undefined',
    }
  });
}
