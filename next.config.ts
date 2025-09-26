import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 基础配置 - 简化避免构建问题
  experimental: {
    // 只保留核心优化
    optimizePackageImports: ['antd', '@ant-design/pro-components'],
  },
  
  // 外部包配置
  serverExternalPackages: ['@supabase/supabase-js'],
  
  // 编译优化
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
};

export default nextConfig;
