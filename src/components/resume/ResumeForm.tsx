"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormField } from "@/components/ui/form";
import { toast } from "sonner";
import { ResumeData, initialResumeData } from "@/types/resume";
import { ChannelSection } from "./ChannelSection";
import { PersonalSection } from "./PersonalSection";
import { EducationSection } from "./EducationSection";
import { CareerSection } from "./CareerSection";
import { FamilySection } from "./FamilySection";
import { TraitsSection } from "./TraitsSection";
import { SignatureCanvas } from "./SignatureCanvas";
import { useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";

const resumeSchema = z.object({
  // 应聘渠道
  channel_type: z.string().min(1, "请选择应聘渠道"),
  channel_referrer: z.string(),
  channel_other: z.string(),
  
  // 应聘信息
  post: z.string().min(1, "请输入应聘岗位"),
  entry_date: z.string().min(1, "请填写预计到岗时间"),
  job_type: z.string().min(1, "请选择岗位性质"),
  current_status: z.string().min(1, "请选择当前状态"),
  current_status_other: z.string(),
  current_salary: z.string().min(1, "请填写目前月薪"),
  salary_expectation: z.string().min(1, "请输入期望月薪"),
  
  // 个人资料
  name: z.string().min(1, "请输入姓名"),
  name_en: z.string().min(1, "请输入英文名"),
  sex: z.string().min(1, "请选择性别"),
  birthday: z.string().min(1, "请选择出生日期"),
  school: z.string().min(1, "请填写毕业院校"),
  degree: z.string().min(1, "请填写最高学历"),
  major: z.string().min(1, "请填写专业"),
  household_address: z.string().min(1, "请填写户籍地"),
  mobilephone: z.string().min(11, "请输入正确的手机号码"),
  email: z.string().email("请输入正确的邮箱地址"),
  marriage: z.string().min(1, "请选择婚姻状况"),
  living_address: z.string().min(1, "请填写现居住地址"),
  has_disease: z.string().min(1, "请选择是否曾患重大疾病"),
  has_dispute: z.string().min(1, "请选择是否曾发生劳动纠纷"),
  has_criminal: z.string().min(1, "请选择是否有犯罪记录"),
  
  // 教育经历
  education_detail: z.array(z.object({
    id: z.string(),
    start: z.string().min(1, "请填写开始时间"),
    end: z.string().min(1, "请填写结束时间"),
    school: z.string().min(1, "请填写学校名称"),
    major: z.string().min(1, "请填写专业"),
    degree: z.string().min(1, "请填写学历"),
    certificate: z.string().min(1, "请填写证书/学位"),
  })).min(1, "请至少填写1条教育经历"),
  
  // 工作经历
  career_detail: z.array(z.object({
    id: z.string(),
    start: z.string().min(1, "请填写开始时间"),
    end: z.string().min(1, "请填写结束时间"),
    company: z.string().min(1, "请填写公司名称"),
    department: z.string().min(1, "请填写部门"),
    job: z.string().min(1, "请填写职位"),
    salary: z.string().min(1, "请填写薪资"),
    reason: z.string().min(1, "请填写离职原因"),
    reference_name: z.string().min(1, "请填写证明人"),
    reference_contact: z.string().min(1, "请填写联系方式"),
  })).min(1, "请至少填写1条工作经历"),
  
  // 个人特质
  character: z.string().min(1, "请填写性格特点"),
  speciality: z.string().min(1, "请填写特长"),
  project_detail: z.string().min(1, "请填写项目经历"),
  job_duty: z.string().min(1, "请填写工作职责理解"),
  plan: z.string().min(1, "请填写职业规划"),
  
  // 家庭信息
  family_info: z.array(z.object({
    id: z.string(),
    name: z.string().min(1, "请填写姓名"),
    relation: z.string().min(1, "请填写关系"),
    organ: z.string().min(1, "请填写工作单位"),
    work: z.string().min(1, "请填写职位"),
    age: z.string().min(1, "请填写年龄"),
  })).min(1, "请至少填写1条家庭信息"),
  
  // 其他信息
  hobby: z.string().min(1, "请填写兴趣爱好"),

  // 声明
  declaration: z.boolean().refine((val) => val === true, {
    message: "请确认信息真实有效",
  }),
  signature: z.string().min(1, "请签名"),
  signatureDate: z.string().min(1, "请填写日期"),
}).superRefine((data, ctx) => {
  // 应聘渠道条件验证
  if (data.channel_type === '内部推荐' && !data.channel_referrer.trim()) {
    ctx.addIssue({
      path: ['channel_referrer'],
      message: '选择内部推荐时，请填写推荐人姓名',
      code: z.ZodIssueCode.custom,
    });
  }
  if (data.channel_type === '其他渠道' && !data.channel_other.trim()) {
    ctx.addIssue({
      path: ['channel_other'],
      message: '选择其他渠道时，请填写渠道说明',
      code: z.ZodIssueCode.custom,
    });
  }

  // 当前状态条件验证
  if (data.current_status === '其他' && !data.current_status_other.trim()) {
    ctx.addIssue({
      path: ['current_status_other'],
      message: '选择其他状态时，请填写状态说明',
      code: z.ZodIssueCode.custom,
    });
  }
});

export function ResumeForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ResumeData>({
    resolver: zodResolver(resumeSchema) as any,
    defaultValues: initialResumeData,
    mode: "onChange",
  });

  const onSubmit = async (data: ResumeData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("提交成功", {
          description: "您的简历已成功提交，我们会尽快与您联系！",
        });
        form.reset(initialResumeData);
      } else {
        throw new Error(result.error || "提交失败");
      }
    } catch (error: any) {
      toast.error("提交失败", {
        description: error.message || "提交过程中出现错误，请稍后重试",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理表单验证错误
  const onInvalid = (errors: any) => {
    console.log("表单验证错误:", errors);
    
    // 收集所有错误信息
    const errorMessages: string[] = [];
    
    if (errors.channel_type) errorMessages.push("请选择应聘渠道");
    if (errors.channel_referrer) errorMessages.push("请填写推荐人");
    if (errors.channel_other) errorMessages.push("请填写其他渠道");
    if (errors.post) errorMessages.push("请输入应聘岗位");
    if (errors.entry_date) errorMessages.push("请填写预计到岗时间");
    if (errors.job_type) errorMessages.push("请选择岗位性质");
    if (errors.current_status) errorMessages.push("请选择当前状态");
    if (errors.current_salary) errorMessages.push("请填写目前月薪");
    if (errors.salary_expectation) errorMessages.push("请输入期望月薪");
    if (errors.name) errorMessages.push("请输入姓名");
    if (errors.name_en) errorMessages.push("请输入英文名");
    if (errors.sex) errorMessages.push("请选择性别");
    if (errors.birthday) errorMessages.push("请选择出生日期");
    if (errors.school) errorMessages.push("请填写毕业院校");
    if (errors.degree) errorMessages.push("请填写学历/专业");
    if (errors.household_address) errorMessages.push("请填写户籍地");
    if (errors.mobilephone) errorMessages.push("请输入正确的手机号码");
    if (errors.email) errorMessages.push("请输入正确的邮箱地址");
    if (errors.marriage) errorMessages.push("请选择婚姻状况");
    if (errors.living_address) errorMessages.push("请填写现居住地址");
    if (errors.has_disease) errorMessages.push("请选择健康状况");
    if (errors.has_dispute) errorMessages.push("请选择劳动纠纷情况");
    if (errors.has_criminal) errorMessages.push("请选择犯罪记录情况");
    if (errors.education_detail) errorMessages.push("请至少填写1条教育经历");
    if (errors.career_detail) errorMessages.push("请至少填写1条工作经历");
    if (errors.character) errorMessages.push("请填写性格特点");
    if (errors.speciality) errorMessages.push("请填写特长");
    if (errors.project_detail) errorMessages.push("请填写项目经历");
    if (errors.job_duty) errorMessages.push("请填写工作职责");
    if (errors.plan) errorMessages.push("请填写职业规划");
    if (errors.family_info) errorMessages.push("请至少填写1条家庭信息");
    if (errors.hobby) errorMessages.push("请填写兴趣爱好");
    if (errors.health) errorMessages.push("请填写健康状况");
    if (errors.criminal) errorMessages.push("请填写犯罪记录");
    if (errors.declaration) errorMessages.push("请勾选信息真实性声明");
    if (errors.signature) errorMessages.push("请签名");
    if (errors.signatureDate) errorMessages.push("请填写日期");
    
    toast.error("表单验证失败", {
      description: errorMessages.length > 0 
        ? errorMessages.slice(0, 3).join("、") + (errorMessages.length > 3 ? "..." : "")
        : "请检查表单填写是否完整",
    });
  };

  return (
    <Form {...form}>
      <form suppressHydrationWarning onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6 pb-8">
        {/* 应聘渠道 */}
        <ChannelSection form={form} />

        {/* 个人资料 */}
        <PersonalSection form={form} />

        {/* 教育经历 */}
        <EducationSection form={form} />

        {/* 家庭信息 */}
        <FamilySection form={form} />

        {/* 工作经历 */}
        <CareerSection form={form} />

        {/* 个人特质 */}
        <TraitsSection form={form} />

        {/* 声明 */}
        <div className="p-4 bg-gray-50 rounded-lg space-y-4">
          <div className="grid gap-1.5 leading-none">
            <label className="text-sm font-medium leading-none">
              个人资料保障声明
            </label>
            <p className="text-sm text-gray-500">
              本人已经明白及接受上述之个人资料保障原则。同时，有关本人在求职申请表上所填写之一切均真实及正确。在必要时同意授权上海进化时代营销策划有限公司对上述信息进行核实确认。一旦以上任意陈述被发现不实或本人蓄意隐瞒相关事实，公司有权立即解除劳动关系并不给予任何经济补偿。
            </p>
          </div>

          {/* 签名区域 - 使用 FormField 嵌套包装 */}
          <FormField
            control={form.control}
            name="signature"
            render={({ field: signatureField }) => (
              <FormField
                control={form.control}
                name="signatureDate"
                render={({ field: dateField }) => (
                  <SignatureCanvas
                    signatureValue={signatureField.value || ''}
                    signatureDateValue={dateField.value || ''}
                    onSignatureChange={signatureField.onChange}
                    onSignatureDateChange={dateField.onChange}
                  />
                )}
              />
            )}
          />

          {/* 声明确认勾选 */}
          <div className="flex items-start space-x-2">
            <FormField
              control={form.control}
              name="declaration"
              render={({ field }) => (
                <Checkbox
                  id="declaration"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="declaration"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                我确认以上信息真实有效
              </label>
              {form.formState.errors.declaration && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.declaration.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 提交按钮 */}
        <div className="flex justify-center">
          <Button
            type="submit"
            size="lg"
            className="px-12"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            提交简历
          </Button>
        </div>
      </form>
    </Form>
  );
}
