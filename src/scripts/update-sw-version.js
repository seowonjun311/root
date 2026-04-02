#!/usr/bin/env node
/* eslint-disable */

/**
 * Service Worker Version Automation Script
 * Automatically increments Service Worker cache version on build
 * Prevents stale assets from being served to users
 * 
 * Usage:
 *   node scripts/update-sw-version.js
 * 
 * Add to package.json:
 *   "prebuild": "node scripts/update-sw-version.js"
 */

const fs = require('fs');
const path = require('path');

const swPath = path.join(__dirname, '..', 'public', 'service-worker.js');
const versionFilePath = path.join(__dirname, '..', '.swversion');

/**
 * Parse semantic version string
 */
function parseVersion(versionStr) {
  const match = versionStr.match(/v(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

/**
 * Format version object to string
 */
function formatVersion(vObj) {
  return `v${vObj.major}.${vObj.minor}.${vObj.patch}`;
}

/**
 * Increment patch version (minor bumps on significant changes)
 */
function incrementVersion(current) {
  return {
    major: current.major,
    minor: current.minor,
    patch: current.patch + 1,
  };
}

/**
 * Read current version from Service Worker
 */
function readCurrentVersion() {
  try {
    const content = fs.readFileSync(swPath, 'utf8');
    const match = content.match(/const CACHE_VERSION = ['"]([^'"]+)['"]/);
    return match ? match[1] : 'v1.0.0';
  } catch (error) {
    console.warn('⚠️  Could not read Service Worker, using default v1.0.0');
    return 'v1.0.0';
  }
}

/**
 * Update Service Worker with new version
 */
function updateServiceWorker(oldVersion, newVersion) {
  let content = fs.readFileSync(swPath, 'utf8');
  content = content.replace(
    `const CACHE_VERSION = '${oldVersion}'`,
    `const CACHE_VERSION = '${newVersion}'`
  );
  fs.writeFileSync(swPath, content, 'utf8');
}

/**
 * Log version update with timestamp
 */
function logVersionUpdate(oldVersion, newVersion) {
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} - Updated: ${oldVersion} → ${newVersion}\n`;
  
  try {
    fs.appendFileSync(versionFilePath, logEntry, 'utf8');
  } catch (error) {
    console.warn('⚠️  Could not write version log');
  }
}

/**
 * Main execution
 */
function main() {
  if (!fs.existsSync(swPath)) {
    console.error('❌ Service Worker not found at:', swPath);
    process.exit(1);
  }

  const currentVersion = readCurrentVersion();
  const parsed = parseVersion(currentVersion);

  if (!parsed) {
    console.error('❌ Invalid version format in Service Worker:', currentVersion);
    console.error('   Expected format: v1.0.0');
    process.exit(1);
  }

  const newVersion = formatVersion(incrementVersion(parsed));

  console.log(`🔄 Service Worker Version Update`);
  console.log(`   Old: ${currentVersion}`);
  console.log(`   New: ${newVersion}`);

  try {
    updateServiceWorker(currentVersion, newVersion);
    logVersionUpdate(currentVersion, newVersion);
    console.log(`✅ Service Worker updated successfully`);
    console.log(`   Cache will be invalidated on next deployment`);
  } catch (error) {
    console.error('❌ Failed to update Service Worker:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { readCurrentVersion, updateServiceWorker, parseVersion, formatVersion };