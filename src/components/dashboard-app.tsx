"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CircleDollarSign,
  ClipboardList,
  FilePlus2,
  FileText,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  PackageCheck,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Upload,
  UserCog
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  workerTrades,
  type CrewMember,
  type Material,
  type Payment,
  type Priority,
  type Project,
  type ProjectFile,
  type ProjectStage,
  type Role,
  type StageStatus,
  type Task,
  type TaskStatus,
  type User,
  type WorkerTrade
} from "@/lib/data";
import { useDemoState } from "@/lib/store";
import { cn, formatCurrency, formatDate, percent } from "@/lib/utils";

type ModuleId =
  | "overview"
  | "projects"
  | "schedule"
  | "tasks"
  | "team"
  | "chat"
  | "documents"
  | "finance"
  | "materials"
  | "reports"
  | "analytics";

const roleLabels: Record<Role, string> = {
  director: "Директор",
  admin: "Админ",
  manager: "Менеджер",
  designer: "Дизайнер",
  foreman: "Прораб",
  accountant: "Бухгалтер",
  worker: "Рабочий",
  client: "Клиент"
};

const modules: { id: ModuleId; label: string; icon: typeof LayoutDashboard; roles: Role[] }[] = [
  { id: "overview", label: "Обзор", icon: LayoutDashboard, roles: ["director", "admin", "manager", "designer", "foreman", "accountant", "worker"] },
  { id: "projects", label: "Проекты", icon: BriefcaseBusiness, roles: ["director", "admin", "manager", "designer", "foreman", "accountant", "worker"] },
  { id: "schedule", label: "Календарь работ", icon: CalendarDays, roles: ["director", "admin", "manager", "designer", "foreman", "worker"] },
  { id: "tasks", label: "Задачи", icon: ClipboardList, roles: ["director", "admin", "manager", "designer", "foreman", "worker"] },
  { id: "team", label: "Команда", icon: UserCog, roles: ["director", "admin", "manager", "foreman"] },
  { id: "chat", label: "Чаты проектов", icon: MessageCircle, roles: ["director", "admin", "manager", "designer", "foreman", "accountant", "worker"] },
  { id: "documents", label: "Документы", icon: FileText, roles: ["director", "admin", "manager", "designer", "foreman", "accountant"] },
  { id: "finance", label: "Финансы", icon: CircleDollarSign, roles: ["director", "admin", "manager", "accountant"] },
  { id: "materials", label: "Материалы", icon: PackageCheck, roles: ["director", "admin", "manager", "foreman", "accountant"] },
  { id: "reports", label: "Фотоотчёты", icon: ImagePlus, roles: ["director", "admin", "manager", "designer", "foreman"] },
  { id: "analytics", label: "Аналитика", icon: BarChart3, roles: ["director", "admin"] }
];

const sessionKey = "gulvira-dashboard-session-v2";
const todayIso = "2026-06-04";

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

function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function isSameDay(value: string, day: string) {
  return value === day;
}

function isOverdue(task: Task) {
  return task.status !== "завершена" && task.deadline < todayIso;
}

