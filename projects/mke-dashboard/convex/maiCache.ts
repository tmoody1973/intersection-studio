import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const CKAN_BASE = "https://data.milwaukee.gov/api/3/action/datastore_search";
const MAI_RESOURCE_ID = "9f905487-720e-4f30-ae70-b5ec8a2a65a1";

async function ckanFetchAll(
  resourceId: string,
  maxRecords: number,
): Promise<Record<string, unknown>[]> {
  const pageSize = 1000;
  const all: Record<string, unknown>[] = [];
  let offset = 0;

  while (offset < maxRecords) {
    const url = `${CKAN_BASE}?resource_id=${resourceId}&limit=${pageSize}&offset=${offset}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`CKAN fetch failed: ${res.status}`);
    const data = await res.json();
    if (!data.success || data.result.records.length === 0) break;
    all.push(...data.result.records);
    if (all.length >= data.result.total) break;
    offset += pageSize;
  }

  return all;
}

/**
 * Rebuild the MAI address→taxkey cache from CKAN.
 * Downloads ~334K records and stores the normalized map in Convex.
 */
export const rebuildMaiCache = internalAction({
  args: {},
  handler: async (ctx) => {
    const records = await ckanFetchAll(MAI_RESOURCE_ID, 350000);

    const map: Record<string, string> = {};
    for (const r of records) {
      const hse = String(r["HSE_NBR"] ?? "").trim();
      const dir = String(r["DIR"] ?? "").trim();
      const street = String(r["STREET"] ?? "").trim();
      const sttype = String(r["STTYPE"] ?? "").trim();
      const taxkey = String(r["TAXKEY"] ?? "").trim();

      if (!hse || !street || !taxkey) continue;

      const key = `${hse} ${dir} ${street} ${sttype}`.replace(/\s+/g, " ").trim().toUpperCase();
      map[key] = taxkey;
    }

    const mapJson = JSON.stringify(map);
    const recordCount = Object.keys(map).length;

    await ctx.runMutation(internal.maiCache.upsertMaiCache, {
      mapJson,
      recordCount,
      builtAt: Date.now(),
    });

    console.log(`MAI cache rebuilt: ${recordCount} address→taxkey entries`);
  },
});

export const upsertMaiCache = internalMutation({
  args: {
    mapJson: v.string(),
    recordCount: v.number(),
    builtAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Replace the single cache document
    const existing = await ctx.db.query("maiCache").first();
    if (existing) {
      await ctx.db.replace(existing._id, args);
    } else {
      await ctx.db.insert("maiCache", args);
    }
  },
});

/**
 * Read the cached MAI map JSON. Returns null if cache is empty.
 */
export const getMaiCache = internalQuery({
  args: {},
  handler: async (ctx): Promise<string | null> => {
    const cached = await ctx.db.query("maiCache").first();
    return cached?.mapJson ?? null;
  },
});
