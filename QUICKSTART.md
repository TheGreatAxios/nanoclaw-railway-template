# Quick Start Guide

Deploy NanoClaw to Railway in 3 simple steps.

## Step 1: Choose Your LLM Provider

NanoClaw works with any Anthropic-compatible API:

| Provider | Best For | Cost |
|----------|----------|------|
| **Anthropic** | Best tool use & coding | Standard |
| **OpenRouter** | Access 200+ models | Pay-per-use |
| **Together AI** | Open-source models | Competitive |
| **Ollama** | 100% offline/local | Free |

## Step 2: Click Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/YOUR_TEMPLATE_ID)

## Step 3: Configure Environment Variables

### Option A: Anthropic (Default)

1. Get key from [console.anthropic.com](https://console.anthropic.com)
2. In Railway, add:
   - `ANTHROPIC_API_KEY` = your Anthropic key

### Option B: OpenRouter (Recommended for flexibility)

1. Get key from [openrouter.ai/keys](https://openrouter.ai/keys)
2. In Railway, add:
   - `ANTHROPIC_API_KEY` = your OpenRouter key
   - `ANTHROPIC_BASE_URL` = `https://openrouter.ai/api/v1`

### Option C: Together AI

1. Get key from [api.together.xyz](https://api.together.xyz)
2. In Railway, add:
   - `ANTHROPIC_API_KEY` = your Together key
   - `ANTHROPIC_BASE_URL` = `https://api.together.xyz/v1`

## Step 4: Create Persistent Volumes

Railway does **not** auto-provision volumes from templates. Without volumes, all data (conversations, sessions, configs) is lost on redeploy or restart.

**Via Railway Dashboard:**
1. Open your NanoClaw service in Railway
2. Press `⌘K` (or right-click the canvas) → **Add Volume**
3. Create these three volumes:

| Volume Name | Mount Path | Purpose |
|-------------|-----------|---------|
| `nanoclaw-data` | `/app/data` | SQLite databases & session data |
| `nanoclaw-store` | `/app/store` | Persistent key-value store |
| `nanoclaw-groups` | `/app/groups` | Group chat configuration |

**Via Railway CLI:**
```bash
railway volume add --mount-path /app/data
railway volume add --mount-path /app/store
railway volume add --mount-path /app/groups
```

## Step 5: Deploy

Railway will automatically build and deploy your NanoClaw instance.

## Next Steps

### WhatsApp Setup

1. Open your service logs in Railway
2. Look for QR code
3. Scan with WhatsApp (Linked Devices → Link a Device)
4. Start chatting with `@YourAssistantName`

### Customization (Optional)

- `ASSISTANT_NAME` = Change trigger name (default: Andy)
- `MAX_CONCURRENT_CONTAINERS` = More parallel agents
- `TZ` = Your timezone for scheduled tasks

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Check API key is set correctly |
| Model errors | Verify `ANTHROPIC_BASE_URL` if using non-Anthropic provider |
| WhatsApp not connecting | Restart service and re-scan QR code |
| Slow responses | Some providers are slower than Anthropic |

## Support

- [NanoClaw Documentation](https://nanoclaw.dev)
- [OpenRouter Documentation](https://openrouter.ai/docs)
- [Discord Community](https://discord.gg/VDdww8qS42)
- [GitHub Issues](https://github.com/qwibitai/nanoclaw/issues)