export function DashboardApp() {
  const store = useDemoState();
  const { state } = store;
  const [session, setSession] = useState<{ role: Role; userId: string } | null>(null);
  const [active, setActive] = useState<ModuleId>("overview");
  const [selectedProjectId, setSelectedProjectId] = useState("p-atilla");
  const [projectQuery, setProjectQuery] = useState("");
  const [scheduleProject, setScheduleProject] = useState("all");
  const [scheduleDay, setScheduleDay] = useState<"today" | "tomorrow" | "week" | "all">("today");
  const [taskStatus, setTaskStatus] = useState<"all" | TaskStatus>("all");
  const [taskProjectFilter, setTaskProjectFilter] = useState("all");
  const [taskTradeFilter, setTaskTradeFilter] = useState<"all" | WorkerTrade>("all");
  const [taskAssigneeFilter, setTaskAssigneeFilter] = useState("all");
  const [taskQuery, setTaskQuery] = useState("");
  const [chatText, setChatText] = useState("");
  const [uploadDraft, setUploadDraft] = useState({
    title: "",
    type: "Смета",
    content: "",
    visibleForClient: false
  });
  const [newProject, setNewProject] = useState({
    title: "",
    clientId: "c-aidar",
    address: "",
    city: "Шымкент",
    area: 80,
    objectType: "квартира",
    service: "дизайн + ремонт",
    startDate: todayIso,
    dueDate: addDays(todayIso, 90),
    managerId: "u-manager",
    designerId: "u-designer",
    foremanId: "u-foreman",
    budget: 15000000
  });
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    projectId: "p-atilla",
    stageId: "s-atilla-2",
    responsibleId: "u-foreman",
    assigneeId: "crew-electric-askar",
    trade: "электрик" as WorkerTrade,
    startDate: todayIso,
    deadline: addDays(todayIso, 3),
    priority: "средний" as Priority,
    status: "новая" as TaskStatus,
    location: ""
  });
  const [newMaterial, setNewMaterial] = useState({
    title: "",
    category: "материалы",
    quantity: "1 шт",
    price: 0,
    supplier: "",
    status: "нужно купить" as Material["status"]
  });
  const [newPayment, setNewPayment] = useState({
    amount: 0,
    date: todayIso,
    type: "этап" as Payment["type"],
    status: "ожидается" as Payment["status"]
  });

  useEffect(() => {
    setSession(getSession());
  }, []);

  const currentUser = useMemo(() => {
    if (!session) return null;
    return state.users.find((user) => user.id === session.userId) ?? state.users[0];
  }, [session, state.users]);

  const currentRole = session?.role ?? currentUser?.role ?? "manager";
  const currentCrewId = currentUser?.linkedCrewId;
  const visibleModules = modules.filter((item) => item.roles.includes(currentRole));

  const userById = useMemo(() => new Map(state.users.map((user) => [user.id, user])), [state.users]);
  const crewById = useMemo(() => new Map(state.crew.map((member) => [member.id, member])), [state.crew]);
  const clientById = useMemo(() => new Map(state.clients.map((client) => [client.id, client])), [state.clients]);
  const projectById = useMemo(() => new Map(state.projects.map((project) => [project.id, project])), [state.projects]);
  const stageById = useMemo(() => new Map(state.stages.map((stage) => [stage.id, stage])), [state.stages]);

  const projectsForRole = useMemo(() => {
    if (!currentUser || ["director", "admin", "accountant"].includes(currentRole)) return state.projects;
    if (currentRole === "manager") return state.projects.filter((project) => project.managerId === currentUser.id);
    if (currentRole === "designer") return state.projects.filter((project) => project.designerId === currentUser.id);
    if (currentRole === "foreman") return state.projects.filter((project) => project.foremanId === currentUser.id);
    if (currentRole === "worker" && currentCrewId) {
      const workerProjectIds = new Set(
        state.tasks.filter((task) => task.assigneeId === currentCrewId).map((task) => task.projectId)
      );
      return state.projects.filter((project) => workerProjectIds.has(project.id));
    }
    return [];
  }, [currentCrewId, currentRole, currentUser, state.projects, state.tasks]);

  useEffect(() => {
    if (!visibleModules.some((item) => item.id === active)) {
      setActive(visibleModules[0]?.id ?? "overview");
    }
  }, [active, visibleModules]);

  useEffect(() => {
    if (!projectsForRole.some((project) => project.id === selectedProjectId)) {
      setSelectedProjectId(projectsForRole[0]?.id ?? "");
    }
  }, [projectsForRole, selectedProjectId]);

  const visibleProjectIds = new Set(projectsForRole.map((project) => project.id));
  const selectedProject = projectById.get(selectedProjectId) ?? projectsForRole[0];
  const selectedProjectTasks = state.tasks.filter((task) => task.projectId === selectedProject?.id);
  const selectedProjectStages = state.stages.filter((stage) => stage.projectId === selectedProject?.id);
  const selectedProjectFiles = state.files.filter((file) => file.projectId === selectedProject?.id);
  const selectedProjectPayments = state.payments.filter((payment) => payment.projectId === selectedProject?.id);
  const selectedProjectMaterials = state.materials.filter((material) => material.projectId === selectedProject?.id);
  const selectedProjectMessages = state.chatMessages.filter((message) => message.projectId === selectedProject?.id);

  const filteredProjects = projectsForRole.filter((project) => {
    const client = clientById.get(project.clientId);
    return `${project.title} ${client?.name ?? ""} ${project.address} ${project.city}`
      .toLowerCase()
      .includes(projectQuery.toLowerCase());
  });

  const visibleTasks = state.tasks.filter((task) => visibleProjectIds.has(task.projectId));
  const filteredTasks = visibleTasks
    .filter((task) => taskStatus === "all" || task.status === taskStatus)
    .filter((task) => taskProjectFilter === "all" || task.projectId === taskProjectFilter)
    .filter((task) => taskTradeFilter === "all" || task.trade === taskTradeFilter)
    .filter((task) => taskAssigneeFilter === "all" || task.assigneeId === taskAssigneeFilter)
    .filter((task) => {
      const project = projectById.get(task.projectId)?.title ?? "";
      const stage = stageById.get(task.stageId)?.title ?? "";
      const assignee = crewById.get(task.assigneeId)?.name ?? "";
      return `${task.title} ${task.description} ${task.location} ${project} ${stage} ${assignee} ${task.trade}`
        .toLowerCase()
        .includes(taskQuery.toLowerCase());
    })
    .sort((a, b) => a.deadline.localeCompare(b.deadline));

  const scheduledTasks = visibleTasks
    .filter((task) => scheduleProject === "all" || task.projectId === scheduleProject)
    .filter((task) => {
      if (scheduleDay === "today") return isSameDay(task.deadline, todayIso) || isSameDay(task.startDate, todayIso);
      if (scheduleDay === "tomorrow") return isSameDay(task.deadline, addDays(todayIso, 1)) || isSameDay(task.startDate, addDays(todayIso, 1));
      if (scheduleDay === "week") return task.deadline >= todayIso && task.deadline <= addDays(todayIso, 7);
      return true;
    })
    .sort((a, b) => a.deadline.localeCompare(b.deadline));

  const taskStats = {
    open: visibleTasks.filter((task) => task.status !== "завершена").length,
    done: visibleTasks.filter((task) => task.status === "завершена").length,
    overdue: visibleTasks.filter(isOverdue).length,
    today: visibleTasks.filter((task) => task.deadline === todayIso || task.startDate === todayIso).length
  };

  const totals = {
    budget: projectsForRole.reduce((sum, project) => sum + project.budget, 0),
    paid: projectsForRole.reduce((sum, project) => sum + project.paid, 0)
  };

  function canOpenProject(projectId: string) {
    if (["director", "admin", "accountant"].includes(currentRole)) return true;
    if (!currentUser) return false;
    const project = projectById.get(projectId);
    if (!project) return false;
    if ([project.managerId, project.designerId, project.foremanId].includes(currentUser.id)) return true;
    if (currentRole === "worker" && currentCrewId) {
      return state.tasks.some((task) => task.projectId === projectId && task.assigneeId === currentCrewId);
    }
    return false;
  }

  function openProject(projectId: string, module: ModuleId = "projects") {
    setSelectedProjectId(projectId);
    setActive(module);
  }

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

  function handleAddProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const projectId = store.addProject(newProject);
    setSelectedProjectId(projectId);
    setNewTask((current) => ({ ...current, projectId }));
    setActive("projects");
    setNewProject({ ...newProject, title: "", address: "" });
  }

  function handleTaskSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    store.addTask(newTask);
    setNewTask({ ...newTask, title: "", description: "", location: "" });
  }

  function handleChatSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProject || !currentUser || !chatText.trim() || !canOpenProject(selectedProject.id)) return;
    store.addChatMessage({
      projectId: selectedProject.id,
      authorId: currentUser.id,
      authorName: currentUser.name,
      body: chatText.trim()
    });
    setChatText("");
  }

  function handleUploadDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProject) return;
    store.addFile({
      projectId: selectedProject.id,
      title: uploadDraft.title,
      type: uploadDraft.type,
      visibleForClient: uploadDraft.visibleForClient,
      source: "upload",
      content: uploadDraft.content || "Загруженный файл в демо-хранилище."
    });
    setUploadDraft({ title: "", type: "Смета", content: "", visibleForClient: false });
  }

  function handleAddMaterial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProject) return;
    store.addMaterial({ ...newMaterial, projectId: selectedProject.id });
    setNewMaterial({ title: "", category: "материалы", quantity: "1 шт", price: 0, supplier: "", status: "нужно купить" });
  }

  function handleAddPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProject) return;
    store.addPayment({ ...newPayment, projectId: selectedProject.id });
    store.updateProject(selectedProject.id, { paid: selectedProject.paid + Number(newPayment.amount) });
    setNewPayment({ amount: 0, date: todayIso, type: "этап", status: "ожидается" });
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-graphite-900 text-white">
        <div className="section-shell flex min-h-screen items-center py-12">
          <div className="grid w-full gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <Badge tone="gold">Gulvira CRM</Badge>
              <h1 className="mt-5 text-5xl font-semibold leading-tight">Рабочая система компании</h1>
              <p className="mt-5 max-w-xl text-white/68">
                Проекты, календарь работ, исполнители, проектные чаты, документы, финансы и материалы в одном месте.
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
                  Войти в CRM
                </CardTitle>
                <CardDescription>Роли показывают, как системой пользуется вся компания.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {(["director", "manager", "designer", "foreman", "accountant", "worker", "admin"] as Role[]).map((role) => {
                  const user = state.users.find((item) => item.role === role);
                  return (
                    <button
                      type="button"
                      key={role}
                      onClick={() => loginAs(role)}
                      className="rounded-lg border border-graphite-100 p-4 text-left transition hover:border-gold-300 hover:bg-gold-100/40"
                    >
                      <span className="block font-semibold">{roleLabels[role]}</span>
                      <span className="text-xs text-graphite-500">{user?.name}</span>
                    </button>
                  );
                })}
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
            <p className="text-xs text-white/60">{currentUser?.position ?? currentUser?.email}</p>
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
              <h1 className="text-3xl font-semibold text-graphite-900">
                {modules.find((module) => module.id === active)?.label}
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={store.reset}>Сбросить демо</Button>
              <Link href="/client">
                <Button variant="gold">Кабинет клиента</Button>
              </Link>
            </div>
          </header>

          {active === "overview" && (
            <div className="mt-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Metric title="Активные проекты" value={projectsForRole.length.toString()} icon={BriefcaseBusiness} />
                <Metric title="Работы сегодня" value={taskStats.today.toString()} icon={CalendarDays} />
                <Metric title="Просрочено" value={taskStats.overdue.toString()} icon={ClipboardList} tone="red" />
                <Metric title="Оборот" value={formatCurrency(totals.budget)} icon={CircleDollarSign} />
              </div>
              <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                <Card>
                  <CardHeader>
                    <CardTitle>Проекты</CardTitle>
                    <CardDescription>Нажмите на проект, чтобы открыть карточку, календарь, чат и документы.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {projectsForRole.map((project) => (
                      <ProjectRow
                        key={project.id}
                        project={project}
                        client={clientById.get(project.clientId)?.name ?? "Клиент"}
                        onOpen={() => openProject(project.id)}
                      />
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Сегодня и завтра</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {visibleTasks
                      .filter((task) => [todayIso, addDays(todayIso, 1)].includes(task.deadline) || [todayIso, addDays(todayIso, 1)].includes(task.startDate))
                      .slice(0, 8)
                      .map((task) => (
                        <TaskMini
                          key={task.id}
                          task={task}
                          project={projectById.get(task.projectId)}
                          assignee={crewById.get(task.assigneeId)}
                          onDone={() => store.updateTaskStatus(task.id, "завершена")}
                        />
                      ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {active === "projects" && (
            <div className="mt-6 space-y-6">
              <ProjectSelector
                projects={projectsForRole}
                selectedProjectId={selectedProject?.id ?? ""}
                setSelectedProjectId={setSelectedProjectId}
              />
              {selectedProject && (
                <ProjectDetail
                  crewById={crewById}
                  files={selectedProjectFiles}
                  messages={selectedProjectMessages}
                  payments={selectedProjectPayments}
                  project={selectedProject}
                  stages={selectedProjectStages}
                  tasks={selectedProjectTasks}
                  userById={userById}
                  onOpenChat={() => setActive("chat")}
                  onOpenDocs={() => setActive("documents")}
                  onOpenFinance={() => setActive("finance")}
                  onTaskDone={(taskId) => store.updateTaskStatus(taskId, "завершена")}
                />
              )}
              {["director", "admin", "manager"].includes(currentRole) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Создать новый проект</CardTitle>
                    <CardDescription>После создания автоматически добавятся шаблонные этапы и первые работы.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddProject} className="grid gap-4 lg:grid-cols-4">
                      <Field label="Название">
                        <Input required value={newProject.title} onChange={(event) => setNewProject({ ...newProject, title: event.target.value })} />
                      </Field>
                      <Field label="Клиент">
                        <Select value={newProject.clientId} onChange={(event) => setNewProject({ ...newProject, clientId: event.target.value })}>
                          {state.clients.map((client) => <option value={client.id} key={client.id}>{client.name}</option>)}
                        </Select>
                      </Field>
                      <Field label="Адрес">
                        <Input required value={newProject.address} onChange={(event) => setNewProject({ ...newProject, address: event.target.value })} />
                      </Field>
                      <Field label="Город">
                        <Input value={newProject.city} onChange={(event) => setNewProject({ ...newProject, city: event.target.value })} />
                      </Field>
                      <Field label="Площадь">
                        <Input type="number" value={newProject.area} onChange={(event) => setNewProject({ ...newProject, area: Number(event.target.value) })} />
                      </Field>
                      <Field label="Услуга">
                        <Select value={newProject.service} onChange={(event) => setNewProject({ ...newProject, service: event.target.value })}>
                          <option>дизайн-проект</option>
                          <option>ремонт</option>
                          <option>дизайн + ремонт</option>
                          <option>архитектура + ремонт</option>
                        </Select>
                      </Field>
                      <Field label="Старт">
                        <Input type="date" value={newProject.startDate} onChange={(event) => setNewProject({ ...newProject, startDate: event.target.value })} />
                      </Field>
                      <Field label="Сдача">
                        <Input type="date" value={newProject.dueDate} onChange={(event) => setNewProject({ ...newProject, dueDate: event.target.value })} />
                      </Field>
                      <Field label="Менеджер">
                        <Select value={newProject.managerId} onChange={(event) => setNewProject({ ...newProject, managerId: event.target.value })}>
                          {state.users.filter((user) => ["manager", "director", "admin"].includes(user.role)).map((user) => <option value={user.id} key={user.id}>{user.name}</option>)}
                        </Select>
                      </Field>
                      <Field label="Дизайнер">
                        <Select value={newProject.designerId} onChange={(event) => setNewProject({ ...newProject, designerId: event.target.value })}>
                          {state.users.filter((user) => user.role === "designer").map((user) => <option value={user.id} key={user.id}>{user.name}</option>)}
                        </Select>
                      </Field>
                      <Field label="Прораб">
                        <Select value={newProject.foremanId} onChange={(event) => setNewProject({ ...newProject, foremanId: event.target.value })}>
                          {state.users.filter((user) => user.role === "foreman").map((user) => <option value={user.id} key={user.id}>{user.name}</option>)}
                        </Select>
                      </Field>
                      <Field label="Бюджет">
                        <Input type="number" value={newProject.budget} onChange={(event) => setNewProject({ ...newProject, budget: Number(event.target.value) })} />
                      </Field>
                      <div className="lg:col-span-4">
                        <Button type="submit" variant="gold"><Plus className="h-4 w-4" /> Создать проект с шаблоном</Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
              <div className="grid gap-4 xl:grid-cols-3">
                <div className="relative xl:col-span-3">
                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-graphite-400" />
                  <Input className="pl-9" placeholder="Поиск проекта" value={projectQuery} onChange={(event) => setProjectQuery(event.target.value)} />
                </div>
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    client={clientById.get(project.clientId)?.name ?? "Клиент"}
                    project={project}
                    onOpen={() => openProject(project.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {active === "schedule" && (
            <div className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Что нужно сделать по дням</CardTitle>
                  <CardDescription>Сортировка по проекту и периоду: сегодня, завтра, неделя или весь график.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <Select value={scheduleProject} onChange={(event) => setScheduleProject(event.target.value)}>
                    <option value="all">Все проекты</option>
                    {projectsForRole.map((project) => <option value={project.id} key={project.id}>{project.title}</option>)}
                  </Select>
                  <Select value={scheduleDay} onChange={(event) => setScheduleDay(event.target.value as typeof scheduleDay)}>
                    <option value="today">Сегодня</option>
                    <option value="tomorrow">Завтра</option>
                    <option value="week">Ближайшая неделя</option>
                    <option value="all">Весь календарь</option>
                  </Select>
                  <Badge tone="gold" className="w-fit self-center">{scheduledTasks.length} работ</Badge>
                </CardContent>
              </Card>
              <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
                <Card>
                  <CardHeader>
                    <CardTitle>Этапы по проектам</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {state.stages
                      .filter((stage) => scheduleProject === "all" || stage.projectId === scheduleProject)
                      .filter((stage) => visibleProjectIds.has(stage.projectId))
                      .sort((a, b) => a.deadline.localeCompare(b.deadline))
                      .map((stage) => (
                        <StageEditor
                          key={stage.id}
                          projectTitle={projectById.get(stage.projectId)?.title ?? ""}
                          stage={stage}
                          users={state.users}
                          onChange={(patch) => store.updateStage(stage.id, patch)}
                        />
                      ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Работы на выбранный период</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {scheduledTasks.map((task) => (
                      <WorkListItem
                        key={task.id}
                        assignee={crewById.get(task.assigneeId)}
                        project={projectById.get(task.projectId)}
                        stage={stageById.get(task.stageId)}
                        task={task}
                        onDone={() => store.updateTaskStatus(task.id, "завершена")}
                      />
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {active === "tasks" && (
            <div className="mt-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Metric title="Открытые" value={taskStats.open.toString()} icon={ClipboardList} />
                <Metric title="Готово" value={taskStats.done.toString()} icon={Check} />
                <Metric title="Сегодня" value={taskStats.today.toString()} icon={CalendarDays} />
                <Metric title="Просрочено" value={taskStats.overdue.toString()} icon={ClipboardList} tone="red" />
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Новая работа</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleTaskSubmit} className="grid gap-4 lg:grid-cols-4">
                    <Field label="Название">
                      <Input required value={newTask.title} onChange={(event) => setNewTask({ ...newTask, title: event.target.value })} />
                    </Field>
                    <Field label="Проект">
                      <Select value={newTask.projectId} onChange={(event) => {
                        const projectId = event.target.value;
                        const firstStage = state.stages.find((stage) => stage.projectId === projectId);
                        setNewTask({ ...newTask, projectId, stageId: firstStage?.id ?? "" });
                      }}>
                        {projectsForRole.map((project) => <option value={project.id} key={project.id}>{project.title}</option>)}
                      </Select>
                    </Field>
                    <Field label="Этап">
                      <Select value={newTask.stageId} onChange={(event) => setNewTask({ ...newTask, stageId: event.target.value })}>
                        {state.stages.filter((stage) => stage.projectId === newTask.projectId).map((stage) => <option value={stage.id} key={stage.id}>{stage.title}</option>)}
                      </Select>
                    </Field>
                    <Field label="Исполнитель">
                      <Select value={newTask.assigneeId} onChange={(event) => {
                        const member = crewById.get(event.target.value);
                        setNewTask({ ...newTask, assigneeId: event.target.value, trade: member?.trade ?? newTask.trade });
                      }}>
                        {state.crew.map((member) => <option value={member.id} key={member.id}>{member.trade} · {member.name}</option>)}
                      </Select>
                    </Field>
                    <Field label="Специализация">
                      <Select value={newTask.trade} onChange={(event) => setNewTask({ ...newTask, trade: event.target.value as WorkerTrade })}>
                        {workerTrades.map((trade) => <option key={trade}>{trade}</option>)}
                      </Select>
                    </Field>
                    <Field label="Старт">
                      <Input type="date" value={newTask.startDate} onChange={(event) => setNewTask({ ...newTask, startDate: event.target.value })} />
                    </Field>
                    <Field label="Дедлайн">
                      <Input type="date" value={newTask.deadline} onChange={(event) => setNewTask({ ...newTask, deadline: event.target.value })} />
                    </Field>
                    <Field label="Куратор">
                      <Select value={newTask.responsibleId} onChange={(event) => setNewTask({ ...newTask, responsibleId: event.target.value })}>
                        {state.users.filter((user) => user.role !== "client").map((user) => <option value={user.id} key={user.id}>{user.name}</option>)}
                      </Select>
                    </Field>
                    <Field label="Приоритет">
                      <Select value={newTask.priority} onChange={(event) => setNewTask({ ...newTask, priority: event.target.value as Priority })}>
                        <option>низкий</option>
                        <option>средний</option>
                        <option>высокий</option>
                      </Select>
                    </Field>
                    <Field label="Зона работ">
                      <Input value={newTask.location} onChange={(event) => setNewTask({ ...newTask, location: event.target.value })} />
                    </Field>
                    <Field label="Описание" className="lg:col-span-2">
                      <Input value={newTask.description} onChange={(event) => setNewTask({ ...newTask, description: event.target.value })} />
                    </Field>
                    <div className="flex items-end">
                      <Button type="submit"><Plus className="h-4 w-4" /> Добавить</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
              <TaskFilters
                assignee={taskAssigneeFilter}
                projects={projectsForRole}
                projectValue={taskProjectFilter}
                query={taskQuery}
                setAssignee={setTaskAssigneeFilter}
                setProject={setTaskProjectFilter}
                setQuery={setTaskQuery}
                setStatus={setTaskStatus}
                setTrade={setTaskTradeFilter}
                status={taskStatus}
                trade={taskTradeFilter}
                crew={state.crew}
              />
              <div className="grid gap-4 xl:grid-cols-4">
                {(["новая", "в работе", "на проверке", "завершена"] as TaskStatus[]).map((status) => (
                  <div key={status} className="rounded-lg border border-graphite-100 bg-white p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-graphite-900">{status}</h3>
                      <Badge>{filteredTasks.filter((task) => task.status === status).length}</Badge>
                    </div>
                    <div className="space-y-3">
                      {filteredTasks.filter((task) => task.status === status).map((task) => (
                        <TaskCard
                          key={task.id}
                          assignee={crewById.get(task.assigneeId)}
                          crew={state.crew}
                          curator={userById.get(task.responsibleId)?.name ?? ""}
                          projectTitle={projectById.get(task.projectId)?.title ?? ""}
                          stageTitle={stageById.get(task.stageId)?.title ?? ""}
                          task={task}
                          onAssigneeChange={(member) => store.updateTaskAssignee(task.id, member.id, member.trade)}
                          onStatusChange={(nextStatus) => store.updateTaskStatus(task.id, nextStatus)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === "team" && (
            <TeamModule
              crew={state.crew}
              users={state.users.filter((user) => user.role !== "client")}
              onCrewAdd={(member) => store.addCrewMember(member)}
              onCrewChange={(id, patch) => store.updateCrewMember(id, patch)}
              onUserChange={(id, patch) => store.updateUser(id, patch)}
            />
          )}

          {active === "chat" && selectedProject && (
            <div className="mt-6 space-y-6">
              <ProjectSelector projects={projectsForRole} selectedProjectId={selectedProject.id} setSelectedProjectId={setSelectedProjectId} />
              <Card>
                <CardHeader>
                  <CardTitle>Группа проекта: {selectedProject.title}</CardTitle>
                  <CardDescription>
                    Доступ: директор, менеджер, дизайнер, прораб, бухгалтер и исполнители, назначенные на работы проекта.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {[selectedProject.managerId, selectedProject.designerId, selectedProject.foremanId].map((id) => (
                      <Badge key={id} tone="gold">{userById.get(id)?.name}</Badge>
                    ))}
                    {Array.from(new Set(selectedProjectTasks.map((task) => task.assigneeId))).map((id) => (
                      <Badge key={id}>{crewById.get(id)?.name}</Badge>
                    ))}
                  </div>
                  <div className="max-h-[520px] space-y-3 overflow-y-auto rounded-lg bg-graphite-50 p-4">
                    {selectedProjectMessages.map((message) => (
                      <div key={message.id} className="max-w-2xl rounded-lg bg-white p-3 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <strong className="text-sm text-graphite-900">{message.authorName}</strong>
                          <span className="text-xs text-graphite-500">{new Date(message.createdAt).toLocaleString("ru-RU")}</span>
                        </div>
                        <p className="mt-2 text-sm text-graphite-700">{message.body}</p>
                      </div>
                    ))}
                  </div>
                  <form className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]" onSubmit={handleChatSubmit}>
                    <Input value={chatText} onChange={(event) => setChatText(event.target.value)} placeholder="Написать сообщение в группу проекта" />
                    <Button type="submit" variant="gold"><Send className="h-4 w-4" /> Отправить</Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {active === "documents" && selectedProject && (
            <DocumentsModule
              files={selectedProjectFiles}
              project={selectedProject}
              templates={state.documentTemplates}
              uploadDraft={uploadDraft}
              setUploadDraft={setUploadDraft}
              onCreateFromTemplate={(template) => store.createFileFromTemplate(selectedProject.id, template)}
              onFileChange={(id, patch) => store.updateFile(id, patch)}
              onToggleVisible={(id) => store.toggleFileVisibility(id)}
              onUpload={handleUploadDocument}
            />
          )}

          {active === "finance" && selectedProject && (
            <FinanceModule
              payments={selectedProjectPayments}
              project={selectedProject}
              newPayment={newPayment}
              setNewPayment={setNewPayment}
              onPaymentAdd={handleAddPayment}
              onPaymentChange={(id, patch) => store.updatePayment(id, patch)}
              onProjectChange={(patch) => store.updateProject(selectedProject.id, patch)}
            />
          )}

          {active === "materials" && selectedProject && (
            <MaterialsModule
              materials={selectedProjectMaterials}
              newMaterial={newMaterial}
              project={selectedProject}
              setNewMaterial={setNewMaterial}
              onAdd={handleAddMaterial}
              onChange={(id, patch) => store.updateMaterial(id, patch)}
            />
          )}

          {active === "reports" && (
            <ReportsModule
              reports={state.photoReports.filter((report) => visibleProjectIds.has(report.projectId))}
              projectById={projectById}
              stageById={stageById}
            />
          )}

          {active === "analytics" && (
            <div className="mt-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Metric title="Проекты" value={state.projects.length.toString()} icon={BriefcaseBusiness} />
                <Metric title="Работы закрыты" value={`${percent(taskStats.done, visibleTasks.length)}%`} icon={Check} />
                <Metric title="Оплачено" value={formatCurrency(totals.paid)} icon={CircleDollarSign} />
                <Metric title="Просрочки" value={taskStats.overdue.toString()} icon={ClipboardList} tone="red" />
              </div>
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

function ProjectSelector({
  projects,
  selectedProjectId,
  setSelectedProjectId
}: {
  projects: Project[];
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
}) {
  return (
    <div className="rounded-lg border border-graphite-100 bg-white p-4">
      <Select value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)}>
        {projects.map((project) => (
          <option value={project.id} key={project.id}>{project.title}</option>
        ))}
      </Select>
    </div>
  );
}

function ProjectRow({
  project,
  client,
  onOpen
}: {
  project: Project;
  client: string;
  onOpen: () => void;
}) {
  return (
    <button type="button" onClick={onOpen} className="w-full rounded-lg border border-graphite-100 p-4 text-left transition hover:border-gold-300 hover:bg-gold-100/30">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold text-graphite-900">{project.title}</p>
          <p className="text-sm text-graphite-500">{client} · сдача {formatDate(project.dueDate)}</p>
        </div>
        <Badge tone="gold">{project.progress}%</Badge>
      </div>
      <Progress value={project.progress} className="mt-4" />
    </button>
  );
}

function ProjectCard({ project, client, onOpen }: { project: Project; client: string; onOpen: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{project.title}</CardTitle>
        <CardDescription>{client} · {project.city}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={project.progress} />
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Info label="Адрес" value={project.address} />
          <Info label="Площадь" value={`${project.area} м²`} />
          <Info label="Срок" value={formatDate(project.dueDate)} />
          <Info label="Бюджет" value={formatCurrency(project.budget)} />
        </div>
        <Button className="w-full" onClick={onOpen}>Открыть проект</Button>
      </CardContent>
    </Card>
  );
}

function ProjectDetail({
  project,
  tasks,
  stages,
  files,
  payments,
  messages,
  userById,
  crewById,
  onTaskDone,
  onOpenChat,
  onOpenDocs,
  onOpenFinance
}: {
  project: Project;
  tasks: Task[];
  stages: ProjectStage[];
  files: ProjectFile[];
  payments: Payment[];
  messages: { body: string }[];
  userById: Map<string, User>;
  crewById: Map<string, CrewMember>;
  onTaskDone: (taskId: string) => void;
  onOpenChat: () => void;
  onOpenDocs: () => void;
  onOpenFinance: () => void;
}) {
  const done = tasks.filter((task) => task.status === "завершена").length;
  const nextTasks = tasks.filter((task) => task.status !== "завершена").sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 6);

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <Badge tone="gold">{project.status}</Badge>
            <CardTitle className="mt-3 text-3xl">{project.title}</CardTitle>
            <CardDescription>{project.address} · {project.area} м² · сдача {formatDate(project.dueDate)}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onOpenChat}><MessageCircle className="h-4 w-4" /> Чат</Button>
            <Button variant="outline" onClick={onOpenDocs}><FileText className="h-4 w-4" /> Документы</Button>
            <Button variant="gold" onClick={onOpenFinance}><CircleDollarSign className="h-4 w-4" /> Финансы</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <InfoCard label="Менеджер" value={userById.get(project.managerId)?.name ?? ""} />
          <InfoCard label="Дизайнер" value={userById.get(project.designerId)?.name ?? ""} />
          <InfoCard label="Прораб" value={userById.get(project.foremanId)?.name ?? ""} />
          <InfoCard label="Работы закрыты" value={`${percent(done, tasks.length)}%`} />
        </div>
        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span>Общий прогресс</span>
            <strong>{project.progress}%</strong>
          </div>
          <Progress value={project.progress} />
        </div>
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg border border-graphite-100 p-4">
            <h3 className="font-semibold text-graphite-900">Хронология по календарю</h3>
            <div className="mt-4 space-y-3">
              {stages.sort((a, b) => a.startDate.localeCompare(b.startDate)).map((stage) => (
                <div key={stage.id} className="grid gap-3 rounded-md bg-graphite-50 p-3 text-sm md:grid-cols-[160px_1fr_120px]">
                  <span>{formatDate(stage.startDate)} → {formatDate(stage.deadline)}</span>
                  <span>
                    <strong>{stage.title}</strong>
                    <span className="block text-xs text-graphite-500">{stage.description}</span>
                  </span>
                  <StageBadge status={stage.status} />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-graphite-100 p-4">
            <h3 className="font-semibold text-graphite-900">Ближайшие работы</h3>
            <div className="mt-4 space-y-3">
              {nextTasks.map((task) => (
                <TaskMini
                  key={task.id}
                  task={task}
                  assignee={crewById.get(task.assigneeId)}
                  onDone={() => onTaskDone(task.id)}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <InfoCard label="Документы" value={files.length.toString()} />
          <InfoCard label="Сообщения в чате" value={messages.length.toString()} />
          <InfoCard label="Оплаты" value={formatCurrency(payments.reduce((sum, payment) => payment.status === "оплачено" ? sum + payment.amount : sum, 0))} />
        </div>
      </CardContent>
    </Card>
  );
}

function TaskFilters(props: {
  projects: Project[];
  crew: CrewMember[];
  query: string;
  setQuery: (value: string) => void;
  projectValue: string;
  setProject: (value: string) => void;
  trade: "all" | WorkerTrade;
  setTrade: (value: "all" | WorkerTrade) => void;
  assignee: string;
  setAssignee: (value: string) => void;
  status: "all" | TaskStatus;
  setStatus: (value: "all" | TaskStatus) => void;
}) {
  return (
    <div className="rounded-lg border border-graphite-100 bg-white p-4">
      <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1fr]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-graphite-400" />
          <Input className="pl-9" placeholder="Поиск по задаче, зоне, исполнителю" value={props.query} onChange={(event) => props.setQuery(event.target.value)} />
        </div>
        <Select value={props.projectValue} onChange={(event) => props.setProject(event.target.value)}>
          <option value="all">Все проекты</option>
          {props.projects.map((project) => <option value={project.id} key={project.id}>{project.title}</option>)}
        </Select>
        <Select value={props.trade} onChange={(event) => props.setTrade(event.target.value as "all" | WorkerTrade)}>
          <option value="all">Все специализации</option>
          {workerTrades.map((trade) => <option key={trade}>{trade}</option>)}
        </Select>
        <Select value={props.assignee} onChange={(event) => props.setAssignee(event.target.value)}>
          <option value="all">Все исполнители</option>
          {props.crew.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}
        </Select>
        <Select value={props.status} onChange={(event) => props.setStatus(event.target.value as "all" | TaskStatus)}>
          <option value="all">Все статусы</option>
          <option>новая</option>
          <option>в работе</option>
          <option>на проверке</option>
          <option>завершена</option>
        </Select>
      </div>
    </div>
  );
}

function TaskCard({
  task,
  projectTitle,
  stageTitle,
  curator,
  assignee,
  crew,
  onStatusChange,
  onAssigneeChange
}: {
  task: Task;
  projectTitle: string;
  stageTitle: string;
  curator: string;
  assignee?: CrewMember;
  crew: CrewMember[];
  onStatusChange: (status: TaskStatus) => void;
  onAssigneeChange: (member: CrewMember) => void;
}) {
  return (
    <div className="rounded-lg border border-graphite-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-graphite-900">{task.title}</p>
          <p className="mt-1 text-xs text-graphite-500">{projectTitle} · {stageTitle}</p>
        </div>
        <Badge tone={task.priority === "высокий" ? "red" : "neutral"}>{task.priority}</Badge>
      </div>
      <p className="mt-3 text-sm leading-6 text-graphite-600">{task.description || "Описание не добавлено."}</p>
      <div className="mt-4 grid gap-2 text-sm">
        <Info label="Исполнитель" value={assignee ? `${assignee.name} · ${assignee.trade}` : task.trade} />
        <Info label="Куратор" value={curator} />
        <Info label="Зона" value={task.location || "объект"} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <DeadlineBadge deadline={task.deadline} status={task.status} />
        <Badge tone="gold">старт {formatDate(task.startDate)}</Badge>
      </div>
      <div className="mt-4 grid gap-2">
        <Select value={task.status} onChange={(event) => onStatusChange(event.target.value as TaskStatus)}>
          <option>новая</option>
          <option>в работе</option>
          <option>на проверке</option>
          <option>завершена</option>
        </Select>
        <Select value={task.assigneeId} onChange={(event) => {
          const member = crew.find((item) => item.id === event.target.value);
          if (member) onAssigneeChange(member);
        }}>
          {crew.map((member) => <option value={member.id} key={member.id}>{member.trade} · {member.name}</option>)}
        </Select>
        {task.status !== "завершена" && (
          <Button size="sm" variant="gold" onClick={() => onStatusChange("завершена")}>
            Готово
          </Button>
        )}
      </div>
    </div>
  );
}

function TeamModule({
  users,
  crew,
  onUserChange,
  onCrewChange,
  onCrewAdd
}: {
  users: User[];
  crew: CrewMember[];
  onUserChange: (id: string, patch: Partial<User>) => void;
  onCrewChange: (id: string, patch: Partial<CrewMember>) => void;
  onCrewAdd: (member: Omit<CrewMember, "id">) => void;
}) {
  const [newCrew, setNewCrew] = useState<Omit<CrewMember, "id">>({
    name: "",
    trade: "электрик",
    phone: "",
    city: "Шымкент",
    ratePerDay: 35000,
    status: "свободен"
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onCrewAdd(newCrew);
    setNewCrew({ ...newCrew, name: "", phone: "" });
  }

  return (
    <div className="mt-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Сотрудники офиса</CardTitle>
          <CardDescription>Редактирование ролей, телефонов и должностей.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="grid gap-3 rounded-lg border border-graphite-100 p-4 md:grid-cols-[1fr_150px_1fr_180px]">
              <Input value={user.name} onChange={(event) => onUserChange(user.id, { name: event.target.value })} />
              <Select value={user.role} onChange={(event) => onUserChange(user.id, { role: event.target.value as Role })}>
                {(["director", "admin", "manager", "designer", "foreman", "accountant", "worker"] as Role[]).map((role) => <option value={role} key={role}>{roleLabels[role]}</option>)}
              </Select>
              <Input value={user.position ?? ""} onChange={(event) => onUserChange(user.id, { position: event.target.value })} />
              <Input value={user.phone ?? ""} onChange={(event) => onUserChange(user.id, { phone: event.target.value })} />
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Исполнители и бригады</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={submit} className="grid gap-3 lg:grid-cols-6">
            <Input placeholder="Имя" required value={newCrew.name} onChange={(event) => setNewCrew({ ...newCrew, name: event.target.value })} />
            <Select value={newCrew.trade} onChange={(event) => setNewCrew({ ...newCrew, trade: event.target.value as WorkerTrade })}>
              {workerTrades.map((trade) => <option key={trade}>{trade}</option>)}
            </Select>
            <Input placeholder="Телефон" required value={newCrew.phone} onChange={(event) => setNewCrew({ ...newCrew, phone: event.target.value })} />
            <Input placeholder="Город" value={newCrew.city} onChange={(event) => setNewCrew({ ...newCrew, city: event.target.value })} />
            <Input type="number" value={newCrew.ratePerDay} onChange={(event) => setNewCrew({ ...newCrew, ratePerDay: Number(event.target.value) })} />
            <Button type="submit"><Plus className="h-4 w-4" /> Добавить</Button>
          </form>
          {crew.map((member) => (
            <div key={member.id} className="grid gap-3 rounded-lg border border-graphite-100 p-4 md:grid-cols-[1fr_150px_180px_140px_140px_150px]">
              <Input value={member.name} onChange={(event) => onCrewChange(member.id, { name: event.target.value })} />
              <Select value={member.trade} onChange={(event) => onCrewChange(member.id, { trade: event.target.value as WorkerTrade })}>
                {workerTrades.map((trade) => <option key={trade}>{trade}</option>)}
              </Select>
              <Input value={member.phone} onChange={(event) => onCrewChange(member.id, { phone: event.target.value })} />
              <Input value={member.city} onChange={(event) => onCrewChange(member.id, { city: event.target.value })} />
              <Input type="number" value={member.ratePerDay} onChange={(event) => onCrewChange(member.id, { ratePerDay: Number(event.target.value) })} />
              <Select value={member.status} onChange={(event) => onCrewChange(member.id, { status: event.target.value as CrewMember["status"] })}>
                <option>свободен</option>
                <option>на объекте</option>
                <option>выходной</option>
              </Select>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function DocumentsModule({
  project,
  files,
  templates,
  uploadDraft,
  setUploadDraft,
  onCreateFromTemplate,
  onUpload,
  onFileChange,
  onToggleVisible
}: {
  project: Project;
  files: ProjectFile[];
  templates: { id: string; title: string; type: string; content: string }[];
  uploadDraft: { title: string; type: string; content: string; visibleForClient: boolean };
  setUploadDraft: (draft: { title: string; type: string; content: string; visibleForClient: boolean }) => void;
  onCreateFromTemplate: (template: { id: string; title: string; type: string; content: string }) => void;
  onUpload: (event: FormEvent<HTMLFormElement>) => void;
  onFileChange: (id: string, patch: Partial<ProjectFile>) => void;
  onToggleVisible: (id: string) => void;
}) {
  return (
    <div className="mt-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Документы проекта: {project.title}</CardTitle>
          <CardDescription>Создание по шаблону и загрузка документов в демо-хранилище.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {templates.map((template) => (
            <button key={template.id} type="button" onClick={() => onCreateFromTemplate(template)} className="rounded-lg border border-graphite-100 p-4 text-left transition hover:border-gold-300 hover:bg-gold-100/40">
              <FilePlus2 className="mb-3 h-5 w-5 text-gold-500" />
              <strong>{template.title}</strong>
              <p className="mt-1 text-xs text-graphite-500">{template.type}</p>
            </button>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Загрузить документ</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onUpload} className="grid gap-3 lg:grid-cols-5">
            <Input required placeholder="Название" value={uploadDraft.title} onChange={(event) => setUploadDraft({ ...uploadDraft, title: event.target.value })} />
            <Select value={uploadDraft.type} onChange={(event) => setUploadDraft({ ...uploadDraft, type: event.target.value })}>
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
            <Input placeholder="Описание / ссылка / номер файла" value={uploadDraft.content} onChange={(event) => setUploadDraft({ ...uploadDraft, content: event.target.value })} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={uploadDraft.visibleForClient} onChange={(event) => setUploadDraft({ ...uploadDraft, visibleForClient: event.target.checked })} />
              Клиент видит
            </label>
            <Button type="submit"><Upload className="h-4 w-4" /> Загрузить</Button>
          </form>
        </CardContent>
      </Card>
      <div className="space-y-3">
        {files.map((file) => (
          <div key={file.id} className="grid gap-3 rounded-lg border border-graphite-100 bg-white p-4 md:grid-cols-[1fr_150px_1fr_100px_80px] md:items-center">
            <Input value={file.title} onChange={(event) => onFileChange(file.id, { title: event.target.value })} />
            <Badge tone={file.source === "template" ? "gold" : "neutral"}>{file.type}</Badge>
            <Input value={file.content ?? ""} onChange={(event) => onFileChange(file.id, { content: event.target.value })} />
            <span className="text-xs text-graphite-500">{formatDate(file.uploadedAt)}</span>
            <Switch checked={file.visibleForClient} onCheckedChange={() => onToggleVisible(file.id)} label="Видимость" />
          </div>
        ))}
      </div>
    </div>
  );
}

function FinanceModule({
  project,
  payments,
  newPayment,
  setNewPayment,
  onPaymentAdd,
  onPaymentChange,
  onProjectChange
}: {
  project: Project;
  payments: Payment[];
  newPayment: { amount: number; date: string; type: Payment["type"]; status: Payment["status"] };
  setNewPayment: (payment: { amount: number; date: string; type: Payment["type"]; status: Payment["status"] }) => void;
  onPaymentAdd: (event: FormEvent<HTMLFormElement>) => void;
  onPaymentChange: (id: string, patch: Partial<Payment>) => void;
  onProjectChange: (patch: Partial<Project>) => void;
}) {
  return (
    <div className="mt-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Финансы: {project.title}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Field label="Общая стоимость">
            <Input type="number" value={project.budget} onChange={(event) => onProjectChange({ budget: Number(event.target.value) })} />
          </Field>
          <Field label="Оплачено">
            <Input type="number" value={project.paid} onChange={(event) => onProjectChange({ paid: Number(event.target.value) })} />
          </Field>
          <InfoCard label="Остаток" value={formatCurrency(project.budget - project.paid)} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Добавить оплату</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onPaymentAdd} className="grid gap-3 md:grid-cols-5">
            <Input type="number" value={newPayment.amount} onChange={(event) => setNewPayment({ ...newPayment, amount: Number(event.target.value) })} />
            <Input type="date" value={newPayment.date} onChange={(event) => setNewPayment({ ...newPayment, date: event.target.value })} />
            <Select value={newPayment.type} onChange={(event) => setNewPayment({ ...newPayment, type: event.target.value as Payment["type"] })}>
              <option>предоплата</option>
              <option>этап</option>
              <option>финальный платёж</option>
            </Select>
            <Select value={newPayment.status} onChange={(event) => setNewPayment({ ...newPayment, status: event.target.value as Payment["status"] })}>
              <option>ожидается</option>
              <option>оплачено</option>
            </Select>
            <Button type="submit">Добавить</Button>
          </form>
        </CardContent>
      </Card>
      <div className="space-y-3">
        {payments.map((payment) => (
          <div key={payment.id} className="grid gap-3 rounded-lg border border-graphite-100 bg-white p-4 md:grid-cols-4">
            <Input type="number" value={payment.amount} onChange={(event) => onPaymentChange(payment.id, { amount: Number(event.target.value) })} />
            <Input type="date" value={payment.date} onChange={(event) => onPaymentChange(payment.id, { date: event.target.value })} />
            <Select value={payment.type} onChange={(event) => onPaymentChange(payment.id, { type: event.target.value as Payment["type"] })}>
              <option>предоплата</option>
              <option>этап</option>
              <option>финальный платёж</option>
            </Select>
            <Select value={payment.status} onChange={(event) => onPaymentChange(payment.id, { status: event.target.value as Payment["status"] })}>
              <option>ожидается</option>
              <option>оплачено</option>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
}

function MaterialsModule({
  project,
  materials,
  newMaterial,
  setNewMaterial,
  onAdd,
  onChange
}: {
  project: Project;
  materials: Material[];
  newMaterial: Omit<Material, "id" | "projectId">;
  setNewMaterial: (material: Omit<Material, "id" | "projectId">) => void;
  onAdd: (event: FormEvent<HTMLFormElement>) => void;
  onChange: (id: string, patch: Partial<Material>) => void;
}) {
  return (
    <div className="mt-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Материалы: {project.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onAdd} className="grid gap-3 lg:grid-cols-6">
            <Input placeholder="Название" required value={newMaterial.title} onChange={(event) => setNewMaterial({ ...newMaterial, title: event.target.value })} />
            <Input placeholder="Категория" value={newMaterial.category} onChange={(event) => setNewMaterial({ ...newMaterial, category: event.target.value })} />
            <Input placeholder="Кол-во" value={newMaterial.quantity} onChange={(event) => setNewMaterial({ ...newMaterial, quantity: event.target.value })} />
            <Input type="number" value={newMaterial.price} onChange={(event) => setNewMaterial({ ...newMaterial, price: Number(event.target.value) })} />
            <Input placeholder="Поставщик" value={newMaterial.supplier} onChange={(event) => setNewMaterial({ ...newMaterial, supplier: event.target.value })} />
            <Button type="submit">Добавить</Button>
          </form>
        </CardContent>
      </Card>
      <div className="space-y-3">
        {materials.map((material) => (
          <div key={material.id} className="grid gap-3 rounded-lg border border-graphite-100 bg-white p-4 md:grid-cols-[1fr_140px_120px_140px_1fr_150px]">
            <Input value={material.title} onChange={(event) => onChange(material.id, { title: event.target.value })} />
            <Input value={material.category} onChange={(event) => onChange(material.id, { category: event.target.value })} />
            <Input value={material.quantity} onChange={(event) => onChange(material.id, { quantity: event.target.value })} />
            <Input type="number" value={material.price} onChange={(event) => onChange(material.id, { price: Number(event.target.value) })} />
            <Input value={material.supplier} onChange={(event) => onChange(material.id, { supplier: event.target.value })} />
            <Select value={material.status} onChange={(event) => onChange(material.id, { status: event.target.value as Material["status"] })}>
              <option>нужно купить</option>
              <option>заказано</option>
              <option>доставлено</option>
              <option>оплачено</option>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportsModule({
  reports,
  projectById,
  stageById
}: {
  reports: { id: string; projectId: string; stageId: string; imageUrl: string; description: string; date: string; visibleForClient: boolean }[];
  projectById: Map<string, Project>;
  stageById: Map<string, ProjectStage>;
}) {
  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-3">
      {reports.map((report) => (
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
  );
}

function StageEditor({
  stage,
  projectTitle,
  users,
  onChange
}: {
  stage: ProjectStage;
  projectTitle: string;
  users: User[];
  onChange: (patch: Partial<ProjectStage>) => void;
}) {
  return (
    <div className="rounded-lg border border-graphite-100 p-4">
      <p className="text-xs text-graphite-500">{projectTitle}</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Input value={stage.title} onChange={(event) => onChange({ title: event.target.value })} />
        <Select value={stage.status} onChange={(event) => onChange({ status: event.target.value as StageStatus })}>
          <option>не начат</option>
          <option>в работе</option>
          <option>на проверке</option>
          <option>завершён</option>
        </Select>
        <Input type="date" value={stage.startDate} onChange={(event) => onChange({ startDate: event.target.value })} />
        <Input type="date" value={stage.deadline} onChange={(event) => onChange({ deadline: event.target.value })} />
        <Select value={stage.responsibleId} onChange={(event) => onChange({ responsibleId: event.target.value })}>
          {users.filter((user) => user.role !== "client").map((user) => <option value={user.id} key={user.id}>{user.name}</option>)}
        </Select>
        <Input type="number" value={stage.progress} onChange={(event) => onChange({ progress: Number(event.target.value) })} />
      </div>
    </div>
  );
}

function WorkListItem({
  task,
  project,
  stage,
  assignee,
  onDone
}: {
  task: Task;
  project?: Project;
  stage?: ProjectStage;
  assignee?: CrewMember;
  onDone: () => void;
}) {
  return (
    <div className="rounded-lg border border-graphite-100 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-semibold text-graphite-900">{task.title}</p>
          <p className="mt-1 text-sm text-graphite-500">{project?.title} · {stage?.title} · {task.location}</p>
          <p className="mt-1 text-sm text-graphite-600">{assignee?.trade} · {assignee?.name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <DeadlineBadge deadline={task.deadline} status={task.status} />
          {task.status !== "завершена" && <Button size="sm" variant="gold" onClick={onDone}>Готово</Button>}
        </div>
      </div>
    </div>
  );
}

function TaskMini({
  task,
  project,
  assignee,
  onDone
}: {
  task: Task;
  project?: Project;
  assignee?: CrewMember;
  onDone: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-graphite-100 p-3">
      <div>
        <p className="text-sm font-semibold text-graphite-900">{task.title}</p>
        <p className="text-xs text-graphite-500">{project?.title ?? ""} · {assignee?.name ?? task.trade}</p>
      </div>
      <div className="flex items-center gap-2">
        <DeadlineBadge deadline={task.deadline} status={task.status} />
        {task.status !== "завершена" && <Button size="sm" variant="outline" onClick={onDone}>Готово</Button>}
      </div>
    </div>
  );
}

function DeadlineBadge({ deadline, status }: { deadline: string; status: TaskStatus }) {
  const diffDays = Math.ceil((new Date(`${deadline}T00:00:00`).getTime() - new Date(`${todayIso}T00:00:00`).getTime()) / 86400000);
  if (status === "завершена") return <Badge tone="green">готово</Badge>;
  if (diffDays < 0) return <Badge tone="red">просрочено {Math.abs(diffDays)} дн.</Badge>;
  if (diffDays === 0) return <Badge tone="gold">сегодня</Badge>;
  if (diffDays === 1) return <Badge tone="gold">завтра</Badge>;
  return <Badge>{formatDate(deadline)}</Badge>;
}

function StageBadge({ status }: { status: StageStatus }) {
  const tone = status === "завершён" ? "green" : status === "на проверке" ? "gold" : status === "в работе" ? "dark" : "neutral";
  return <Badge tone={tone}>{status}</Badge>;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-graphite-500">{label}</dt>
      <dd className="font-medium text-graphite-900">{value}</dd>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-graphite-100 p-4">
      <p className="text-xs text-graphite-500">{label}</p>
      <p className="mt-1 font-semibold text-graphite-900">{value}</p>
    </div>
  );
}
