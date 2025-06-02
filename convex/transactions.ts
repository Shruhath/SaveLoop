import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get transactions with filters
export const getTransactions = query({
  args: {
    type: v.optional(v.union(v.literal("income"), v.literal("expense"))),
    categoryId: v.optional(v.id("categories")),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let query = ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc");

    const transactions = await query.collect();

    // Apply filters
    let filtered = transactions;

    if (args.type) {
      filtered = filtered.filter(t => t.type === args.type);
    }

    if (args.categoryId) {
      filtered = filtered.filter(t => t.categoryId === args.categoryId);
    }

    if (args.startDate) {
      filtered = filtered.filter(t => t.date >= args.startDate!);
    }

    if (args.endDate) {
      filtered = filtered.filter(t => t.date <= args.endDate!);
    }

    if (args.limit) {
      filtered = filtered.slice(0, args.limit);
    }

    // Get category details for each transaction
    const transactionsWithCategories = await Promise.all(
      filtered.map(async (transaction) => {
        const category = await ctx.db.get(transaction.categoryId);
        return {
          ...transaction,
          category,
        };
      })
    );

    return transactionsWithCategories;
  },
});

// Get recent transactions
export const getRecentTransactions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit || 10);

    const transactionsWithCategories = await Promise.all(
      transactions.map(async (transaction) => {
        const category = await ctx.db.get(transaction.categoryId);
        return {
          ...transaction,
          category,
        };
      })
    );

    return transactionsWithCategories;
  },
});

// Create a new transaction
export const createTransaction = mutation({
  args: {
    amount: v.number(),
    type: v.union(v.literal("income"), v.literal("expense")),
    categoryId: v.id("categories"),
    date: v.string(),
    description: v.string(),
    isRecurring: v.optional(v.boolean()),
    recurringFrequency: v.optional(v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"))),
    recurringEndDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Verify category belongs to user
    const category = await ctx.db.get(args.categoryId);
    if (!category || category.userId !== userId) {
      throw new Error("Invalid category");
    }

    return await ctx.db.insert("transactions", {
      ...args,
      userId,
    });
  },
});

// Update a transaction
export const updateTransaction = mutation({
  args: {
    id: v.id("transactions"),
    amount: v.number(),
    categoryId: v.id("categories"),
    date: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const transaction = await ctx.db.get(args.id);
    if (!transaction || transaction.userId !== userId) {
      throw new Error("Transaction not found or unauthorized");
    }

    // Verify category belongs to user
    const category = await ctx.db.get(args.categoryId);
    if (!category || category.userId !== userId) {
      throw new Error("Invalid category");
    }

    await ctx.db.patch(args.id, {
      amount: args.amount,
      categoryId: args.categoryId,
      date: args.date,
      description: args.description,
    });
  },
});

// Delete a transaction
export const deleteTransaction = mutation({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const transaction = await ctx.db.get(args.id);
    if (!transaction || transaction.userId !== userId) {
      throw new Error("Transaction not found or unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});

// Get monthly summary
export const getMonthlySummary = query({
  args: { month: v.string() }, // YYYY-MM format
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const startDate = `${args.month}-01`;
    const endDate = `${args.month}-31`;

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const monthlyTransactions = transactions.filter(
      t => t.date >= startDate && t.date <= endDate
    );

    const income = monthlyTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = monthlyTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    // Group expenses by category
    const expensesByCategory: Record<string, { amount: number; category: any }> = {};
    
    for (const transaction of monthlyTransactions.filter(t => t.type === "expense")) {
      const category = await ctx.db.get(transaction.categoryId);
      const categoryId = transaction.categoryId;
      
      if (!expensesByCategory[categoryId]) {
        expensesByCategory[categoryId] = { amount: 0, category };
      }
      expensesByCategory[categoryId].amount += transaction.amount;
    }

    return {
      income,
      expenses,
      balance: income - expenses,
      expensesByCategory: Object.values(expensesByCategory),
      transactionCount: monthlyTransactions.length,
    };
  },
});
