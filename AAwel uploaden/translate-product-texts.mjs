#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const args = new Set(process.argv.slice(2));
const overwrite = args.has('--overwrite');
const dryRun = args.has('--dry-run');

function getArg(name, fallback = '') {
  const prefix = name + '=';
  const hit = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : fallback;
}

const cwd = process.cwd();
const sourceDirRequested = process.argv.slice(2).some((arg) => arg.startsWith('--source-dir='));
const productsFile = getArg('--products', path.join(cwd, 'producten.json'));
const sourceDir = getArg('--source-dir', '');
const outputDir = getArg('--out-dir', path.join(cwd, 'generated-mfw-teksten'));
const sourceBaseUrl = getArg(
  '--source-base',
  'https://pub-ad74d32a13e446fbba18cdb7e699f91b.r2.dev/mfw-teksten'
);
const translateUrl = getArg(
  '--translate-url',
  'https://paypal-handler-v3.camar.workers.dev/translate'
);
const glossaryFile = getArg('--glossary', path.join(cwd, 'glossary.json'));
const targetLangs = ['fr', 'en'];

function log(...parts) {
  console.log(...parts);
}

function warn(...parts) {
  console.warn(...parts);
}

function err(...parts) {
  console.error(...parts);
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

async function readJsonIfExists(filePath) {
  try {
    return await readJson(filePath);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function normalizeGlossary(glossaryData) {
  if (!glossaryData || typeof glossaryData !== 'object') {
    return [];
  }

  return Object.entries(glossaryData)
    .map(([source, targets]) => ({
      source: String(source).trim(),
      targets: targets && typeof targets === 'object' ? targets : {}
    }))
    .filter((entry) => entry.source.length > 0 && (entry.targets.en || entry.targets.fr))
    .sort((a, b) => b.source.length - a.source.length);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function applyGlossaryPlaceholders(text, glossaryEntries) {
  let transformed = text;
  const replacements = [];

  for (const [index, entry] of glossaryEntries.entries()) {
    const placeholder = `GLOSSARYTOKEN${String(index).padStart(4, '0')}`;
    const pattern = new RegExp(escapeRegExp(entry.source), 'gi');
    transformed = transformed.replace(pattern, placeholder);
    replacements.push({ placeholder, targets: entry.targets });
  }

  return { text: transformed, replacements };
}

function restoreGlossaryPlaceholders(text, replacements, targetLang) {
  let transformed = text;
  for (const replacement of replacements) {
    const targetText = replacement.targets?.[targetLang];
    if (targetText) {
      transformed = transformed.replaceAll(replacement.placeholder, targetText);
    }
  }
  return transformed;
}

async function readSourceText(code) {
  if (sourceDir) {
    const localPath = path.join(sourceDir, `${code}.txt`);
    if (await fileExists(localPath)) {
      return fs.readFile(localPath, 'utf8');
    }
    if (sourceDirRequested) {
      throw new Error(`Source text not found: ${localPath}`);
    }
  }

  const url = `${sourceBaseUrl.replace(/\/$/, '')}/${code}.txt`;
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    return '';
  }
  return response.text();
}

async function translateText(text, targetLang) {
  const response = await fetch(translateUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, targetLang })
  });

  if (!response.ok) {
    throw new Error(`Translate HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.translated_text || '';
}

async function translateWithGlossary(text, targetLang, glossaryEntries) {
  const prepared = applyGlossaryPlaceholders(text, glossaryEntries);
  const translated = await translateText(prepared.text, targetLang);
  return restoreGlossaryPlaceholders(translated, prepared.replacements, targetLang);
}

async function writeTargetFile(dir, code, lang, text) {
  const targetDir = path.join(dir, 'mfw-teksten');
  await fs.mkdir(targetDir, { recursive: true });
  const outPath = path.join(targetDir, `${code}_${lang}.txt`);
  await fs.writeFile(outPath, text.trimEnd() + '\n', 'utf8');
  return outPath;
}

async function main() {
  const products = await readJson(productsFile);
  const glossaryData = await readJsonIfExists(glossaryFile);
  const glossaryEntries = normalizeGlossary(glossaryData);
  const codes = [...new Set(products.map((p) => p.code).filter(Boolean))];

  log(`Products: ${codes.length}`);
  log(`Source: ${sourceDir ? `local folder ${sourceDir}` : sourceBaseUrl}`);
  log(`Output: ${outputDir}`);
  log(`Glossary: ${glossaryEntries.length ? glossaryFile : 'none'}`);
  log(`Mode: ${dryRun ? 'dry-run' : 'write files'}`);

  const summary = { written: 0, skipped: 0, missingSource: 0, failed: 0 };

  for (const code of codes) {
    const sourceText = (await readSourceText(code)).trim();
    if (!sourceText) {
      summary.missingSource++;
      warn(`Missing source text for ${code}`);
      continue;
    }

    for (const lang of targetLangs) {
      const outPath = path.join(outputDir, 'mfw-teksten', `${code}_${lang}.txt`);
      if (!overwrite && (await fileExists(outPath))) {
        summary.skipped++;
        continue;
      }

      try {
        const translated = glossaryEntries.length
          ? await translateWithGlossary(sourceText, lang, glossaryEntries)
          : await translateText(sourceText, lang);
        if (!translated.trim()) {
          throw new Error('Empty translation');
        }

        if (dryRun) {
          log(`Would write ${path.relative(cwd, outPath)}`);
        } else {
          const savedPath = await writeTargetFile(outputDir, code, lang, translated);
          log(`Wrote ${path.relative(cwd, savedPath)}`);
        }
        summary.written++;
      } catch (error) {
        summary.failed++;
        err(`Failed ${code} -> ${lang}: ${error.message}`);
      }
    }
  }

  log(`Summary: written=${summary.written} skipped=${summary.skipped} missingSource=${summary.missingSource} failed=${summary.failed}`);
}

main().catch((error) => {
  err(error.stack || error.message);
  process.exit(1);
});
