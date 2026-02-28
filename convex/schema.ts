import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  transactions: defineTable({
    userId: v.string(),
    amount: v.number(),
    type: v.union(v.literal("income"), v.literal("expense")),
    category: v.string(),
    description: v.string(),
    date: v.number(), // Unix timestamp
  }).index("by_user", ["userId"]),

  budgets: defineTable({
    userId: v.string(),
    month: v.string(), // Format: "YYYY-MM"
    limit: v.number(),
  }).index("by_user_month", ["userId", "month"]),
});
