"use client";

import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResumeData } from "@/types/resume";

interface ChannelSectionProps {
  form: ReturnType<typeof useForm<ResumeData>>;
}

export function ChannelSection({ form }: ChannelSectionProps) {
  const watchChannelType = form.watch("channel_type");
  const watchCurrentStatus = form.watch("current_status");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>📋</span> 岗位信息
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 应聘渠道选择 - 横向排列 */}
        <FormField
          control={form.control}
          name="channel_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>应聘渠道 *</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-wrap gap-6"
                >
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <RadioGroupItem value="网络渠道" />
                    </FormControl>
                    <FormLabel className="font-normal whitespace-nowrap">网络渠道</FormLabel>
                  </FormItem>
                  <div className="flex items-center flex-wrap gap-2">
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <RadioGroupItem value="内部推荐" />
                      </FormControl>
                      <FormLabel className="font-normal whitespace-nowrap">公司内部推荐</FormLabel>
                    </FormItem>
                    {watchChannelType === "内部推荐" && (
                      <FormField
                        control={form.control}
                        name="channel_referrer"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="推荐人姓名，如没有请写无" {...field} className="w-40" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  <div className="flex items-center flex-wrap gap-2">
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <RadioGroupItem value="其他渠道" />
                      </FormControl>
                      <FormLabel className="font-normal whitespace-nowrap">其他渠道</FormLabel>
                    </FormItem>
                    {watchChannelType === "其他渠道" && (
                      <FormField
                        control={form.control}
                        name="channel_other"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="请填写渠道，如没有请写无" {...field} className="w-40" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 应聘岗位、预计到岗时间、岗位性质 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="post"
            render={({ field }) => (
              <FormItem>
                <FormLabel>应聘岗位 *</FormLabel>
                <FormControl>
                  <Input placeholder="请输入应聘岗位" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="entry_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>预计到岗时间 *</FormLabel>
                <FormControl>
                  <Input placeholder="如：一周内" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="job_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>岗位性质 *</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex gap-4"
                  >
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <RadioGroupItem value="全职" />
                      </FormControl>
                      <FormLabel className="font-normal">全职</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <RadioGroupItem value="兼职" />
                      </FormControl>
                      <FormLabel className="font-normal">兼职</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 当前状态、目前月薪、期望月薪 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <FormLabel>当前状态 *</FormLabel>
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="current_status"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-wrap gap-4"
                      >
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem value="在职" />
                          </FormControl>
                          <FormLabel className="font-normal">在职</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem value="离职" />
                          </FormControl>
                          <FormLabel className="font-normal">离职</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem value="应届生" />
                          </FormControl>
                          <FormLabel className="font-normal">应届生</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem value="其他" />
                          </FormControl>
                          <FormLabel className="font-normal">其他</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
              {watchCurrentStatus === "其他" && (
                <FormField
                  control={form.control}
                  name="current_status_other"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="请说明，如没有请写无" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="current_salary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>目前月薪（税前）*</FormLabel>
                  <FormControl>
                    <Input placeholder="如：8000元" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="salary_expectation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>期望月薪（税前）*</FormLabel>
                  <FormControl>
                    <Input placeholder="如：10000元" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
