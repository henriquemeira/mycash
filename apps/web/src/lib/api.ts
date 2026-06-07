import i18n from "@/i18n";

const API_BASE = "/api";

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const body = await res.json();

  if (!res.ok) {
    const key = body.error || "errors.unknown";
    const translated = i18n.t(key);
    return { error: translated !== key ? translated : key };
  }

  return { data: body as T };
}

export interface User {
  id: string;
  email: string;
  status?: string;
}

export type TransactionType = "income" | "expense" | "transfer";

export type RecurrenceType = "installment" | "recurring";

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  dueDate: string;
  type: TransactionType;
  isPaid: boolean;
  accountId: string;
  categoryId: string;
  recurrenceId: string | null;
  installmentNumber: number | null;
  totalInstallments: number | null;
  notes: string | null;
  reminderDate: string | null;
  accountName?: string;
  categoryName?: string;
  categoryColor?: string;
}

export interface TransactionSummary {
  income: number;
  expense: number;
  balance: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface TransactionListResponse {
  summary: TransactionSummary;
  items: Transaction[];
  pagination: Pagination;
}

export interface Account {
  id: string;
  name: string;
  type: string;
  color: string;
  currency: string;
}

export interface Category {
  id: string;
  name: string;
  type: string;
  color: string;
  icon: string;
}

export interface CreateTransactionData {
  description: string;
  amount: number;
  date: string;
  dueDate: string;
  type: TransactionType;
  accountId: string;
  categoryId: string;
  notes?: string;
  reminderDate?: string;
  recurrence?: {
    type: RecurrenceType;
    totalInstallments: number;
  };
}

export interface UpdateTransactionData {
  description?: string;
  amount?: number;
  date?: string;
  dueDate?: string;
  type?: TransactionType;
  accountId?: string;
  categoryId?: string;
  notes?: string;
  reminderDate?: string | null;
  isPaid?: boolean;
  scope?: "single" | "future";
}

export const api = {
  register(email: string, password: string) {
    return request<{ user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  login(email: string, password: string) {
    return request<{ user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  logout() {
    return request<{ message: string }>("/auth/logout", { method: "POST" });
  },

  me() {
    return request<{ user: User }>("/auth/me");
  },

  getTransactions(month: number, year: number, page: number = 1, limit: number = 50) {
    return request<TransactionListResponse>(
      `/transactions?month=${month}&year=${year}&page=${page}&limit=${limit}`
    );
  },

  createTransaction(data: CreateTransactionData) {
    return request<{ transaction: Transaction; createdCount: number }>("/transactions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateTransaction(id: string, data: UpdateTransactionData) {
    return request<{ updatedCount: number | string; scope: string }>(`/transactions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteTransaction(id: string, scope: "single" | "future" = "single") {
    return request<{ deletedCount: number | string; scope: string }>(
      `/transactions/${id}?scope=${scope}`,
      { method: "DELETE" }
    );
  },

  togglePaid(id: string) {
    return request<{ isPaid: boolean }>(`/transactions/${id}/toggle-paid`, {
      method: "PATCH",
    });
  },

  getAccounts() {
    return request<{ items: Account[] }>("/accounts");
  },

  getCategories() {
    return request<{ items: Category[] }>("/categories");
  },

  createCategory(data: { name: string; type: string; color?: string; icon?: string }) {
    return request<{ category: Category }>("/categories", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};