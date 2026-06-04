"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createDemoState,
  type Approval,
  type DemoState,
  type Lead,
  type LeadStatus,
  type Material,
  type PhotoReport,
  type ProjectFile,
  type Task,
  type TaskStatus
} from "@/lib/data";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

const STORAGE_KEY = "gulvira-group-demo-state-v1";

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
    return JSON.parse(raw) as DemoState;
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
