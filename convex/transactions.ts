import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    amount: v.number(),
    type: v.union(v.literal("income"), v.literal("expense")),
    category: v.string(),
    description: v.string(),
    date: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    await ctx.db.insert("transactions", {
      userId: identity.subject,
      ...args,
    });
  },
});

export const remove = mutation({
  args: {
    id: v.id("transactions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const transaction = await ctx.db.get(args.id);
    if (!transaction) throw new Error("Not found");
    if (transaction.userId !== identity.subject)
      throw new Error("Unauthorized");

    await ctx.db.delete(args.id);
  },
});
