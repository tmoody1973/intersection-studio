"use client";

import { useCopilotReadable, useCopilotAction } from "@copilotkit/react-core";
import type { MetricCardProps, CategoryId } from "@/types/metrics";

interface DashboardContextProps {
  neighborhoodName: string;
  neighborhoodSlug: string;
  activeCategory: CategoryId;
  metrics: MetricCardProps[];
  onSwitchNeighborhood: (slug: string) => void;
  onSwitchCategory: (category: CategoryId) => void;
}

/**
 * Makes dashboard state readable by CopilotKit and defines actions
 * the AI can take (switch neighborhood, switch category, etc.)
 */
export function DashboardContext({
  neighborhoodName,
  neighborhoodSlug,
  activeCategory,
  metrics,
  onSwitchNeighborhood,
  onSwitchCategory,
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

  // This component doesn't render anything — it just registers context
  return null;
}
