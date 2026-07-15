import { API_URL } from "./config";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type RequestOptions = {
  method?: string;
  token?: string | null;
  body?: unknown;
  formData?: FormData;
};

export async function apiFetch<T>(
  path: string,
  { method = "GET", token, body, formData }: RequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined && !formData) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }

  if (!res.ok) {
    const message =
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return data as T;
}

export type Card = {
  id: string;
  name: string;
  displayName: string | null;
  description: string | null;
  year: number | null;
  setName: string | null;
  rarity: string | null;
  cardNumber: string | null;
  imageUrl: string | null;
  marketPrice: number | null;
  catalogId: string | null;
  createdAt: string;
};

export type CatalogCard = {
  id: string;
  name: string;
  displayName: string;
  setName: string | null;
  year: number | null;
  rarity: string | null;
  cardNumber: string | null;
  imageUrl: string | null;
  imageUrlLarge: string | null;
  imageUrlExternal?: string | null;
  description: string | null;
};

export function cardImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  if (url.startsWith("/")) return `${API_URL}${url}`;
  return url;
}

export function displayLabel(card: {
  displayName?: string | null;
  name: string;
  setName?: string | null;
  cardNumber?: string | null;
}): string {
  if (card.displayName?.trim()) return card.displayName.trim();
  const bits = [card.name];
  if (card.cardNumber) bits.push(`(${card.cardNumber})`);
  if (card.setName) bits.push(`— ${card.setName}`);
  return bits.join(" ");
}
