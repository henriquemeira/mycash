import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { useTheme } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { AuthPage } from "@/pages/AuthPage";
import { TransactionsPage } from "@/pages/TransactionsPage";
import { BottomNav } from "@/components/BottomNav";
import { Sun, Moon, Globe } from "lucide-react";

function TopBar() {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { logout } = useAuth();
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
      <button
        onClick={toggleTheme}
        className="hidden rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 md:block"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {t("app.title")}
      </h1>

      <div className="hidden items-center gap-1 md:flex">
        <button
          onClick={() => setLanguage(language === "pt" ? "en" : "pt")}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <Globe size={14} />
          {language === "pt" ? "PT" : "EN"}
        </button>
        <button
          onClick={logout}
          className="rounded-lg px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          {t("app.logout")}
        </button>
      </div>
    </header>
  );
}

function handleNewTransaction() {
  const form = document.getElementById("quick-add-form");
  if (form) {
    form.scrollIntoView({ behavior: "smooth" });
    const input = form.querySelector('input[type="text"]');
    if (input) (input as HTMLInputElement).focus();
  }
}

function Dashboard() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <TopBar />
      <main className="flex-1 pb-16 md:pb-0">
        <TransactionsPage />
      </main>
      <BottomNav onNewTransaction={handleNewTransaction} />
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400">{t("app.loading")}</p>
      </div>
    );
  }

  return user ? <Dashboard /> : <AuthPage />;
}

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}