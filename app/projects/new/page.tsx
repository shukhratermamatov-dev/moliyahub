"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast, Toaster } from "sonner";
import { Shell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { STAGE_LABEL, type ProjectStage } from "@/lib/data/projects";
import { useHubStore } from "@/lib/store";

export default function NewProjectPage() {
  const router = useRouter();
  const addProject = useHubStore((s) => s.addProject);
  const [title, setTitle] = useState("");
  const [industry, setIndustry] = useState("Производство");
  const [stage, setStage] = useState<ProjectStage>("GROWTH");
  const [amount, setAmount] = useState(500_000_000);
  const [region, setRegion] = useState("Ташкент");
  const [owner, setOwner] = useState("");
  const [description, setDescription] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !owner.trim()) {
      toast.error("Заполните название, компанию и описание");
      return;
    }
    const id = addProject({ title, industry, stage, amount, region, owner, description });
    toast.success("Проект опубликован");
    router.push(`/projects/${id}`);
  };

  return (
    <Shell>
      <Toaster theme="dark" position="top-center" />
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="font-display text-3xl">Новый проект</h1>
        <p className="mt-2 text-muted">Карточка сразу появится в каталоге для инвесторов.</p>
        <Card className="mt-8">
          <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm">
              <span className="mb-1 block text-muted">Название</span>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-muted">Компания / автор</span>
              <Input value={owner} onChange={(e) => setOwner(e.target.value)} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block text-muted">Отрасль</span>
                <Input value={industry} onChange={(e) => setIndustry(e.target.value)} />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-muted">Регион</span>
                <Input value={region} onChange={(e) => setRegion(e.target.value)} />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block text-muted">Стадия</span>
                <select
                  className="h-11 w-full rounded-xl bg-raised px-3 text-sm"
                  value={stage}
                  onChange={(e) => setStage(e.target.value as ProjectStage)}
                >
                  {(Object.keys(STAGE_LABEL) as ProjectStage[]).map((k) => (
                    <option key={k} value={k}>
                      {STAGE_LABEL[k]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-muted">Сумма, сум</span>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                />
              </label>
            </div>
            <label className="block text-sm">
              <span className="mb-1 block text-muted">Описание и ТЭО кратко</span>
              <Textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <Button type="submit">Опубликовать</Button>
          </form>
        </Card>
      </div>
    </Shell>
  );
}
