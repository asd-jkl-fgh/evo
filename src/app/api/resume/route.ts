import { NextRequest, NextResponse } from 'next/server';
import { ResumeData } from '@/types/resume';
import { generatePDFWithPdfLib, sendToFeishuWebhook } from '@/lib/resume-pdf-template';
import { uploadPdfToBitable, createBitableRecord } from '@/lib/feishu-bitable';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const resumeData: ResumeData = await request.json();

    if (
      !resumeData.channel_type ||
      !resumeData.post ||
      !resumeData.job_type ||
      !resumeData.current_status ||
      !resumeData.salary_expectation ||
      !resumeData.name ||
      !resumeData.sex ||
      !resumeData.birthday ||
      !resumeData.mobilephone ||
      !resumeData.email ||
      !resumeData.declaration
    ) {
      return NextResponse.json({ success: false, error: '请填写所有必填字段' }, { status: 400 });
    }

    const { buffer, filename } = await generatePDFWithPdfLib(resumeData);

    let fileToken: string;
    try {
      fileToken = await uploadPdfToBitable(filename, buffer);
    } catch (uploadError) {
      console.error('附件上传失败:', uploadError);
      throw new Error('简历文件保存失败，请稍后重试');
    }

    try {
      await createBitableRecord(resumeData, fileToken);
    } catch (recordError) {
      console.error('写入多维表格失败:', recordError);
      throw new Error('简历写入失败，请稍后重试');
    }

    if (process.env.FEISHU_WEBHOOK_URL) {
      const bitableToken = process.env.FEISHU_BITABLE_TOKEN ?? '';
      const recordLink = `https://feishu.cn/base/${bitableToken}`;
      sendToFeishuWebhook(resumeData, recordLink).catch((err) =>
        console.error('飞书通知发送失败:', err),
      );
    }

    return NextResponse.json({ success: true, message: '简历提交成功' });
  } catch (error: unknown) {
    console.error('简历提交错误:', error);
    const message = error instanceof Error ? error.message : '提交失败，请稍后重试';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
