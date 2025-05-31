import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

export default function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const monthlySummary = useQuery(api.transactions.getMonthlySummary, { month: selectedMonth });
  const recentTransactions = useQuery(api.transactions.getRecentTransactions, { limit: 5 });
  const budgets = useQuery(api.budgets.getBudgets, { month: selectedMonth });
  const savingsGoals = useQuery(api.savingsGoals.getSavingsGoals);

  if (!monthlySummary || !recentTransactions || !budgets || !savingsGoals) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Month:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <span className="text-2xl">📈</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Income</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(monthlySummary.income)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <span className="text-2xl">📉</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(monthlySummary.expenses)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${monthlySummary.balance >= 0 ? 'bg-blue-100 dark:bg-blue-900' : 'bg-red-100 dark:bg-red-900'}`}>
              <span className="text-2xl">{monthlySummary.balance >= 0 ? '💰' : '⚠️'}</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Balance</p>
              <p className={`text-2xl font-bold ${monthlySummary.balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(monthlySummary.balance)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
          </div>
          <div className="p-6">
            {recentTransactions.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No transactions yet</p>
            ) : (
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div key={transaction._id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: transaction.category?.color + '20' }}>
                        <span className="text-lg">{transaction.category?.icon}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{transaction.description}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {transaction.category?.name} • {formatDate(transaction.date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Budget Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Budget Overview</h3>
          </div>
          <div className="p-6">
            {budgets.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No budgets set</p>
            ) : (
              <div className="space-y-4">
                {budgets.slice(0, 4).map((budget) => (
                  <div key={budget._id}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {budget.category?.name || 'Overall Budget'}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          budget.percentage > 100 ? 'bg-red-500' : 
                          budget.percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>{budget.percentage.toFixed(1)}% used</span>
                      <span>{formatCurrency(budget.remaining)} remaining</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expense Breakdown */}
      {monthlySummary.expensesByCategory.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Expense Breakdown</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {monthlySummary.expensesByCategory.map((item, index) => {
                const percentage = monthlySummary.expenses > 0 ? (item.amount / monthlySummary.expenses) * 100 : 0;
                return (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: item.category?.color + '20' }}>
                      <span className="text-lg">{item.category?.icon}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{item.category?.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatCurrency(item.amount)} ({percentage.toFixed(1)}%)
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Savings Goals */}
      {savingsGoals.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Savings Goals</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savingsGoals.slice(0, 4).map((goal) => {
                const percentage = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
                const daysLeft = Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div key={goal._id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">{goal.name}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        goal.isCompleted ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                        daysLeft < 0 ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                      }`}>
                        {goal.isCompleted ? 'Completed' : daysLeft < 0 ? 'Overdue' : `${daysLeft} days left`}
                      </span>
                    </div>
                    <div className="mb-2">
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <span>{formatCurrency(goal.currentAmount)}</span>
                        <span>{formatCurrency(goal.targetAmount)}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            goal.isCompleted ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {percentage.toFixed(1)}% complete
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
