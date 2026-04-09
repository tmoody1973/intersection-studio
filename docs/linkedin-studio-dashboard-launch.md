# LinkedIn post — Studio Dashboard launch (2026-04-09)

For the last year I've been building products with AI agents. Music intelligence, civic data, financial literacy, public media. I'm a product architect, not a developer. I define problems, design systems, make product decisions, and direct AI to build. No code. Just domain expertise and system design.

Somewhere along the way I realized I wasn't just building products. I was developing a methodology. A repeatable process for solving problems through building solutions with AI. So I decided to give it structure. That's Intersection Studio. A product studio that builds at the intersection of culture and technology.

The methodology is called Bumwad Coding, inspired by design thinking in architecture. Research first. Then schematic design. Then design development. Then refinement. Then construction documents. Same phases I'd use to design a building. Applied to building software with AI.

But a studio built on this methodology needs infrastructure. I need agents that can hold context, remember decisions, use real tools, and keep working without me manually directing every conversation.

Hermes Agent changes that.

Let me explain what Hermes actually is because it's different from ChatGPT or Claude or any chatbot you've used.

When you use ChatGPT, you're having a conversation. You ask something, it answers, you close the tab, it forgets everything. Next time you open it, you start over. It doesn't have a job. It doesn't have tools. It doesn't remember what it did for you last Tuesday.

Hermes is an open-source AI agent framework from Nous Research that works completely differently. You create a profile for an agent. That profile has five things:

1. A SOUL.md file. This is the agent's job description, written in plain English. "You are the Creative Director for Intersection Studio. You own visual identity across all products. You direct the Designer and Social Media agents. No generic AI aesthetics. Every product has its own visual language." That's it. Not code. Just words describing who this agent is and what it does.

2. Persistent memory. The agent remembers every conversation, every decision, every piece of work it's done. When you talk to it on Monday and then again on Thursday, it knows what happened Monday. It learns your preferences over time.

3. Skills that improve. Hermes agents get better at tasks the more they do them. After 10-20 similar tasks, execution speed improves 2-3x. The agent isn't static. It's compounding.

4. Tools that connect to real services. This is the big one. You can give an agent access to actual APIs. My Social Media agent can publish posts through Blotato. My Data Analyst can query live civic datasets. My Engineering Lead can interact with GitHub. These aren't simulations. The agents are doing real work through real integrations.

5. An API server. Each agent runs its own server on a specific port. Other software can talk to it over HTTP, just like calling any other API. This is what lets me build a dashboard on top of it.

You deploy these profiles to a cloud server and they run 24/7. Always on. Not waiting for you to open a tab.

I set up 12 profiles on a $22/month server on Fly.io. A CEO agent at the top. Four leads: Creative Director, Engineering Lead, Content Strategist, Project Manager. Seven individual contributors: Visual Designer, Frontend Dev, Backend Dev, Content Writer, Social Media, QA Reviewer, Data Analyst. Each one scoped to only the tools it needs. The Content Strategist doesn't get GitHub access. The Backend Dev doesn't get Blotato. Same way you'd scope permissions for real employees.

But here's the thing. 12 agents running on a server is just 12 processes. Without a way to see them, manage them, and direct them, it's useless to someone like me who doesn't want to SSH into a server and type commands.

So I built a frontend. A dashboard. Here's what it lets me do:

See all 12 agents in an org chart with live status dots. Green means online, gray means offline, red means something's wrong. At a glance I know who's working and who's not.

Create tasks by typing what I need. "Write a LinkedIn post about the new comparison feature." The system dispatches it to the right agent automatically.

Watch the work happen in a real-time activity feed. "CEO delegated to Content Strategist." "Content Strategist started working." "Content Strategist completed. Needs approval." I can see the chain of delegation as it happens.

Approve or reject work. When an agent finishes something that needs my sign-off, a card slides up on my screen with the output and two buttons: approve or reject. I read it, I decide, I tap. That's my job.

Search institutional memory. Every decision, every delegation, every output gets logged automatically. I hit Cmd+K and type "what did we decide about the logo?" and the system finds it. Not because someone organized notes. Because the work itself generated the knowledge.

Swap AI models per agent from a dropdown. 157 models available through OpenRouter. If the Writer isn't performing on Llama 3.3, I switch it to Claude Sonnet and see if the output improves. Live, in the dashboard, without redeploying anything.

Track costs. How much each agent has spent today, this month, projected monthly burn against my $200 budget. Per agent, not just a total.

Switch to presentation mode. One button flips the whole dashboard to high-contrast light theme with larger text. Built specifically for showing this on a projector.

Here's an example of the full workflow.

I type: "Write a LinkedIn post about the new neighborhood comparison feature in MKE Dashboard." That task goes to the CEO agent. The CEO reads it, decides this is content work, and delegates to the Content Strategist. The Content Strategist drafts the post, but flags it: "This is external-facing content. Needs approval."

An approval card pops up on my screen. I read the draft. I tap approve. The Social Media agent picks it up, formats it for LinkedIn, and publishes it through Blotato. Done.

Four agents touched that task. I touched it once.

Three weeks later I search "what did we post about MKE Dashboard?" and the whole chain is there. The delegation, the draft, my approval, the publish. Institutional memory, generated as a byproduct of work.

Each agent runs on a specific model through OpenRouter. Strategic agents (CEO, leads) get Claude Sonnet for stronger reasoning. Execution agents (writers, devs, QA) get Llama 3.3 70B to keep costs down. One API key, all models. And I can change any of them at runtime from the dashboard.

This is also an experiment. I genuinely don't know if this works long-term. Can 12 AI agents actually help run a product studio? Will the CEO agent make good delegation decisions or terrible ones? Will the institutional memory become useful or just noise? Will I save time or spend more time managing agents than I would have spent doing the work myself?

I'm going to find out and document the whole thing along the way. The wins, the failures, the moments where an agent does something brilliant, and the moments where it does something so wrong I have to rethink the entire approach. All of it, in public.

If it works, it's a blueprint for anyone with deep domain expertise who wants to build things without learning to code. If it doesn't, at least we'll know why, and that's worth documenting too.

Still early. Very early. The CEO agent is live and responding on a server right now. The other eleven have their job descriptions written and are ready to deploy. The architecture is done. The dashboard works. But this is the beginning of building the studio, not the finished product.

Intersection Studio is open source. Link in the replies.

#BuildInPublic #IntersectionStudio #HermesAgent
