import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // Categories for income and expenses
  categories: defineTable({
    name: v.string(),
    type: v.union(v.literal("income"), v.literal("expense")),
    color: v.string(),
    icon: v.string(),
    isDefault: v.boolean(),
    userId: v.id("users"),
  }).index("by_user_and_type", ["userId", "type"]),

  // Transactions (income and expenses)
  transactions: defineTable({
    amount: v.number(),
    type: v.union(v.literal("income"), v.literal("expense")),
    categoryId: v.id("categories"),
    date: v.string(), // ISO date string
    description: v.string(),
    userId: v.id("users"),
    isRecurring: v.optional(v.boolean()),
    recurringFrequency: v.optional(v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"))),
    recurringEndDate: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "date"])
    .index("by_user_and_type", ["userId", "type"])
    .index("by_user_and_category", ["userId", "categoryId"]),

  // Monthly budgets
  budgets: defineTable({
    categoryId: v.optional(v.id("categories")), // null for overall budget
    amount: v.number(),
    month: v.string(), // YYYY-MM format
    userId: v.id("users"),
  })
    .index("by_user_and_month", ["userId", "month"])
    .index("by_user_category_month", ["userId", "categoryId", "month"]),

  // Savings goals
  savingsGoals: defineTable({
    name: v.string(),
    targetAmount: v.number(),
    currentAmount: v.number(),
    targetDate: v.string(),
    description: v.string(),
    userId: v.id("users"),
    isCompleted: v.boolean(),
  }).index("by_user", ["userId"]),

  // User preferences
  userPreferences: defineTable({
    userId: v.id("users"),
    darkMode: v.boolean(),
    currency: v.string(),
    defaultView: v.string(),
  }).index("by_user", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
