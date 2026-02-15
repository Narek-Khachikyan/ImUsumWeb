#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const srcDir = path.join(rootDir, 'src');

const allowedExt = new Set(['.ts', '.tsx']);
const violations = [];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist') {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (allowedExt.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

const importRegex = /(?:import|export)\s+(?:[^'";]+?\s+from\s+)?["']([^"']+)["']/g;

function ownerFeature(filePath) {
  const normalized = filePath.split(path.sep).join('/');
  const marker = '/src/features/';
  const idx = normalized.indexOf(marker);
  if (idx < 0) {
    return null;
  }
  const rest = normalized.slice(idx + marker.length);
  const [feature] = rest.split('/');
  return feature || null;
}

function importedFeature(specifier, fromFile) {
  if (specifier.startsWith('@/features/')) {
    const rest = specifier.slice('@/features/'.length);
    const [feature] = rest.split('/');
    return feature || null;
  }

  if (!specifier.startsWith('.')) {
    return null;
  }

  const resolved = path.resolve(path.dirname(fromFile), specifier);
  const normalized = resolved.split(path.sep).join('/');
  const marker = '/src/features/';
  const idx = normalized.indexOf(marker);
  if (idx < 0) {
    return null;
  }
  const rest = normalized.slice(idx + marker.length);
  const [feature] = rest.split('/');
  return feature || null;
}

const files = walk(srcDir);
const graph = new Map();

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = path.relative(rootDir, file);

  for (const match of content.matchAll(importRegex)) {
    const specifier = match[1];

    if (/^(\.\.\/){2,}/.test(specifier)) {
      violations.push(`[deep-relative] ${relPath}: ${specifier}`);
    }

    const fromFeature = ownerFeature(file);
    const toFeature = importedFeature(specifier, file);

    if (fromFeature && toFeature && fromFeature !== toFeature) {
      if (!graph.has(fromFeature)) {
        graph.set(fromFeature, new Set());
      }
      graph.get(fromFeature).add(toFeature);
    }
  }
}

const visited = new Set();
const inStack = new Set();
const pathStack = [];
const cycles = new Set();

function dfs(node) {
  visited.add(node);
  inStack.add(node);
  pathStack.push(node);

  for (const next of graph.get(node) ?? []) {
    if (!visited.has(next)) {
      dfs(next);
    } else if (inStack.has(next)) {
      const cycleStart = pathStack.indexOf(next);
      const cycle = [...pathStack.slice(cycleStart), next].join(' -> ');
      cycles.add(cycle);
    }
  }

  pathStack.pop();
  inStack.delete(node);
}

for (const node of graph.keys()) {
  if (!visited.has(node)) {
    dfs(node);
  }
}

for (const cycle of cycles) {
  violations.push(`[feature-cycle] ${cycle}`);
}

if (violations.length > 0) {
  console.error('Frontend structure guardrail failed:');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log('Frontend structure guardrail passed');
