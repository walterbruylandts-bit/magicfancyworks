# Vertaalworkflow productteksten

Dit project gebruikt `mfw-teksten/*.txt` als bron voor de productomschrijvingen per taal.

De vaste termen zitten in `glossary.json`. Die worden tijdens de vertaling eerst afgeschermd en daarna per taal teruggezet.

## Wat dit script doet

`translate-product-texts.mjs` leest de Nederlandse brontekst per product en maakt automatisch:

- `*_fr.txt`
- `*_en.txt`

De output wordt geschreven naar:

`generated-mfw-teksten/mfw-teksten/`

Daarna kun je die bestanden uploaden naar dezelfde R2-structuur die de shop al gebruikt.

## Aanbevolen werkwijze

1. Zet de Nederlandse bronbestanden klaar.
   - Ofwel lokaal in een map zoals `../mfw_teksten/`
   - Ofwel laat het script rechtstreeks lezen van de publieke R2-basis

2. Draai de generator:

```bash
node translate-product-texts.mjs --source-dir=../mfw_teksten --out-dir=./generated-mfw-teksten --overwrite
```

3. Upload daarna de gegenereerde bestanden uit:

`generated-mfw-teksten/mfw-teksten/`

naar de R2-map:

`mfw-teksten/`

## Handige opties

- `--dry-run` toont alleen wat er zou worden geschreven.
- `--overwrite` vervangt bestaande vertalingen.
- `--source-base=...` wijst naar een andere bron dan de publieke R2-url.
- `--translate-url=...` laat je een andere vertaalendpoint gebruiken.
- `--glossary=...` gebruikt een andere glossary dan de standaard `glossary.json`.

## Praktisch

De shop blijft werken zoals hij nu werkt:

- als een vertaling aanwezig is, wordt die gebruikt;
- als een vertaling ontbreekt, blijft de live fallback actief.
