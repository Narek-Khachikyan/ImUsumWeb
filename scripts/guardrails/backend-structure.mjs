#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const backendRoot = path.join(rootDir, 'backend');
const routesRoot = path.join(backendRoot, 'src/routes');
const routesV1Root = path.join(routesRoot, 'v1');
const servicesRoot = path.join(backendRoot, 'src/services');
const routesIndexPath = path.join(routesV1Root, 'index.ts');

const violations = [];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) {
    return out;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
      continue;
    }
    if (entry.name.endsWith('.ts')) {
      out.push(full);
    }
  }
  return out;
}

const allRouteFiles = walk(routesRoot);
for (const file of allRouteFiles) {
  if (!file.startsWith(routesV1Root + path.sep)) {
    const rel = path.relative(backendRoot, file);
    violations.push(`[routes-location] ${rel} must live under src/routes/v1`);
  }
}

if (!fs.existsSync(routesIndexPath)) {
  violations.push('[routes-index] Missing src/routes/v1/index.ts');
} else {
  const indexContent = fs.readFileSync(routesIndexPath, 'utf8');
  const v1Files = walk(routesV1Root)
    .map((file) => path.basename(file, '.ts'))
    .filter((name) => name !== 'index');

  for (const routeName of v1Files) {
    const importRegex = new RegExp(`from ['\"]\\./${routeName}\\.js['\"]`);
    if (!importRegex.test(indexContent)) {
      violations.push(`[route-registration] src/routes/v1/${routeName}.ts is not imported in src/routes/v1/index.ts`);
    }
  }
}

if (!fs.existsSync(servicesRoot)) {
  violations.push('[services-missing] Missing backend/src/services directory');
} else {
  const serviceFiles = walk(servicesRoot);
  if (serviceFiles.length === 0) {
    violations.push('[services-empty] backend/src/services has no service modules');
  }
}

if (violations.length > 0) {
  console.error('Backend structure guardrail failed:');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log('Backend structure guardrail passed');
