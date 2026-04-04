"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { CopilotKit } from "@copilotkit/react-core";

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL!,
);

const COPILOTKIT_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_COPILOTKIT_PUBLIC_KEY || "ck_pub_e7ae60fefdc7b4de5e3f2909631e80eb";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <CopilotKit publicApiKey={COPILOTKIT_PUBLIC_KEY}>
          {children}
        </CopilotKit>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
