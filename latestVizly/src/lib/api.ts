import { signIn, updateAuthUser } from "@/hooks/use-auth";
import type { FoodItem } from "@/lib/nutrix";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";
const TOKEN_KEY = "vizly:token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (
    init.body &&
    !(typeof FormData !== "undefined" && init.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch (e) {
    throw new ApiError(`Couldn't reach the API. Is the backend running?`, 0);
  }
  const text = await res.text();
  let data: Record<string, unknown> = {};
  if (text) {
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      if (res.ok) {
        throw new ApiError("The API returned an invalid response.", res.status);
      }
      throw new ApiError(
        `API request failed (${res.status}): ${text.slice(0, 200)}. Check that VITE_API_URL points to the backend server.`,
        res.status,
      );
    }
  }
  if (!res.ok) {
    const message = data.error ?? data.detail;
    throw new ApiError(
      typeof message === "string" ? message : `Request failed (${res.status})`,
      res.status,
    );
  }
  return data as T;
}

export type AuthResponse = {
  token: string;
  user: {
    email: string;
    name?: string;
    dateOfBirth: string | null;
    weightKg: number | null;
    age: number | null;
    allergies: string[];
  };
};

export async function signupApi(input: {
  email: string;
  password: string;
  name?: string;
  dateOfBirth: string;
  weightKg: number;
  allergies: string[];
}) {
  const data = await request<AuthResponse>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      name: input.name,
      date_of_birth: input.dateOfBirth,
      weight_kg: input.weightKg,
      allergies: input.allergies,
    }),
  });
  setToken(data.token);
  signIn({
    email: data.user.email,
    name: data.user.name || data.user.email,
    ...(data.user.dateOfBirth ? { dateOfBirth: data.user.dateOfBirth } : {}),
    ...(data.user.weightKg != null ? { weightKg: data.user.weightKg } : {}),
    allergies: data.user.allergies ?? [],
    provider: "email",
  });
  return data;
}

export async function loginApi(input: { email: string; password: string }) {
  const data = await request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
  setToken(data.token);
  signIn({
    email: data.user.email,
    name: data.user.name || data.user.email,
    ...(data.user.dateOfBirth ? { dateOfBirth: data.user.dateOfBirth } : {}),
    ...(data.user.weightKg != null ? { weightKg: data.user.weightKg } : {}),
    allergies: data.user.allergies ?? [],
    provider: "email",
  });
  return data;
}

export type UserProfile = {
  name: string;
  email: string;
  dateOfBirth: string | null;
  weightKg: number | null;
  age: number | null;
  allergies: string[];
};

export function getProfileApi() {
  return request<UserProfile>("/api/auth/profile");
}

export async function updateProfileApi(input: {
  name: string;
  dateOfBirth: string;
  weightKg: number;
  allergies: string[];
}) {
  const profile = await request<UserProfile>("/api/auth/profile", {
    method: "PUT",
    body: JSON.stringify({
      name: input.name,
      date_of_birth: input.dateOfBirth,
      weight_kg: input.weightKg,
      allergies: input.allergies,
    }),
  });
  updateAuthUser({
    name: profile.name,
    dateOfBirth: profile.dateOfBirth ?? undefined,
    weightKg: profile.weightKg ?? undefined,
    allergies: profile.allergies,
  });
  return profile;
}

export type ConversationSummary = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

export type SavedConversation = ConversationSummary & {
  messages: ConversationMessage[];
};

export function getConversationTitle(messages: ConversationMessage[]) {
  const firstUserMessage = messages.find((message) => message.role === "user")?.content ?? "";
  const menuBlock = firstUserMessage.match(
    /(?:^|\n)Menu items:[ \t]*\r?\n([\s\S]*?)(?:\r?\n[ \t]*\r?\n|$)/i,
  )?.[1];
  if (menuBlock) {
    const items = menuBlock
      .split("\n")
      .map((line) => line.match(/^\s*[-•]?\s*(.+?)\s*\(₹?\s*\d+(?:\.\d+)?\)\s*$/)?.[1]?.trim())
      .filter((item): item is string => Boolean(item))
      .slice(0, 3);
    if (items.length > 0) {
      const suffix = menuBlock.split("\n").length > items.length ? " + more" : "";
      return `Menu: ${items.join(" + ")}${suffix}`.slice(0, 60);
    }
  }

  const itemLine = firstUserMessage.match(/(?:^|\n)Items:\s*(.+)/i)?.[1];
  if (itemLine) {
    const items = itemLine
      .split(",")
      .map((item) => item.replace(/\s*\([^)]*\)/g, "").trim())
      .filter(Boolean)
      .slice(0, 3);
    if (items.length > 0) {
      const suffix = items.length < itemLine.split(",").length ? " + more" : "";
      const budget = firstUserMessage.match(/(?:^|\n)Budget:\s*₹?([\d.]+)/i)?.[1];
      return `${budget ? `₹${budget} plan: ` : "Meal plan: "}${items.join(" + ")}${suffix}`.slice(
        0,
        60,
      );
    }
  }

  const meaningfulLine = firstUserMessage
    .split("\n")
    .map((line) => line.trim())
    .find(
      (line) =>
        line &&
        !/^(optimization request|budget:|protein target:|food preference:|items:)/i.test(line),
    );
  return meaningfulLine?.slice(0, 60) || "New conversation";
}

export async function listConversationsApi(email: string) {
  const data = await request<{ conversations: ConversationSummary[] }>(
    `/api/conversations?email=${encodeURIComponent(email)}`,
  );
  return data.conversations;
}

export async function getConversationApi(input: { id: string; email: string }) {
  return request<SavedConversation>(
    `/api/conversations/${input.id}?email=${encodeURIComponent(input.email)}`,
  );
}

export async function createConversationApi(input: {
  email: string;
  title: string;
  messages: ConversationMessage[];
}) {
  return request<{ id: string; createdAt: string; updatedAt: string }>("/api/conversations", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateConversationApi(input: {
  id: string;
  email: string;
  title: string;
  messages: ConversationMessage[];
}) {
  return request<{ ok: true; updatedAt: string }>(`/api/conversations/${input.id}`, {
    method: "PUT",
    body: JSON.stringify({
      email: input.email,
      title: input.title,
      messages: input.messages,
    }),
  });
}

export async function deleteConversationApi(input: { id: string; email: string }) {
  return request<{ ok: true }>(
    `/api/conversations/${input.id}?email=${encodeURIComponent(input.email)}`,
    {
      method: "DELETE",
    },
  );
}

export async function saveProjectApi(payload: {
  title: string;
  summary?: string;
  fileName?: string;
  prompt?: string;
  spec: unknown;
  rowCount?: number;
}) {
  return request<{ id: string; createdAt: string }>("/api/projects", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function subscribeApi(input: { email: string; source?: string }) {
  return request<{ ok: true; alreadySubscribed?: boolean }>("/api/subscribers", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function recognizeFoodMenuApi(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return request<{ items: FoodItem[] }>("/api/recognize-food", {
    method: "POST",
    body: formData,
  });
}

export { ApiError };
