"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  FileText,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  PackageCheck,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  Workflow
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  leadStatuses,
  type LeadStatus,
  type Material,
  type Priority,
  type Role,
  type StageStatus,
  type TaskStatus
} from "@/lib/data";
import { useDemoState } from "@/lib/store";
import { cn, formatCurrency, formatDate, percent } from "@/lib/utils";

type ModuleId =
  | "overview"
  | "leads"
  | "projects"
  | "stages"
  | "tasks"
  | "reports"
  | "documents"
  | "finance"
  | "materials"
  | "analytics";

const roleLabels: Record<Role, string> = {
  admin: "Admin",
  manager: "Manager",
  designer: "Designer",
  foreman: "Foreman",
  accountant: "Accountant",
  client: "Client"
};

const modules: { id: ModuleId; label: string; icon: typeof LayoutDashboard; roles: Role[] }[] = [
  { id: "overview", label: "Обзор", icon: LayoutDashboard, roles: ["admin", "manager", "designer", "foreman", "accountant"] },
  { id: "leads", label: "Лиды", icon: Users, roles: ["admin", "manager"] },
  { id: "projects", label: "Проекты", icon: BriefcaseBusiness, roles: ["admin", "manager", "designer", "foreman", "accountant"] },
  { id: "stages", label: "Этапы", icon: Workflow, roles: ["admin", "manager", "designer", "foreman"] },
  { id: "tasks", label: "Задачи", icon: ClipboardList, roles: ["admin", "manager", "designer", "foreman"] },
  { id: "reports", label: "Фотоотчёты", icon: ImagePlus, roles: ["admin", "manager", "designer", "foreman"] },
  { id: "documents", label: "Документы", icon: FileText, roles: ["admin", "manager", "designer", "foreman", "accountant"] },
  { id: "finance", label: "Финансы", icon: CircleDollarSign, roles: ["admin", "manager", "accountant"] },
  { id: "materials", label: "Материалы", icon: PackageCheck, roles: ["admin", "manager", "foreman", "accountant"] },
  { id: "analytics", label: "Аналитика", icon: BarChart3, roles: ["admin"] }
];

const sessionKey = "gulvira-dashboard-session";

function getSession() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(sessionKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { role: Role; userId: string };
  } catch {
    return null;
  }
}

