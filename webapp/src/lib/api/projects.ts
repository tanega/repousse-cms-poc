import type { ManagementType, Project, PublicationStatus } from "@/types/project";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

function getHankoToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie
    .split("; ")
    .find((entry) => entry.startsWith("hanko="))
    ?.split("=")[1];
}

async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getHankoToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Échec de la requête (${res.status})`);
  }

  return res;
}

export async function fetchProjects(): Promise<Project[]> {
  const res = await authedFetch("/api/v1/projects");
  const { data } = await res.json();
  return data;
}

export interface ProjectAttrs {
  name?: string;
  description?: string | null;
  management_type?: ManagementType;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  surface_m2?: number | null;
  soil_type?: string | null;
  publication_status?: PublicationStatus;
  /** Full replace: sent on every create/update, mirrors the form's editable array. */
  preferred_species?: { taxon_id: string }[];
}

export async function createProject(attrs: ProjectAttrs): Promise<Project> {
  const res = await authedFetch("/api/v1/projects", {
    method: "POST",
    body: JSON.stringify({ project: attrs }),
  });
  const { data } = await res.json();
  return data;
}

export async function updateProject(id: string, attrs: ProjectAttrs): Promise<Project> {
  const res = await authedFetch(`/api/v1/projects/${id}`, {
    method: "PUT",
    body: JSON.stringify({ project: attrs }),
  });
  const { data } = await res.json();
  return data;
}

export async function archiveProject(id: string): Promise<void> {
  await authedFetch(`/api/v1/projects/${id}`, { method: "DELETE" });
}
