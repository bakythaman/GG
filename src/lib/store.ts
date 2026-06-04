"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createDemoState,
  type Approval,
  type ChatMessage,
  type CrewMember,
  type DemoState,
  type DocumentTemplate,
  type Lead,
  type LeadStatus,
  type Material,
  type Payment,
  type PhotoReport,
  type Project,
  type ProjectFile,
  type ProjectStage,
  type Task,
  type TaskStatus,
  type User,
  type WorkerTrade
} from "@/lib/data";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

const STORAGE_KEY = "gulvira-group-demo-state-v3";

function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadState() {
  if (typeof window === "undefined") return createDemoState();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return createDemoState();

  try {
    const parsed = JSON.parse(raw) as DemoState;
    const seed = createDemoState();
    return {
      ...seed,
      ...parsed,
      crew: parsed.crew?.length ? parsed.crew : seed.crew,
      users: parsed.users?.length ? parsed.users : seed.users,
      chatMessages: parsed.chatMessages?.length ? parsed.chatMessages : seed.chatMessages,
      documentTemplates: parsed.documentTemplates?.length
        ? parsed.documentTemplates
        : seed.documentTemplates,
      tasks: (parsed.tasks?.length ? parsed.tasks : seed.tasks).map((task) => {
        const seedTask = seed.tasks.find((item) => item.id === task.id);
        const assignee = seed.crew.find((member) => member.id === (task as Task).assigneeId) ?? seed.crew[0];
        return {
          ...task,
          assigneeId: (task as Task).assigneeId ?? seedTask?.assigneeId ?? assignee.id,
          trade: (task as Task).trade ?? seedTask?.trade ?? assignee.trade,
          startDate: (task as Task).startDate ?? seedTask?.startDate ?? new Date().toISOString().slice(0, 10),
          location: (task as Task).location ?? seedTask?.location ?? "объект"
        };
      })
    };
  } catch {
    return createDemoState();
  }
}

export function resetDemoState() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

