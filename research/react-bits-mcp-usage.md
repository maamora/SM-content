# React Bits registry and shadcn MCP usage

## What was configured

STUDIO now has a shadcn-compatible `frontend/components.json` file with the public React Bits namespace registered as `@react-bits`. The project-local `.mcp.json` also registers the official shadcn MCP process next to the existing Higgsfield entry. Because STUDIO is a repository with its web package in `frontend/`, the small cross-platform launcher at `frontend/scripts/shadcn-mcp.mjs` starts the official process in that directory, ensuring it reads the correct `components.json`. No visual component has been installed as part of this setup, so the public landing and authenticated workflow behavior remain unchanged.

## Claude Code usage

Open the repository in Claude Code, restart it after pulling this change, then run `/mcp`. The `shadcn` server should show as connected. It can browse, search, and install registry items, including the React Bits namespace, from natural-language prompts.

| Goal | Example prompt |
|---|---|
| Browse React Bits | `Show me the available backgrounds from the @react-bits registry.` |
| Find a motion primitive | `Find a subtle scroll reveal from @react-bits that respects reduced motion.` |
| Inspect before installing | `Show the files, dependencies, and behavior for @react-bits/FadeContent. Do not install it yet.` |
| Install safely | `Install @react-bits/FadeContent in the frontend, then use it only on the authenticated Studio route and preserve existing keyboard and reduced-motion behavior.` |

## STUDIO guardrails

Registry components are optional implementation materials, not automatic design direction. Before installing one, inspect its code, dependencies, license, bundle cost, accessibility behavior, and behavior under reduced motion. Use it only if it reinforces the active Quiet Studio system and does not turn a functional workflow into decorative motion. Avoid adding React Bits effects to the public landing unless a separate request explicitly permits it.

## Verification

The enabled project connector successfully discovers both `@shadcn` and `@react-bits` from STUDIO’s frontend configuration. A non-mutating search for `fade content` returned the React Bits `FadeContent` variants, confirming that the registry is available for browsing before any component is installed.

## References

[1]: https://reactbits.dev/get-started/mcp "React Bits MCP Server"
[2]: https://ui.shadcn.com/docs/mcp "shadcn MCP Server"
