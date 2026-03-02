# NanoClaw Railway Template

One-click deploy [NanoClaw](https://github.com/qwibitai/nanoclaw) to Railway.

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/YOUR_TEMPLATE_ID)

## What is NanoClaw?

A lightweight AI assistant that runs agents securely in containers. Features:

- WhatsApp, Telegram, Discord, Slack, Signal integration
- Memory per group with isolated filesystem
- Scheduled jobs and tasks
- Container-isolated agents (secure sandboxing)
- **Works with any Anthropic-compatible API** (Anthropic, OpenRouter, Together AI, Ollama, etc.)

## LLM Provider Options

You can use NanoClaw with any of these providers:

| Provider | `ANTHROPIC_BASE_URL` | Get API Key |
|----------|---------------------|-------------|
| **Anthropic (Claude)** | (leave empty) | [console.anthropic.com](https://console.anthropic.com) |
| **OpenRouter** | `https://openrouter.ai/api/v1` | [openrouter.ai](https://openrouter.ai/keys) |
| **Together AI** | `https://api.together.xyz/v1` | [api.together.xyz](https://api.together.xyz) |
| **Fireworks** | `https://api.fireworks.ai/inference/v1` | [fireworks.ai](https://fireworks.ai) |
| **Ollama (local)** | `http://host.docker.internal:11434/v1` | N/A (local) |

## Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Your API key (from any provider above) | **Yes** |

## Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_BASE_URL` | API base URL for non-Anthropic providers | - |
| `ASSISTANT_NAME` | Name of your assistant (trigger word) | `Andy` |
| `CONTAINER_TIMEOUT` | Agent container timeout (ms) | `1800000` |
| `MAX_CONCURRENT_CONTAINERS` | Max concurrent agents | `5` |
| `TZ` | Timezone for scheduled tasks | `UTC` |

## Quick Setup Examples

### Using OpenRouter (any model)

```
ANTHROPIC_API_KEY=sk-or-v1-xxxxxxxxxxxxx
ANTHROPIC_BASE_URL=https://openrouter.ai/api/v1
```

### Using Together AI

```
ANTHROPIC_API_KEY=xxxxxxxxxxxxx
ANTHROPIC_BASE_URL=https://api.together.xyz/v1
```

### Using Local Ollama

1. Install Ollama locally
2. Run: `ollama pull llama3`
3. Set:

```
ANTHROPIC_API_KEY=ollama
ANTHROPIC_BASE_URL=http://host.docker.internal:11434/v1
```

## Post-Deployment Setup

1. **Choose your provider** from the table above
2. **Get your API key** from the provider
3. **Add to Railway environment variables:**
   - `ANTHROPIC_API_KEY` = your key
   - `ANTHROPIC_BASE_URL` = provider URL (if not Anthropic)
4. **Deploy and configure WhatsApp** (see NanoClaw docs)

## Volumes

Three persistent volumes are created:
- `data` - Database and sessions
- `store` - Auth credentials and messages
- `groups` - Group configurations and memory

## Documentation

- [NanoClaw Docs](https://nanoclaw.dev)
- [GitHub Repository](https://github.com/qwibitai/nanoclaw)
- [OpenRouter Docs](https://openrouter.ai/docs)

## License

MIT - Same as NanoClaw
