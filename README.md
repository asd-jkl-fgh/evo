<div align="center">

# Resume Intake

**A modern, self-hosted resume intake platform with full Feishu integration.**

Collect candidate information through a polished form, generate signed PDF resumes,
and deliver them straight into your Feishu group chat and Feishu Bitable — in one pipeline.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)
![pnpm](https://img.shields.io/badge/pnpm-9-f69220?logo=pnpm)
![License](https://img.shields.io/badge/license-MIT-green)

</div>

---

## ✨ Highlights

- **Polished candidate experience** — Built on `shadcn/ui` + `react-hook-form` + `zod`, with a signature canvas and on-the-fly validation.
- **Server-side PDF generation** — `pdf-lib` with embedded Noto Sans SC. Fully rendered Chinese, no subset artifacts.
- **🔔 Feishu Group Chat delivery** — The moment a candidate submits, the configured Feishu group receives a rich interactive card with a one-click link to the record.
- **📊 Feishu Bitable as a database** — Every submission becomes a row in your Bitable, with the generated PDF attached to the record. No separate DB, no S3 bucket.
- **Zero external storage** — PDFs live inside Feishu Drive, bound to the Bitable row. Free, scalable, access-controlled by your workspace.
- **Deploy anywhere** — Vercel, Tencent EdgeOne Pages, Cloudflare Pages, or a self-hosted Node server.

---

## 🏗️ Architecture

```
 ┌──────────────┐     ┌─────────────────────┐     ┌──────────────────┐
 │   Candidate  │───▶ │  Next.js App Router │───▶ │  PDF Generator   │
 │   (Browser)  │     │   /api/resume       │     │  (pdf-lib + NSC) │
 └──────────────┘     └──────────┬──────────┘     └────────┬─────────┘
                                 │                         │
                                 ▼                         ▼
                      ┌─────────────────────┐   ┌──────────────────────┐
                      │  Feishu Open API    │   │  Feishu Drive        │
                      │  tenant_access_token│   │  upload_all (parent  │
                      │  (cached 2h)        │   │  = bitable_file)     │
                      └──────────┬──────────┘   └──────────┬───────────┘
                                 │                         │ file_token
                                 ▼                         ▼
                 ┌─────────────────────────────────────────────────┐
                 │          Feishu Bitable (Records API)           │
                 │   ┌─────────┬──────┬───────┬──────┬─────────┐  │
                 │   │ 姓名    │ 手机 │ 岗位  │ 时间 │ 简历附件 │  │
                 │   └─────────┴──────┴───────┴──────┴─────────┘  │
                 └──────────────────┬──────────────────────────────┘
                                    │
                                    ▼
                      ┌──────────────────────────┐
                      │  Feishu Group Webhook    │
                      │  (interactive card with  │
                      │   direct Bitable link)   │
                      └──────────────────────────┘
```

---

## 🛠 Tech Stack

| Layer        | Choice                                                             |
| ------------ | ------------------------------------------------------------------ |
| Framework    | **Next.js 16** (App Router, Turbopack)                             |
| UI           | **shadcn/ui** on Radix primitives + **Tailwind CSS v4**            |
| Forms        | `react-hook-form` + `zod` with resolver                            |
| PDF          | `pdf-lib` + `@pdf-lib/fontkit`, Noto Sans SC embedded              |
| Integration  | **Feishu Open Platform** (OAuth tokens, Drive, Bitable)            |
| Runtime      | Node.js 20+                                                        |
| Package Mgmt | **pnpm 9** (enforced via `preinstall`)                             |

---

## 🚀 Quick Start

```bash
# 1. Clone
git clone <your-fork> resume-intake && cd resume-intake

# 2. Install
pnpm install

# 3. Configure env
cp .env.example .env.local
# then edit .env.local — see "Environment" below

# 4. Run
pnpm dev
# → http://localhost:5000
```

### Build & Start (production)

```bash
pnpm build
pnpm start
```

---

## 🔐 Environment

Create `.env.local` with these values:

```env
# Feishu self-built app credentials
FEISHU_APP_ID=cli_xxxxxxxxxxxxxxxx
FEISHU_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Feishu Bitable target
FEISHU_BITABLE_TOKEN=xxxxxxxxxxxxxxxxxxxx
FEISHU_TABLE_ID=tblxxxxxxxxxxxxx

# Feishu group chat webhook (optional but recommended)
FEISHU_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/xxxxxxxx
```

### Required Bitable schema

Create the following fields in your target Bitable table (names must match exactly):

| Field   | Type       |
| ------- | ---------- |
| 姓名    | Text       |
| 手机    | Text       |
| 应聘岗位| Text      |
| 提交时间| Date/Time |
| 简历附件| Attachment|

### Required Feishu app permissions

- `bitable:app` — Read & write Bitable records
- `drive:drive` or `drive:file` — Upload PDF attachments

After adding scopes, **publish a new version** of the app, then add the app to your target Bitable (`⋯` → More → Add document app → Manage).

---

## 📁 Project Layout

```
src/
├── app/
│   ├── api/resume/route.ts      # Submission endpoint → PDF → Feishu
│   ├── layout.tsx
│   └── page.tsx                 # The intake form
├── components/
│   ├── resume/                  # Form sections, signature canvas
│   └── ui/                      # shadcn primitives
├── lib/
│   ├── feishu-bitable.ts        # Token cache + upload + record
│   ├── resume-pdf-template.ts   # PDF generator + webhook sender
│   └── utils.ts
└── types/resume.ts

public/
├── fonts/NotoSansSC-Regular.ttf # Embedded CN font
└── logo.png                     # Brand logo
```

---

## 🌐 Deployment

The app is a stateless Next.js application. It runs on any platform supporting a Node.js runtime.

| Platform              | Notes                                                          |
| --------------------- | -------------------------------------------------------------- |
| **Vercel**            | Zero-config. Paste env vars, deploy.                           |
| **Tencent EdgeOne**   | Set install command to `pnpm install`. Needs domain ICP for MLC acceleration. |
| **Cloudflare Pages**  | Works with `@opennextjs/cloudflare` adapter.                   |
| **Self-hosted**       | `pnpm build && pnpm start` behind Nginx / PM2.                 |

---

## 🧠 How it works

1. Candidate fills the form. Client-side `zod` validation catches errors before submit.
2. Browser `POST /api/resume` with the sanitized payload.
3. Server renders a PDF via `pdf-lib` with Noto Sans SC (full embed, no subset — ensures Feishu preview renders correctly).
4. Server fetches a `tenant_access_token` (cached for 2 hours).
5. PDF is streamed to `drive/v1/medias/upload_all` with `parent_type=bitable_file`, returning a `file_token`.
6. A new Bitable record is created with candidate fields plus the attachment pointing at `file_token`.
7. An interactive card is pushed to the Feishu group webhook, linking back to the Bitable.

Total round-trip: ~1-3 seconds.

---

## 🪪 License

MIT. Use it, fork it, ship it.

---

<div align="center">

Built with [Claude Code](https://claude.com/claude-code) · Next.js · Feishu Open Platform

</div>
