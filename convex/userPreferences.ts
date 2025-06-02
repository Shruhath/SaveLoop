import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get user preferences
export const getUserPreferences = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      // Return default preferences for unauthenticated users
      return {
        darkMode: false,
        currency: "₹",
        defaultView: "dashboard",
      };
    }

    const preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!preferences) {
      // Create default preferences if none exist
      const defaultPreferences = {
        userId,
        darkMode: false,
        currency: "₹",
        defaultView: "dashboard",
      };
      const id = await ctx.db.insert("userPreferences", defaultPreferences);
      return { ...defaultPreferences, _id: id };
    }

    return preferences;
  },
});

// Update user preferences
export const updateUserPreferences = mutation({
  args: {
    darkMode: v.optional(v.boolean()),
    currency: v.optional(v.string()),
    defaultView: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existingPreferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingPreferences) {
      // Update existing preferences
      const updates: any = {};
      if (args.darkMode !== undefined) updates.darkMode = args.darkMode;
      if (args.currency !== undefined) updates.currency = args.currency;
      if (args.defaultView !== undefined) updates.defaultView = args.defaultView;

      await ctx.db.patch(existingPreferences._id, updates);
      return { ...existingPreferences, ...updates };
    } else {
      // Create new preferences
      const newPreferences = {
        userId,
        darkMode: args.darkMode ?? false,
        currency: args.currency ?? "₹",
        defaultView: args.defaultView ?? "dashboard",
      };
      const id = await ctx.db.insert("userPreferences", newPreferences);
      return { ...newPreferences, _id: id };
    }
  },
});
