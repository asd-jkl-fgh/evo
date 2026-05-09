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
import { ResumeData, FamilyInfo } from "@/types/resume";
import { Plus, Trash2, Pencil } from "lucide-react";
import { useState } from "react";
import { FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface FamilySectionProps {
  form: ReturnType<typeof useForm<ResumeData>>;
}

export function FamilySection({ form }: FamilySectionProps) {
  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "family_info",
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [currentFamily, setCurrentFamily] = useState<Partial<FamilyInfo>>({});

  const handleAdd = () => {
    setEditingIndex(-1);
    setCurrentFamily({
      id: Date.now().toString(),
      name: "",
      relation: "",
      organ: "",
      work: "",
      age: "",
    });
    setDialogOpen(true);
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setCurrentFamily(form.getValues(`family_info.${index}`));
    setDialogOpen(true);
  };

  const handleConfirm = () => {
    if (currentFamily.name && currentFamily.relation) {
      if (editingIndex >= 0) {
        update(editingIndex, currentFamily as FamilyInfo);
      } else {
        append(currentFamily as FamilyInfo);
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
            <span>👨‍👩‍👧‍👦</span> 家庭信息
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
                <TableHead>姓名</TableHead>
                <TableHead>关系</TableHead>
                <TableHead>工作（学习）单位</TableHead>
                <TableHead>职务</TableHead>
                <TableHead>年龄</TableHead>
                <TableHead className="w-16">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, index) => (
                <TableRow key={field.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{form.getValues(`family_info.${index}.name`)}</TableCell>
                  <TableCell>{form.getValues(`family_info.${index}.relation`)}</TableCell>
                  <TableCell>{form.getValues(`family_info.${index}.organ`)}</TableCell>
                  <TableCell>{form.getValues(`family_info.${index}.work`)}</TableCell>
                  <TableCell>{form.getValues(`family_info.${index}.age`)}</TableCell>
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
          <p className="text-gray-500 text-center py-4">暂无家庭成员信息，点击右上角添加按钮添加</p>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingIndex >= 0 ? "编辑家庭成员" : "添加家庭成员"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <FormLabel>姓名 *</FormLabel>
              <Input
                value={currentFamily.name || ""}
                onChange={(e) =>
                  setCurrentFamily({ ...currentFamily, name: e.target.value })
                }
                placeholder="请输入姓名"
              />
            </div>
            <div>
              <FormLabel>关系 *</FormLabel>
              <Input
                value={currentFamily.relation || ""}
                onChange={(e) =>
                  setCurrentFamily({ ...currentFamily, relation: e.target.value })
                }
                placeholder="如：父亲、母亲"
              />
            </div>
            <div className="col-span-2">
              <FormLabel>工作（学习）单位 *</FormLabel>
              <Input
                value={currentFamily.organ || ""}
                onChange={(e) =>
                  setCurrentFamily({ ...currentFamily, organ: e.target.value })
                }
                placeholder="请输入工作或学习单位"
              />
            </div>
            <div>
              <FormLabel>职务 *</FormLabel>
              <Input
                value={currentFamily.work || ""}
                onChange={(e) =>
                  setCurrentFamily({ ...currentFamily, work: e.target.value })
                }
                placeholder="请输入职务"
              />
            </div>
            <div>
              <FormLabel>年龄 *</FormLabel>
              <Input
                type="number"
                value={currentFamily.age || ""}
                onChange={(e) =>
                  setCurrentFamily({ ...currentFamily, age: e.target.value })
                }
                placeholder="请输入年龄"
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
