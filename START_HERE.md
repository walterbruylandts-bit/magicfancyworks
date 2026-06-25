# Start Here

## Active webshop folder

Work in `AAwel uploaden/` for the webshop front-end.

Use `AAniet uploaden/` only for the worker/backend and invoice logic.

## Very short workflow

1. Open `AAwel uploaden/`.
2. Edit the files you need.
3. Run:

```bash
git status
git add .
git commit -m "Your message"
git push
```

## Keep out of the normal flow

- `node_modules/`
- `.wrangler/`
- `indexBACKUPS/`
- `workerBACKUPS/`
- `schematron/`
- `duo-zang-*`

## Rule of thumb

- Website text and layout: `AAwel uploaden/`
- Payment and backend changes: `AAniet uploaden/`
- Everything else: leave it alone unless you explicitly need it

## Sandbox vs live

- `PAYPAL_ENV = "sandbox"` means test mode.
- In sandbox, the VAT/VIES check is skipped so test orders do not fail on fake VAT numbers.
- When `PAYPAL_ENV = "live"`, the worker validates business VAT numbers against VIES before continuing.
