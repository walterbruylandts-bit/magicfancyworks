# Project Map

## Main areas

- `AAwel uploaden/`
  - webshop front-end
  - public pages and content
  - this is the folder you normally edit first

- `AAniet uploaden/`
  - Cloudflare Worker
  - backend and invoice/payment logic
  - only touch this when you work on server-side logic

- `assets/`
  - shared fonts and media
  - safe to use from both areas

- `mfw_teksten/`
  - source text snippets
  - useful for content generation and translations

- `facturen/`
  - invoice test files
  - leave alone unless you work on invoicing

## Support files

- `README.md`
  - short project overview

- `START_HERE.md`
  - quickest entry point for daily work

- `VertaalPromptInTerminal.txt`
  - translation prompt reference

- `scenarioLaatsteTest.txt`
  - test note / scenario reference

## Keep out of the normal flow

- `node_modules/`
- `.wrangler/`
- `indexBACKUPS/`
- `workerBACKUPS/`
- `schematron/`
- `duo-zang-*`

## Simple rule

- Change website content in `AAwel uploaden/`
- Change backend logic in `AAniet uploaden/`
- If you are unsure, leave the file untouched until you know why you need it
