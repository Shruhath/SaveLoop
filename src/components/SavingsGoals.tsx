import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export default function SavingsGoals() {
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [goalForm, setGoalForm] = useState({
    name: "",
    targetAmount: "",
    targetDate: "",
    description: "",
  });

  const [progressForm, setProgressForm] = useState({
    goalId: "",
    amount: "",
  });

  const savingsGoals = useQuery(api.savingsGoals.getSavingsGoals);
  const createSavingsGoal = useMutation(api.savingsGoals.createSavingsGoal);
  const updateSavingsGoal = useMutation(api.savingsGoals.updateSavingsGoal);
  const updateSavingsGoalProgress = useMutation(api.savingsGoals.updateSavingsGoalProgress);
  const deleteSavingsGoal = useMutation(api.savingsGoals.deleteSavingsGoal);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!goalForm.name || !goalForm.targetAmount || !goalForm.targetDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (editingGoal) {
        await updateSavingsGoal({
          id: editingGoal._id,
          name: goalForm.name,
          targetAmount: parseFloat(goalForm.targetAmount),
          targetDate: goalForm.targetDate,
          description: goalForm.description,
        });
        toast.success("Savings goal updated successfully!");
        setEditingGoal(null);
      } else {
        await createSavingsGoal({
          name: goalForm.name,
          targetAmount: parseFloat(goalForm.targetAmount),
          targetDate: goalForm.targetDate,
          description: goalForm.description,
        });
        toast.success("Savings goal created successfully!");
      }

      setGoalForm({ name: "", targetAmount: "", targetDate: "", description: "" });
      setShowAddGoal(false);
    } catch (error) {
      toast.error("Failed to save goal");
      console.error(error);
    }
  };

  const handleUpdateProgress = async (goalId: string, newAmount: number) => {
    try {
      await updateSavingsGoalProgress({
        id: goalId as any,
        amount: newAmount,
      });
      toast.success("Progress updated successfully!");
    } catch (error) {
      toast.error("Failed to update progress");
      console.error(error);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm("Are you sure you want to delete this savings goal?")) {
      return;
    }

    try {
      await deleteSavingsGoal({ id: goalId as any });
      toast.success("Savings goal deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete goal");
      console.error(error);
    }
  };

  const handleEditGoal = (goal: any) => {
    setEditingGoal(goal);
    setGoalForm({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      targetDate: goal.targetDate,
      description: goal.description,
    });
    setShowAddGoal(true);
  };

  if (!savingsGoals) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Savings Goals</h2>
        <button
          onClick={() => {
            setEditingGoal(null);
            setGoalForm({ name: "", targetAmount: "", targetDate: "", description: "" });
            setShowAddGoal(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Add Goal
        </button>
      </div>

      {/* Add/Edit Goal Modal */}
      {showAddGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingGoal ? 'Edit Savings Goal' : 'Add Savings Goal'}
            </h3>
            
            <form onSubmit={handleAddGoal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Goal Name *
                </label>
                <input
                  type="text"
                  value={goalForm.name}
                  onChange={(e) => setGoalForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Emergency Fund, Vacation, New Car"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Amount *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">₹</span>
                  <input
                    type="number"
                    value={goalForm.targetAmount}
                    onChange={(e) => setGoalForm(prev => ({ ...prev, targetAmount: e.target.value }))}
                    step="0.01"
                    min="0"
                    required
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Date *
                </label>
                <input
                  type="date"
                  value={goalForm.targetDate}
                  onChange={(e) => setGoalForm(prev => ({ ...prev, targetDate: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={goalForm.description}
                  onChange={(e) => setGoalForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Optional description for your goal..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddGoal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {editingGoal ? 'Update Goal' : 'Add Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Goals List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savingsGoals.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <p className="text-gray-500 dark:text-gray-400 mb-4">No savings goals yet</p>
            <button
              onClick={() => setShowAddGoal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Create Your First Goal
            </button>
          </div>
        ) : (
          savingsGoals.map((goal) => {
            const percentage = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            const daysLeft = Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            
            return (
              <div key={goal._id} className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                      {goal.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {goal.description}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditGoal(goal)}
                      className="text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 p-1 rounded transition-colors"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal._id)}
                      className="text-red-600 hover:bg-red-100 dark:hover:bg-red-900 p-1 rounded transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <span>{formatCurrency(goal.currentAmount)}</span>
                      <span>{formatCurrency(goal.targetAmount)}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          goal.isCompleted ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>{percentage.toFixed(1)}% complete</span>
                      <span className={`${
                        goal.isCompleted ? 'text-green-600 dark:text-green-400' :
                        daysLeft < 0 ? 'text-red-600 dark:text-red-400' :
                        'text-blue-600 dark:text-blue-400'
                      }`}>
                        {goal.isCompleted ? 'Completed!' : 
                         daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` :
                         `${daysLeft} days left`}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Update amount"
                      step="0.01"
                      min="0"
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const input = e.target as HTMLInputElement;
                          const amount = parseFloat(input.value);
                          if (amount >= 0) {
                            handleUpdateProgress(goal._id, amount);
                            input.value = '';
                          }
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                        const amount = parseFloat(input.value);
                        if (amount >= 0) {
                          handleUpdateProgress(goal._id, amount);
                          input.value = '';
                        }
                      }}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                    >
                      Update
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
