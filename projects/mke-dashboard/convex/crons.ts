import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * Sync all 8 target neighborhoods every 24 hours.
 * Runs at 4am UTC (11pm CDT) to minimize impact on ArcGIS server.
 */
const NEIGHBORHOODS = [
  { name: "Amani", slug: "amani" },
  { name: "Borchert Field", slug: "borchert-field" },
  { name: "Franklin Heights", slug: "franklin-heights" },
  { name: "Harambee", slug: "harambee" },
  { name: "Havenwoods", slug: "havenwoods" },
  { name: "Lindsay Heights", slug: "lindsay-heights" },
  { name: "Metcalfe Park", slug: "metcalfe-park" },
  { name: "Sherman Park", slug: "sherman-park" },
];

// Schedule each neighborhood sync staggered by 2 minutes
// to avoid hammering ArcGIS with 8 parallel requests
NEIGHBORHOODS.forEach((neighborhood, index) => {
  const minute = index * 2; // 0, 2, 4, 6, 8, 10, 12, 14
  crons.cron(
    `sync-${neighborhood.slug}`,
    `${minute} 4 * * *`, // 4:00, 4:02, 4:04, ... UTC
    internal.sync.syncNeighborhood,
    {
      name: neighborhood.name,
      slug: neighborhood.slug,
      source: "cron",
    },
  );
});

// Rebuild MAI address→taxkey cache weekly (Sundays at 3am UTC)
// This avoids downloading 334K records during every neighborhood sync
crons.cron(
  "rebuild-mai-cache",
  "0 3 * * 0", // Sunday 3am UTC
  internal.maiCache.rebuildMaiCache,
  {},
);

export default crons;
