"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResumeData } from "@/types/resume";

interface TraitsSectionProps {
  form: ReturnType<typeof useForm<ResumeData>>;
}

export function TraitsSection({ form }: TraitsSectionProps) {
  const [projectDetailLength, setProjectDetailLength] = useState(0);
  const maxProjectDetailLength = 200;
  const [hobbyLength, setHobbyLength] = useState(0);
  const maxHobbyLength = 10;

  // 监控 project_detail 和 hobby 字段长度
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "project_detail") {
        setProjectDetailLength(value.project_detail?.length || 0);
      }
      if (name === "hobby") {
        setHobbyLength(value.hobby?.length || 0);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>✨</span> 个人特质
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="character"
          render={({ field }) => (
            <FormItem>
              <FormLabel>请描述您的性格和个性 *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="请输入您的性格特点，如没有请写无..."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="speciality"
          render={({ field }) => (
            <FormItem>
              <FormLabel>您的特长（专业及优势）*</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="请输入您的特长和专业优势，如没有请写无..."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="project_detail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                请描述一个在您职业生涯中对您最有价值的项目，在这个项目中您的收获是什么？*
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="请描述项目经历和收获，如没有请写无..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
              <div className="flex justify-end text-xs text-muted-foreground">
                <span className={projectDetailLength > maxProjectDetailLength ? "text-destructive" : ""}>
                  {projectDetailLength}/{maxProjectDetailLength}
                  {projectDetailLength > maxProjectDetailLength && " (已超出建议字数)"}
                </span>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="job_duty"
          render={({ field }) => (
            <FormItem>
              <FormLabel>请根据您的理解，列出您所应聘职位的工作职责 *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="请列出工作职责，如没有请写无..."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="plan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>请描述您未来三至五年的发展计划和设想 *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="请描述您的职业规划，如没有请写无..."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hobby"
          render={({ field }) => (
            <FormItem>
              <FormLabel>兴趣爱好 *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="请输入您的兴趣爱好，如没有请写无..."
                  className="min-h-[60px]"
                  maxLength={maxHobbyLength}
                  {...field}
                />
              </FormControl>
              <FormMessage />
              <div className="flex justify-end text-xs text-muted-foreground">
                <span className={hobbyLength > maxHobbyLength ? "text-destructive" : ""}>
                  {hobbyLength}/{maxHobbyLength}
                </span>
              </div>
            </FormItem>
          )}
        />

      </CardContent>
    </Card>
  );
}