export function DashboardApp() {
  const store = useDemoState();
  const { state } = store;
  const [session, setSession] = useState<{ role: Role; userId: string } | null>(null);
  const [active, setActive] = useState<ModuleId>("overview");
  const [leadQuery, setLeadQuery] = useState("");
  const [projectQuery, setProjectQuery] = useState("");
  const [projectSort, setProjectSort] = useState("progress");
  const [stageStatus, setStageStatus] = useState<"all" | StageStatus>("all");
  const [taskStatus, setTaskStatus] = useState<"all" | TaskStatus>("all");
  const [newLead, setNewLead] = useState({
    name: "",
    phone: "",
    whatsapp: "",
    city: "Шымкент",
    objectType: "квартира",
    area: 70,
    budget: 12000000,
    source: "CRM",
    comment: ""
  });
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    projectId: "p-atilla",
    stageId: "s-atilla-2",
    responsibleId: "u-foreman",
    deadline: "2026-06-15",
    priority: "средний" as Priority,
    status: "новая" as TaskStatus
  });
  const [newReport, setNewReport] = useState({
    projectId: "p-atilla",
    stageId: "s-atilla-2",
    imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=900&q=80",
    description: "",
    visibleForClient: true
  });
  const [newFile, setNewFile] = useState({
    projectId: "p-atilla",
    stageId: "s-atilla-2",
    title: "",
    type: "Смета",
    visibleForClient: true
  });

  useEffect(() => {
    setSession(getSession());
  }, []);

  const currentUser = useMemo(() => {
    if (!session) return null;
    return state.users.find((user) => user.id === session.userId) ?? state.users[0];
  }, [session, state.users]);

  const currentRole = session?.role ?? currentUser?.role ?? "manager";
  const visibleModules = modules.filter((item) => item.roles.includes(currentRole));

  useEffect(() => {
    if (!visibleModules.some((item) => item.id === active)) {
      setActive(visibleModules[0]?.id ?? "overview");
    }
  }, [active, visibleModules]);

  const userNameById = useMemo(() => new Map(state.users.map((user) => [user.id, user.name])), [state.users]);
  const clientById = useMemo(() => new Map(state.clients.map((client) => [client.id, client])), [state.clients]);
  const projectById = useMemo(() => new Map(state.projects.map((project) => [project.id, project])), [state.projects]);
  const stageById = useMemo(() => new Map(state.stages.map((stage) => [stage.id, stage])), [state.stages]);

  const projectsForRole = useMemo(() => {
    if (!currentUser || currentRole === "admin" || currentRole === "accountant") return state.projects;
    if (currentRole === "manager") return state.projects.filter((project) => project.managerId === currentUser.id);
    if (currentRole === "designer") return state.projects.filter((project) => project.designerId === currentUser.id);
    if (currentRole === "foreman") return state.projects.filter((project) => project.foremanId === currentUser.id);
    return [];
  }, [currentRole, currentUser, state.projects]);

  const visibleProjectIds = new Set(projectsForRole.map((project) => project.id));
  const filteredProjects = projectsForRole
    .filter((project) => {
      const client = clientById.get(project.clientId);
      return `${project.title} ${project.city} ${client?.name ?? ""}`.toLowerCase().includes(projectQuery.toLowerCase());
    })
    .sort((a, b) => {
      if (projectSort === "budget") return b.budget - a.budget;
      if (projectSort === "deadline") return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      return b.progress - a.progress;
    });

  const visibleStages = state.stages
    .filter((stage) => visibleProjectIds.has(stage.projectId))
    .filter((stage) => stageStatus === "all" || stage.status === stageStatus);

  const visibleTasks = state.tasks
    .filter((task) => visibleProjectIds.has(task.projectId))
    .filter((task) => currentRole !== "designer" || task.responsibleId === currentUser?.id)
    .filter((task) => currentRole !== "foreman" || task.responsibleId === currentUser?.id)
    .filter((task) => taskStatus === "all" || task.status === taskStatus);

  const filteredLeads = state.leads.filter((lead) =>
    `${lead.name} ${lead.phone} ${lead.city} ${lead.objectType}`.toLowerCase().includes(leadQuery.toLowerCase())
  );

  const totals = useMemo(() => {
    const budget = projectsForRole.reduce((sum, project) => sum + project.budget, 0);
    const paid = projectsForRole.reduce((sum, project) => sum + project.paid, 0);
    const overdueTasks = visibleTasks.filter((task) => new Date(task.deadline) < new Date() && task.status !== "завершена").length;
    return { budget, paid, debt: budget - paid, overdueTasks };
  }, [projectsForRole, visibleTasks]);

  function loginAs(role: Role) {
    if (role === "client") return;
    const user = state.users.find((item) => item.role === role) ?? state.users[0];
    const nextSession = { role, userId: user.id };
    window.localStorage.setItem(sessionKey, JSON.stringify(nextSession));
    setSession(nextSession);
  }

  function logout() {
    window.localStorage.removeItem(sessionKey);
    setSession(null);
  }

  async function handleLeadSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await store.addLead(newLead);
    setNewLead({ ...newLead, name: "", phone: "", whatsapp: "", comment: "" });
  }

  function handleTaskSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    store.addTask(newTask);
    setNewTask({ ...newTask, title: "", description: "" });
  }

  function handleReportSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    store.addPhotoReport(newReport);
    setNewReport({ ...newReport, description: "" });
  }

  function handleFileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    store.addFile(newFile);
    setNewFile({ ...newFile, title: "" });
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-graphite-900 text-white">
        <div className="section-shell flex min-h-screen items-center py-12">
          <div className="grid w-full gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <Badge tone="gold">Gulvira CRM</Badge>
              <h1 className="mt-5 text-5xl font-semibold leading-tight">Внутренний портал команды</h1>
              <p className="mt-5 max-w-xl text-white/68">
                Демо-авторизация по ролям показывает, какие данные видят администратор, менеджер,
                дизайнер, прораб и бухгалтер. Для клиента есть отдельный кабинет.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/">
                  <Button variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                    На лендинг
                  </Button>
                </Link>
                <Link href="/client">
                  <Button variant="gold">Кабинет клиента</Button>
                </Link>
              </div>
            </div>
            <Card className="bg-white text-graphite-900 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-gold-500" />
                  Войти как сотрудник
                </CardTitle>
                <CardDescription>Выберите роль, чтобы открыть соответствующие модули.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {(["admin", "manager", "designer", "foreman", "accountant"] as Role[]).map((role) => (
                  <button
                    type="button"
                    key={role}
                    onClick={() => loginAs(role)}
                    className="flex items-center justify-between rounded-lg border border-graphite-100 p-4 text-left transition hover:border-gold-300 hover:bg-gold-100/40"
                  >
                    <span>
                      <span className="block font-semibold">{roleLabels[role]}</span>
                      <span className="text-xs text-graphite-500">{state.users.find((user) => user.role === role)?.name}</span>
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee]">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-graphite-100 bg-white px-4 py-5">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl font-semibold text-graphite-900">
              Gulvira Group
            </Link>
            <Button size="icon" variant="ghost" onClick={logout} title="Выйти">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-6 rounded-lg bg-graphite-900 p-4 text-white">
            <Badge tone="gold">{roleLabels[currentRole]}</Badge>
            <p className="mt-3 font-semibold">{currentUser?.name}</p>
            <p className="text-xs text-white/60">{currentUser?.email}</p>
          </div>
          <nav className="mt-6 space-y-1">
            {visibleModules.map((module) => {
              const Icon = module.icon;
              return (
                <button
                  key={module.id}
                  onClick={() => setActive(module.id)}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition",
                    active === module.id ? "bg-gold-100 text-graphite-900" : "text-graphite-600 hover:bg-graphite-50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {module.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="min-w-0 px-4 py-5 md:px-8">
          <header className="flex flex-col gap-4 border-b border-graphite-100 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-graphite-500">Сегодня: 4 июня 2026</p>
              <h1 className="text-3xl font-semibold text-graphite-900">{modules.find((module) => module.id === active)?.label}</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={store.reset}>Сбросить демо</Button>
              <Link href="/client">
                <Button variant="gold">Открыть кабинет клиента</Button>
              </Link>
            </div>
          </header>

          {active === "overview" && (
            <div className="mt-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Metric title="Активные проекты" value={projectsForRole.length.toString()} icon={BriefcaseBusiness} />
                <Metric title="Оборот" value={formatCurrency(totals.budget)} icon={CircleDollarSign} />
                <Metric title="Оплачено" value={formatCurrency(totals.paid)} icon={Check} />
                <Metric title="Просроченные задачи" value={totals.overdueTasks.toString()} icon={CalendarClock} tone="red" />
              </div>
              <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                <Card>
                  <CardHeader>
                    <CardTitle>Проекты в работе</CardTitle>
                    <CardDescription>Прогресс, сроки и остаток оплаты.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {projectsForRole.map((project) => (
                      <ProjectRow key={project.id} project={project} client={clientById.get(project.clientId)?.name ?? "Клиент"} />
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Ближайшие задачи</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {visibleTasks.slice(0, 5).map((task) => (
                      <TaskLine key={task.id} task={task} projectTitle={projectById.get(task.projectId)?.title ?? ""} onDone={() => store.updateTaskStatus(task.id, "завершена")} />
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {active === "leads" && (
            <div className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Новая заявка</CardTitle>
                  <CardDescription>Форма сохраняет лид в канбан-воронку.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLeadSubmit} className="grid gap-4 lg:grid-cols-4">
                    <Field label="Имя">
                      <Input required value={newLead.name} onChange={(event) => setNewLead({ ...newLead, name: event.target.value })} />
                    </Field>
                    <Field label="Телефон">
                      <Input required value={newLead.phone} onChange={(event) => setNewLead({ ...newLead, phone: event.target.value })} />
                    </Field>
                    <Field label="Город">
                      <Select value={newLead.city} onChange={(event) => setNewLead({ ...newLead, city: event.target.value })}>
                        <option>Шымкент</option>
                        <option>Алматы</option>
                        <option>Туркестан</option>
                      </Select>
                    </Field>
                    <Field label="Бюджет">
                      <Input type="number" value={newLead.budget} onChange={(event) => setNewLead({ ...newLead, budget: Number(event.target.value) })} />
                    </Field>
                    <Field label="WhatsApp">
                      <Input value={newLead.whatsapp} onChange={(event) => setNewLead({ ...newLead, whatsapp: event.target.value })} />
                    </Field>
                    <Field label="Тип объекта">
                      <Select value={newLead.objectType} onChange={(event) => setNewLead({ ...newLead, objectType: event.target.value })}>
                        <option>квартира</option>
                        <option>дом</option>
                        <option>коммерческое помещение</option>
                      </Select>
                    </Field>
                    <Field label="Площадь">
                      <Input type="number" value={newLead.area} onChange={(event) => setNewLead({ ...newLead, area: Number(event.target.value) })} />
                    </Field>
                    <div className="flex items-end">
                      <Button type="submit" className="w-full">Добавить лид</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="relative max-w-md flex-1">
                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-graphite-400" />
                  <Input className="pl-9" placeholder="Поиск по имени, телефону, городу" value={leadQuery} onChange={(event) => setLeadQuery(event.target.value)} />
                </div>
                <Badge tone="gold">{filteredLeads.length} лидов</Badge>
              </div>

              <div className="grid gap-4 overflow-x-auto pb-4 xl:grid-cols-5">
                {leadStatuses.map((status) => {
                  const leads = filteredLeads.filter((lead) => lead.status === status);
                  return (
                    <div key={status} className="min-w-64 rounded-lg border border-graphite-100 bg-white p-3">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-graphite-900">{status}</h3>
                        <Badge>{leads.length}</Badge>
                      </div>
                      <div className="space-y-3">
                        {leads.map((lead) => (
                          <Card key={lead.id} className="border-graphite-100 shadow-none">
                            <CardHeader className="p-4">
                              <CardTitle className="text-base">{lead.name}</CardTitle>
                              <CardDescription>
                                {lead.city} · {lead.area} м² · {formatCurrency(lead.budget)}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 p-4 pt-0">
                              <p className="text-xs text-graphite-500">{lead.comment}</p>
                              <Select value={lead.status} onChange={(event) => store.updateLeadStatus(lead.id, event.target.value as LeadStatus)}>
                                {leadStatuses.map((item) => (
                                  <option key={item}>{item}</option>
                                ))}
                              </Select>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {active === "projects" && (
            <div className="mt-6 space-y-6">
              <FilterBar
                query={projectQuery}
                setQuery={setProjectQuery}
                sort={projectSort}
                setSort={setProjectSort}
              />
              <div className="grid gap-4 xl:grid-cols-3">
                {filteredProjects.map((project) => (
                  <Card key={project.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle>{project.title}</CardTitle>
                          <CardDescription>{clientById.get(project.clientId)?.name} · {project.city}</CardDescription>
                        </div>
                        <Badge tone="gold">{project.progress}%</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Progress value={project.progress} />
                      <dl className="grid grid-cols-2 gap-3 text-sm">
                        <Info label="Адрес" value={project.address} />
                        <Info label="Площадь" value={`${project.area} м²`} />
                        <Info label="Услуга" value={project.service} />
                        <Info label="Срок" value={formatDate(project.dueDate)} />
                        <Info label="Менеджер" value={userNameById.get(project.managerId) ?? ""} />
                        <Info label="Прораб" value={userNameById.get(project.foremanId) ?? ""} />
                      </dl>
                      <div className="rounded-md bg-graphite-50 p-3 text-sm">
                        <div className="flex justify-between">
                          <span>Бюджет</span>
                          <strong>{formatCurrency(project.budget)}</strong>
                        </div>
                        <div className="mt-1 flex justify-between text-graphite-500">
                          <span>Остаток</span>
                          <span>{formatCurrency(project.budget - project.paid)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {active === "stages" && (
            <div className="mt-6 space-y-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h2 className="text-xl font-semibold text-graphite-900">Этапы проектов</h2>
                <Select className="max-w-xs" value={stageStatus} onChange={(event) => setStageStatus(event.target.value as "all" | StageStatus)}>
                  <option value="all">Все статусы</option>
                  <option>не начат</option>
                  <option>в работе</option>
                  <option>на проверке</option>
                  <option>завершён</option>
                </Select>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {visibleStages.map((stage) => (
                  <Card key={stage.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle>{stage.title}</CardTitle>
                          <CardDescription>{projectById.get(stage.projectId)?.title}</CardDescription>
                        </div>
                        <StageBadge status={stage.status} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm leading-6 text-graphite-500">{stage.description}</p>
                      <Progress value={stage.progress} />
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <Info label="Старт" value={formatDate(stage.startDate)} />
                        <Info label="Дедлайн" value={formatDate(stage.deadline)} />
                        <Info label="Ответственный" value={userNameById.get(stage.responsibleId) ?? ""} />
                        <Info label="Клиент видит" value={stage.visibleForClient ? "да" : "нет"} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {active === "tasks" && (
            <div className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Новая задача</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleTaskSubmit} className="grid gap-4 lg:grid-cols-4">
                    <Field label="Название">
                      <Input required value={newTask.title} onChange={(event) => setNewTask({ ...newTask, title: event.target.value })} />
                    </Field>
                    <Field label="Проект">
                      <Select value={newTask.projectId} onChange={(event) => setNewTask({ ...newTask, projectId: event.target.value })}>
                        {projectsForRole.map((project) => (
                          <option value={project.id} key={project.id}>{project.title}</option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Ответственный">
                      <Select value={newTask.responsibleId} onChange={(event) => setNewTask({ ...newTask, responsibleId: event.target.value })}>
                        {state.users.map((user) => (
                          <option value={user.id} key={user.id}>{user.name}</option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Дедлайн">
                      <Input type="date" value={newTask.deadline} onChange={(event) => setNewTask({ ...newTask, deadline: event.target.value })} />
                    </Field>
                    <Field label="Этап">
                      <Select value={newTask.stageId} onChange={(event) => setNewTask({ ...newTask, stageId: event.target.value })}>
                        {state.stages.filter((stage) => stage.projectId === newTask.projectId).map((stage) => (
                          <option value={stage.id} key={stage.id}>{stage.title}</option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Приоритет">
                      <Select value={newTask.priority} onChange={(event) => setNewTask({ ...newTask, priority: event.target.value as Priority })}>
                        <option>низкий</option>
                        <option>средний</option>
                        <option>высокий</option>
                      </Select>
                    </Field>
                    <Field label="Описание" className="lg:col-span-2">
                      <Input value={newTask.description} onChange={(event) => setNewTask({ ...newTask, description: event.target.value })} />
                    </Field>
                    <div className="lg:col-span-4">
                      <Button type="submit">Создать задачу</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
              <div className="flex justify-between gap-3">
                <Select className="max-w-xs" value={taskStatus} onChange={(event) => setTaskStatus(event.target.value as "all" | TaskStatus)}>
                  <option value="all">Все задачи</option>
                  <option>новая</option>
                  <option>в работе</option>
                  <option>на проверке</option>
                  <option>завершена</option>
                </Select>
                <Badge tone="gold">{visibleTasks.length} задач</Badge>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {visibleTasks.map((task) => (
                  <Card key={task.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle>{task.title}</CardTitle>
                          <CardDescription>{projectById.get(task.projectId)?.title} · {stageById.get(task.stageId)?.title}</CardDescription>
                        </div>
                        <Badge tone={task.priority === "высокий" ? "red" : "neutral"}>{task.priority}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-graphite-500">{task.description}</p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <Info label="Ответственный" value={userNameById.get(task.responsibleId) ?? ""} />
                        <Info label="Дедлайн" value={formatDate(task.deadline)} />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Select className="max-w-48" value={task.status} onChange={(event) => store.updateTaskStatus(task.id, event.target.value as TaskStatus)}>
                          <option>новая</option>
                          <option>в работе</option>
                          <option>на проверке</option>
                          <option>завершена</option>
                        </Select>
                        <Button size="sm" variant="gold" onClick={() => store.updateTaskStatus(task.id, "завершена")}>
                          Завершить
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {active === "reports" && (
            <div className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Добавить фотоотчёт</CardTitle>
                  <CardDescription>В демо-режиме фото добавляется по URL.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleReportSubmit} className="grid gap-4 lg:grid-cols-4">
                    <Field label="Проект">
                      <Select value={newReport.projectId} onChange={(event) => setNewReport({ ...newReport, projectId: event.target.value })}>
                        {projectsForRole.map((project) => <option value={project.id} key={project.id}>{project.title}</option>)}
                      </Select>
                    </Field>
                    <Field label="Этап">
                      <Select value={newReport.stageId} onChange={(event) => setNewReport({ ...newReport, stageId: event.target.value })}>
                        {state.stages.filter((stage) => stage.projectId === newReport.projectId).map((stage) => <option value={stage.id} key={stage.id}>{stage.title}</option>)}
                      </Select>
                    </Field>
                    <Field label="URL фото">
                      <Input value={newReport.imageUrl} onChange={(event) => setNewReport({ ...newReport, imageUrl: event.target.value })} />
                    </Field>
                    <label className="flex items-end gap-2 pb-2 text-sm">
                      <input type="checkbox" checked={newReport.visibleForClient} onChange={(event) => setNewReport({ ...newReport, visibleForClient: event.target.checked })} />
                      Видно клиенту
                    </label>
                    <Field label="Описание" className="lg:col-span-3">
                      <Input required value={newReport.description} onChange={(event) => setNewReport({ ...newReport, description: event.target.value })} />
                    </Field>
                    <div className="flex items-end">
                      <Button type="submit">Сохранить отчёт</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
              <div className="grid gap-4 lg:grid-cols-3">
                {state.photoReports.filter((report) => visibleProjectIds.has(report.projectId)).map((report) => (
                  <Card key={report.id} className="overflow-hidden">
                    <img alt={report.description} src={report.imageUrl} className="h-48 w-full object-cover" />
                    <CardHeader>
                      <CardTitle className="text-base">{projectById.get(report.projectId)?.title}</CardTitle>
                      <CardDescription>{formatDate(report.date)} · {stageById.get(report.stageId)?.title}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-graphite-600">{report.description}</p>
                      <Badge className="mt-3" tone={report.visibleForClient ? "green" : "neutral"}>
                        {report.visibleForClient ? "видно клиенту" : "внутренний"}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {active === "documents" && (
            <div className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Добавить документ</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleFileSubmit} className="grid gap-4 lg:grid-cols-5">
                    <Field label="Название">
                      <Input required value={newFile.title} onChange={(event) => setNewFile({ ...newFile, title: event.target.value })} />
                    </Field>
                    <Field label="Тип">
                      <Select value={newFile.type} onChange={(event) => setNewFile({ ...newFile, type: event.target.value })}>
                        <option>Договор</option>
                        <option>Смета</option>
                        <option>Дизайн-проект</option>
                        <option>Планировки</option>
                        <option>Чертежи</option>
                        <option>Акты</option>
                        <option>Счета</option>
                        <option>Чеки</option>
                        <option>Гарантийные документы</option>
                      </Select>
                    </Field>
                    <Field label="Проект">
                      <Select value={newFile.projectId} onChange={(event) => setNewFile({ ...newFile, projectId: event.target.value })}>
                        {projectsForRole.map((project) => <option value={project.id} key={project.id}>{project.title}</option>)}
                      </Select>
                    </Field>
                    <label className="flex items-end gap-2 pb-2 text-sm">
                      <input type="checkbox" checked={newFile.visibleForClient} onChange={(event) => setNewFile({ ...newFile, visibleForClient: event.target.checked })} />
                      Видно клиенту
                    </label>
                    <div className="flex items-end">
                      <Button type="submit">Добавить</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
              <div className="overflow-hidden rounded-lg border border-graphite-100 bg-white">
                {state.files.filter((file) => visibleProjectIds.has(file.projectId)).map((file) => (
                  <div key={file.id} className="grid gap-3 border-b border-graphite-100 p-4 text-sm md:grid-cols-[1fr_160px_1fr_130px_80px] md:items-center">
                    <strong>{file.title}</strong>
                    <span>{file.type}</span>
                    <span className="text-graphite-500">{projectById.get(file.projectId)?.title}</span>
                    <span>{formatDate(file.uploadedAt)}</span>
                    <Switch checked={file.visibleForClient} onCheckedChange={() => store.toggleFileVisibility(file.id)} label="Видимость для клиента" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === "finance" && (
            <div className="mt-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Metric title="Общая стоимость" value={formatCurrency(totals.budget)} icon={CircleDollarSign} />
                <Metric title="Оплачено" value={formatCurrency(totals.paid)} icon={Check} />
                <Metric title="Долги клиентов" value={formatCurrency(totals.debt)} icon={CalendarClock} tone="red" />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {projectsForRole.map((project) => {
                  const materialsCost = state.materials.filter((material) => material.projectId === project.id).reduce((sum, material) => sum + material.price, 0);
                  const worksCost = Math.round(project.budget * 0.58);
                  const margin = project.budget - materialsCost - worksCost;
                  return (
                    <Card key={project.id}>
                      <CardHeader>
                        <CardTitle>{project.title}</CardTitle>
                        <CardDescription>Финансы проекта</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <FinanceLine label="Стоимость" value={project.budget} />
                        <FinanceLine label="Оплачено" value={project.paid} />
                        <FinanceLine label="Остаток" value={project.budget - project.paid} />
                        <FinanceLine label="Материалы" value={materialsCost} />
                        <FinanceLine label="Работы" value={worksCost} />
                        <FinanceLine label="Маржа" value={margin} strong />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {active === "materials" && (
            <div className="mt-6 space-y-6">
              <div className="overflow-hidden rounded-lg border border-graphite-100 bg-white">
                <div className="grid gap-3 bg-graphite-50 p-4 text-xs font-semibold uppercase text-graphite-500 md:grid-cols-[1fr_120px_120px_130px_1fr_150px]">
                  <span>Название</span>
                  <span>Категория</span>
                  <span>Кол-во</span>
                  <span>Цена</span>
                  <span>Поставщик</span>
                  <span>Статус</span>
                </div>
                {state.materials.filter((material) => visibleProjectIds.has(material.projectId)).map((material) => (
                  <div key={material.id} className="grid gap-3 border-t border-graphite-100 p-4 text-sm md:grid-cols-[1fr_120px_120px_130px_1fr_150px] md:items-center">
                    <strong>{material.title}</strong>
                    <span>{material.category}</span>
                    <span>{material.quantity}</span>
                    <span>{formatCurrency(material.price)}</span>
                    <span className="text-graphite-500">{material.supplier}</span>
                    <Select value={material.status} onChange={(event) => store.updateMaterialStatus(material.id, event.target.value as Material["status"])}>
                      <option>нужно купить</option>
                      <option>заказано</option>
                      <option>доставлено</option>
                      <option>оплачено</option>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === "analytics" && (
            <div className="mt-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Metric title="Лиды" value={state.leads.length.toString()} icon={Users} />
                <Metric title="Конверсия в замер" value={`${percent(state.leads.filter((lead) => ["Замер назначен", "Замер проведён", "КП отправлено", "Договор", "Оплата", "Проект в работе"].includes(lead.status)).length, state.leads.length)}%`} icon={SlidersHorizontal} />
                <Metric title="Конверсия в договор" value={`${percent(state.leads.filter((lead) => ["Договор", "Оплата", "Проект в работе"].includes(lead.status)).length, state.leads.length)}%`} icon={Check} />
                <Metric title="Активные проекты" value={state.projects.length.toString()} icon={BriefcaseBusiness} />
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Маржа по проектам</CardTitle>
                  <CardDescription>Оборот, оплаты и приблизительная маржинальность.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {state.projects.map((project) => {
                    const costs = state.materials.filter((material) => material.projectId === project.id).reduce((sum, material) => sum + material.price, 0) + Math.round(project.budget * 0.58);
                    const margin = project.budget - costs;
                    return (
                      <div key={project.id} className="rounded-lg border border-graphite-100 p-4">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <strong>{project.title}</strong>
                            <p className="text-sm text-graphite-500">Маржа: {formatCurrency(margin)}</p>
                          </div>
                          <Badge tone={margin > 0 ? "green" : "red"}>{percent(margin, project.budget)}%</Badge>
                        </div>
                        <Progress value={percent(margin, project.budget)} className="mt-3" />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({
  title,
  value,
  icon: Icon,
  tone = "gold"
}: {
  title: string;
  value: string;
  icon: typeof LayoutDashboard;
  tone?: "gold" | "red";
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardDescription>{title}</CardDescription>
          <span className={cn("rounded-md p-2", tone === "red" ? "bg-clay/10 text-clay" : "bg-gold-100 text-gold-700")}>
            <Icon className="h-4 w-4" />
          </span>
        </div>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function ProjectRow({ project, client }: { project: { title: string; progress: number; budget: number; paid: number; dueDate: string }; client: string }) {
  return (
    <div className="rounded-lg border border-graphite-100 p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold text-graphite-900">{project.title}</p>
          <p className="text-sm text-graphite-500">{client} · сдача {formatDate(project.dueDate)}</p>
        </div>
        <Badge tone="gold">{formatCurrency(project.budget - project.paid)} остаток</Badge>
      </div>
      <Progress value={project.progress} className="mt-4" />
    </div>
  );
}

function TaskLine({ task, projectTitle, onDone }: { task: { title: string; deadline: string; priority: Priority }; projectTitle: string; onDone: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-graphite-100 p-3">
      <div>
        <p className="text-sm font-semibold text-graphite-900">{task.title}</p>
        <p className="text-xs text-graphite-500">{projectTitle} · {formatDate(task.deadline)}</p>
      </div>
      <Button size="sm" variant="outline" onClick={onDone}>Готово</Button>
    </div>
  );
}

function FilterBar({
  query,
  setQuery,
  sort,
  setSort
}: {
  query: string;
  setQuery: (value: string) => void;
  sort: string;
  setSort: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-graphite-100 bg-white p-4 md:flex-row md:items-center md:justify-between">
      <div className="relative max-w-md flex-1">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-graphite-400" />
        <Input className="pl-9" placeholder="Поиск проекта или клиента" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      <Select className="max-w-xs" value={sort} onChange={(event) => setSort(event.target.value)}>
        <option value="progress">Сортировать по прогрессу</option>
        <option value="budget">Сортировать по бюджету</option>
        <option value="deadline">Сортировать по сроку</option>
      </Select>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-graphite-500">{label}</dt>
      <dd className="font-medium text-graphite-900">{value}</dd>
    </div>
  );
}

function StageBadge({ status }: { status: StageStatus }) {
  const tone = status === "завершён" ? "green" : status === "на проверке" ? "gold" : status === "в работе" ? "dark" : "neutral";
  return <Badge tone={tone}>{status}</Badge>;
}

function FinanceLine({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-graphite-100 py-2 last:border-0">
      <span className="text-graphite-500">{label}</span>
      <span className={strong ? "font-semibold text-moss" : "font-medium text-graphite-900"}>{formatCurrency(value)}</span>
    </div>
  );
}
