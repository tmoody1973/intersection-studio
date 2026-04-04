import {
  CopilotRuntime,
  AnthropicAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";

const runtime = new CopilotRuntime({
  remoteActions: [],
});

export const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
  runtime,
  serviceAdapter: new AnthropicAdapter({
    model: "claude-sonnet-4-5",
  }),
  endpoint: "/api/copilotkit",
});
