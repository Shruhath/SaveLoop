import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState, useEffect } from "react";
import Dashboard from "./components/Dashboard";
import TransactionForm from "./components/TransactionForm";
import TransactionHistory from "./components/TransactionHistory";
import BudgetManager from "./components/BudgetManager";
import SavingsGoals from "./components/SavingsGoals";
import CategoryManager from "./components/CategoryManager";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(false);
  
  const userPreferences = useQuery(api.userPreferences.getUserPreferences);
  const updatePreferences = useMutation(api.userPreferences.updateUserPreferences);
  const initializeCategories = useMutation(api.categories.initializeDefaultCategories);

  // Initialize dark mode from preferences
  useEffect(() => {
    if (userPreferences) {
      setDarkMode(userPreferences.darkMode);
      document.documentElement.classList.toggle('dark', userPreferences.darkMode);
    }
  }, [userPreferences]);

  // Initialize default categories for new users
  useEffect(() => {
    if (userPreferences !== undefined) {
      initializeCategories();
    }
  }, [userPreferences, initializeCategories]);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
    updatePreferences({ darkMode: newDarkMode });
  };

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <Authenticated>
          <div className="flex flex-col h-screen">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <div className="flex items-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      💰 Budget Tracker
                    </h1>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={toggleDarkMode}
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {darkMode ? '☀️' : '🌙'}
                    </button>
                    <SignOutButton />
                  </div>
                </div>
              </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar */}
              <nav className="w-64 bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
                <div className="p-4">
                  <div className="space-y-2">
                    {[
                      { id: "dashboard", label: "Dashboard", icon: "📊" },
                      { id: "add-transaction", label: "Add Transaction", icon: "➕" },
                      { id: "transactions", label: "Transaction History", icon: "📋" },
                      { id: "budgets", label: "Budget Manager", icon: "🎯" },
                      { id: "savings", label: "Savings Goals", icon: "🏆" },
                      { id: "categories", label: "Categories", icon: "🏷️" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          activeTab === tab.id
                            ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        <span className="text-lg">{tab.icon}</span>
                        <span className="font-medium">{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </nav>

              {/* Main Content */}
              <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                <div className="max-w-7xl mx-auto p-6">
                  {activeTab === "dashboard" && <Dashboard />}
                  {activeTab === "add-transaction" && <TransactionForm />}
                  {activeTab === "transactions" && <TransactionHistory />}
                  {activeTab === "budgets" && <BudgetManager />}
                  {activeTab === "savings" && <SavingsGoals />}
                  {activeTab === "categories" && <CategoryManager />}
                </div>
              </main>
            </div>
          </div>
        </Authenticated>

        <Unauthenticated>
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="max-w-md w-full space-y-8 p-8">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  💰 Budget Tracker
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Track your income, expenses, and achieve your financial goals
                </p>
              </div>
              <SignInForm />
            </div>
          </div>
        </Unauthenticated>

        <Toaster />
      </div>
    </div>
  );
}
