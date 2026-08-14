# External provider research notes

## Higgsfield

- Official API documentation: https://docs.higgsfield.ai
  - The API is asynchronous and uses a two-part credential format: API key ID and API key secret, sent as `Authorization: Key <id>:<secret>`.
  - A generation request returns a request ID plus status, status URL, and cancel URL.
  - The docs describe polling and webhooks for completion handling.
  - Output files are available for at least seven days, so STUDIO should copy completed output into application-controlled storage for durable retention.
- Official MCP help: https://higgsfield.ai/creator-hub/help-center/integrations/how-do-i-connect-higgsfield-to-claude
  - MCP supports image/video generation, upscaling, background removal, outpainting, reference assets, and history browsing.
  - MCP generation consumes Higgsfield credits; free generations and unlimited model access are not available through MCP.
  - MCP output remains in Higgsfield Assets and is not directly downloadable from Claude.
- Official CLI/MCP overview: https://higgsfield.ai/cli
  - Higgsfield advertises 30+ image/video models and agent workflows through MCP.

These findings support using the Higgsfield API as the deployed STUDIO adapter and keeping MCP for interactive creative evaluation only.

## Caption generation alternatives

- Ollama API documentation: https://docs.ollama.com/api/introduction and https://docs.ollama.com/api/chat
  - Ollama serves a local API at `http://localhost:11434/api` after installation.
  - The chat API supports non-streaming responses with `stream: false` and structured JSON output through `format`.
  - A local installation avoids hosted request quotas; practical throughput is limited by the machine's CPU, memory, and GPU.
- Groq rate limits: https://console.groq.com/docs/rate-limits
  - Groq's free plan has explicit per-model RPM, RPD, TPM, and TPD limits, so it is not unlimited.
- OpenRouter limits: https://openrouter.ai/docs/api_reference/limits
  - Free models have explicit request-per-minute and request-per-day caps, so they are not unlimited.

The selected caption fallback is therefore Ollama local inference, with Gemini retained as an optional hosted provider. The application must report Ollama as unavailable when the local service or configured model is missing rather than silently pretending caption generation is enabled.
