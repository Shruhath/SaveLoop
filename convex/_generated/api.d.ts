/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as budgets from "../budgets.js";
import type * as categories from "../categories.js";
import type * as http from "../http.js";
import type * as router from "../router.js";
import type * as savingsGoals from "../savingsGoals.js";
import type * as transactions from "../transactions.js";
import type * as userPreferences from "../userPreferences.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  budgets: typeof budgets;
  categories: typeof categories;
  http: typeof http;
  router: typeof router;
  savingsGoals: typeof savingsGoals;
  transactions: typeof transactions;
  userPreferences: typeof userPreferences;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
