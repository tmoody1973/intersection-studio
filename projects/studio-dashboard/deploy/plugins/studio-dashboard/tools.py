"""
Tool handlers for the Studio Dashboard plugin.

Each handler:
- Accepts args dict + **kwargs
- Returns JSON string (never raises)
- Communicates with Convex via HMAC-signed HTTP
"""

import hashlib
import hmac
import json
import os
import time
import urllib.request
import urllib.error
import logging

logger = logging.getLogger("studio-dashboard")

CONVEX_SITE_URL = os.environ.get("CONVEX_SITE_URL", "")
HMAC_SECRET = os.environ.get("HERMES_CALLBACK_SECRET", "")


def _sign_payload(payload: str) -> str:
    """Generate HMAC-SHA256 signature for a payload."""
    if not HMAC_SECRET:
        return ""
    return hmac.new(
        HMAC_SECRET.encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def _post_to_convex(path: str, data: dict) -> dict:
    """Send an HMAC-signed POST to a Convex HTTP endpoint."""
    if not CONVEX_SITE_URL:
        return {"error": "CONVEX_SITE_URL not configured"}

    url = f"{CONVEX_SITE_URL}{path}"
    body = json.dumps(data)
    signature = _sign_payload(body)

    req = urllib.request.Request(
        url,
        data=body.encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "X-HMAC-Signature": signature,
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return {"error": f"HTTP {e.code}: {e.reason}"}
    except urllib.error.URLError as e:
        return {"error": f"Connection failed: {e.reason}"}
    except Exception as e:
        return {"error": str(e)}


def read_project_sources(args: dict, **kwargs) -> str:
    """Fetch project sources from Convex."""
    project_id = args.get("project_id", "")
    if not project_id:
        return json.dumps({"error": "project_id is required"})

    result = _post_to_convex("/project-context", {
        "projectId": project_id,
        "include": ["sources", "thread"],
    })

    return json.dumps(result)


def request_approval(args: dict, **kwargs) -> str:
    """Send an approval request to the dashboard."""
    action = args.get("action", "")
    reason = args.get("reason", "")
    draft = args.get("draft", "")

    if not action or not reason:
        return json.dumps({"error": "action and reason are required"})

    # Get task context from kwargs (injected by Hermes)
    task_id = kwargs.get("task_id", "")

    result = _post_to_convex("/hermes-callback", {
        "taskRunId": task_id,
        "status": "needs_approval",
        "result": draft,
        "approvalRequest": {
            "action": action,
            "reason": reason,
        },
    })

    if "error" not in result:
        return json.dumps({
            "status": "approval_requested",
            "message": f"Approval requested: {action}. Tarik has 60 minutes to respond.",
        })

    return json.dumps(result)


STUDIO_API_KEY = os.environ.get("STUDIO_API_KEY", "")
ROUTING_PROXY_URL = "http://localhost:3000"


def delegate_to_agent(args: dict, **kwargs) -> str:
    """
    Delegate a task to another named agent via the routing proxy.
    Calls the target agent's Hermes profile through the local proxy.
    Results flow back to the calling agent.
    """
    agent_profile = args.get("agent_profile", "")
    task_title = args.get("task_title", "")
    task_description = args.get("task_description", "")
    reason = args.get("reason", "")

    if not agent_profile or not task_title or not task_description:
        return json.dumps({"error": "agent_profile, task_title, and task_description are required"})

    if not STUDIO_API_KEY:
        return json.dumps({"error": "STUDIO_API_KEY not configured"})

    # Log the delegation to Convex
    _post_to_convex("/hermes-tool-log", {
        "taskRunId": kwargs.get("task_id", ""),
        "toolName": "delegate_to_agent",
        "args": json.dumps({"to": agent_profile, "task": task_title, "reason": reason})[:500],
        "resultPreview": "",
        "timestamp": time.time(),
    })

    # Call the target agent via routing proxy
    try:
        body = json.dumps({
            "model": "hermes-agent",
            "input": task_description,
            "instructions": (
                f"You are working on a delegated task.\n"
                f"Task: {task_title}\n"
                f"Delegated by: CEO agent\n"
                f"Reason: {reason}\n\n"
                f"Complete this task thoroughly. Use your tools (web search, terminal, file ops) as needed. "
                f"When done, provide your complete output."
            ),
            "store": True,
        })

        req = urllib.request.Request(
            f"{ROUTING_PROXY_URL}/v1/responses",
            data=body.encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {STUDIO_API_KEY}",
                "X-Agent-Profile": agent_profile,
            },
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=120) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            output_text = result.get("output_text", "")
            if not output_text:
                for item in result.get("output", []):
                    if item.get("type") == "message":
                        content = item.get("content", [])
                        if isinstance(content, list):
                            for c in content:
                                if isinstance(c, dict) and c.get("text"):
                                    output_text = c["text"]
                                    break
                        elif isinstance(content, str):
                            output_text = content
                        break

            return json.dumps({
                "status": "delegated",
                "agent": agent_profile,
                "task": task_title,
                "result": output_text[:2000] if output_text else "Agent completed with no text output",
            })

    except urllib.error.HTTPError as e:
        return json.dumps({"error": f"Agent {agent_profile} returned HTTP {e.code}", "agent": agent_profile})
    except urllib.error.URLError as e:
        return json.dumps({"error": f"Could not reach {agent_profile}: {e.reason}", "agent": agent_profile})
    except Exception as e:
        return json.dumps({"error": f"Delegation failed: {str(e)}", "agent": agent_profile})


def report_progress(args: dict, **kwargs) -> str:
    """Report intermediate progress back to the dashboard."""
    entry_type = args.get("type", "finding")
    content = args.get("content", "")

    if not content:
        return json.dumps({"error": "content is required"})

    task_id = kwargs.get("task_id", "")

    result = _post_to_convex("/hermes-progress", {
        "taskRunId": task_id,
        "type": entry_type,
        "content": content,
    })

    if "error" not in result:
        return json.dumps({
            "status": "progress_reported",
            "type": entry_type,
            "message": "Progress update sent to dashboard.",
        })

    return json.dumps(result)
