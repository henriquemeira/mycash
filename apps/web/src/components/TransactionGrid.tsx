import { useTranslation } from "react-i18next";
import { useState, useCallback, useMemo, type FormEvent, Fragment } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type Row,
} from "@tanstack/react-table";
import { Plus, ChevronDown } from "lucide-react";
import type { Transaction, Category, Account, TransactionType } from "@/lib/api";
import { PaidToggle } from "./PaidToggle";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Math.abs(value) / 100);
}

function formatFullDate(dateStr: string, locale: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = date.toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US", {
    weekday: "long",
  });
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}, ${weekday}`;
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

interface TransactionGridProps {
  items: Transaction[];
  categories: Category[];
  accounts: Account[];
  onTogglePaid: (id: string) => void;
  onCreateTransaction: (data: {
    description: string;
    amount: number;
    date: string;
    dueDate: string;
    type: TransactionType;
    accountId: string;
    categoryId: string;
  }) => void;
  defaultAccountId?: string;
}

export function TransactionGrid({
  items,
  categories,
  accounts,
  onTogglePaid,
  onCreateTransaction,
  defaultAccountId,
}: TransactionGridProps) {
  const { t, i18n } = useTranslation();
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const today = new Date().toISOString().split("T")[0];
  const [dueDate, setDueDate] = useState(today);
  const [type, setType] = useState<TransactionType>("expense");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState(defaultAccountId || "");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  const filteredCategories = categories.filter((cat) => {
    if (type === "transfer") return true;
    return cat.type === type;
  });

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const selectedAccount = accounts.find((a) => a.id === accountId);

  const columns = useMemo<ColumnDef<Transaction>[]>(
    () => [
      {
        id: "paid",
        size: 44,
        header: "",
        cell: ({ row }) => (
          <PaidToggle
            isPaid={row.original.isPaid}
            type={row.original.type}
            onToggle={() => onTogglePaid(row.original.id)}
          />
        ),
      },
      {
        accessorKey: "description",
        header: t("transactions.description"),
        cell: ({ getValue }) => (
          <span className="text-sm text-gray-900 dark:text-gray-100">
            {getValue() as string}
          </span>
        ),
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
    ],
    [t, onTogglePaid]
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
  }, [table]);

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

  const handleInsert = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const parsedAmount = parseFloat(amount.replace(",", "."));
      if (!desc.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;
      if (!categoryId || !accountId || !dueDate) return;

      const amountCents = Math.round(parsedAmount * 100);

      onCreateTransaction({
        description: desc.trim(),
        amount: amountCents,
        date: today,
        dueDate,
        type,
        accountId,
        categoryId,
      });

      setDesc("");
      setAmount("");
      setCategoryId("");
    },
    [desc, amount, dueDate, type, categoryId, accountId, today, onCreateTransaction]
  );

  const colCount = columns.length;

  return (
    <div className="flex flex-col">
      <form
        id="quick-add-form"
        onSubmit={handleInsert}
        className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
      >
        <div className="flex overflow-hidden rounded-md border border-gray-200 dark:border-gray-600">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setType(opt.value);
                setCategoryId("");
              }}
              className={`px-2 py-1 text-xs font-bold transition-colors ${
                type === opt.value
                  ? typeColorClasses(opt.value)
                  : "bg-white text-gray-400 dark:bg-gray-800 dark:text-gray-500"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder={t("transactions.new_description_placeholder")}
          className="min-w-0 flex-1 border-none bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500"
        />

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowCategoryDropdown(!showCategoryDropdown);
              setShowAccountDropdown(false);
            }}
            className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            {selectedCategory ? (
              <>
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: selectedCategory.color }}
                />
                {selectedCategory.name}
              </>
            ) : (
              t("transactions.category")
            )}
            <ChevronDown size={12} />
          </button>

          {showCategoryDropdown && (
            <div className="absolute right-0 top-full z-20 mt-1 max-h-48 w-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700">
              {filteredCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setCategoryId(cat.id);
                    setShowCategoryDropdown(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  {cat.name}
                </button>
              ))}
              {filteredCategories.length === 0 && (
                <div className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500">
                  {t("transactions.no_categories")}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowAccountDropdown(!showAccountDropdown);
              setShowCategoryDropdown(false);
            }}
            className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            {selectedAccount ? selectedAccount.name : t("transactions.account")}
            <ChevronDown size={12} />
          </button>

          {showAccountDropdown && (
            <div className="absolute right-0 top-full z-20 mt-1 max-h-48 w-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700">
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => {
                    setAccountId(acc.id);
                    setShowAccountDropdown(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: acc.color }}
                  />
                  {acc.name}
                </button>
              ))}
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
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={t("transactions.new_amount_placeholder")}
          className="w-24 border-none bg-transparent text-right text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500"
          inputMode="decimal"
        />

        <button
          type="submit"
          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
        >
          <Plus size={18} />
        </button>
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
                        <tr
                          key={item.id}
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
                      );
                    })}
                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700">
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
                    className={`flex items-center gap-3 border-b border-gray-100 px-4 py-3 transition-opacity duration-200 dark:border-gray-800 ${
                      item.isPaid
                        ? "opacity-100"
                        : "opacity-50 dark:opacity-60"
                    }`}
                  >
                    <PaidToggle
                      isPaid={item.isPaid}
                      type={item.type}
                      onToggle={() => onTogglePaid(item.id)}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                          {item.description}
                        </span>
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
    </div>
  );
}