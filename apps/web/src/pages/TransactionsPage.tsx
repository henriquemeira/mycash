import { useState, useEffect, useCallback } from "react";
import {
  api,
  type Transaction,
  type TransactionSummary,
  type Account,
  type Category,
  type TransactionType,
  type CreateTransactionData,
} from "@/lib/api";
import { MonthSelector } from "@/components/MonthSelector";
import { BalanceRibbon } from "@/components/BalanceRibbon";
import { TransactionGrid } from "@/components/TransactionGrid";
import { RecurrenceModal } from "@/components/RecurrenceModal";
import { useToast } from "@/contexts/ToastContext";
import { useTranslation } from "react-i18next";

const EMPTY_SUMMARY: TransactionSummary = { income: 0, expense: 0, balance: 0 };

export function TransactionsPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [items, setItems] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary>(EMPTY_SUMMARY);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setPage(1);
    const [txRes, accRes, catRes] = await Promise.all([
      api.getTransactions(month, year, 1, 50),
      api.getAccounts(),
      api.getCategories(),
    ]);
    if (txRes.data) {
      setItems(txRes.data.items);
      setSummary(txRes.data.summary);
      setHasMore(txRes.data.pagination.hasMore);
    }
    if (accRes.data) setAccounts(accRes.data.items);
    if (catRes.data) setCategories(catRes.data.items);
    setLoading(false);
  }, [month, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLoadMore = useCallback(async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    const txRes = await api.getTransactions(month, year, nextPage, 50);
    if (txRes.data) {
      setItems((prev) => [...prev, ...txRes.data!.items]);
      setHasMore(txRes.data!.pagination.hasMore);
      setPage(nextPage);
    }
    setLoadingMore(false);
  }, [month, year, page]);

  const handleTogglePaid = useCallback(
    async (id: string) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isPaid: !item.isPaid } : item
        )
      );

      const { data, error } = await api.togglePaid(id);
      if (error) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, isPaid: !item.isPaid } : item
          )
        );
        showToast(t("errors.save_failed_retry"), "error");
      } else if (data) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, isPaid: data.isPaid } : item
          )
        );
      }
    },
    [showToast, t]
  );

  const handleCreate = useCallback(
    async (txData: CreateTransactionData) => {
      const category = categories.find((c) => c.id === txData.categoryId);
      const account = accounts.find((a) => a.id === txData.accountId);

      const optimisticTx: Transaction = {
        id: `temp-${Date.now()}`,
        description: txData.description,
        amount: txData.type === "expense" ? -txData.amount : txData.amount,
        date: txData.date,
        dueDate: txData.dueDate,
        type: txData.type,
        isPaid: false,
        accountId: txData.accountId,
        categoryId: txData.categoryId,
        recurrenceId: null,
        installmentNumber: null,
        totalInstallments: null,
        notes: txData.notes || null,
        accountName: account?.name,
        categoryName: category?.name,
        categoryColor: category?.color,
      };

      setItems((prev) => [...prev, optimisticTx]);
      setSummary((prev) => {
        const amt = optimisticTx.amount;
        if (optimisticTx.type === "income") {
          return {
            ...prev,
            income: prev.income + amt,
            balance: prev.balance + amt,
          };
        }
        if (optimisticTx.type === "expense") {
          return {
            ...prev,
            expense: prev.expense + Math.abs(amt),
            balance: prev.balance - Math.abs(amt),
          };
        }
        return prev;
      });

      const { data, error } = await api.createTransaction(txData);
      if (error) {
        setItems((prev) => prev.filter((item) => item.id !== optimisticTx.id));
        const amt = optimisticTx.amount;
        setSummary((prev) => {
          if (optimisticTx.type === "income") {
            return { ...prev, income: prev.income - amt, balance: prev.balance - amt };
          }
          if (optimisticTx.type === "expense") {
            return {
              ...prev,
              expense: prev.expense - Math.abs(amt),
              balance: prev.balance + Math.abs(amt),
            };
          }
          return prev;
        });
        showToast(t("errors.save_failed_retry"), "error");
      } else if (data?.transaction) {
        setItems((prev) => {
          const replaced = prev.map((item) =>
            item.id === optimisticTx.id
              ? {
                  ...data.transaction,
                  accountName: account?.name,
                  categoryName: category?.name,
                  categoryColor: category?.color,
                }
              : item
          );
          if (data.createdCount > 1) {
            fetchData();
            return replaced;
          }
          return replaced;
        });
        if (data.createdCount > 1) {
          fetchData();
        }
      }
    },
    [categories, accounts, showToast, t, fetchData]
  );

  const handleDelete = useCallback(
    async (id: string, scope: "single" | "future") => {
      const tx = items.find((i) => i.id === id);
      if (!tx) return;

      setItems((prev) => {
        if (scope === "future" && tx.recurrenceId) {
          const dueDate = tx.dueDate;
          return prev.filter(
            (item) =>
              !(item.recurrenceId === tx.recurrenceId && item.dueDate >= dueDate)
          );
        }
        return prev.filter((item) => item.id !== id);
      });

      setSummary((prev) => {
        const toRemove = scope === "future" && tx.recurrenceId
          ? items.filter(
              (item) =>
                item.recurrenceId === tx.recurrenceId &&
                item.dueDate >= tx.dueDate
            )
          : [tx];
        const incomeDiff = toRemove
          .filter((i) => i.type === "income")
          .reduce((sum, i) => sum + i.amount, 0);
        const expenseDiff = toRemove
          .filter((i) => i.type === "expense")
          .reduce((sum, i) => sum + Math.abs(i.amount), 0);
        return {
          ...prev,
          income: prev.income - incomeDiff,
          expense: prev.expense - expenseDiff,
          balance: prev.balance - incomeDiff + expenseDiff,
        };
      });

      const { error } = await api.deleteTransaction(id, scope);
      if (error) {
        fetchData();
        showToast(t("errors.save_failed_retry"), "error");
      }
    },
    [items, fetchData, showToast, t]
  );

  const handleMonthChange = (m: number, y: number) => {
    setMonth(m);
    setYear(y);
  };

  const defaultAccountId = accounts[0]?.id;

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-center border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
        <MonthSelector month={month} year={year} onChange={handleMonthChange} />
      </div>

      <BalanceRibbon summary={summary} />

      {loading ? (
        <div className="px-4 py-12 text-center text-sm text-gray-400 dark:text-gray-500">
          {t("app.loading")}
        </div>
      ) : (
        <TransactionGrid
          items={items}
          categories={categories}
          accounts={accounts}
          onTogglePaid={handleTogglePaid}
          onCreateTransaction={handleCreate}
          onDeleteTransaction={handleDelete}
          defaultAccountId={defaultAccountId}
        />
      )}

      {hasMore && !loading && (
        <div className="flex justify-center border-t border-gray-200 py-3 dark:border-gray-700">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            {loadingMore ? t("transactions.loading_more") : t("transactions.load_more")}
          </button>
        </div>
      )}
    </div>
  );
}