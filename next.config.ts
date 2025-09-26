import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 性能优化配置
  experimental: {
    // 其他实验性功能
    optimizePackageImports: ['antd', '@ant-design/pro-components']
  },
  
  // Turbopack配置（新格式）
  turbopack: {
    resolveAlias: {
      '@': './src'
    }
  },
  
  // 外部包配置（新格式）
  serverExternalPackages: ['@supabase/supabase-js'],
  
  // 编译优化
  compiler: {
    // 移除console.log (生产环境)
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  
  // 图片优化
  images: {
    formats: ['image/avif', 'image/webp'],
    // 禁用未使用的图片优化减少构建时间
    unoptimized: true
  },
  
  // 输出配置
  output: 'standalone',
  
  // 压缩配置
  compress: true,
  
  // 忽略构建错误（仅开发环境）
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Webpack优化
  webpack: (config, { isServer }) => {
    // 减少模块解析时间
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src')
    };
    
    // 优化代码分割
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }
    
    return config;
  }
};

export default nextConfig;
