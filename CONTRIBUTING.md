# Contributing to NanoClaw Railway Template

Thank you for your interest in contributing!

## How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run validation (`npm run validate`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Validation

Before submitting, run:

```bash
npm run validate
```

This checks:
- All required files exist
- `railway.template.json` is valid
- `Dockerfile.railway` has required steps
- JSON files are parseable

## Adding New Environment Variables

When adding new env vars to `railway.template.json`:

1. Add to the `env` section with description and default
2. Add to `.env.example` with documentation
3. Update README.md with the new variable
4. Add to `scripts/validate-template.js` OPTIONAL_ENV_VARS

## Code of Conduct

- Be respectful and constructive
- Focus on improving the template experience
- Test changes before submitting
