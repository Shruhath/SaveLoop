import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

type ViewType = "monthly" | "yearly" | "alltime";

export default function Dashboard() {
  const [viewType, setViewType] = useState<ViewType>("monthly");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedYear, setSelectedYear] = useState(() => {
    return new Date().getFullYear().toString();
  });

  // Queries based on view type
  const monthlySummary = useQuery(
    api.transactions.getMonthlySummary,
    viewType === "monthly" ? { month: selectedMonth } : "skip"
  );
  
  const yearlySummary = useQuery(
    api.transactions.getYearlySummary,
    viewType === "yearly" ? { year: selectedYear } : "skip"
  );
  
  const allTimeSummary = useQuery(
    api.transactions.getAllTimeSummary,
    viewType === "alltime" ? {} : "skip"
  );

  const recentTransactions = useQuery(api.transactions.getRecentTransactions, { limit: 5 });
  const spendingByCategory = useQuery(api.transactions.getSpendingByCategory, {
    type: "expense",
    ...(viewType === "monthly" && {
      startDate: `${selectedMonth}-01`,
      endDate: `${selectedMonth}-31`,
    }),
    ...(viewType === "yearly" && {
      startDate: `${selectedYear}-01-01`,
      endDate: `${selectedYear}-12-31`,
    }),
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getCurrentSummary = () => {
    switch (viewType) {
      case "monthly":
        return monthlySummary;
      case "yearly":
        return yearlySummary;
      case "alltime":
        return allTimeSummary;
      default:
        return null;
    }
  };

  const getViewTitle = () => {
    switch (viewType) {
      case "monthly":
        return `Monthly Summary - ${new Date(selectedMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`;
      case "yearly":
        return `Yearly Summary - ${selectedYear}`;
      case "alltime":
        return "All Time Summary";
      default:
        return "Summary";
    }
  };

  const summary = getCurrentSummary();

  if (!summary || !recentTransactions || !spendingByCategory) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with View Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* View Type Selector */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {[
              { key: "monthly", label: "Monthly", icon: "📅" },
              { key: "yearly", label: "Yearly", icon: "📊" },
              { key: "alltime", label: "All Time", icon: "🌍" },
            ].map((view) => (
              <button
                key={view.key}
                onClick={() => setViewType(view.key as ViewType)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewType === view.key
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <span className="mr-1">{view.icon}</span>
                {view.label}
              </button>
            ))}
          </div>

          {/* Date Selectors */}
          <div className="flex gap-2">
            {viewType === "monthly" && (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )}
            
            {viewType === "yearly" && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Array.from({ length: 10 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <option key={year} value={year.toString()}>
                      {year}
                    </option>
                  );
                })}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Income</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(summary.income)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900">
              <span className="text-2xl">💸</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(summary.expenses)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${
              summary.balance >= 0 
                ? 'bg-blue-100 dark:bg-blue-900' 
                : 'bg-orange-100 dark:bg-orange-900'
            }`}>
              <span className="text-2xl">{summary.balance >= 0 ? '📈' : '📉'}</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Balance</p>
              <p className={`text-2xl font-bold ${
                summary.balance >= 0 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-orange-600 dark:text-orange-400'
              }`}>
                {formatCurrency(summary.balance)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Period Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {getViewTitle()}
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Transactions</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {summary.transactionCount}
            </p>
          </div>
          
          {viewType === "alltime" && allTimeSummary?.firstTransactionDate && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Since</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatDate(allTimeSummary.firstTransactionDate)}
              </p>
            </div>
          )}
          
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Daily</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {viewType === "monthly" 
                ? formatCurrency(summary.expenses / 30)
                : viewType === "yearly"
                ? formatCurrency(summary.expenses / 365)
                : formatCurrency(summary.expenses / Math.max(1, summary.transactionCount))
              }
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Savings Rate</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {summary.income > 0 
                ? `${((summary.balance / summary.income) * 100).toFixed(1)}%`
                : '0%'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Breakdown Data */}
      {viewType === "yearly" && yearlySummary?.monthlyData && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Monthly Breakdown for {selectedYear}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {yearlySummary.monthlyData.map((month) => (
              <div key={month.month} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  {new Date(`${selectedYear}-${month.month}-01`).toLocaleDateString('en-IN', { month: 'long' })}
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Income:</span>
                    <span className="text-green-600 dark:text-green-400">{formatCurrency(month.income)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Expenses:</span>
                    <span className="text-red-600 dark:text-red-400">{formatCurrency(month.expenses)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-gray-900 dark:text-white">Balance:</span>
                    <span className={month.balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}>
                      {formatCurrency(month.balance)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewType === "alltime" && allTimeSummary?.yearlyData && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Yearly Breakdown
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allTimeSummary.yearlyData.map((year) => (
              <div key={year.year} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  {year.year}
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Income:</span>
                    <span className="text-green-600 dark:text-green-400">{formatCurrency(year.income)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Expenses:</span>
                    <span className="text-red-600 dark:text-red-400">{formatCurrency(year.expenses)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-gray-900 dark:text-white">Balance:</span>
                    <span className={year.balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}>
                      {formatCurrency(year.balance)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Layout for Charts and Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Spending Categories */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top Spending Categories
          </h3>
          {spendingByCategory.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No expenses found for this period
            </p>
          ) : (
            <div className="space-y-4">
              {spendingByCategory.slice(0, 5).map((item, index) => (
                <div key={item.category._id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{item.category.icon}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {item.category.name}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(item.amount)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {summary.expenses > 0 ? `${((item.amount / summary.expenses) * 100).toFixed(1)}%` : '0%'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Transactions
          </h3>
          {recentTransactions.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No transactions yet
            </p>
          ) : (
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction._id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: transaction.category?.color + '20' }}>
                      <span className="text-lg">{transaction.category?.icon}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {transaction.description}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {transaction.category?.name} • {formatDate(transaction.date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type === 'income' 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {transaction.type}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
