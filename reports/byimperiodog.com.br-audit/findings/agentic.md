# Agent readiness: byimperiodog.com.br (2026-11-17)

Lighthouse Agentic Browsing: not measurable. PSI returned HTTP 429 (daily quota, no API key) on mobile and desktop. Retry with a key (/seo google setup).
Agent-UX heuristic (separate from Lighthouse): 100/100, complete. Home only: 44 buttons, 88 anchors, 0 div-onclick, 0 unnamed interactive nodes, 854 a11y nodes. /filhotes, puppy page and contact flow were not scored by the script (home only). The form was not submitted.

## Access policy (robots.txt, 20 groups)
- Training (GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, CCBot): Allow / except /admin/ (deliberate)
- Search (OAI-SearchBot, Claude-SearchBot, PerplexityBot, Googlebot, Bingbot): allowed, same /admin/ /api/admin/ /blog/preview/ /contract/ disallows
- User-triggered (ChatGPT-User, Claude-User, Perplexity-User): allowed. Vendor docs: Claude-User honours robots.txt; ChatGPT-User may not apply; Perplexity-User generally ignores.
- WAF/Netlify: curl with UAs Mozilla, GPTBot, ClaudeBot, ChatGPT-User, Claude-User on /filhotes all returned 200 (no UA blocking; UA-only test, not IP-verified).
- Non-standard "MJ12bot" user-agent line noted (harmless).

## Findings
- P0: none. Server-rendered (3,074 words without JS), real 404s, robots reachable.
- P1 (info, preference): no Content-Signal line. Draft/proposal (checked 2026-09-23). Optional: add `Content-Signal: search=yes, ai-input=yes, ai-train=<your choice>` per group. Note the current robots.txt explicitly allows training crawlers, so choose deliberately.
- P3: Markdown delivery absent (no Accept negotiation, no .md sibling). Opportunity only; no consumer agent confirmed to request it.
- P3: WebMCP absent (0 registerTool; 1 form, 0 annotated; draft, WebKit opposes). Opportunity; optionally annotate the contact form.
- P3: ai-catalog.json (draft), api-catalog, oauth metadata, agent-card, ucp: all 404. N/A, no matching services.
- Pass: /llms.txt 200, text/plain, 14,047 bytes, Lighthouse rules pass; llms-full.txt 404 (optional).
- Not checked: Web Bot Auth (proposal); Agent-UX for /filhotes, puppy page, contact.

## Standards notes (vendor-matrix check date 2026-09-23)
WebMCP, Content-Signal, ai-catalog.json, Web Bot Auth: drafts/proposals. No ranking, citation or traffic effect is promised.

## Structured findings (AI Search Readiness)
[
 {"title":"Lighthouse Agentic Browsing not measured (PSI quota 429)","severity":"Low","description":"Mobile and desktop PSI runs failed with quota errors.","recommendation":"Configure a Google API key and rerun."},
 {"title":"No Content-Signal in robots.txt","severity":"Low","description":"Draft preference signal absent; training crawlers explicitly allowed.","recommendation":"Optionally add Content-Signal per group reflecting the training policy."},
 {"title":"No Markdown delivery, WebMCP or ai-catalog.json","severity":"Low","description":"Emerging, unconfirmed-consumer standards; opportunities only.","recommendation":"Optional; low priority for a local breeder."}
]
