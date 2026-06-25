# Magicfancyworks

This repository contains the Magicfancyworks webshop project.

## Where to work

- `AAwel uploaden/` = webshop front-end and pages
- `AAniet uploaden/` = Cloudflare Worker / backend / invoice logic
- `assets/` = shared fonts and media
- `mfw_teksten/` = source texts
- `facturen/` = invoice test files

## Simple workflow

1. Edit the files locally on your Mac.
2. Check what changed with `git status`.
3. Save a snapshot with `git add .` and `git commit -m "message"`.
4. Send it to GitHub with `git push`.

## What not to edit in the normal flow

- `node_modules/`
- `.wrangler/`
- `indexBACKUPS/`
- `workerBACKUPS/`
- `schematron/`
- `duo-zang-*` test concept folders

## Notes

- GitHub is the source of truth for the code.
- Cloudflare is for deployment and runtime settings.
- Keep webshop content changes in the repository, not directly in Cloudflare.
