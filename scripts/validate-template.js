#!/usr/bin/env node
/**
 * Railway Template Validation Script
 * Validates the template configuration before deployment
 */

import fs from 'fs';
import path from 'path';

const REQUIRED_FILES = [
  'railway.json',
  'railway.template.json',
  'Dockerfile.railway',
  'README.md'
];

const REQUIRED_ENV_VARS = [
  'ANTHROPIC_API_KEY'
];

const OPTIONAL_ENV_VARS = [
  'ANTHROPIC_BASE_URL',
  'ANTHROPIC_AUTH_TOKEN',
  'CLAUDE_CODE_OAUTH_TOKEN',
  'ASSISTANT_NAME',
  'ASSISTANT_HAS_OWN_NUMBER',
  'CONTAINER_IMAGE',
  'CONTAINER_TIMEOUT',
  'MAX_CONCURRENT_CONTAINERS',
  'IDLE_TIMEOUT',
  'LOG_LEVEL',
  'TZ'
];

function validateFiles() {
  console.log('Checking required files...\n');
  let allExist = true;
  
  for (const file of REQUIRED_FILES) {
    const exists = fs.existsSync(file);
    const status = exists ? '✓' : '✗';
    console.log(`  ${status} ${file}`);
    if (!exists) allExist = false;
  }
  
  return allExist;
}

function validateTemplateJson() {
  console.log('\nValidating railway.template.json...\n');
  
  const content = fs.readFileSync('railway.template.json', 'utf-8');
  const template = JSON.parse(content);
  
  // Check required fields
  const requiredFields = ['name', 'description', 'repository', 'env'];
  for (const field of requiredFields) {
    if (!template[field]) {
      console.log(`  ✗ Missing required field: ${field}`);
      return false;
    }
    console.log(`  ✓ ${field}: ${template[field]}`);
  }
  
  // Check environment variables
  console.log('\nChecking environment variables...\n');
  const envVars = template.env || {};
  
  for (const varName of REQUIRED_ENV_VARS) {
    if (!envVars[varName]) {
      console.log(`  ✗ Missing required env var: ${varName}`);
      return false;
    }
    const required = envVars[varName].required;
    console.log(`  ✓ ${varName} (required: ${required})`);
  }
  
  for (const varName of OPTIONAL_ENV_VARS) {
    if (envVars[varName]) {
      console.log(`  ✓ ${varName} (optional)`);
    }
  }
  
  return true;
}

function validateDockerfile() {
  console.log('\nValidating Dockerfile.railway...\n');
  
  const content = fs.readFileSync('Dockerfile.railway', 'utf-8');
  
  const checks = [
    { pattern: /FROM.*node/, name: 'Node.js base image' },
    { pattern: /npm ci|npm install/, name: 'npm install step' },
    { pattern: /npm run build/, name: 'Build step' },
    { pattern: /npm run start|CMD.*\[.*npm.*start.*\]/, name: 'Start command' }
  ];
  
  let allPass = true;
  for (const check of checks) {
    const pass = check.pattern.test(content);
    const status = pass ? '✓' : '✗';
    console.log(`  ${status} ${check.name}`);
    if (!pass) allPass = false;
  }
  
  return allPass;
}

function main() {
  console.log('=== NanoClaw Railway Template Validator ===\n');
  
  const checks = [
    { name: 'Files', fn: validateFiles },
    { name: 'Template JSON', fn: validateTemplateJson },
    { name: 'Dockerfile', fn: validateDockerfile }
  ];
  
  let allPass = true;
  for (const check of checks) {
    try {
      const pass = check.fn();
      if (!pass) allPass = false;
    } catch (err) {
      console.log(`\n✗ ${check.name} validation failed: ${err.message}`);
      allPass = false;
    }
  }
  
  console.log('\n=== Validation Summary ===\n');
  if (allPass) {
    console.log('✓ All checks passed! Template is ready for Railway.');
    process.exit(0);
  } else {
    console.log('✗ Some checks failed. Please fix the issues above.');
    process.exit(1);
  }
}

main();
