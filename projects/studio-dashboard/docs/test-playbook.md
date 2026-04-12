# Studio Dashboard Test Playbook

Run through these tests in order. Each builds on the previous one.
Check off each step as you go.

---

## Test 1: Authentication & RBAC

**Goal:** Verify Clerk auth gate and role assignment.

- [ ] Open https://studio-dashboard-eta.vercel.app
- [ ] You should see "Intersection Studio" sign-in page
- [ ] Sign in with your Clerk account
- [ ] Dashboard loads with sidebar, Overview page
- [ ] Your avatar appears in top-right (Clerk UserButton)
- [ ] Go to Clerk dashboard → Restrictions → enable Allowlist → add only your email

**Expected:** First user gets "owner" role automatically. All mutations (create, edit, approve) should work.

---

## Test 2: Agent Status

**Goal:** Verify all 12 agents show online.

- [ ] Overview page shows OrgChart with CEO at top
- [ ] All 12 agent cards have green status dots
- [ ] KPI row shows "Agents Online: 12/12"
- [ ] Each card shows its model (claude-sonnet-4 or llama-3.3-70b)

**If agents show offline:** Wait 2 minutes for the heartbeat cron. Check https://intersection-studio.fly.dev/health

---

## Test 3: Create a Project

**Goal:** Test the full project creation flow with sources.

- [ ] Click **+ New** in sidebar under Projects
- [ ] Modal opens with all fields
- [ ] Fill in:
  - Name: "Test Project Alpha"
  - Description: "Testing the full Intersection Studio workflow"
  - Phase: Research (default)
  - Budget: $10
- [ ] Assign agents: CEO + Engineering Lead
- [ ] Add a **text source**:
  - Name: "Project Brief"
  - Content: "This is a test project for validating the studio dashboard. We want to verify that agents can receive tasks, use tools, report progress, and delegate work. The product domain is developer tooling."
- [ ] Add a **URL source**:
  - Name: "Hermes Docs"
  - URL: https://hermes-agent.nousresearch.com/docs
- [ ] Click Create Project
- [ ] Project appears in sidebar with "Research" phase badge
- [ ] Click the project to filter views

---

## Test 4: Create & Dispatch a Simple Task

**Goal:** Verify the task lifecycle end-to-end.

- [ ] Go to **Tasks** page
- [ ] Click **+ New Task**
- [ ] Fill in:
  - Title: "Summarize the project brief"
  - Description: "Read the project sources and produce a 3-sentence summary of what this project is about. Use the read_project_sources tool to access the reference material."
  - Project: Test Project Alpha
  - Assign To: CEO
  - Priority: Normal
- [ ] Click Create Task
- [ ] Task card appears in **Queued** column
- [ ] Watch it move to **Running** (may take a few seconds)
- [ ] Watch it move to **Completed** (or check back in 1-2 minutes)
- [ ] Click the task card to open detail panel
- [ ] Verify:
  - [ ] Result shows a summary
  - [ ] Thread section has entries
  - [ ] Run history shows timing and status
  - [ ] **Copy** and **Download .md** buttons work on the result
  - [ ] **Export for Claude Code** button works on the thread

---

## Test 5: Test Plugin Tools

**Goal:** Verify the studio-dashboard plugin tools work.

### 5a: report_progress

- [ ] Create task:
  - Title: "Research developer tooling landscape"
  - Description: "Research the current developer tooling market. As you find information, use the report_progress tool to send findings back to the dashboard. Report at least 2 findings using type='finding'."
  - Assign To: CEO
  - Priority: Normal
- [ ] While running, check the **Activity Feed** on Overview page
- [ ] Look for "agent.progress_reported" events
- [ ] After completion, check the thread — should have multiple entries

### 5b: request_approval

- [ ] Create task:
  - Title: "Propose a product name"
  - Description: "Come up with 3 potential product names for a developer tooling product. Then use the request_approval tool to ask for approval on your top recommendation. Action: 'Propose product name: [your choice]'. Reason: 'This will be the public-facing brand name'."
  - Assign To: CEO
  - Priority: High
- [ ] Task should move to **Waiting Approval**
- [ ] Approval card should appear in bottom-right corner of dashboard
- [ ] Shows agent name, task title, reason, countdown timer
- [ ] Click **Approve**
- [ ] Task moves to **Completed**

### 5c: read_project_sources

- [ ] Create task:
  - Title: "Analyze project context"
  - Description: "Use the read_project_sources tool to fetch all sources for this project. Summarize what context is available including text sources, URLs, and any files."
  - Assign To: CEO
- [ ] Result should reference the "Project Brief" text and "Hermes Docs" URL you added earlier

---

## Test 6: Skills

**Goal:** Verify Bumwad methodology skills work.

- [ ] Create task:
  - Title: "Run research brief"
  - Description: "Use the /research-brief skill to produce a research brief for this project. The domain is developer tooling for AI-powered coding assistants."
  - Assign To: CEO
  - Priority: High
- [ ] Result should be a structured research brief with:
  - Problem Statement
  - Landscape (competitors)
  - Target Users
  - Data Sources
  - Open Questions
- [ ] Download the result as .md

---

## Test 7: Delegation

**Goal:** Verify agents can delegate to other agents.

