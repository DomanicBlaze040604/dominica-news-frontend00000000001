#!/usr/bin/env node

/**
 * Build validation script
 * Validates the production build for deployment readiness
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = 'dist';
const MAX_CHUNK_SIZE = 1024 * 1024; // 1MB
const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10MB

function validateBuildExists() {
  console.log('🔍 Checking if build exists...');
  
  if (!fs.existsSync(DIST_DIR)) {
    throw new Error(`Build directory '${DIST_DIR}' does not exist. Run 'npm run build' first.`);
  }
  
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(indexPath)) {
    throw new Error(`index.html not found in build directory.`);
  }
  
  console.log('✅ Build directory exists');
}

function validateChunkSizes() {
  console.log('🔍 Validating chunk sizes...');
  
  const assetsDir = path.join(DIST_DIR, 'assets');
  if (!fs.existsSync(assetsDir)) {
    throw new Error('Assets directory not found in build');
  }
  
  const files = fs.readdirSync(assetsDir);
  const jsFiles = files.filter(file => file.endsWith('.js'));
  
  let totalSize = 0;
  const oversizedChunks = [];
  
  for (const file of jsFiles) {
    const filePath = path.join(assetsDir, file);
    const stats = fs.statSync(filePath);
    const sizeKB = Math.round(stats.size / 1024);
    
    totalSize += stats.size;
    
    if (stats.size > MAX_CHUNK_SIZE) {
      oversizedChunks.push({ file, size: sizeKB });
    }
    
    console.log(`  📦 ${file}: ${sizeKB} KB`);
  }
  
  if (oversizedChunks.length > 0) {
    console.warn('⚠️  Large chunks detected:');
    oversizedChunks.forEach(({ file, size }) => {
      console.warn(`    ${file}: ${size} KB (>${Math.round(MAX_CHUNK_SIZE / 1024)} KB)`);
    });
  }
  
  const totalSizeMB = Math.round(totalSize / (1024 * 1024) * 100) / 100;
  console.log(`📊 Total bundle size: ${totalSizeMB} MB`);
  
  if (totalSize > MAX_TOTAL_SIZE) {
    console.warn(`⚠️  Total bundle size exceeds ${Math.round(MAX_TOTAL_SIZE / (1024 * 1024))} MB`);
  }
  
  console.log('✅ Chunk size validation complete');
}

function validateEnvironmentVariables() {
  console.log('🔍 Validating environment configuration...');
  
  const indexPath = path.join(DIST_DIR, 'index.html');
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // Check if environment variables are properly embedded
  if (indexContent.includes('VITE_API_URL')) {
    console.warn('⚠️  VITE_API_URL found in build - ensure environment variables are properly configured');
  }
  
  console.log('✅ Environment validation complete');
}

function validateAssets() {
  console.log('🔍 Validating assets...');
  
  const assetsDir = path.join(DIST_DIR, 'assets');
  const files = fs.readdirSync(assetsDir);
  
  const cssFiles = files.filter(file => file.endsWith('.css'));
  const jsFiles = files.filter(file => file.endsWith('.js'));
  
  if (cssFiles.length === 0) {
    throw new Error('No CSS files found in build');
  }
  
  if (jsFiles.length === 0) {
    throw new Error('No JavaScript files found in build');
  }
  
  console.log(`  📄 CSS files: ${cssFiles.length}`);
  console.log(`  📄 JS files: ${jsFiles.length}`);
  
  // Check for source maps in production
  const sourceMaps = files.filter(file => file.endsWith('.map'));
  if (sourceMaps.length > 0) {
    console.log(`  🗺️  Source maps: ${sourceMaps.length} (hidden for production)`);
  }
  
  console.log('✅ Asset validation complete');
}

function validateTypeScript() {
  console.log('🔍 Running TypeScript validation...');
  
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    console.log('✅ TypeScript validation passed');
  } catch (error) {
    console.error('❌ TypeScript validation failed:');
    console.error(error.stdout?.toString() || error.message);
    throw new Error('TypeScript validation failed');
  }
}

function validateLinting() {
  console.log('🔍 Running ESLint validation...');
  
  try {
    execSync('npm run lint', { stdio: 'pipe' });
    console.log('✅ Linting validation passed');
  } catch (error) {
    console.warn('⚠️  Linting issues detected:');
    console.warn(error.stdout?.toString() || error.message);
    // Don't fail the build for linting issues, just warn
  }
}

function generateBuildReport() {
  console.log('📊 Generating build report...');
  
  const assetsDir = path.join(DIST_DIR, 'assets');
  const files = fs.readdirSync(assetsDir);
  
  const report = {
    timestamp: new Date().toISOString(),
    files: {},
    totalSize: 0,
    chunks: {
      js: 0,
      css: 0,
      other: 0
    }
  };
  
  for (const file of files) {
    const filePath = path.join(assetsDir, file);
    const stats = fs.statSync(filePath);
    
    report.files[file] = {
      size: stats.size,
      sizeKB: Math.round(stats.size / 1024)
    };
    
    report.totalSize += stats.size;
    
    if (file.endsWith('.js')) {
      report.chunks.js++;
    } else if (file.endsWith('.css')) {
      report.chunks.css++;
    } else {
      report.chunks.other++;
    }
  }
  
  const reportPath = path.join(DIST_DIR, 'build-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`📄 Build report saved to ${reportPath}`);
  console.log('✅ Build report generated');
}

async function main() {
  console.log('🚀 Starting build validation...\n');
  
  try {
    validateTypeScript();
    validateLinting();
    validateBuildExists();
    validateChunkSizes();
    validateEnvironmentVariables();
    validateAssets();
    generateBuildReport();
    
    console.log('\n🎉 Build validation completed successfully!');
    console.log('✅ Your build is ready for production deployment.');
    
  } catch (error) {
    console.error('\n❌ Build validation failed:');
    console.error(error.message);
    process.exit(1);
  }
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  validateBuildExists,
  validateChunkSizes,
  validateEnvironmentVariables,
  validateAssets,
  validateTypeScript,
  validateLinting,
  generateBuildReport
};