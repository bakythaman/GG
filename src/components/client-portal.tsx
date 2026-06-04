"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  FileText,
  Home,
  LogOut,
  MessageSquareText,
  Send,
  WalletCards
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, Textarea } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { type Approval } from "@/lib/data";
import { useDemoState } from "@/lib/store";
import { formatCurrency, formatDate } from "@/lib/utils";

const clientSessionKey = "gulvira-client-session";

function getClientSession() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(clientSessionKey);
}

export function ClientPortal() {
  const store = useDemoState();
  const { state } = store;
  const [clientId, setClientId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState("c-aidar");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [question, setQuestion] = useState("");

  useEffect(() => {
    setClientId(getClientSession());
  }, []);

  const client = state.clients.find((item) => item.id === clientId);
  const clientProjects = state.projects.filter((project) => project.clientId === clientId);
  const activeProject = useMemo(() => {
    if (!clientProjects.length) return null;
    return clientProjects.find((project) => project.id === selectedProjectId) ?? clientProjects[0];
  }, [clientProjects, selectedProjectId]);

  useEffect(() => {
    if (activeProject && !selectedProjectId) {
      setSelectedProjectId(activeProject.id);
    }
  }, [activeProject, selectedProjectId]);

  const projectStages = state.stages.filter(
    (stage) => stage.projectId === activeProject?.id && stage.visibleForClient
  );
  const reports = state.photoReports.filter(
    (report) => report.projectId === activeProject?.id && report.visibleForClient
  );
  const documents = state.files.filter(
    (file) => file.projectId === activeProject?.id && file.visibleForClient
  );
  const payments = state.payments.filter((payment) => payment.projectId === activeProject?.id);
  const approvals = state.approvals.filter((approval) => approval.projectId === activeProject?.id);

  function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    window.localStorage.setItem(clientSessionKey, selectedClient);
    setClientId(selectedClient);
  }

  function logout() {
    window.localStorage.removeItem(clientSessionKey);
    setClientId(null);
    setSelectedProjectId("");
  }

  function updateApproval(approval: Approval, status: Approval["status"], comment?: string) {
    store.updateApproval(approval.id, status, comment);
    setQuestion("");
  }

  if (!client || !activeProject) {
    return (
      <main className="min-h-screen bg-graphite-900 text-white">
        <div className="section-shell flex min-h-screen items-center py-12">
          <div className="grid w-full gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <Badge tone="gold">Кабинет клиента</Badge>
              <h1 className="mt-5 text-5xl font-semibold leading-tight">Ход объекта, документы и оплаты</h1>
              <p className="mt-5 max-w-xl text-white/68">
                Клиент видит только свой проект: прогресс, этапы, фотоотчёты, открытые файлы,
                платежи и согласования.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/">
                  <Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                    На лендинг
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="gold">CRM</Button>
                </Link>
              </div>
            </div>
            <Card className="bg-white text-graphite-900 shadow-soft">
              <CardHeader>
                <CardTitle>Войти как клиент</CardTitle>
                <CardDescription>Демо-доступ к одному из клиентских проектов.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={login} className="space-y-4">
                  <Select value={selectedClient} onChange={(event) => setSelectedClient(event.target.value)}>
                    {state.clients.map((item) => (
                      <option value={item.id} key={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </Select>
                  <Button type="submit" className="w-full">
                    Открыть кабинет
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f5ef]">
      <header className="border-b border-graphite-100 bg-white">
        <div className="section-shell flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/" className="text-xl font-semibold text-graphite-900">
              Gulvira Group
            </Link>
            <p className="mt-1 text-sm text-graphite-500">Личный кабинет · {client.name}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {clientProjects.length > 1 && (
              <Select value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)}>
                {clientProjects.map((project) => (
                  <option value={project.id} key={project.id}>
                    {project.title}
                  </option>
                ))}
              </Select>
            )}
            <Link href="/dashboard">
              <Button variant="outline">CRM</Button>
            </Link>
            <Button size="icon" variant="ghost" onClick={logout} title="Выйти">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <section className="section-shell py-8">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="shadow-soft">
            <CardHeader>
              <Badge tone="gold">{activeProject.status}</Badge>
              <CardTitle className="text-3xl">{activeProject.title}</CardTitle>
              <CardDescription>
                {activeProject.address} · {activeProject.area} м² · плановая сдача {formatDate(activeProject.dueDate)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>Общий прогресс</span>
                  <strong>{activeProject.progress}%</strong>
                </div>
                <Progress value={activeProject.progress} />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <ClientStat icon={Home} label="Текущий этап" value={projectStages.find((stage) => stage.status === "в работе")?.title ?? projectStages[0]?.title ?? "В работе"} />
                <ClientStat icon={MessageSquareText} label="Последнее обновление" value={reports[0] ? formatDate(reports[0].date) : "нет отчётов"} />
                <ClientStat icon={WalletCards} label="Остаток" value={formatCurrency(activeProject.budget - activeProject.paid)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Оплаты</CardTitle>
              <CardDescription>Общая стоимость, оплачено и история платежей.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-graphite-900 p-4 text-white">
                <div className="flex justify-between text-sm text-white/65">
                  <span>Стоимость</span>
                  <span>{formatCurrency(activeProject.budget)}</span>
                </div>
                <div className="mt-2 flex justify-between text-sm text-white/65">
                  <span>Оплачено</span>
                  <span>{formatCurrency(activeProject.paid)}</span>
                </div>
                <div className="mt-4 flex justify-between text-lg font-semibold">
                  <span>Остаток</span>
                  <span>{formatCurrency(activeProject.budget - activeProject.paid)}</span>
                </div>
              </div>
              <div className="space-y-2">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between rounded-md border border-graphite-100 p-3 text-sm">
                    <span>
                      <strong>{payment.type}</strong>
                      <span className="block text-xs text-graphite-500">{formatDate(payment.date)}</span>
                    </span>
                    <span className="text-right">
                      <span className="block font-semibold">{formatCurrency(payment.amount)}</span>
                      <Badge tone={payment.status === "оплачено" ? "green" : "gold"}>{payment.status}</Badge>
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Этапы проекта</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {projectStages.map((stage) => (
                <div key={stage.id} className="rounded-lg border border-graphite-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-graphite-900">{stage.title}</p>
                      <p className="mt-1 text-sm text-graphite-500">{stage.description}</p>
                    </div>
                    <Badge tone={stage.status === "завершён" ? "green" : stage.status === "на проверке" ? "gold" : "neutral"}>
                      {stage.status}
                    </Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-graphite-500">
                    <span>Старт: {formatDate(stage.startDate)}</span>
                    <span>Дедлайн: {formatDate(stage.deadline)}</span>
                  </div>
                  <Progress value={stage.progress} className="mt-3" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Фотоотчёты</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {reports.map((report) => (
                <article key={report.id} className="overflow-hidden rounded-lg border border-graphite-100">
                  <img src={report.imageUrl} alt={report.description} className="h-48 w-full object-cover" />
                  <div className="p-4">
                    <p className="font-semibold text-graphite-900">{state.stages.find((stage) => stage.id === report.stageId)?.title}</p>
                    <p className="mt-1 text-sm text-graphite-500">{report.description}</p>
                    <p className="mt-3 text-xs text-graphite-500">{formatDate(report.date)}</p>
                  </div>
                </article>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <Card>
            <CardHeader>
              <CardTitle>Документы</CardTitle>
              <CardDescription>Файлы, открытые для клиента.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {documents.map((document) => (
                <div key={document.id} className="flex items-center justify-between rounded-lg border border-graphite-100 p-4">
                  <span className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gold-500" />
                    <span>
                      <strong className="block text-sm">{document.title}</strong>
                      <span className="text-xs text-graphite-500">{document.type}</span>
                    </span>
                  </span>
                  <Badge>{formatDate(document.uploadedAt)}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Согласования</CardTitle>
              <CardDescription>Планировки, визуализации, материалы, смета и этапы работ.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {approvals.map((approval) => (
                <div key={approval.id} className="rounded-lg border border-graphite-100 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold text-graphite-900">{approval.title}</p>
                      <p className="mt-1 text-sm text-graphite-500">
                        Обновлено {formatDate(approval.updatedAt)}
                        {approval.comment ? ` · ${approval.comment}` : ""}
                      </p>
                    </div>
                    <ApprovalBadge status={approval.status} />
                  </div>
                  <form
                    className="mt-4 grid gap-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      updateApproval(approval, "вопрос", question || "Клиент задал вопрос.");
                    }}
                  >
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="gold" type="button" onClick={() => updateApproval(approval, "одобрено", "Одобрено клиентом.")}>
                        <CheckCircle2 className="h-4 w-4" />
                        Одобрить
                      </Button>
                      <Button size="sm" variant="outline" type="button" onClick={() => updateApproval(approval, "нужны правки", "Клиент запросил правки.")}>
                        Нужны правки
                      </Button>
                    </div>
                    <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                      <Textarea
                        placeholder="Задать вопрос по согласованию"
                        value={question}
                        onChange={(event) => setQuestion(event.target.value)}
                      />
                      <Button type="submit" className="self-end">
                        <Send className="h-4 w-4" />
                        Задать вопрос
                      </Button>
                    </div>
                  </form>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

function ClientStat({
  icon: Icon,
  label,
  value
}: {
  icon: typeof Home;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-graphite-100 p-4">
      <Icon className="h-5 w-5 text-gold-500" />
      <p className="mt-3 text-xs text-graphite-500">{label}</p>
      <p className="mt-1 font-semibold text-graphite-900">{value}</p>
    </div>
  );
}

function ApprovalBadge({ status }: { status: Approval["status"] }) {
  const tone = status === "одобрено" ? "green" : status === "нужны правки" ? "red" : status === "вопрос" ? "gold" : "neutral";
  return <Badge tone={tone}>{status}</Badge>;
}
