import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get transactions with optional filters
export const getTransactions = query({
  args: {
    type: v.optional(v.union(v.literal("income"), v.literal("expense"))),
    categoryId: v.optional(v.id("categories")),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let query = ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", userId));

    const transactions = await query.collect();

    // Apply filters
    let filteredTransactions = transactions;

    if (args.type) {
      filteredTransactions = filteredTransactions.filter(t => t.type === args.type);
    }

    if (args.categoryId) {
      filteredTransactions = filteredTransactions.filter(t => t.categoryId === args.categoryId);
    }

    if (args.startDate) {
      filteredTransactions = filteredTransactions.filter(t => t.date >= args.startDate!);
    }

    if (args.endDate) {
      filteredTransactions = filteredTransactions.filter(t => t.date <= args.endDate!);
    }

    // Get category information for each transaction
    const transactionsWithCategories = await Promise.all(
      filteredTransactions.map(async (transaction) => {
        const category = await ctx.db.get(transaction.categoryId);
        return {
          ...transaction,
          category,
        };
      })
    );

    return transactionsWithCategories.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
      .filter((q) => 
        q.and(
          q.gte(q.field("date"), startDate),
          q.lte(q.field("date"), endDate)
        )
      )
      .collect();

    const income = transactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expenses,
      balance: income - expenses,
      transactionCount: transactions.length,
    };
  },
});

// Get yearly summary
export const getYearlySummary = query({
  args: { year: v.string() }, // YYYY format
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const startDate = `${args.year}-01-01`;
    const endDate = `${args.year}-12-31`;

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => 
        q.and(
          q.gte(q.field("date"), startDate),
          q.lte(q.field("date"), endDate)
        )
      )
      .collect();

    const income = transactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    // Get monthly breakdown
    const monthlyData = [];
    for (let month = 1; month <= 12; month++) {
      const monthStr = month.toString().padStart(2, '0');
      const monthStart = `${args.year}-${monthStr}-01`;
      const monthEnd = `${args.year}-${monthStr}-31`;
      
      const monthTransactions = transactions.filter(t => 
        t.date >= monthStart && t.date <= monthEnd
      );
      
      const monthIncome = monthTransactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
      
      const monthExpenses = monthTransactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
      
      monthlyData.push({
        month: monthStr,
        income: monthIncome,
        expenses: monthExpenses,
        balance: monthIncome - monthExpenses,
      });
    }

    return {
      income,
      expenses,
      balance: income - expenses,
      transactionCount: transactions.length,
      monthlyData,
    };
  },
});

// Get all-time summary
export const getAllTimeSummary = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const income = transactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    // Get yearly breakdown
    const yearlyData: Record<string, { income: number; expenses: number; balance: number }> = {};
    
    transactions.forEach(transaction => {
      const year = transaction.date.substring(0, 4);
      if (!yearlyData[year]) {
        yearlyData[year] = { income: 0, expenses: 0, balance: 0 };
      }
      
      if (transaction.type === "income") {
        yearlyData[year].income += transaction.amount;
      } else {
        yearlyData[year].expenses += transaction.amount;
      }
      yearlyData[year].balance = yearlyData[year].income - yearlyData[year].expenses;
    });

    const sortedYears = Object.keys(yearlyData).sort().reverse();

    return {
      income,
      expenses,
      balance: income - expenses,
      transactionCount: transactions.length,
      yearlyData: sortedYears.map(year => ({
        year,
        ...yearlyData[year],
      })),
      firstTransactionDate: transactions.length > 0 
        ? transactions.sort((a, b) => a.date.localeCompare(b.date))[0].date
        : null,
    };
  },
});

// Add a new transaction
export const addTransaction = mutation({
  args: {
    amount: v.number(),
    type: v.union(v.literal("income"), v.literal("expense")),
    categoryId: v.id("categories"),
    date: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Verify the category belongs to the user
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

    // Verify the category belongs to the user
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

// Get recent transactions for dashboard
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

    // Get category information for each transaction
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

// Get spending by category for a time period
export const getSpendingByCategory = query({
  args: {
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    type: v.optional(v.union(v.literal("income"), v.literal("expense"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let query = ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", userId));

    const transactions = await query.collect();

    // Apply filters
    let filteredTransactions = transactions;

    if (args.type) {
      filteredTransactions = filteredTransactions.filter(t => t.type === args.type);
    }

    if (args.startDate) {
      filteredTransactions = filteredTransactions.filter(t => t.date >= args.startDate!);
    }

    if (args.endDate) {
      filteredTransactions = filteredTransactions.filter(t => t.date <= args.endDate!);
    }

    // Group by category
    const categoryTotals: Record<string, { amount: number; category: any }> = {};

    for (const transaction of filteredTransactions) {
      const category = await ctx.db.get(transaction.categoryId);
      if (category) {
        if (!categoryTotals[category._id]) {
          categoryTotals[category._id] = { amount: 0, category };
        }
        categoryTotals[category._id].amount += transaction.amount;
      }
    }

    return Object.values(categoryTotals)
      .sort((a, b) => b.amount - a.amount);
  },
});
