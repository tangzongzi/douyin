import type { Metadata } from "next";
import "./globals.css";
import { AntdRegistry } from '@ant-design/nextjs-registry';

export const metadata: Metadata = {
  title: "抖音电商数据看板",
  description: "抖音电商业务数据可视化看板",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <AntdRegistry>
          {children}
        </AntdRegistry>
      </body>
    </html>
  );
}
