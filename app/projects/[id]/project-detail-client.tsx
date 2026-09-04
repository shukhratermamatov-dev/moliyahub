"use client";

import Link from "next/link";
import { useState } from "react";
import { toast, Toaster } from "sonner";
import { Shell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { STAGE_LABEL, type ProjectStage } from "@/lib/data/projects";
import { useAllProjects, useHubStore } from "@/lib/store";
import { formatMoney } from "@/lib/utils";

export function ProjectDetailClient({ id }: { id: string }) {
  const projects = useAllProjects();
  const project = projects.find((p) => p.id === id);
  const addApplication = useHubStore((s) => s.addApplication);
  const applications = useHubStore((s) => s.applications.filter((a) => a.projectId === id));
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  if (!project) {
    return (
      <Shell>
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="font-display text-3xl">Проект не найден</h1>
          <Button asChild className="mt-6">
            <Link href="/projects">К каталогу</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      toast.error("Укажите имя и сообщение");
      return;
    }
    addApplication({ projectId: id, name, message });
    setMessage("");
    toast.success("Заявка отправлена предпринимателю");
  };

  return (
    <Shell>
      <Toaster theme="dark" position="top-center" />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link href="/projects" className="text-sm text-muted hover:text-fg">
          ← Все проекты
        </Link>
        <p className="mt-6 text-xs text-gold">
          {project.industry} · {STAGE_LABEL[project.stage as ProjectStage]} · {project.region}
        </p>
        <h1 className="mt-2 font-display text-4xl">{project.title}</h1>
        <p className="mt-2 text-muted">{project.owner}</p>
        <p className="mt-6 text-lg tabular-nums text-primary">{formatMoney(project.amount)}</p>
        <p className="mt-6 leading-relaxed">{project.description}</p>
        {project.raisedHint ? <p className="mt-4 text-sm text-gold">{project.raisedHint}</p> : null}

        <Card className="mt-10">
          <h2 className="font-display text-xl">Заявка инвестора</h2>
          <form onSubmit={send} className="mt-4 space-y-3">
            <Input
              placeholder="Имя или фонд"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Textarea
              rows={4}
              placeholder="Сумма интереса, вопросы, условия"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <Button type="submit">Отправить заявку</Button>
          </form>
        </Card>

        {applications.length > 0 ? (
          <div className="mt-8 space-y-3">
            <h3 className="font-display text-lg">Полученные заявки</h3>
            {applications.map((a) => (
              <Card key={a.id}>
                <div className="font-medium">{a.name}</div>
                <p className="mt-1 text-sm text-muted">{a.message}</p>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
    </Shell>
  );
}
