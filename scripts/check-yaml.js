#!/usr/bin/env node

/**
 * Validates YAML syntax in:
 *   1. Standalone .yml / .yaml files
 *   2. YAML frontmatter (between --- delimiters) in .md files
 *
 * Uses js-yaml (already a transitive dependency) — no new packages required.
 * Exit code 0 = all valid, 1 = at least one error found.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT = path.resolve(__dirname, '..');
const IGNORE = ['node_modules', '.git', 'coverage', 'playwright-report', 'test-results', 'dist'];

function walk(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE.includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

function extractFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return match ? match[1] : null;
}

function validateYaml(filePath, content, label) {
  try {
    yaml.load(content, { filename: filePath });
    return null;
  } catch (err) {
    return `${label}: ${err.message}`;
  }
}

const files = walk(ROOT);
const errors = [];

for (const file of files) {
  const rel = path.relative(ROOT, file);
  const ext = path.extname(file).toLowerCase();

  if (ext === '.yml' || ext === '.yaml') {
    const content = fs.readFileSync(file, 'utf8');
    const err = validateYaml(file, content, rel);
    if (err) errors.push(err);
  }

  if (ext === '.md') {
    const content = fs.readFileSync(file, 'utf8');
    const fm = extractFrontmatter(content);
    if (fm) {
      const err = validateYaml(file, fm, `${rel} (frontmatter)`);
      if (err) errors.push(err);
    }
  }
}

if (errors.length) {
  console.error('YAML validation failed:\n');
  errors.forEach((e) => console.error(`  ✗ ${e}`));
  console.error(`\n${errors.length} error(s) found.`);
  process.exit(1);
} else {
  console.log('✓ All YAML files and frontmatter are valid.');
}
