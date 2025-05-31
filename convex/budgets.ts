import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get budgets for a specific month
export const getBudgets = query({
  args: { month: v.string() }, // YYYY-MM format
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const budgets = await ctx.db
      .query("budgets")
      .withIndex("by_user_and_month", (q) => q.eq("userId", userId).eq("month", args.month))
      .collect();

    // Get category details and spending for each budget
    const budgetsWithDetails = await Promise.all(
      budgets.map(async (budget) => {
        let category = null;
        if (budget.categoryId) {
          category = await ctx.db.get(budget.categoryId);
        }

        // Calculate spent amount for this category in this month
        const startDate = `${args.month}-01`;
        const endDate = `${args.month}-31`;

        const transactions = await ctx.db
          .query("transactions")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .collect();

        let spent = 0;
        if (budget.categoryId) {
          // Category-specific budget
          spent = transactions
            .filter(t => 
              t.type === "expense" &&
              t.categoryId === budget.categoryId &&
              t.date >= startDate &&
              t.date <= endDate
            )
            .reduce((sum, t) => sum + t.amount, 0);
        } else {
          // Overall budget
          spent = transactions
            .filter(t => 
              t.type === "expense" &&
              t.date >= startDate &&
              t.date <= endDate
            )
            .reduce((sum, t) => sum + t.amount, 0);
        }

        return {
          ...budget,
          category,
          spent,
          remaining: budget.amount - spent,
          percentage: budget.amount > 0 ? (spent / budget.amount) * 100 : 0,
        };
      })
    );

    return budgetsWithDetails;
  },
});

// Create or update a budget
export const setBudget = mutation({
  args: {
    categoryId: v.optional(v.id("categories")),
    amount: v.number(),
    month: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if budget already exists
    const existingBudget = await ctx.db
      .query("budgets")
      .withIndex("by_user_category_month", (q) => 
        q.eq("userId", userId).eq("categoryId", args.categoryId).eq("month", args.month)
      )
      .first();

    if (existingBudget) {
      // Update existing budget
      await ctx.db.patch(existingBudget._id, {
        amount: args.amount,
      });
      return existingBudget._id;
    } else {
      // Create new budget
      return await ctx.db.insert("budgets", {
        ...args,
        userId,
      });
    }
  },
});

// Delete a budget
export const deleteBudget = mutation({
  args: { id: v.id("budgets") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const budget = await ctx.db.get(args.id);
    if (!budget || budget.userId !== userId) {
      throw new Error("Budget not found or unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});
