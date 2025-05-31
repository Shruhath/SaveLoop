import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export default function TransactionForm() {
  const [formData, setFormData] = useState({
    amount: "",
    type: "expense" as "income" | "expense",
    categoryId: "",
    date: new Date().toISOString().split('T')[0],
    description: "",
    isRecurring: false,
    recurringFrequency: "monthly" as "daily" | "weekly" | "monthly",
    recurringEndDate: "",
  });

  const createTransaction = useMutation(api.transactions.createTransaction);
  const categories = useQuery(api.categories.getUserCategories, { type: formData.type });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.categoryId || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createTransaction({
        amount: parseFloat(formData.amount),
        type: formData.type,
        categoryId: formData.categoryId as any,
        date: formData.date,
        description: formData.description,
        isRecurring: formData.isRecurring,
        recurringFrequency: formData.isRecurring ? formData.recurringFrequency : undefined,
        recurringEndDate: formData.isRecurring && formData.recurringEndDate ? formData.recurringEndDate : undefined,
      });

      toast.success("Transaction added successfully!");
      
      // Reset form
      setFormData({
        amount: "",
        type: "expense",
        categoryId: "",
        date: new Date().toISOString().split('T')[0],
        description: "",
        isRecurring: false,
        recurringFrequency: "monthly",
        recurringEndDate: "",
      });
    } catch (error) {
      toast.error("Failed to add transaction");
      console.error(error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add Transaction</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Record your income or expense</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: "income", categoryId: "" }))}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  formData.type === "income"
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                }`}
              >
                <div className="text-2xl mb-2">📈</div>
                <div className="font-medium">Income</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: "expense", categoryId: "" }))}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  formData.type === "expense"
                    ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                }`}
              >
                <div className="text-2xl mb-2">📉</div>
                <div className="font-medium">Expense</div>
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">₹</span>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                required
                className="w-full pl-8 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category *
            </label>
            <select
              id="categoryId"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a category</option>
              {categories?.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date *
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter transaction description..."
            />
          </div>

          {/* Recurring Transaction */}
          <div>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isRecurring"
                name="isRecurring"
                checked={formData.isRecurring}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Recurring Transaction
              </label>
            </div>

            {formData.isRecurring && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="recurringFrequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Frequency
                  </label>
                  <select
                    id="recurringFrequency"
                    name="recurringFrequency"
                    value={formData.recurringFrequency}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="recurringEndDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    id="recurringEndDate"
                    name="recurringEndDate"
                    value={formData.recurringEndDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