- [ ] Create task:
  - Title: "Plan technical architecture"
  - Description: "As CEO, review the project context and delegate the technical architecture design to the Engineering Lead. Use the delegate_task tool to assign them the work."
  - Assign To: CEO
  - Priority: Normal
- [ ] Check if a child task appears in the Kanban assigned to Engineering Lead
- [ ] The delegation should show in the Activity Feed
- [ ] Both tasks should reference the same project thread

**Note:** Delegation through Hermes's built-in `delegate_task` tool creates a subagent conversation. The result flows back through the CEO's response. For dashboard-visible delegation (child tasks in Kanban), the callback system needs to process delegation responses — this may need iteration.

---

## Test 8: Agent Editor

**Goal:** Verify all agent configuration works.

### 8a: Edit a Soul

- [ ] Go to **Agents** page
- [ ] Click the **Content Writer** card
- [ ] Editor panel opens with Soul tab
- [ ] Edit the soul text — add a line: "Always end posts with a relevant emoji."
- [ ] Click **Save** (or Cmd+S)
- [ ] "Saved" confirmation appears
- [ ] Toggle **Preview** to see formatted text
- [ ] Close and reopen — change persists

### 8b: Manage Skills

- [ ] Click **Skills** tab
- [ ] Add a skill: type "linkedin-post" and click Add
- [ ] Skill pill appears
- [ ] Add another: "case-study"
- [ ] Remove "case-study" by clicking x
- [ ] Only "linkedin-post" remains

### 8c: Update Config

- [ ] Click **Config** tab
- [ ] Change Daily Budget from $1.00 to $2.00 (blur to save)
- [ ] Change Max Concurrent Tasks to 3
- [ ] Change Timeout to 30 minutes
- [ ] Change Reports To dropdown to "Content Lead"
- [ ] Check "CEO" in Can Delegate To
- [ ] Close and reopen — all changes persist

---

## Test 9: Cost Tracking

**Goal:** Verify cost data flows through.

- [ ] After running several tasks, go to **Overview** page
- [ ] Cost Dashboard should show:
  - [ ] Today's spend > $0.00
  - [ ] Per-agent breakdown with task counts
  - [ ] Budget bar showing utilization
- [ ] KPI row "Today's Spend" matches

---

## Test 10: Command Palette (Second Brain)

**Goal:** Verify thread search works.

- [ ] Press **Cmd+K** anywhere in the dashboard
- [ ] Command palette opens with search input
- [ ] Type "project" or "developer tooling"
- [ ] Results should show thread entries from your test tasks
- [ ] Each result shows agent name, type, date, and content preview
- [ ] Press **Esc** to close

---

## Test 11: Kanban Interactions

**Goal:** Verify board UX.

- [ ] Create a task, wait for it to fail (assign to an offline agent or use bad description)
- [ ] Click failed task → **Retry** button
- [ ] Task moves back to Queued → Running
- [ ] Create another task → let it complete → click **Archive**
- [ ] Task disappears from Kanban
- [ ] Create a queued task → click **Cancel**
- [ ] Task moves to cancelled state
- [ ] Click **Delete** → click **Confirm Delete**
- [ ] Task fully removed

---

## Test 12: Presentation Mode

**Goal:** Verify demo mode for AfroTech.

- [ ] Click **Present** button (top-right, next to avatar)
- [ ] Dashboard switches to high-contrast light theme
- [ ] Text is larger, colors are more vivid
- [ ] Good for projector display
- [ ] Click **Exit** to return to dark mode

---

## Test 13: Multi-Project Parallel Work

**Goal:** Verify the "agentic company" handles parallel projects.

- [ ] Create a second project: "Test Project Beta"
  - Add different sources
  - Assign different agents
- [ ] Create tasks in both projects
- [ ] Select "All projects" in sidebar → Kanban shows tasks from both
- [ ] Select "Test Project Alpha" → only Alpha tasks visible
- [ ] Select "Test Project Beta" → only Beta tasks visible
- [ ] Activity Feed shows events from all projects

---

## Test 14: Different Agent Models

**Goal:** Verify both Claude and Llama agents work.

- [ ] Create a task for **CEO** (Claude Sonnet 4): "Write a haiku about coding"
- [ ] Create a task for **Frontend Dev** (Llama 3.3 70B): "Write a haiku about React"
- [ ] Both complete successfully
- [ ] Compare response quality and timing
- [ ] Check cost difference in the Cost Dashboard

---

## Test 15: Error Handling

**Goal:** Verify graceful failure.

- [ ] Create a task with a very long description (paste 5000+ characters)
- [ ] Create a task with no description (just a title)
- [ ] Create a task for an agent and immediately cancel it
- [ ] Verify error messages are clear in the task detail panel
- [ ] Verify the Activity Feed logs failures

---

## After Testing

### Clean Up
- Archive or delete test tasks
- Keep "Test Project Alpha" if you want ongoing reference
- Delete "Test Project Beta" if not needed

### Known Limitations
- Delegation via Hermes `delegate_task` creates a subagent within the CEO's session — child tasks don't automatically appear as separate Kanban cards yet
- File upload sources are stored but agents can't read binary files (PDFs, images) directly — they see the metadata
- Soul edits in the dashboard save to Convex but don't sync to Fly.io SOUL.md until next deploy
- Llama models may timeout on complex prompts — increase timeout in Config tab if needed

### Report Issues
Note any failures with:
- What you tried
- What happened
- What you expected
- Screenshot if visual
