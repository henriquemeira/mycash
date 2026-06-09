import { useTranslation } from "react-i18next";
import { useState, useCallback, useMemo, useRef, useEffect, type FormEvent, Fragment } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type Row,
} from "@tanstack/react-table";
import { Plus, ChevronDown, ChevronUp, Trash2, Pencil, X, Repeat, CalendarRange, Bell, Paperclip } from "lucide-react";
import type { Transaction, Category, Account, TransactionType, RecurrenceType, CreateTransactionData, UpdateTransactionData } from "@/lib/api";
import { api } from "@/lib/api";
import { PaidToggle } from "./PaidToggle";
import { Modal } from "./Modal";
import { RecurrenceModal } from "./RecurrenceModal";
import { AttachmentManager } from "./AttachmentManager";
import { useToast } from "@/contexts/ToastContext";
import { parseCliInput } from "@/lib/cliParser";
import { fuzzyMatchCategory, fuzzyMatchAccount } from "@/lib/fuzzyMatch";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Math.abs(value) / 100);
}

function parseCurrencyInput(value: string): number {
  const digits = value.replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

function formatCurrencyInput(cents: number): string {
  if (cents === 0) return "";
  const reais = Math.floor(cents / 100);
  const centavos = cents % 100;
  return `R$ ${reais.toLocaleString("pt-BR")},${String(centavos).padStart(2, "0")}`;
}

function formatFullDate(dateStr: string, locale: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = date.toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US", {
    weekday: "long",
  });
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}, ${weekday}`;
}

function isCliMode(text: string): boolean {
  const trimmed = text.trimStart();
  return trimmed.startsWith("/-") || trimmed.startsWith("/+");
}

const TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: "income", label: "+" },
  { value: "expense", label: "-" },
  { value: "transfer", label: "\u21C4" },
];

const amountColorClass = (t: TransactionType) => {
  switch (t) {
    case "income":
      return "text-emerald-600 dark:text-emerald-400";
    case "expense":
      return "text-rose-600 dark:text-rose-400";
    case "transfer":
      return "text-blue-600 dark:text-blue-400";
  }
};

const typeColorClasses = (t: TransactionType) => {
  switch (t) {
    case "income":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "expense":
      return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400";
    case "transfer":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  }
};

const RECURRENCE_OPTIONS = [2, 3, 4, 5, 6, 8, 10, 12, 18, 24, 36, 48];

function getRandomColor(seed: string): string {
  const colors = [
    "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e",
    "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6",
    "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
    "#f43f5e",
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

interface TransactionGridProps {
  items: Transaction[];
  categories: Category[];
  accounts: Account[];
  onTogglePaid: (id: string) => void;
  onCreateTransaction: (data: CreateTransactionData) => Promise<void>;
  onDeleteTransaction: (id: string, scope: "single" | "future") => Promise<void>;
  onRefresh: () => void;
  defaultAccountId?: string;
  expandedTxId?: string | null;
  onExpandTx?: (id: string | null) => void;
  month: number;
  year: number;
}

export function TransactionGrid({
  items,
  categories,
  accounts,
  onTogglePaid,
  onCreateTransaction,
  onDeleteTransaction,
  onRefresh,
  defaultAccountId,
  expandedTxId,
  onExpandTx,
  month,
  year,
}: TransactionGridProps) {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const descRef = useRef<HTMLInputElement>(null);
  const [desc, setDesc] = useState("");
  const [amountCents, setAmountCents] = useState(0);
  const [amountDisplay, setAmountDisplay] = useState("");
  const today = new Date().toISOString().split("T")[0];
  const [dueDate, setDueDate] = useState(today);
  const [type, setType] = useState<TransactionType>("expense");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState(defaultAccountId || "");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [categoryQuery, setCategoryQuery] = useState("");
  const [highlightedCategoryIndex, setHighlightedCategoryIndex] = useState(0);
  const [accountQuery, setAccountQuery] = useState("");
  const [highlightedAccountIndex, setHighlightedAccountIndex] = useState(0);
  const [cliFocused, setCliFocused] = useState(false);

  const selectedMonth = `${year}-${String(month).padStart(2, "0")}`;

  const cliActive = isCliMode(desc);
  const cliPreview = useMemo(() => {
    if (!cliActive) return null;
    return parseCliInput(desc, selectedMonth);
  }, [desc, selectedMonth, cliActive]);

  const cliMatchedCategory = useMemo(() => {
    if (!cliPreview?.category) return null;
    return fuzzyMatchCategory(cliPreview.category, categories);
  }, [cliPreview?.category, categories]);

  const cliMatchedAccount = useMemo(() => {
    if (!cliPreview?.account) return null;
    return fuzzyMatchAccount(cliPreview.account, accounts);
  }, [cliPreview?.account, accounts]);

  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [notes, setNotes] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType | "none">("none");
  const [installmentCount, setInstallmentCount] = useState(2);

  const [recurrenceModal, setRecurrenceModal] = useState<{
    open: boolean;
    action: "edit" | "delete";
    transactionId: string;
    description: string;
  }>({
    open: false,
    action: "delete",
    transactionId: "",
    description: "",
  });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    transactionId: string;
    description: string;
  }>({ open: false, transactionId: "", description: "" });

  const [editModal, setEditModal] = useState<{
    open: boolean;
    transaction: Transaction | null;
  }>({ open: false, transaction: null });

  const [editDesc, setEditDesc] = useState("");
  const [editAmountCents, setEditAmountCents] = useState(0);
  const [editAmountDisplay, setEditAmountDisplay] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editAccountId, setEditAccountId] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editReminderDate, setEditReminderDate] = useState("");
  const [editDueDate, setEditDueDate] = useState("");

  const filteredCategories = categories.filter((cat) => {
    if (type === "transfer") return true;
    return cat.type === type;
  }).filter((cat) =>
    categoryQuery.trim() === "" ||
    cat.name.toLowerCase().includes(categoryQuery.trim().toLowerCase())
  );

  const filteredAccounts = accounts.filter((acc) =>
    accountQuery.trim() === "" ||
    acc.name.toLowerCase().includes(accountQuery.trim().toLowerCase())
  );

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const selectedAccount = accounts.find((a) => a.id === accountId);

  useEffect(() => {
    if (selectedCategory) {
      setCategoryQuery(selectedCategory.name);
    } else {
      setCategoryQuery("");
    }
  }, [selectedCategory?.id]);

  useEffect(() => {
    if (selectedAccount) {
      setAccountQuery(selectedAccount.name);
    } else {
      setAccountQuery("");
    }
  }, [selectedAccount?.id]);

  const handleCreateCategory = useCallback(
    async (name: string) => {
      const { data, error } = await api.createCategory({
        name,
        type: type === "transfer" ? "expense" : type,
        color: getRandomColor(name),
      });
      if (error || !data) {
        showToast(t("errors.save_failed_retry"), "error");
        return;
      }
      setCategoryId(data.category.id);
      setCategoryQuery(data.category.name);
      setShowCategoryDropdown(false);
      onRefresh();
    },
    [type, showToast, t, onRefresh]
  );

  const handleAmountChange = useCallback((raw: string) => {
    const cents = parseCurrencyInput(raw);
    setAmountCents(cents);
    setAmountDisplay(formatCurrencyInput(cents));
  }, []);

  const handleEditAmountChange = useCallback((raw: string) => {
    const cents = parseCurrencyInput(raw);
    setEditAmountCents(cents);
    setEditAmountDisplay(formatCurrencyInput(cents));
  }, []);

  const openEditModal = useCallback(
    (tx: Transaction) => {
      if (tx.recurrenceId) {
        setRecurrenceModal({
          open: true,
          action: "edit",
          transactionId: tx.id,
          description: tx.description,
        });
        return;
      }
      setEditDesc(tx.description);
      setEditAmountCents(Math.abs(tx.amount));
      setEditAmountDisplay(formatCurrencyInput(Math.abs(tx.amount)));
      setEditCategoryId(tx.categoryId);
      setEditAccountId(tx.accountId);
      setEditNotes(tx.notes || "");
      setEditReminderDate(tx.reminderDate || "");
      setEditDueDate(tx.dueDate);
      setEditModal({ open: true, transaction: tx });
    },
    []
  );

  const handleEditSubmit = useCallback(
    async (scope: "single" | "future") => {
      const tx = editModal.transaction;
      if (!tx) return;
      setEditModal({ open: false, transaction: null });

      const data: UpdateTransactionData = {
        description: editDesc.trim() || undefined,
        amount: editAmountCents || undefined,
        categoryId: editCategoryId || undefined,
        accountId: editAccountId || undefined,
        dueDate: editDueDate || undefined,
        notes: editNotes || undefined,
        reminderDate: editReminderDate || null,
        scope,
      };

      await api.updateTransaction(tx.id, data);
      onRefresh();
    },
    [editModal, editDesc, editAmountCents, editCategoryId, editAccountId, editNotes, editReminderDate, editDueDate, onRefresh]
  );

  const columns = useMemo<ColumnDef<Transaction>[]>(
    () => [
      {
        accessorKey: "description",
        header: t("transactions.description"),
        cell: ({ getValue, row }) => {
          const desc = getValue() as string;
          return (
            <div className="flex flex-col">
              <span className="text-sm text-gray-900 dark:text-gray-100">
                {desc}
              </span>
              {row.original.notes && (
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {row.original.notes}
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: "category",
        header: t("transactions.category"),
        cell: ({ row }) => (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            <span
              className="mr-1.5 inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: row.original.categoryColor }}
            />
            {row.original.categoryName}
          </span>
        ),
      },
      {
        id: "account",
        header: t("transactions.account"),
        cell: ({ row }) => (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {row.original.accountName}
          </span>
        ),
      },
      {
        id: "amount",
        header: t("transactions.amount"),
        cell: ({ row }) => {
          const { amount, type } = row.original;
          return (
            <span
              className={`text-sm font-medium ${amountColorClass(type)}`}
            >
              {type === "income" ? "+" : type === "expense" ? "-" : "\u21C4"}
              {formatCurrency(amount)}
            </span>
          );
        },
      },
      {
        id: "icons",
        header: "",
        size: 52,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            {row.original.recurrenceId && (
              <Repeat size={14} className="text-gray-400 dark:text-gray-500" />
            )}
            {row.original.reminderDate && (
              <Bell size={14} className="text-amber-400 dark:text-amber-500" />
            )}
            {(row.original.attachmentCount ?? 0) > 0 && (
              <Paperclip size={14} className="text-gray-400 dark:text-gray-500" />
            )}
          </div>
        ),
      },
      {
        id: "actions",
        size: 80,
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center gap-0.5">
            <PaidToggle
              isPaid={row.original.isPaid}
              type={row.original.type}
              onToggle={() => onTogglePaid(row.original.id)}
            />
            <button
              onClick={() => onExpandTx?.(expandedTxId === row.original.id ? null : row.original.id)}
              className={`rounded p-1 transition-colors ${
                (row.original.attachmentCount ?? 0) > 0
                  ? "text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                  : "text-gray-300 hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-400"
              }`}
              title={t("transactions.attachments")}
            >
              <Paperclip size={14} />
            </button>
            <button
              onClick={() => openEditModal(row.original)}
              className="rounded p-1 text-gray-300 transition-colors hover:bg-blue-50 hover:text-blue-500 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
              title={t("transactions.edit")}
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => handleDeleteClick(row.original)}
              className="rounded p-1 text-gray-300 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900/30 dark:hover:text-rose-400"
              title={t("transactions.delete")}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ),
      },
    ],
    [t, onTogglePaid, openEditModal, expandedTxId, onExpandTx]
  );

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const rowMap = useMemo(() => {
    const map = new Map<string, Row<Transaction>>();
    for (const row of table.getRowModel().rows) {
      map.set(row.original.id, row);
    }
    return map;
  }, [items]);

  const groupedItems = useMemo(() => {
    const groups: { date: string; items: Transaction[]; balance: number }[] = [];
    let runningBalance = 0;

    const sorted = [...items].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const byDate = new Map<string, Transaction[]>();

    for (const item of sorted) {
      const key = item.dueDate;
      if (!byDate.has(key)) byDate.set(key, []);
      byDate.get(key)!.push(item);
    }

    for (const [date, dateItems] of byDate) {
      let dayBalance = 0;
      for (const item of dateItems) {
        if (item.type === "income") dayBalance += item.amount;
        else if (item.type === "expense") dayBalance -= Math.abs(item.amount);
      }
      runningBalance += dayBalance;
      groups.push({ date, items: dateItems, balance: runningBalance });
    }

    return groups;
  }, [items]);

  const handleDeleteClick = useCallback(
    (tx: Transaction) => {
      if (tx.recurrenceId) {
        setRecurrenceModal({
          open: true,
          action: "delete",
          transactionId: tx.id,
          description: tx.description,
        });
      } else {
        setDeleteConfirm({ open: true, transactionId: tx.id, description: tx.description });
      }
    },
    []
  );

  const handleDeleteConfirm = useCallback(
    async () => {
      const id = deleteConfirm.transactionId;
      setDeleteConfirm({ open: false, transactionId: "", description: "" });
      await onDeleteTransaction(id, "single");
    },
    [deleteConfirm, onDeleteTransaction]
  );

  const handleRecurrenceConfirm = useCallback(
    async (scope: "single" | "future") => {
      const modal = recurrenceModal;
      setRecurrenceModal((prev) => ({ ...prev, open: false }));

      if (modal.action === "delete") {
        await onDeleteTransaction(modal.transactionId, scope);
      } else {
        const tx = items.find((i) => i.id === modal.transactionId);
        if (!tx) return;
        setEditDesc(tx.description);
        setEditAmountCents(Math.abs(tx.amount));
        setEditAmountDisplay(formatCurrencyInput(Math.abs(tx.amount)));
        setEditCategoryId(tx.categoryId);
        setEditAccountId(tx.accountId);
        setEditNotes(tx.notes || "");
        setEditReminderDate(tx.reminderDate || "");
        setEditDueDate(tx.dueDate);
        setEditModal({ open: true, transaction: { ...tx, _scope: scope } as Transaction & { _scope?: string } });
      }
    },
    [recurrenceModal, onDeleteTransaction, items]
  );

  const resetTraditionalForm = useCallback(() => {
    setDesc("");
    setAmountCents(0);
    setAmountDisplay("");
    setDueDate(today);
    setCategoryId("");
    setCategoryQuery("");
    setAccountId(defaultAccountId || "");
    setAccountQuery(selectedAccount?.name || "");
    setNotes("");
    setReminderDate("");
    setRecurrenceType("none");
    setInstallmentCount(2);
    setShowMoreOptions(false);
    setType("expense");
    descRef.current?.focus();
  }, [today, defaultAccountId, selectedAccount?.name]);

  const resetCliForm = useCallback(() => {
    setDesc("");
    setNotes("");
    setReminderDate("");
    setRecurrenceType("none");
    setInstallmentCount(2);
    setShowMoreOptions(false);
    descRef.current?.focus();
  }, []);

  const handleInsert = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      if (cliActive) {
        if (!desc.trim()) return;

        const parsed = parseCliInput(desc, selectedMonth);
        if (!parsed.amount || parsed.amount <= 0) return;

        const amountCentsVal = Math.round(parsed.amount * 100);

        const matchedCategory = parsed.category
          ? fuzzyMatchCategory(parsed.category, categories)
          : null;
        if (!matchedCategory) return;

        const matchedAccount = parsed.account
          ? fuzzyMatchAccount(parsed.account, accounts)
          : null;
        const finalAccountId = matchedAccount?.id || defaultAccountId || "";
        if (!finalAccountId) return;

        const finalDate = parsed.date || today;

        const data: CreateTransactionData = {
          description: parsed.description || t("transactions.cli_default_description"),
          amount: amountCentsVal,
          date: finalDate,
          dueDate: finalDate,
          type: parsed.type,
          accountId: finalAccountId,
          categoryId: matchedCategory.id,
          notes: notes.trim() || undefined,
          reminderDate: reminderDate || undefined,
        };

        if (recurrenceType === "installment") {
          data.recurrence = {
            type: "installment",
            totalInstallments: installmentCount,
          };
        } else if (recurrenceType === "recurring") {
          data.recurrence = {
            type: "recurring",
            totalInstallments: 12,
          };
        }

        await onCreateTransaction(data);
        resetCliForm();
      } else {
        if (!desc.trim() || amountCents <= 0) return;
        if (!dueDate) return;

        let finalCategoryId = categoryId;
        if (!finalCategoryId && categoryQuery.trim()) {
          const exactMatch = categories.find(
            (c) =>
              c.name.toLowerCase() === categoryQuery.trim().toLowerCase() &&
              (type === "transfer" || c.type === type)
          );
          if (exactMatch) {
            finalCategoryId = exactMatch.id;
          }
        }

        let finalAccountId = accountId;
        if (!finalAccountId && accountQuery.trim()) {
          const exactMatch = accounts.find(
            (a) => a.name.toLowerCase() === accountQuery.trim().toLowerCase()
          );
          if (exactMatch) {
            finalAccountId = exactMatch.id;
          }
        }

        if (!finalCategoryId || !finalAccountId) return;

        const data: CreateTransactionData = {
          description: desc.trim(),
          amount: amountCents,
          date: today,
          dueDate,
          type,
          accountId: finalAccountId,
          categoryId: finalCategoryId,
          notes: notes.trim() || undefined,
          reminderDate: reminderDate || undefined,
        };

        if (recurrenceType === "installment") {
          data.recurrence = {
            type: "installment",
            totalInstallments: installmentCount,
          };
        } else if (recurrenceType === "recurring") {
          data.recurrence = {
            type: "recurring",
            totalInstallments: 12,
          };
        }

        await onCreateTransaction(data);
        resetTraditionalForm();
      }
    },
    [
      cliActive, desc, selectedMonth, categories, defaultAccountId, today,
      onCreateTransaction, amountCents, dueDate, type, categoryId, accountId,
      categoryQuery, accountQuery, accounts, notes, reminderDate,
      recurrenceType, installmentCount, resetCliForm, resetTraditionalForm, t
    ]
  );

  const colCount = columns.length;
  const editFilteredCategories = editModal.transaction
    ? categories.filter((cat) => {
        if (editModal.transaction!.type === "transfer") return true;
        return cat.type === editModal.transaction!.type;
      })
    : [];

  const editTx = editModal.transaction;
  const editScope = (editTx as Transaction & { _scope?: string })?._scope as "single" | "future" | undefined;

  const currentAmountCents = cliActive && cliPreview?.amount
    ? Math.round(cliPreview.amount * 100)
    : amountCents;

  return (
    <div className="flex flex-col">
      <form
        id="quick-add-form"
        onSubmit={handleInsert}
        className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
      >
        <div className="space-y-2 px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="flex shrink-0 overflow-hidden rounded-md border border-gray-200 dark:border-gray-600">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setType(opt.value);
                    setCategoryId("");
                  }}
                  className={`px-2 py-1 text-xs font-bold transition-colors ${
                    (cliActive
                      ? cliPreview?.type === opt.value
                      : type === opt.value)
                      ? typeColorClasses(opt.value)
                      : "bg-white text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-0 flex-1">
              <input
                ref={descRef}
                type="text"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                onFocus={() => setCliFocused(true)}
                onBlur={() => setTimeout(() => setCliFocused(false), 200)}
                placeholder={t("transactions.cli_placeholder")}
                className={`w-full border-none bg-transparent text-sm outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
                  cliActive
                    ? "text-gray-900 dark:text-gray-100"
                    : "text-gray-900 dark:text-gray-100"
                }`}
              />

              {cliActive && cliFocused && (
                <div className="absolute left-0 top-full z-50 mt-2 w-full max-w-xl rounded-lg border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95">
                  <div className="flex flex-wrap gap-4 text-xs">
                    <span
                      className={`flex items-center gap-1 font-semibold ${
                        cliPreview?.type === "expense"
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {cliPreview?.type === "expense" ? "🔴" : "🟢"}{" "}
                      {cliPreview?.type === "expense"
                        ? t("transactions.expense")
                        : t("transactions.income")}
                    </span>

                    <span className="text-slate-400 dark:text-slate-500">|</span>

                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      💰 R${" "}
                      {cliPreview?.amount
                        ? cliPreview.amount.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })
                        : "0,00"}
                    </span>

                    <span className="text-slate-400 dark:text-slate-500">|</span>

                    <span className="text-slate-600 dark:text-slate-400">
                      📝 {cliPreview?.description || t("transactions.cli_no_description")}
                    </span>

                    {(cliPreview?.category || cliPreview?.account || cliPreview?.date) && (
                      <>
                        <span className="text-slate-400 dark:text-slate-500">|</span>
                        {cliPreview?.category && (
                          <span
                            className={`rounded px-1.5 py-0.5 font-medium ${
                              cliMatchedCategory
                                ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                : "italic text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            🏷️{" "}
                            {cliMatchedCategory
                              ? `@${cliMatchedCategory.name}`
                              : `${t("transactions.cli_map_to")} ${cliPreview.category}?`}
                          </span>
                        )}
                        {cliPreview?.account && (
                          <span
                            className={`rounded px-1.5 py-0.5 font-medium ${
                              cliMatchedAccount
                                ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                : "italic text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            🏦{" "}
                            {cliMatchedAccount
                              ? `!${cliMatchedAccount.name}`
                              : `${t("transactions.cli_map_to")} ${cliPreview.account}?`}
                          </span>
                        )}
                        {cliPreview?.date && (
                          <span className="text-slate-500 dark:text-slate-400">
                            📅{" "}
                            {new Date(cliPreview.date + "T12:00:00").toLocaleDateString(
                              i18n.language === "pt" ? "pt-BR" : "en-US",
                              { day: "numeric", month: "long", year: "numeric" }
                            )}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!cliActive && (
              <>
                <div className="relative">
                  <div className="flex items-center gap-1">
                    {selectedCategory && (
                      <span
                        className="ml-1.5 inline-block h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: selectedCategory.color }}
                      />
                    )}
                    <input
                      type="text"
                      value={categoryQuery}
                      onChange={(e) => {
                        setCategoryQuery(e.target.value);
                        setCategoryId("");
                        setShowCategoryDropdown(true);
                        setHighlightedCategoryIndex(0);
                      }}
                      onFocus={() => {
                        setShowCategoryDropdown(true);
                        setShowAccountDropdown(false);
                        setHighlightedCategoryIndex(0);
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowCategoryDropdown(false), 150);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowDown") {
                          e.preventDefault();
                          setShowCategoryDropdown(true);
                          setHighlightedCategoryIndex((prev) =>
                            Math.min(prev + 1, filteredCategories.length - 1)
                          );
                        } else if (e.key === "ArrowUp") {
                          e.preventDefault();
                          setShowCategoryDropdown(true);
                          setHighlightedCategoryIndex((prev) => Math.max(prev - 1, 0));
                        } else if (e.key === "Enter") {
                          e.preventDefault();
                          const items = filteredCategories;
                          if (items.length > 0 && highlightedCategoryIndex < items.length) {
                            const cat = items[highlightedCategoryIndex];
                            setCategoryId(cat.id);
                            setCategoryQuery(cat.name);
                            setShowCategoryDropdown(false);
                          }
                        } else if (e.key === "Escape") {
                          setShowCategoryDropdown(false);
                        }
                      }}
                      placeholder={t("transactions.category")}
                      className="w-28 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:placeholder:text-gray-500"
                    />
                  </div>

                  {showCategoryDropdown && (
                    <div className="absolute right-0 top-full z-20 mt-1 max-h-48 w-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700">
                      {filteredCategories.map((cat, index) => (
                        <button
                          key={cat.id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setCategoryId(cat.id);
                            setCategoryQuery(cat.name);
                            setShowCategoryDropdown(false);
                          }}
                          className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 transition-colors dark:text-gray-300 ${
                            index === highlightedCategoryIndex
                              ? "bg-gray-100 dark:bg-gray-600"
                              : "hover:bg-gray-100 dark:hover:bg-gray-600"
                          }`}
                        >
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          {cat.name}
                        </button>
                      ))}
                      {categoryQuery.trim() !== "" &&
                        !filteredCategories.some(
                          (c) => c.name.toLowerCase() === categoryQuery.trim().toLowerCase()
                        ) && (
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              if (
                                window.confirm(
                                  t("transactions.create_category_confirm", {
                                    name: categoryQuery.trim(),
                                  })
                                )
                              ) {
                                handleCreateCategory(categoryQuery.trim());
                              }
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-indigo-600 transition-colors hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                          >
                            <Plus size={14} />
                            {t("transactions.create_category", { name: categoryQuery.trim() })}
                          </button>
                        )}
                      {filteredCategories.length === 0 && categoryQuery.trim() === "" && (
                        <div className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500">
                          {t("transactions.no_categories")}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={accountQuery}
                    onChange={(e) => {
                      setAccountQuery(e.target.value);
                      setAccountId("");
                      setShowAccountDropdown(true);
                      setHighlightedAccountIndex(0);
                    }}
                    onFocus={() => {
                      setShowAccountDropdown(true);
                      setShowCategoryDropdown(false);
                      setHighlightedAccountIndex(0);
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowAccountDropdown(false), 150);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setShowAccountDropdown(true);
                        setHighlightedAccountIndex((prev) =>
                          Math.min(prev + 1, filteredAccounts.length - 1)
                        );
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setShowAccountDropdown(true);
                        setHighlightedAccountIndex((prev) => Math.max(prev - 1, 0));
                      } else if (e.key === "Enter") {
                        e.preventDefault();
                        const items = filteredAccounts;
                        if (items.length > 0 && highlightedAccountIndex < items.length) {
                          const acc = items[highlightedAccountIndex];
                          setAccountId(acc.id);
                          setAccountQuery(acc.name);
                          setShowAccountDropdown(false);
                        }
                      } else if (e.key === "Escape") {
                        setShowAccountDropdown(false);
                      }
                    }}
                    placeholder={t("transactions.account")}
                    className="w-28 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:placeholder:text-gray-500"
                  />

                  {showAccountDropdown && (
                    <div className="absolute right-0 top-full z-20 mt-1 max-h-48 w-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700">
                      {filteredAccounts.map((acc, index) => (
                        <button
                          key={acc.id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setAccountId(acc.id);
                            setAccountQuery(acc.name);
                            setShowAccountDropdown(false);
                          }}
                          className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 transition-colors dark:text-gray-300 ${
                            index === highlightedAccountIndex
                              ? "bg-gray-100 dark:bg-gray-600"
                              : "hover:bg-gray-100 dark:hover:bg-gray-600"
                          }`}
                        >
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: acc.color }}
                          />
                          {acc.name}
                        </button>
                      ))}
                      {filteredAccounts.length === 0 && (
                        <div className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500">
                          {t("transactions.no_accounts")}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  className="w-32 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300"
                  title={t("transactions.due_date")}
                />

                <input
                  type="text"
                  value={amountDisplay}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder={t("transactions.new_amount_placeholder")}
                  className="w-28 border-none bg-transparent text-right text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500"
                  inputMode="decimal"
                />
              </>
            )}

            <button
              type="submit"
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            >
              <Plus size={18} />
            </button>

            <button
              type="button"
              onClick={() => setShowMoreOptions(!showMoreOptions)}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title={t("transactions.more_options")}
            >
              {showMoreOptions ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>

        {showMoreOptions && (
          <div className="space-y-3 border-t border-gray-200 px-4 py-3 dark:border-gray-600">
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                <Bell size={12} />
                {t("transactions.reminder_label")}
              </label>
              <input
                type="date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                {t("transactions.notes_label")}
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("transactions.notes_placeholder")}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                {t("transactions.recurrence_label")}
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRecurrenceType(recurrenceType === "none" ? "none" : "none")}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                    recurrenceType === "none"
                      ? "border-gray-400 bg-gray-100 text-gray-900 dark:border-gray-500 dark:bg-gray-600 dark:text-gray-100"
                      : "border-gray-200 bg-white text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400"
                  }`}
                >
                  {t("transactions.no_recurrence")}
                </button>
                <button
                  type="button"
                  onClick={() => setRecurrenceType(recurrenceType === "installment" ? "none" : "installment")}
                  className={`flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                    recurrenceType === "installment"
                      ? "border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-400"
                      : "border-gray-200 bg-white text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400"
                  }`}
                >
                  <CalendarRange size={14} />
                  {t("transactions.installment")}
                </button>
                <button
                  type="button"
                  onClick={() => setRecurrenceType(recurrenceType === "recurring" ? "none" : "recurring")}
                  className={`flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                    recurrenceType === "recurring"
                      ? "border-violet-400 bg-violet-50 text-violet-700 dark:border-violet-500 dark:bg-violet-900/30 dark:text-violet-400"
                      : "border-gray-200 bg-white text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400"
                  }`}
                >
                  <Repeat size={14} />
                  {t("transactions.recurring")}
                </button>
              </div>
            </div>

            {recurrenceType === "installment" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                  {t("transactions.installment_count")}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {RECURRENCE_OPTIONS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setInstallmentCount(n)}
                      className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                        installmentCount === n
                          ? "border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-400"
                          : "border-gray-200 bg-white text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400"
                      }`}
                    >
                      {n}x
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                  {t("transactions.installment_hint", { count: installmentCount })}
                  {currentAmountCents > 0 && (
                    <span className="ml-1 text-gray-500 dark:text-gray-400">
                      {t("transactions.installment_value_hint", {
                        value: formatCurrency(currentAmountCents),
                      })}
                    </span>
                  )}
                </p>
              </div>
            )}

            {recurrenceType === "recurring" && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("transactions.recurring_hint")}
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                setShowMoreOptions(false);
                setNotes("");
                setReminderDate("");
                setRecurrenceType("none");
                setInstallmentCount(2);
              }}
              className="flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={14} />
              {t("transactions.clear_options")}
            </button>
          </div>
        )}
        </div>
      </form>

      {items.length === 0 ? (
        <div className="px-4 py-12 text-center text-sm text-gray-400 dark:text-gray-500">
          {t("transactions.no_transactions")}
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr
                    key={headerGroup.id}
                    className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500 dark:border-gray-700 dark:text-gray-400"
                  >
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-4 py-2">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {groupedItems.map((group) => (
                  <Fragment key={`group-${group.date}`}>
                    <tr className="bg-gray-100 dark:bg-gray-800">
                      <td
                        colSpan={colCount}
                        className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
                      >
                        {formatFullDate(group.date, i18n.language)}
                      </td>
                    </tr>
                    {group.items.map((item) => {
                      const row = rowMap.get(item.id);
                      if (!row) return null;
                      return (
                        <Fragment key={item.id}>
                        <tr
                          className={`border-b border-gray-100 transition-opacity duration-200 dark:border-gray-800 ${
                            item.isPaid
                              ? "opacity-100"
                              : "opacity-50 dark:opacity-60"
                          }`}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="px-2 py-1">
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </td>
                          ))}
                        </tr>
                        {expandedTxId === item.id && (
                          <tr className="border-b border-gray-100 dark:border-gray-800">
                            <td colSpan={colCount} className="px-4 py-2">
                              <AttachmentManager
                                transactionId={item.id}
                                attachmentCount={item.attachmentCount ?? 0}
                                onAttachmentChange={onRefresh}
                              />
                            </td>
                          </tr>
                        )}
                        </Fragment>
                      );
                    })}
                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                      <td
                        colSpan={colCount - 1}
                        className="px-4 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-400"
                      >
                        {t("transactions.daily_balance")}
                      </td>
                      <td
                        className={`px-4 py-2 text-right text-sm font-semibold ${
                          group.balance >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {group.balance >= 0 ? "+" : "-"}
                        {formatCurrency(group.balance)}
                      </td>
                    </tr>
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col md:hidden">
            {groupedItems.map((group) => (
              <div key={`mobile-group-${group.date}`}>
                <div className="bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  {formatFullDate(group.date, i18n.language)}
                </div>
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className={`border-b border-gray-100 px-4 py-3 transition-opacity duration-200 dark:border-gray-800 ${
                      item.isPaid
                        ? "opacity-100"
                        : "opacity-50 dark:opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                            {item.description}
                          </span>
                          {item.recurrenceId && (
                            <Repeat size={12} className="text-gray-400 dark:text-gray-500" />
                          )}
                          {item.reminderDate && (
                            <Bell size={12} className="text-amber-400 dark:text-amber-500" />
                          )}
                          {(item.attachmentCount ?? 0) > 0 && (
                            <Paperclip size={12} className="text-gray-400 dark:text-gray-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: item.categoryColor }}
                          />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {item.categoryName}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            &middot; {item.accountName}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-sm font-semibold ${amountColorClass(item.type)}`}
                      >
                        {item.type === "income"
                          ? "+"
                          : item.type === "expense"
                            ? "-"
                            : "\u21C4"}
                        {formatCurrency(item.amount)}
                      </span>

                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => onExpandTx?.(expandedTxId === item.id ? null : item.id)}
                          className={`rounded p-1 transition-colors ${
                            (item.attachmentCount ?? 0) > 0
                              ? "text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                              : "text-gray-300 hover:bg-gray-50 hover:text-gray-500 dark:hover:bg-gray-700"
                          }`}
                        >
                          <Paperclip size={14} />
                        </button>
                        <PaidToggle
                          isPaid={item.isPaid}
                          type={item.type}
                          onToggle={() => onTogglePaid(item.id)}
                        />
                        <button
                          onClick={() => openEditModal(item)}
                          className="rounded p-1 text-gray-300 transition-colors hover:bg-blue-50 hover:text-blue-500 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(item)}
                          className="rounded p-1 text-gray-300 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900/30 dark:hover:text-rose-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {expandedTxId === item.id && (
                      <AttachmentManager
                        transactionId={item.id}
                        attachmentCount={item.attachmentCount ?? 0}
                        onAttachmentChange={onRefresh}
                      />
                    )}
                  </div>
                ))}
                <div className="flex items-center justify-end border-b border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
                  <span className="mr-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                    {t("transactions.daily_balance")}
                  </span>
                  <span
                    className={`text-sm font-semibold ${
                      group.balance >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {group.balance >= 0 ? "+" : "-"}
                    {formatCurrency(group.balance)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <RecurrenceModal
        open={recurrenceModal.open}
        onClose={() => setRecurrenceModal((prev) => ({ ...prev, open: false }))}
        onConfirm={handleRecurrenceConfirm}
        action={recurrenceModal.action}
        description={recurrenceModal.description}
      />

      <Modal
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, transactionId: "", description: "" })}
        title={t("transactions.delete_confirm_title")}
      >
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          {t("transactions.delete_confirm_message", { description: deleteConfirm.description })}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setDeleteConfirm({ open: false, transactionId: "", description: "" })}
            className="flex-1 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-300 transition-colors hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:ring-gray-600 dark:hover:bg-gray-600"
          >
            {t("transactions.delete_confirm_cancel")}
          </button>
          <button
            onClick={handleDeleteConfirm}
            className="flex-1 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-800"
          >
            {t("transactions.delete_confirm_ok")}
          </button>
        </div>
      </Modal>

      <Modal
        open={editModal.open}
        onClose={() => setEditModal({ open: false, transaction: null })}
        title={t("transactions.edit_title")}
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              {t("transactions.description")}
            </label>
            <input
              type="text"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              {t("transactions.due_date")}
            </label>
            <input
              type="date"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              {t("transactions.amount")}
            </label>
            <input
              type="text"
              value={editAmountDisplay}
              onChange={(e) => handleEditAmountChange(e.target.value)}
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              inputMode="decimal"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              {t("transactions.category")}
            </label>
            <select
              value={editCategoryId}
              onChange={(e) => setEditCategoryId(e.target.value)}
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              {editFilteredCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              {t("transactions.account")}
            </label>
            <select
              value={editAccountId}
              onChange={(e) => setEditAccountId(e.target.value)}
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
              <Bell size={12} />
              {t("transactions.reminder_label")}
            </label>
            <input
              type="date"
              value={editReminderDate}
              onChange={(e) => setEditReminderDate(e.target.value)}
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              {t("transactions.notes_label")}
            </label>
            <input
              type="text"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setEditModal({ open: false, transaction: null })}
              className="flex-1 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-300 transition-colors hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:ring-gray-600 dark:hover:bg-gray-600"
            >
              {t("transactions.edit_cancel")}
            </button>
            <button
              onClick={() => handleEditSubmit(editScope || "single")}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              {t("transactions.edit_save")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}