import { Mastra } from "@mastra/core";
import { registerCopilotKit } from "@ag-ui/mastra/copilotkit";
import { ceo, researcher, writer, socialMedia, dataAnalyst } from "./agents";

export const mastra = new Mastra({
  agents: { ceo, researcher, writer, socialMedia, dataAnalyst },
  server: {
    cors: {
      origin: "*",
      allowMethods: ["*"],
      allowHeaders: ["*"],
    },
    apiRoutes: [
      registerCopilotKit({ path: "/chat", resourceId: "ceo" }),
    ],
  },
});
