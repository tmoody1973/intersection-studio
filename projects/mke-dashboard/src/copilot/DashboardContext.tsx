"use client";

import { useCopilotReadable, useCopilotAction } from "@copilotkit/react-core";
import type { MetricCardProps, CategoryId } from "@/types/metrics";

interface NeighborhoodRaw {
  tidDistricts?: string;
  bidDistricts?: string;
  tinDistricts?: string;
  opportunityZones?: string;
  nidDistricts?: string;
  totalPermitInvestment?: number;
  newConstructionCount?: number;
  propertySalesCount?: number;
  medianSalePrice?: number;
  totalSalesVolume?: number;
  liquorLicenseCount?: number;
}

interface DashboardContextProps {
  neighborhoodName: string;
  neighborhoodSlug: string;
  activeCategory: CategoryId;
  metrics: MetricCardProps[];
  raw?: NeighborhoodRaw | null;
  onSwitchNeighborhood: (slug: string) => void;
  onSwitchCategory: (category: CategoryId) => void;
  onOpenComparison?: () => void;
}

/**
 * Makes dashboard state readable by CopilotKit and defines actions
 * the AI can take (switch neighborhood, switch category, etc.)
 */
function parseJsonField(value?: string): unknown[] {
  if (!value) return [];
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

export function DashboardContext({
  neighborhoodName,
  neighborhoodSlug,
  activeCategory,
  metrics,
  raw,
  onSwitchNeighborhood,
  onSwitchCategory,
  onOpenComparison,
}: DashboardContextProps) {
  // Make the current neighborhood readable
  useCopilotReadable({
    description: "The currently selected Milwaukee neighborhood",
    value: {
      name: neighborhoodName,
      slug: neighborhoodSlug,
    },
  });

  // Make the active category readable
  useCopilotReadable({
    description: "The currently active metric category tab",
    value: activeCategory,
  });

  // Make all metrics readable
  useCopilotReadable({
    description:
      "All neighborhood metrics currently displayed on the dashboard",
    value: metrics.map((m) => ({
      id: m.id,
      label: m.label,
      value: m.value,
      unit: m.unit,
      trend: m.trend,
      category: m.category,
      source: m.source.name,
      lastUpdated: m.source.lastUpdated,
    })),
  });

  // Make economic development data readable
  useCopilotReadable({
    description:
      "Economic development zones and investment data for the current neighborhood",
    value: {
      zones: {
        tid: parseJsonField(raw?.tidDistricts),
        bid: parseJsonField(raw?.bidDistricts),
        tin: parseJsonField(raw?.tinDistricts),
        oz: parseJsonField(raw?.opportunityZones),
        nid: parseJsonField(raw?.nidDistricts),
      },
      investment: {
        permitTotal: raw?.totalPermitInvestment ?? null,
        newConstruction: raw?.newConstructionCount ?? null,
        salesCount: raw?.propertySalesCount ?? null,
        medianPrice: raw?.medianSalePrice ?? null,
        totalSalesVolume: raw?.totalSalesVolume ?? null,
        liquorLicenses: raw?.liquorLicenseCount ?? null,
      },
    },
  });

  // Action: Switch neighborhood
  useCopilotAction({
    name: "switchNeighborhood",
    description:
      "Switch the dashboard to show data for a different Milwaukee neighborhood. Available: Amani, Borchert Field, Franklin Heights, Harambee, Havenwoods, Lindsay Heights, Metcalfe Park, Sherman Park.",
    parameters: [
      {
        name: "slug",
        type: "string",
        description:
          "The neighborhood slug (e.g., 'harambee', 'sherman-park', 'metcalfe-park')",
        required: true,
      },
    ],
    handler: ({ slug }) => {
      onSwitchNeighborhood(slug);
    },
  });

  // Action: Switch category
  useCopilotAction({
    name: "showCategory",
    description:
      "Switch the dashboard to show a different metric category. Options: community, publicSafety, qualityOfLife, wellness.",
    parameters: [
      {
        name: "category",
        type: "string",
        description:
          "The category ID: 'community', 'publicSafety', 'qualityOfLife', or 'wellness'",
        required: true,
      },
    ],
    handler: ({ category }) => {
      onSwitchCategory(category as CategoryId);
    },
  });

  // Action: Open comparison view
  useCopilotAction({
    name: "compareNeighborhoods",
    description:
      "Open the neighborhood comparison view to compare metrics side by side between two Milwaukee neighborhoods.",
    parameters: [],
    handler: () => {
      onOpenComparison?.();
    },
  });

  // This component doesn't render anything — it just registers context
  return null;
}
