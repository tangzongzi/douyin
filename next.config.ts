import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 基础配置 - 修复构建问题
  output: 'standalone',
  
  // 实验性功能配置
  experimental: {
    // 只保留核心优化
    optimizePackageImports: ['antd', '@ant-design/pro-components'],
    // 禁用有问题的CSS优化避免critters卡死
    optimizeCss: false,
  },
  
  // 外部包配置
  serverExternalPackages: ['@supabase/supabase-js'],
  
  // 编译优化 - 修复critters问题
  compiler: {
    // 生产环境移除console.log
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  
  // 图片优化 - 简化配置
  images: {
    unoptimized: true
  },
  
  // TypeScript配置
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Next.js 15已默认使用SWC
  
  // 环境变量
  env: {
    SKIP_ENV_VALIDATION: 'true',
  },
};

export default nextConfig;
