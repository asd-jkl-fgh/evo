'use client';

import dynamic from 'next/dynamic';

const ResumeForm = dynamic(() => import('@/components/resume/ResumeForm').then(mod => ({ default: mod.ResumeForm })), {
  ssr: false,
  loading: () => <div className="p-8 text-center text-gray-500">加载中...</div>,
});

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Logo 和标题区域 */}
        <div className="flex items-center mb-8">
          {/* Logo */}
          <img 
            src="/logo.png" 
            alt="EVOLUTICAN" 
            className="h-8 w-auto"
          />
          {/* 标题 */}
          <div className="ml-6 flex-1 text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              应聘人员信息登记表
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              请认真填写以下信息，带 * 为必填项
            </p>
          </div>
          {/* 右侧占位保持对称 */}
          <div className="h-8 w-40"></div>
        </div>

        {/* 表单内容 */}
        <ResumeForm />

        {/* 页脚 */}
        <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>招聘系统-EVO</p>
        </div>
      </div>
    </div>
  );
}
