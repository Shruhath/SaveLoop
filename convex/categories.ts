import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all categories for a user
export const getUserCategories = query({
  args: { type: v.optional(v.union(v.literal("income"), v.literal("expense"))) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let query = ctx.db
      .query("categories")
      .withIndex("by_user_and_type", (q) => q.eq("userId", userId));

    if (args.type) {
      query = query.filter((q) => q.eq(q.field("type"), args.type));
    }

    return await query.collect();
  },
});

// Create a new category
export const createCategory = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("income"), v.literal("expense")),
    color: v.string(),
    icon: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("categories", {
      ...args,
      userId,
      isDefault: false,
    });
  },
});

// Update a category
export const updateCategory = mutation({
  args: {
    id: v.id("categories"),
    name: v.string(),
    color: v.string(),
    icon: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const category = await ctx.db.get(args.id);
    if (!category || category.userId !== userId) {
      throw new Error("Category not found or unauthorized");
    }

    await ctx.db.patch(args.id, {
      name: args.name,
      color: args.color,
      icon: args.icon,
    });
  },
});

// Delete a category
export const deleteCategory = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const category = await ctx.db.get(args.id);
    if (!category || category.userId !== userId) {
      throw new Error("Category not found or unauthorized");
    }

    if (category.isDefault) {
      throw new Error("Cannot delete default category");
    }

    await ctx.db.delete(args.id);
  },
});

// Initialize default categories for new users
export const initializeDefaultCategories = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user already has any categories
    const existingCategories = await ctx.db
      .query("categories")
      .withIndex("by_user_and_type", (q) => q.eq("userId", userId))
      .collect();

    // Only create default categories if user has no categories
    if (existingCategories.length === 0) {
      const defaultCategories = [
        // Income categories
        { name: "Salary", type: "income" as const, color: "#10B981", icon: "💼" },
        { name: "Freelance", type: "income" as const, color: "#3B82F6", icon: "💻" },
        { name: "Investment", type: "income" as const, color: "#8B5CF6", icon: "📈" },
        { name: "Other Income", type: "income" as const, color: "#06B6D4", icon: "💰" },
        
        // Expense categories
        { name: "Food & Dining", type: "expense" as const, color: "#EF4444", icon: "🍽️" },
        { name: "Transportation", type: "expense" as const, color: "#F59E0B", icon: "🚗" },
        { name: "Shopping", type: "expense" as const, color: "#EC4899", icon: "🛍️" },
        { name: "Entertainment", type: "expense" as const, color: "#8B5CF6", icon: "🎬" },
        { name: "Bills & Utilities", type: "expense" as const, color: "#6B7280", icon: "📄" },
        { name: "Healthcare", type: "expense" as const, color: "#10B981", icon: "🏥" },
        { name: "Education", type: "expense" as const, color: "#3B82F6", icon: "📚" },
        { name: "Travel", type: "expense" as const, color: "#06B6D4", icon: "✈️" },
        { name: "Other Expenses", type: "expense" as const, color: "#6B7280", icon: "📦" },
      ];

      for (const category of defaultCategories) {
        await ctx.db.insert("categories", {
          ...category,
          userId,
          isDefault: true,
        });
      }
    }
  },
});
