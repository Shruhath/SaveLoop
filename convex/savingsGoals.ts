import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all savings goals for a user
export const getSavingsGoals = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db
      .query("savingsGoals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

// Create a new savings goal
export const createSavingsGoal = mutation({
  args: {
    name: v.string(),
    targetAmount: v.number(),
    targetDate: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("savingsGoals", {
      ...args,
      userId,
      currentAmount: 0,
      isCompleted: false,
    });
  },
});

// Update savings goal progress
export const updateSavingsGoalProgress = mutation({
  args: {
    id: v.id("savingsGoals"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const goal = await ctx.db.get(args.id);
    if (!goal || goal.userId !== userId) {
      throw new Error("Savings goal not found or unauthorized");
    }

    const newAmount = Math.max(0, args.amount);
    const isCompleted = newAmount >= goal.targetAmount;

    await ctx.db.patch(args.id, {
      currentAmount: newAmount,
      isCompleted,
    });
  },
});

// Update savings goal details
export const updateSavingsGoal = mutation({
  args: {
    id: v.id("savingsGoals"),
    name: v.string(),
    targetAmount: v.number(),
    targetDate: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const goal = await ctx.db.get(args.id);
    if (!goal || goal.userId !== userId) {
      throw new Error("Savings goal not found or unauthorized");
    }

    const isCompleted = goal.currentAmount >= args.targetAmount;

    await ctx.db.patch(args.id, {
      name: args.name,
      targetAmount: args.targetAmount,
      targetDate: args.targetDate,
      description: args.description,
      isCompleted,
    });
  },
});

// Delete a savings goal
export const deleteSavingsGoal = mutation({
  args: { id: v.id("savingsGoals") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const goal = await ctx.db.get(args.id);
    if (!goal || goal.userId !== userId) {
      throw new Error("Savings goal not found or unauthorized");
    }

    await ctx.db.delete(args.id);
  },
});
