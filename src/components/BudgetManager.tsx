import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export default function BudgetManager() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [showAddBudget, setShowAddBudget] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [budgetForm, setBudgetForm] = useState({
    categoryId: "",
    amount: "",
    applyToFutureMonths: false,
  });

  const budgets = useQuery(api.budgets.getBudgets, { month: selectedMonth });
  const categories = useQuery(api.categories.getUserCategories, { type: "expense" });
  const setBudget = useMutation(api.budgets.setBudget);
  const deleteBudget = useMutation(api.budgets.deleteBudget);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!budgetForm.amount) {
      toast.error("Please enter a budget amount");
      return;
    }

    try {
      await setBudget({
        categoryId: budgetForm.categoryId ? (budgetForm.categoryId as any) : undefined,
        amount: parseFloat(budgetForm.amount),
        month: selectedMonth,
        applyToFutureMonths: budgetForm.applyToFutureMonths,
      });

      toast.success(editingBudget ? "Budget updated successfully!" : "Budget set successfully!");
      setBudgetForm({ categoryId: "", amount: "", applyToFutureMonths: false });
      setShowAddBudget(false);
      setEditingBudget(null);
    } catch (error) {
      toast.error("Failed to set budget");
      console.error(error);
    }
  };

  const handleEditBudget = (budget: any) => {
    setEditingBudget(budget);
    setBudgetForm({
      categoryId: budget.categoryId || "",
      amount: budget.amount.toString(),
      applyToFutureMonths: budget.isRecurring,
    });
    setShowAddBudget(true);
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (!confirm("Are you sure you want to delete this budget?")) {
      return;
    }

    try {
      await deleteBudget({ id: budgetId as any });
      toast.success("Budget deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete budget");
      console.error(error);
    }
  };

  if (!budgets || !categories) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const usedCategories = budgets.map(b => b.categoryId).filter(Boolean);
  const availableCategories = categories.filter(c => !usedCategories.includes(c._id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Budget Manager</h2>
        <div className="flex items-center space-x-4">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={() => {
              setEditingBudget(null);
              setBudgetForm({ categoryId: "", amount: "", applyToFutureMonths: false });
              setShowAddBudget(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Add Budget
          </button>
        </div>
      </div>

      {/* Add/Edit Budget Modal */}
      {showAddBudget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingBudget ? 'Edit Budget' : `Add Budget for ${selectedMonth}`}
            </h3>
            
            <form onSubmit={handleAddBudget} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category (Optional - leave empty for overall budget)
                </label>
                <select
                  value={budgetForm.categoryId}
                  onChange={(e) => setBudgetForm(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!!editingBudget}
                >
                  <option value="">Overall Budget</option>
                  {availableCategories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Budget Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">₹</span>
                  <input
                    type="number"
                    value={budgetForm.amount}
                    onChange={(e) => setBudgetForm(prev => ({ ...prev, amount: e.target.value }))}
                    step="0.01"
                    min="0"
                    required
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="applyToFutureMonths"
                  checked={budgetForm.applyToFutureMonths}
                  onChange={(e) => setBudgetForm(prev => ({ ...prev, applyToFutureMonths: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="applyToFutureMonths" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  {editingBudget ? 'Update all future months' : 'Apply to all future months'}
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddBudget(false);
                    setEditingBudget(null);
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {editingBudget ? 'Update Budget' : 'Add Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Budgets List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">No budgets set for this month</p>
            <button
              onClick={() => setShowAddBudget(true)}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Create Your First Budget
            </button>
          </div>
        ) : (
          budgets.map((budget) => (
            <div key={budget._id} className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  {budget.category ? (
                    <>
                      <div className="p-2 rounded-lg" style={{ backgroundColor: budget.category.color + '20' }}>
                        <span className="text-lg">{budget.category.icon}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {budget.category.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Category Budget</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <span className="text-lg">🎯</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Overall Budget
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</p>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditBudget(budget)}
                    className="text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 p-1 rounded transition-colors"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteBudget(budget._id)}
                    className="text-red-600 hover:bg-red-100 dark:hover:bg-red-900 p-1 rounded transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Spent</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(budget.spent)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Budget</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(budget.amount)}
                  </span>
                </div>

                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      budget.percentage > 100 ? 'bg-red-500' : 
                      budget.percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                  ></div>
                </div>

                <div className="flex justify-between text-sm">
                  <span className={`font-medium ${
                    budget.percentage > 100 ? 'text-red-600 dark:text-red-400' :
                    budget.percentage > 80 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-green-600 dark:text-green-400'
                  }`}>
                    {budget.percentage.toFixed(1)}% used
                  </span>
                  <span className={`font-medium ${
                    budget.remaining < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
                  }`}>
                    {budget.remaining < 0 ? 'Over by ' : 'Remaining: '}
                    {formatCurrency(Math.abs(budget.remaining))}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
