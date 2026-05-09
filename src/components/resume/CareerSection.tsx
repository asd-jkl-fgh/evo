"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResumeData, CareerDetail } from "@/types/resume";
import { Plus, Trash2, Pencil } from "lucide-react";
import { useState } from "react";
import { FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface CareerSectionProps {
  form: ReturnType<typeof useForm<ResumeData>>;
}

export function CareerSection({ form }: CareerSectionProps) {
  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "career_detail",
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [currentCareer, setCurrentCareer] = useState<Partial<CareerDetail>>({});

  const handleAdd = () => {
    setEditingIndex(-1);
    setCurrentCareer({
      id: Date.now().toString(),
      start: "",
      end: "",
      company: "",
      department: "",
      job: "",
      salary: "",
      reason: "",
      reference_name: "",
      reference_contact: "",
    });
    setDialogOpen(true);
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setCurrentCareer(form.getValues(`career_detail.${index}`));
    setDialogOpen(true);
  };

  const handleConfirm = () => {
    if (currentCareer.start && currentCareer.company) {
      if (editingIndex >= 0) {
        update(editingIndex, currentCareer as CareerDetail);
      } else {
        append(currentCareer as CareerDetail);
      }
      setDialogOpen(false);
      setEditingIndex(-1);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span>💼</span> 工作经历
          </span>
          <Button type="button" size="sm" onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-1" /> 添加
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {fields.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>起止年月</TableHead>
                <TableHead>公司名称</TableHead>
                <TableHead>部门</TableHead>
                <TableHead>职务</TableHead>
                <TableHead>薪资/津贴</TableHead>
                <TableHead>离职原因</TableHead>
                <TableHead>证明人</TableHead>
                <TableHead>联系方式</TableHead>
                <TableHead className="w-16">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, index) => (
                <TableRow key={field.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    {form.getValues(`career_detail.${index}.start`)} ~{" "}
                    {form.getValues(`career_detail.${index}.end`)}
                  </TableCell>
                  <TableCell>{form.getValues(`career_detail.${index}.company`)}</TableCell>
                  <TableCell>{form.getValues(`career_detail.${index}.department`)}</TableCell>
                  <TableCell>{form.getValues(`career_detail.${index}.job`)}</TableCell>
                  <TableCell>{form.getValues(`career_detail.${index}.salary`)}</TableCell>
                  <TableCell>{form.getValues(`career_detail.${index}.reason`)}</TableCell>
                  <TableCell>{form.getValues(`career_detail.${index}.reference_name`)}</TableCell>
                  <TableCell>{form.getValues(`career_detail.${index}.reference_contact`)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(index)}
                      >
                        <Pencil className="w-4 h-4 text-blue-500" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-gray-500 text-center py-4">暂无工作经历，点击右上角添加按钮添加</p>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingIndex >= 0 ? "编辑工作经历" : "添加工作经历"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <FormLabel>开始时间 *</FormLabel>
              <Input
                value={currentCareer.start || ""}
                onChange={(e) =>
                  setCurrentCareer({ ...currentCareer, start: e.target.value })
                }
                placeholder="如：2020.01"
              />
            </div>
            <div>
              <FormLabel>结束时间 *</FormLabel>
              <Input
                value={currentCareer.end || ""}
                onChange={(e) =>
                  setCurrentCareer({ ...currentCareer, end: e.target.value })
                }
                placeholder="如：2024.01"
              />
            </div>
            <div className="col-span-2">
              <FormLabel>公司名称 *</FormLabel>
              <Input
                value={currentCareer.company || ""}
                onChange={(e) =>
                  setCurrentCareer({ ...currentCareer, company: e.target.value })
                }
                placeholder="请输入公司名称"
              />
            </div>
            <div>
              <FormLabel>部门 *</FormLabel>
              <Input
                value={currentCareer.department || ""}
                onChange={(e) =>
                  setCurrentCareer({ ...currentCareer, department: e.target.value })
                }
                placeholder="请输入部门名称"
              />
            </div>
            <div>
              <FormLabel>职务 *</FormLabel>
              <Input
                value={currentCareer.job || ""}
                onChange={(e) =>
                  setCurrentCareer({ ...currentCareer, job: e.target.value })
                }
                placeholder="请输入职务"
              />
            </div>
            <div>
              <FormLabel>薪资/津贴 *</FormLabel>
              <Input
                value={currentCareer.salary || ""}
                onChange={(e) =>
                  setCurrentCareer({ ...currentCareer, salary: e.target.value })
                }
                placeholder="如：8000元/月"
              />
            </div>
            <div>
              <FormLabel>离职原因 *</FormLabel>
              <Input
                value={currentCareer.reason || ""}
                onChange={(e) =>
                  setCurrentCareer({ ...currentCareer, reason: e.target.value })
                }
                placeholder="请输入离职原因"
              />
            </div>
            <div>
              <FormLabel>证明人 *</FormLabel>
              <Input
                value={currentCareer.reference_name || ""}
                onChange={(e) =>
                  setCurrentCareer({ ...currentCareer, reference_name: e.target.value })
                }
                placeholder="如：张经理"
              />
            </div>
            <div>
              <FormLabel>联系方式 *</FormLabel>
              <Input
                value={currentCareer.reference_contact || ""}
                onChange={(e) =>
                  setCurrentCareer({ ...currentCareer, reference_contact: e.target.value })
                }
                placeholder="如：13800138000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button type="button" onClick={handleConfirm}>
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
