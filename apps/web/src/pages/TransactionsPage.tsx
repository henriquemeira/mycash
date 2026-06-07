import { useState, useEffect, useCallback } from "react";
import {
  api,
  type Transaction,
  type TransactionSummary,
  type Account,
  type Category,
  type TransactionType,
} from "@/lib/api";
import { MonthSelector } from "@/components/MonthSelector";
import { BalanceRibbon } from "@/components/BalanceRibbon";
import { TransactionGrid } from "@/components/TransactionGrid";

const EMPTY_SUMMARY: TransactionSummary = { income: 0, expense: 0, balance: 0 };

export function TransactionsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [items, setItems] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary>(EMPTY_SUMMARY);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [txRes, accRes, catRes] = await Promise.all([
      api.getTransactions(month, year),
      api.getAccounts(),
      api.getCategories(),
    ]);
    if (txRes.data) {
      setItems(txRes.data.items);
      setSummary(txRes.data.summary);
    }
    if (accRes.data) setAccounts(accRes.data.items);
    if (catRes.data) setCategories(catRes.data.items);
    setLoading(false);
  }, [month, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTogglePaid = useCallback(async (id: string) => {
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
    } else if (data) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isPaid: data.isPaid } : item
        )
      );
    }
  }, []);

  const handleCreate = useCallback(
    async (txData: {
      description: string;
      amount: number;
      date: string;
      dueDate: string;
      type: TransactionType;
      accountId: string;
      categoryId: string;
    }) => {
      const category = categories.find((c) => c.id === txData.categoryId);
      const account = accounts.find((a) => a.id === txData.accountId);

      const optimisticTx: Transaction = {
        id: `temp-${Date.now()}`,
        description: txData.description,
        amount:
          txData.type === "expense"
            ? -txData.amount
            : txData.amount,
        date: txData.date,
        dueDate: txData.dueDate,
        type: txData.type,
        isPaid: false,
        accountId: txData.accountId,
        categoryId: txData.categoryId,
        accountName: account?.name,
        categoryName: category?.name,
        categoryColor: category?.color,
      };

      setItems((prev) => [...prev, optimisticTx]);
      setSummary((prev) => {
        const amount = optimisticTx.amount;
        if (optimisticTx.type === "income") {
          return {
            ...prev,
            income: prev.income + amount,
            balance: prev.balance + amount,
          };
        }
        if (optimisticTx.type === "expense") {
          return {
            ...prev,
            expense: prev.expense + Math.abs(amount),
            balance: prev.balance - Math.abs(amount),
          };
        }
        return prev;
      });

      const { data } = await api.createTransaction(txData);
      if (data?.transaction) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === optimisticTx.id ? { ...data.transaction, accountName: account?.name, categoryName: category?.name, categoryColor: category?.color } : item
          )
        );
      }
    },
    [categories, accounts]
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
          ...
        </div>
      ) : (
        <TransactionGrid
          items={items}
          categories={categories}
          accounts={accounts}
          onTogglePaid={handleTogglePaid}
          onCreateTransaction={handleCreate}
          defaultAccountId={defaultAccountId}
        />
      )}
    </div>
  );
}
