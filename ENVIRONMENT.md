# Environment Variables Reference

## Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Your API key (Anthropic OR any compatible provider) | `sk-ant-api03-...` or `sk-or-v1-...` |

## Provider-Specific Setup

### Anthropic (Default)

```
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
# ANTHROPIC_BASE_URL can be left empty
```

### OpenRouter

Access 200+ models (GPT-4, Claude, Llama, etc.) through one API:

```
ANTHROPIC_API_KEY=sk-or-v1-your-openrouter-key
ANTHROPIC_BASE_URL=https://openrouter.ai/api/v1
```

Get your key at [openrouter.ai/keys](https://openrouter.ai/keys)

### Together AI

```
ANTHROPIC_API_KEY=your-together-api-key
ANTHROPIC_BASE_URL=https://api.together.xyz/v1
```

Get your key at [api.together.xyz](https://api.together.xyz)

### Fireworks AI

```
ANTHROPIC_API_KEY=your-fireworks-key
ANTHROPIC_BASE_URL=https://api.fireworks.ai/inference/v1
```

### Ollama (Local Models)

Run completely offline with local models:

1. Install Ollama: https://ollama.ai
2. Pull a model: `ollama pull llama3`
3. Set environment:

```
ANTHROPIC_API_KEY=ollama
ANTHROPIC_BASE_URL=http://host.docker.internal:11434/v1
```

Note: For Railway deployment, you'd need to expose your local Ollama or use a hosted version.

## Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_BASE_URL` | API endpoint URL | (Anthropic default) |
| `ANTHROPIC_AUTH_TOKEN` | Additional auth token | - |
| `CLAUDE_CODE_OAUTH_TOKEN` | Claude Code OAuth token | - |
| `ASSISTANT_NAME` | Name of your assistant (trigger word) | `Andy` |
| `ASSISTANT_HAS_OWN_NUMBER` | Assistant has own WhatsApp number | `false` |
| `CONTAINER_IMAGE` | Docker image for agent containers | `nanoclaw-agent:latest` |
| `CONTAINER_TIMEOUT` | Container timeout (ms) | `1800000` |
| `MAX_CONCURRENT_CONTAINERS` | Max concurrent agents | `5` |
| `IDLE_TIMEOUT` | Idle timeout (ms) | `1800000` |
| `LOG_LEVEL` | Logging level | `info` |
| `TZ` | Timezone | `UTC` |

## Getting API Keys

### Anthropic

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Navigate to API Keys
4. Create a new key

### OpenRouter

1. Go to [openrouter.ai/keys](https://openrouter.ai/keys)
2. Create an account
3. Generate an API key
4. (Optional) Add credits for pay-per-use

### Together AI

1. Go to [api.together.xyz](https://api.together.xyz)
2. Sign up
3. Get your API key from settings

## Important Notes

- The model must support the **Anthropic API format** (messages endpoint)
- Not all providers support all Claude-specific features (like tool use)
- OpenRouter provides the widest model compatibility
- For best results with tool use and agent features, Claude models are recommended

## Security

- Never commit your `.env` file
- Use Railway's environment variable encryption
- Rotate API keys regularly
- Use separate keys for production and development
