import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Helper function to get next month in YYYY-MM format
function getNextMonth(month: string): string {
  const [year, monthNum] = month.split('-').map(Number);
  if (monthNum === 12) {
    return `${year + 1}-01`;
  }
  return `${year}-${String(monthNum + 1).padStart(2, '0')}`;
}

// Helper function to delete all future budgets for a category
async function deleteFutureBudgets(ctx: any, userId: string, categoryId: string | undefined, startMonth: string) {
  let currentMonth = getNextMonth(startMonth);
  const endYear = new Date().getFullYear() + 1; // Look ahead for next 12 months
  
  while (true) {
    const [year] = currentMonth.split('-').map(Number);
    
    // Stop if we've reached next year
    if (year > endYear) break;

    // Find and delete budget for this month
    const futureBudget = await ctx.db
      .query("budgets")
      .withIndex("by_user_category_month", (q: any) => 
        q.eq("userId", userId)
         .eq("categoryId", categoryId)
         .eq("month", currentMonth)
      )
      .first();

    if (futureBudget) {
      await ctx.db.delete(futureBudget._id);
    }

    currentMonth = getNextMonth(currentMonth);
  }
}

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

        // Check if this budget is recurring by looking for future months
        const nextMonth = getNextMonth(args.month);
        const futureBudget = await ctx.db
          .query("budgets")
          .withIndex("by_user_category_month", (q) => 
            q.eq("userId", userId)
             .eq("categoryId", budget.categoryId)
             .eq("month", nextMonth)
          )
          .first();

        return {
          ...budget,
          category,
          spent,
          remaining: budget.amount - spent,
          percentage: budget.amount > 0 ? (spent / budget.amount) * 100 : 0,
          isRecurring: !!futureBudget,
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
    applyToFutureMonths: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if budget already exists for the current month
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

      // If applyToFutureMonths is false, delete all future budgets
      if (args.applyToFutureMonths === false) {
        await deleteFutureBudgets(ctx, userId, args.categoryId, args.month);
      }
      // If applyToFutureMonths is true, update all future budgets
      else if (args.applyToFutureMonths) {
        let currentMonth = args.month;
        const endYear = new Date().getFullYear() + 1; // Apply for next 12 months
        
        while (true) {
          currentMonth = getNextMonth(currentMonth);
          const [year] = currentMonth.split('-').map(Number);
          
          // Stop if we've reached next year
          if (year > endYear) break;

          // Find and update existing budget for this month
          const futureBudget = await ctx.db
            .query("budgets")
            .withIndex("by_user_category_month", (q) => 
              q.eq("userId", userId).eq("categoryId", args.categoryId).eq("month", currentMonth)
            )
            .first();

          if (futureBudget) {
            await ctx.db.patch(futureBudget._id, {
              amount: args.amount,
            });
          } else {
            // Create new budget if it doesn't exist
            await ctx.db.insert("budgets", {
              categoryId: args.categoryId,
              amount: args.amount,
              month: currentMonth,
              userId,
            });
          }
        }
      }

      return existingBudget._id;
    } else {
      // Create new budget
      const budgetId = await ctx.db.insert("budgets", {
        categoryId: args.categoryId,
        amount: args.amount,
        month: args.month,
        userId,
      });

      // If applyToFutureMonths is true, create budgets for future months
      if (args.applyToFutureMonths) {
        let currentMonth = args.month;
        const endYear = new Date().getFullYear() + 1; // Apply for next 12 months
        
        while (true) {
          currentMonth = getNextMonth(currentMonth);
          const [year] = currentMonth.split('-').map(Number);
          
          // Stop if we've reached next year
          if (year > endYear) break;

          // Check if budget already exists for this month
          const existingFutureBudget = await ctx.db
            .query("budgets")
            .withIndex("by_user_category_month", (q) => 
              q.eq("userId", userId).eq("categoryId", args.categoryId).eq("month", currentMonth)
            )
            .first();

          if (!existingFutureBudget) {
            await ctx.db.insert("budgets", {
              categoryId: args.categoryId,
              amount: args.amount,
              month: currentMonth,
              userId,
            });
          }
        }
      }

      return budgetId;
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
