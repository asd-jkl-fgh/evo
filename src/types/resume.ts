export interface EducationDetail {
  id: string;
  start: string;
  end: string;
  school: string;
  major: string;
  degree: string;
  certificate: string;
}

export interface CareerDetail {
  id: string;
  start: string;
  end: string;
  company: string;
  department: string;
  job: string;
  salary: string;
  reason: string;
  reference_name: string; // 证明人
  reference_contact: string; // 联系方式
}

export interface FamilyInfo {
  id: string;
  name: string;
  relation: string;
  organ: string;
  work: string;
  age: string;
}

export interface ResumeData {
  // 应聘渠道
  channel_type: string; // 网络渠道/内部推荐/其他渠道
  channel_referrer: string; // 推荐人姓名
  channel_other: string; // 其他渠道说明
  
  // 应聘信息
  post: string; // 应聘岗位
  entry_date: string; // 预计到岗时间
  job_type: string; // 岗位性质（全职/兼职）
  current_status: string; // 当前状态（在职/离职/应届生/其他）
  current_status_other: string; // 当前状态其他说明
  current_salary: string; // 目前月薪
  salary_expectation: string; // 期望月薪
  
  // 个人资料
  name: string; // 姓名（中文）
  name_en: string; // 姓名（英文）
  sex: string; // 性别
  birthday: string; // 出生日期
  
  // 学历信息
  school: string; // 毕业院校
  degree: string; // 最高学历
  major: string; // 专业
  
  // 联系方式
  household_address: string; // 户籍地
  mobilephone: string; // 手机
  email: string; // 电子邮件
  
  // 婚姻状况
  marriage: string; // 未婚/已婚未育/已婚已育/其他
  
  // 地址
  living_address: string; // 现居住地址及邮政编码
  
  // 健康和法律状况
  has_disease: string; // 是否曾患重大疾病
  has_dispute: string; // 是否曾发生劳动纠纷
  has_criminal: string; // 是否曾被判刑或拘留
  
  // 教育经历
  education_detail: EducationDetail[];
  
  // 工作经历
  career_detail: CareerDetail[];
  
  // 个人特质
  character: string;
  speciality: string;
  project_detail: string;
  job_duty: string;
  plan: string;
  
  // 家庭信息
  family_info: FamilyInfo[];
  
  // 其他信息
  hobby: string;

  // 声明
  declaration: boolean;
  signature: string; // Base64 签名字符串
  signatureDate: string; // Base64 日期签名字符串
}

export const initialResumeData: ResumeData = {
  channel_type: '',
  channel_referrer: '',
  channel_other: '',
  post: '',
  entry_date: '',
  job_type: '',
  current_status: '',
  current_status_other: '',
  current_salary: '',
  salary_expectation: '',
  name: '',
  name_en: '',
  sex: '',
  birthday: '',
  school: '',
  degree: '',
  major: '',
  household_address: '',
  mobilephone: '',
  email: '',
  marriage: '',
  living_address: '',
  has_disease: '',
  has_dispute: '',
  has_criminal: '',
  education_detail: [],
  career_detail: [],
  character: '',
  speciality: '',
  project_detail: '',
  job_duty: '',
  plan: '',
  family_info: [],
  hobby: '',
  declaration: false,
  signature: '',
  signatureDate: '',
};
