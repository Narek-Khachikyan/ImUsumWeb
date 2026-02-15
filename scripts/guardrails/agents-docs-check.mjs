#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const checks = [
  {
    file: path.join(rootDir, 'AGENTS.md'),
    required: [
      'docs/knowledge/system-overview.md',
      'docs/knowledge/frontend-architecture.md',
      'docs/knowledge/backend-architecture.md',
      'docs/knowledge/runbooks.md',
      'docs/knowledge/troubleshooting.md',
      'docs/knowledge/feedback-loop.md',
      'PLANS.md',
      'npm run harness:doctor',
      'npm run harness:up',
      'npm run harness:smoke',
      'npm run harness:down'
    ]
  },
  {
    file: path.join(rootDir, 'backend/AGENTS.md'),
    required: [
      '../docs/knowledge/system-overview.md',
      '../docs/knowledge/backend-architecture.md',
      '../docs/knowledge/runbooks.md',
      '../docs/knowledge/troubleshooting.md',
      '../docs/knowledge/feedback-loop.md',
      '../PLANS.md'
    ]
  }
];

const violations = [];

for (const check of checks) {
  if (!fs.existsSync(check.file)) {
    violations.push(`[missing-file] ${path.relative(rootDir, check.file)}`);
    continue;
  }

  const content = fs.readFileSync(check.file, 'utf8');
  for (const token of check.required) {
    if (!content.includes(token)) {
      violations.push(`[missing-token] ${path.relative(rootDir, check.file)} must include: ${token}`);
    }
  }
}

if (violations.length > 0) {
  console.error('AGENTS docs guardrail failed:');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log('AGENTS docs guardrail passed');
