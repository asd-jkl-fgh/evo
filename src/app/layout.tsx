import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

export const metadata: Metadata = {
  title: '应聘人员信息登记表 | 招聘系统',
  description: '应聘人员信息登记表系统，填写个人资料、教育经历、工作经历等信息，自动生成PDF简历并发送至飞书。',
  keywords: [
    '应聘登记表',
    '简历填写',
    '招聘系统',
    '人才招聘',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
