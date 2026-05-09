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
  const fields: Record<string, unknown> = {
    '应聘渠道': data.channel_type,
    '推荐人': data.channel_referrer,
    '其他渠道说明': data.channel_other,
    '应聘岗位': data.post,
    '预计到岗时间': data.entry_date,
    '岗位性质': data.job_type,
    '当前状态': data.current_status === '其他' ? data.current_status_other : data.current_status,
    '目前月薪': data.current_salary,
    '期望月薪': data.salary_expectation,
    '姓名（中文）': data.name,
    '姓名（英文）': data.name_en,
    '性别': data.sex,
    '出生日期': data.birthday,
    '毕业院校': data.school,
    '最高学历/专业': data.degree,
    '户籍地': data.household_address,
    '手机': data.mobilephone,
    '电子邮件': data.email,
    '婚姻状况': data.marriage,
    '现居住地址': data.living_address,
    '是否曾患重大疾病': data.has_disease,
    '是否曾发生劳动纠纷': data.has_dispute,
    '是否曾被判刑或拘留': data.has_criminal,
    '性格特点': data.character,
    '特长': data.speciality,
    '项目经历': data.project_detail,
    '工作职责理解': data.job_duty,
    '职业规划': data.plan,
    '兴趣爱好': data.hobby,
    '提交时间': Date.now(),
    '简历附件': [{ file_token: fileToken }],
  };

  if (data.education_detail.length > 0) {
    fields['教育经历'] = data.education_detail
      .map((edu) => `${edu.start}~${edu.end} ${edu.school} ${edu.major} ${edu.degree}`)
      .join('\n');
  }
  if (data.career_detail.length > 0) {
    fields['工作经历'] = data.career_detail
      .map(
        (work) =>
          `${work.start}~${work.end} ${work.company} ${work.department} ${work.job} 证明人:${work.reference_name || '无'} 联系方式:${work.reference_contact || '无'}`,
      )
      .join('\n');
  }
  if (data.family_info.length > 0) {
    fields['家庭信息'] = data.family_info
      .map((f) => `${f.name}(${f.relation}) ${f.organ} ${f.work}`)
      .join('\n');
  }

  return fields;
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
