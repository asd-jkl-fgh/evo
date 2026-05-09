# 项目上下文

## 项目简介

应聘人员信息登记表系统 - 一个用于收集应聘者信息、自动生成PDF简历并发送飞书通知的全栈应用。

### 核心功能

1. **简历表单填写** - 收集应聘者个人信息、教育经历、工作经历、家庭信息等
2. **PDF生成** - 使用 Puppeteer + Chromium 生成格式化的PDF简历
3. **飞书通知** - 通过 Webhook 将简历信息推送到飞书群
4. **多维表格集成** - 可选将数据写入飞书多维表格

### 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4
- **PDF生成**: pdf-lib + fontkit（纯 JavaScript 实现，无系统依赖）
- **字体处理**: fonttools（提取系统字体）
- **表单验证**: React Hook Form + Zod

## 目录结构

```
├── public/                 # 静态资源
│   ├── logo.png            # 公司 Logo
│   └── resumes/            # PDF 简历存储目录
├── scripts/                # 构建与启动脚本
│   ├── build.sh            # 构建脚本
│   ├── dev.sh              # 开发环境启动脚本
│   ├── extract-fonts.py    # 字体提取脚本（TTC转TTF）
│   ├── prepare.sh          # 预处理脚本
│   └── start.sh            # 生产环境启动脚本
├── src/
│   ├── app/                # 页面路由与布局
│   │   ├── api/resume/     # 简历提交 API
│   │   ├── layout.tsx      # 根布局
│   │   └── page.tsx        # 首页
│   ├── components/
│   │   ├── resume/         # 简历表单组件
│   │   │   ├── ResumeForm.tsx
│   │   │   ├── ChannelSection.tsx
│   │   │   ├── PersonalSection.tsx
│   │   │   ├── EducationSection.tsx
│   │   │   ├── CareerSection.tsx
│   │   │   ├── FamilySection.tsx
│   │   │   └── TraitsSection.tsx
│   │   └── ui/             # Shadcn UI 组件库
│   ├── hooks/              # 自定义 Hooks
│   ├── lib/
│   │   ├── resume-pdf.tsx        # PDF 生成主入口
│   │   ├── resume-pdf-lib-v2.ts  # pdf-lib 实现（当前使用）
│   │   ├── resume-pdfmake.ts     # pdfmake 实现（备用）
│   │   ├── resume-pdf-document.tsx # @react-pdf/renderer 组件（备用）
│   │   └── utils.ts              # 通用工具函数
│   ├── types/
│   │   └── resume.ts       # 简历数据类型定义
│   └── server.ts           # 自定义服务端入口
├── next.config.ts          # Next.js 配置
├── package.json            # 项目依赖管理
└── tsconfig.json           # TypeScript 配置
```

## 包管理规范

**仅允许使用 pnpm** 作为包管理器，**严禁使用 npm 或 yarn**。
**常用命令**：
- 安装依赖：`pnpm add <package>`
- 安装开发依赖：`pnpm add -D <package>`
- 安装所有依赖：`pnpm install`
- 移除依赖：`pnpm remove <package>`

## 开发规范

- **项目理解加速**：初始可以依赖项目下`package.json`文件理解项目类型，如果没有或无法理解退化成阅读其他文件。
- **Hydration 错误预防**：严禁在 JSX 渲染逻辑中直接使用 typeof window、Date.now()、Math.random() 等动态数据。必须使用 'use client' 并配合 useEffect + useState 确保动态内容仅在客户端挂载后渲染；同时严禁非法 HTML 嵌套（如 <p> 嵌套 <div>）。

## UI 设计与组件规范

- 模板默认预装核心组件库 `shadcn/ui`，位于`src/components/ui/`目录下
- Next.js 项目**必须默认**采用 shadcn/ui 组件、风格和规范，**除非用户指定用其他的组件和规范。**

## 环境变量配置

创建 `.env.local` 文件配置环境变量：

```env
# 飞书 Webhook URL（用于发送通知消息）
FEISHU_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/your-key

# 飞书多维表格配置（可选）
# FEISHU_APP_ID=your_app_id
# FEISHU_APP_SECRET=your_app_secret
# FEISHU_BITABLE_TOKEN=your_bitable_token
# FEISHU_TABLE_ID=your_table_id
```

## API 接口

### POST /api/resume

提交简历数据，生成PDF并发送飞书通知。

**请求体**: ResumeData 对象（参见 `src/types/resume.ts`）

**响应**:
```json
{
  "success": true,
  "message": "简历提交成功",
  "pdfUrl": "https://domain/resumes/Resume_xxx.pdf"
}
```

## PDF 存储策略

- **开发环境**: PDF 存储在 `public/resumes/` 目录
- **生产环境**: PDF 存储在 `/tmp` 目录（临时存储，建议后续集成对象存储）

## 常见问题

1. **PDF中文显示问题**: 系统使用文泉驿微米黑字体，启动时会自动从 TTC 提取 TTF 格式
2. **字体提取失败**: 确保 Python3 和 fonttools 已安装：`pip3 install fonttools`
3. **飞书通知失败**: 检查 FEISHU_WEBHOOK_URL 是否正确配置
4. **表单验证失败**: 确保所有必填字段已填写

## PDF 生成方案说明

项目使用 **pdf-lib** 作为 PDF 生成引擎，这是一个纯 JavaScript 实现，无需系统依赖。

### 字体处理流程

1. 系统预装了文泉驿微米黑字体（TTC 格式）
2. 启动时通过 `scripts/extract-fonts.py` 提取 TTF 格式字体
3. PDF 生成时嵌入字体子集，确保中文正常显示

### 优势

- 无需 Chromium/Puppeteer，部署简单
- 纯 JavaScript 实现，跨平台兼容
- 字体子集嵌入，PDF 文件体积小