export function useDemoState() {
  const [state, setState] = useState<DemoState>(() => createDemoState());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(loadState());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [ready, state]);

  const api = useMemo(
    () => ({
      state,
      ready,
      supabaseEnabled: isSupabaseConfigured,
      addLead: async (lead: Omit<Lead, "id" | "createdAt" | "status" | "managerId">) => {
        const nextLead: Lead = {
          ...lead,
          id: makeId("lead"),
          status: "Новая заявка",
          managerId: "u-manager",
          createdAt: new Date().toISOString().slice(0, 10)
        };

        const supabase = getSupabaseClient();
        if (supabase) {
          await supabase.from("leads").insert({
            name: nextLead.name,
            phone: nextLead.phone,
            whatsapp: nextLead.whatsapp,
            city: nextLead.city,
            object_type: nextLead.objectType,
            area: nextLead.area,
            budget: nextLead.budget,
            source: nextLead.source,
            comment: nextLead.comment,
            status: nextLead.status
          });
        }

        setState((current) => ({ ...current, leads: [nextLead, ...current.leads] }));
        return nextLead;
      },
      updateLeadStatus: (leadId: string, status: LeadStatus) => {
        setState((current) => ({
          ...current,
          leads: current.leads.map((lead) => (lead.id === leadId ? { ...lead, status } : lead))
        }));
      },
      addProject: (projectInput: {
        title: string;
        clientId: string;
        address: string;
        city: string;
        area: number;
        objectType: string;
        service: string;
        startDate: string;
        dueDate: string;
        managerId: string;
        designerId: string;
        foremanId: string;
        budget: number;
      }) => {
        const projectId = makeId("project");
        const nextProject: Project = {
          ...projectInput,
          id: projectId,
          status: "новый проект",
          progress: 0,
          paid: 0
        };

        const templateStages = [
          "Обмер",
          "Планировка",
          "Концепция",
          "3D-визуализация",
          "Рабочие чертежи",
          "Демонтаж",
          "Электрика",
          "Сантехника",
          "Черновые работы",
          "Чистовые работы",
          "Мебель",
          "Сдача объекта"
        ];
        const start = new Date(`${projectInput.startDate}T00:00:00`);
        const nextStages: ProjectStage[] = templateStages.map((title, index) => {
          const stageStart = new Date(start);
          stageStart.setDate(start.getDate() + index * 7);
          const deadline = new Date(stageStart);
          deadline.setDate(stageStart.getDate() + 6);
          return {
            id: makeId("stage"),
            projectId,
            title,
            status: index === 0 ? "в работе" : "не начат",
            startDate: stageStart.toISOString().slice(0, 10),
            deadline: deadline.toISOString().slice(0, 10),
            responsibleId:
              title.includes("План") || title.includes("Концеп") || title.includes("3D")
                ? projectInput.designerId
                : projectInput.foremanId,
            description: `Шаблонный этап проекта: ${title}.`,
            progress: index === 0 ? 10 : 0,
            visibleForClient: true
          };
        });

        const findStage = (title: string) =>
          nextStages.find((stage) => stage.title === title) ?? nextStages[0];
        const nextTasks: Task[] = [
          {
            id: makeId("task"),
            title: "Провести обмер и фотофиксацию",
            description: "Снять размеры, сделать фото исходного состояния и добавить отчёт.",
            projectId,
            stageId: findStage("Обмер").id,
            responsibleId: projectInput.foremanId,
            assigneeId: "crew-electric-askar",
            trade: "электрик",
            startDate: projectInput.startDate,
            deadline: findStage("Обмер").deadline,
            priority: "высокий",
            status: "новая",
            location: "весь объект",
            comments: []
          },
          {
            id: makeId("task"),
            title: "Подготовить план-график работ",
            description: "Разложить работы по календарю и назначить исполнителей.",
            projectId,
            stageId: findStage("Планировка").id,
            responsibleId: projectInput.managerId,
            assigneeId: "crew-supply-dauren",
            trade: "снабженец",
            startDate: projectInput.startDate,
            deadline: findStage("Планировка").deadline,
            priority: "средний",
            status: "новая",
            location: "планирование",
            comments: []
          },
          {
            id: makeId("task"),
            title: "Проверить точки электрики и сантехники",
            description: "Сверить будущие выводы с планировкой до закупа материалов.",
            projectId,
            stageId: findStage("Электрика").id,
            responsibleId: projectInput.foremanId,
            assigneeId: "crew-plumber-marat",
            trade: "сантехник",
            startDate: findStage("Электрика").startDate,
            deadline: findStage("Сантехника").deadline,
            priority: "высокий",
            status: "новая",
            location: "мокрые зоны и кухня",
            comments: []
          }
        ];

        const initialPayment: Payment = {
          id: makeId("payment"),
          projectId,
          amount: 0,
          date: projectInput.startDate,
          type: "предоплата",
          status: "ожидается"
        };

        setState((current) => ({
          ...current,
          projects: [nextProject, ...current.projects],
          stages: [...nextStages, ...current.stages],
          tasks: [...nextTasks, ...current.tasks],
          payments: [initialPayment, ...current.payments]
        }));

        return projectId;
      },
      updateProject: (projectId: string, patch: Partial<Project>) => {
        setState((current) => ({
          ...current,
          projects: current.projects.map((project) =>
            project.id === projectId ? { ...project, ...patch } : project
          )
        }));
      },
      addTask: (task: Omit<Task, "id" | "comments">) => {
        const nextTask: Task = { ...task, id: makeId("task"), comments: [] };
        setState((current) => ({ ...current, tasks: [nextTask, ...current.tasks] }));
      },
      updateTaskStatus: (taskId: string, status: TaskStatus) => {
        setState((current) => ({
          ...current,
          tasks: current.tasks.map((task) => (task.id === taskId ? { ...task, status } : task))
        }));
      },
      updateTaskAssignee: (taskId: string, assigneeId: string, trade: WorkerTrade) => {
        setState((current) => ({
          ...current,
          tasks: current.tasks.map((task) =>
            task.id === taskId ? { ...task, assigneeId, trade } : task
          )
        }));
      },
      updateStage: (stageId: string, patch: Partial<ProjectStage>) => {
        setState((current) => ({
          ...current,
          stages: current.stages.map((stage) =>
            stage.id === stageId ? { ...stage, ...patch } : stage
          )
        }));
      },
      updateCrewMember: (memberId: string, patch: Partial<CrewMember>) => {
        setState((current) => ({
          ...current,
          crew: current.crew.map((member) =>
            member.id === memberId ? { ...member, ...patch } : member
          )
        }));
      },
      addCrewMember: (member: Omit<CrewMember, "id">) => {
        setState((current) => ({
          ...current,
          crew: [{ ...member, id: makeId("crew") }, ...current.crew]
        }));
      },
      updateUser: (userId: string, patch: Partial<User>) => {
        setState((current) => ({
          ...current,
          users: current.users.map((user) => (user.id === userId ? { ...user, ...patch } : user))
        }));
      },
      addPhotoReport: (report: Omit<PhotoReport, "id" | "date" | "authorId">) => {
        const nextReport: PhotoReport = {
          ...report,
          id: makeId("report"),
          date: new Date().toISOString().slice(0, 10),
          authorId: "u-foreman"
        };
        setState((current) => ({
          ...current,
          photoReports: [nextReport, ...current.photoReports]
        }));
      },
      addFile: (file: Omit<ProjectFile, "id" | "uploadedAt">) => {
        const nextFile: ProjectFile = {
          ...file,
          id: makeId("file"),
          uploadedAt: new Date().toISOString().slice(0, 10)
        };
        setState((current) => ({ ...current, files: [nextFile, ...current.files] }));
      },
      updateFile: (fileId: string, patch: Partial<ProjectFile>) => {
        setState((current) => ({
          ...current,
          files: current.files.map((file) => (file.id === fileId ? { ...file, ...patch } : file))
        }));
      },
      createFileFromTemplate: (projectId: string, template: DocumentTemplate) => {
        const nextFile: ProjectFile = {
          id: makeId("file"),
          projectId,
          title: `${template.title} · ${new Date().toLocaleDateString("ru-RU")}`,
          type: template.type,
          visibleForClient: false,
          uploadedAt: new Date().toISOString().slice(0, 10),
          source: "template",
          content: template.content
        };
        setState((current) => ({ ...current, files: [nextFile, ...current.files] }));
      },
      toggleFileVisibility: (fileId: string) => {
        setState((current) => ({
          ...current,
          files: current.files.map((file) =>
            file.id === fileId ? { ...file, visibleForClient: !file.visibleForClient } : file
          )
        }));
      },
      updateMaterialStatus: (materialId: string, status: Material["status"]) => {
        setState((current) => ({
          ...current,
          materials: current.materials.map((material) =>
            material.id === materialId ? { ...material, status } : material
          )
        }));
      },
      updateMaterial: (materialId: string, patch: Partial<Material>) => {
        setState((current) => ({
          ...current,
          materials: current.materials.map((material) =>
            material.id === materialId ? { ...material, ...patch } : material
          )
        }));
      },
      addMaterial: (material: Omit<Material, "id">) => {
        setState((current) => ({
          ...current,
          materials: [{ ...material, id: makeId("material") }, ...current.materials]
        }));
      },
      updatePayment: (paymentId: string, patch: Partial<Payment>) => {
        setState((current) => ({
          ...current,
          payments: current.payments.map((payment) =>
            payment.id === paymentId ? { ...payment, ...patch } : payment
          )
        }));
      },
      addPayment: (payment: Omit<Payment, "id">) => {
        setState((current) => ({
          ...current,
          payments: [{ ...payment, id: makeId("payment") }, ...current.payments]
        }));
      },
      addChatMessage: (message: Omit<ChatMessage, "id" | "createdAt">) => {
        const nextMessage: ChatMessage = {
          ...message,
          id: makeId("msg"),
          createdAt: new Date().toISOString()
        };
        setState((current) => ({
          ...current,
          chatMessages: [...current.chatMessages, nextMessage]
        }));
      },
      updateApproval: (approvalId: string, status: Approval["status"], comment?: string) => {
        setState((current) => ({
          ...current,
          approvals: current.approvals.map((approval) =>
            approval.id === approvalId
              ? {
                  ...approval,
                  status,
                  comment: comment || approval.comment,
                  updatedAt: new Date().toISOString().slice(0, 10)
                }
              : approval
          )
        }));
      },
      reset: () => {
        resetDemoState();
        setState(createDemoState());
      }
    }),
    [ready, state]
  );

  return api;
}
