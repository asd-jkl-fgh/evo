import { ResumeData } from '@/types/resume';

const FEISHU_BASE = 'https://open.feishu.cn/open-apis';

interface TokenResponse {
  code: number;
  msg: string;
  tenant_access_token?: string;
  expire?: number;
}

interface UploadAllResponse {
  code: number;
  msg: string;
  data?: { file_token: string };
}

interface CreateRecordResponse {
  code: number;
  msg: string;
  data?: { record: { record_id: string } };
}

let cachedToken: { value: string; expiresAt: number } | null = null;

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`环境变量 ${name} 未配置`);
  return v;
}

export async function getTenantAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.value;
  }

  const appId = requireEnv('FEISHU_APP_ID');
  const appSecret = requireEnv('FEISHU_APP_SECRET');

  const res = await fetch(`${FEISHU_BASE}/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
  });

  const data = (await res.json()) as TokenResponse;
  if (data.code !== 0 || !data.tenant_access_token) {
    throw new Error(`获取飞书 token 失败: ${data.msg}`);
  }

  cachedToken = {
    value: data.tenant_access_token,
    expiresAt: now + (data.expire ?? 7200) * 1000,
  };
  return data.tenant_access_token;
}

export async function uploadPdfToBitable(filename: string, buffer: Buffer): Promise<string> {
  const token = await getTenantAccessToken();
  const bitableToken = requireEnv('FEISHU_BITABLE_TOKEN');

  const form = new FormData();
  form.append('file_name', filename);
  form.append('parent_type', 'bitable_file');
  form.append('parent_node', bitableToken);
  form.append('size', String(buffer.length));
  form.append(
    'file',
    new Blob([new Uint8Array(buffer)], { type: 'application/pdf' }),
    filename,
  );

  const res = await fetch(`${FEISHU_BASE}/drive/v1/medias/upload_all`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  const data = (await res.json()) as UploadAllResponse;
  if (data.code !== 0 || !data.data?.file_token) {
    throw new Error(`上传附件失败: ${data.msg}`);
  }
  return data.data.file_token;
}

function buildFields(data: ResumeData, fileToken: string): Record<string, unknown> {
  return {
    '姓名': data.name,
    '手机': data.mobilephone,
    '应聘岗位': data.post,
    '提交时间': Date.now(),
    '简历附件': [{ file_token: fileToken }],
  };
}

export async function createBitableRecord(
  data: ResumeData,
  fileToken: string,
): Promise<string> {
  const token = await getTenantAccessToken();
  const bitableToken = requireEnv('FEISHU_BITABLE_TOKEN');
  const tableId = requireEnv('FEISHU_TABLE_ID');

  const res = await fetch(
    `${FEISHU_BASE}/bitable/v1/apps/${bitableToken}/tables/${tableId}/records`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields: buildFields(data, fileToken) }),
    },
  );

  const result = (await res.json()) as CreateRecordResponse;
  if (result.code !== 0 || !result.data?.record?.record_id) {
    throw new Error(`写入多维表格失败: ${result.msg}`);
  }
  return result.data.record.record_id;
}
