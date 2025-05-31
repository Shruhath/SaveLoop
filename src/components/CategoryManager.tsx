import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

const COLORS = [
  "#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", 
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1"
];

const ICONS = [
  "💼", "💻", "📈", "💰", "🍽️", "🚗", "🛍️", "🎬", "📄", "🏥",
  "📚", "✈️", "📦", "🏠", "⚡", "📱", "🎵", "🏋️", "🎨", "🔧"
];

export default function CategoryManager() {
  const [activeTab, setActiveTab] = useState<"income" | "expense">("expense");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    color: COLORS[0],
    icon: ICONS[0],
  });

  const categories = useQuery(api.categories.getUserCategories, { type: activeTab });
  const createCategory = useMutation(api.categories.createCategory);
  const updateCategory = useMutation(api.categories.updateCategory);
  const deleteCategory = useMutation(api.categories.deleteCategory);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryForm.name) {
      toast.error("Please enter a category name");
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory({
          id: editingCategory._id,
          name: categoryForm.name,
          color: categoryForm.color,
          icon: categoryForm.icon,
        });
        toast.success("Category updated successfully!");
        setEditingCategory(null);
      } else {
        await createCategory({
          name: categoryForm.name,
          type: activeTab,
          color: categoryForm.color,
          icon: categoryForm.icon,
        });
        toast.success("Category created successfully!");
      }

      setCategoryForm({ name: "", color: COLORS[0], icon: ICONS[0] });
      setShowAddCategory(false);
    } catch (error) {
      toast.error("Failed to save category");
      console.error(error);
    }
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      color: category.color,
      icon: category.icon,
    });
    setShowAddCategory(true);
  };

  const handleDeleteCategory = async (categoryId: string, isDefault: boolean) => {
    if (isDefault) {
      toast.error("Cannot delete default categories");
      return;
    }

    if (!confirm("Are you sure you want to delete this category? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteCategory({ id: categoryId as any });
      toast.success("Category deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete category");
      console.error(error);
    }
  };

  if (!categories) {
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
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Category Manager</h2>
        <button
          onClick={() => {
            setEditingCategory(null);
            setCategoryForm({ name: "", color: COLORS[0], icon: ICONS[0] });
            setShowAddCategory(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Add Category
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => setActiveTab("expense")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "expense"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          📉 Expense Categories
        </button>
        <button
          onClick={() => setActiveTab("income")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "income"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          📈 Income Categories
        </button>
      </div>

      {/* Add/Edit Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingCategory ? 'Edit Category' : `Add ${activeTab} Category`}
            </h3>
            
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Groceries, Rent, Salary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Icon
                </label>
                <div className="grid grid-cols-10 gap-2">
                  {ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setCategoryForm(prev => ({ ...prev, icon }))}
                      className={`p-2 text-lg rounded-lg border-2 transition-colors ${
                        categoryForm.icon === icon
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setCategoryForm(prev => ({ ...prev, color }))}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        categoryForm.color === color
                          ? "border-gray-900 dark:border-white scale-110"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddCategory(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {editingCategory ? 'Update Category' : 'Add Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No {activeTab} categories found
            </p>
            <button
              onClick={() => setShowAddCategory(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Add Your First Category
            </button>
          </div>
        ) : (
          categories.map((category) => (
            <div
              key={category._id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: category.color + '20' }}
                  >
                    <span className="text-lg">{category.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {category.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {category.isDefault ? 'Default' : 'Custom'}
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEditCategory(category)}
                    className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-colors"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category._id, category.isDefault)}
                    className={`p-1 rounded transition-colors ${
                      category.isDefault
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-red-600 hover:bg-red-100 dark:hover:bg-red-900'
                    }`}
                    disabled={category.isDefault}
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {category.color}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
