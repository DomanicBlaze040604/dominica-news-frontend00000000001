#!/usr/bin/env node

/**
 * Production deployment script
 * Validates environment, builds, and deploys the application
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function runCommand(command, description) {
  log(`\n🔄 ${description}...`, 'blue');
  try {
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} completed successfully`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description} failed`, 'red');
    console.error(error.message);
    return false;
  }
}

function checkPrerequisites() {
  log('\n📋 Checking prerequisites...', 'cyan');
  
  const requiredFiles = [
    'package.json',
    '.env.production',
    'Dockerfile',
    'nginx.conf'
  ];
  
  for (const file of requiredFiles) {
    if (!existsSync(file)) {
      log(`❌ Missing required file: ${file}`, 'red');
      return false;
    }
  }
  
  log('✅ All required files present', 'green');
  return true;
}

async function main() {
  const args = process.argv.slice(2);
  const environment = args[0] || 'production';
  const skipTests = args.includes('--skip-tests');
  const skipBuild = args.includes('--skip-build');
  
  log('🚀 Starting deployment process...', 'magenta');
  log(`📦 Environment: ${environment}`, 'cyan');
  
  // Step 1: Check prerequisites
  if (!checkPrerequisites()) {
    process.exit(1);
  }
  
  // Step 2: Validate environment configuration
  if (!runCommand('npm run validate:env', 'Environment validation')) {
    process.exit(1);
  }
  
  // Step 3: Type checking
  if (!runCommand('npm run type-check', 'TypeScript type checking')) {
    process.exit(1);
  }
  
  // Step 4: Linting
  if (!runCommand('npm run lint', 'Code linting')) {
    log('⚠️  Linting issues found, but continuing...', 'yellow');
  }
  
  // Step 5: Build validation
  if (!skipBuild) {
    if (!runCommand('npm run validate:build', 'Build validation')) {
      log('⚠️  Build validation issues found, but continuing...', 'yellow');
    }
  }
  
  // Step 6: Production build
  if (!skipBuild) {
    if (!runCommand('npm run build', 'Production build')) {
      process.exit(1);
    }
  }
  
  // Step 7: Build Docker image
  const dockerTag = `dominica-news-frontend:${environment}`;
  if (!runCommand(`docker build -t ${dockerTag} .`, 'Docker image build')) {
    process.exit(1);
  }
  
  // Step 8: Test Docker container (optional)
  if (!skipTests) {
    log('\n🧪 Testing Docker container...', 'blue');
    try {
      // Start container in background
      execSync(`docker run -d --name test-container -p 3001:80 ${dockerTag}`, { stdio: 'pipe' });
      
      // Wait a moment for container to start
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Test if container is responding
      try {
        execSync('curl -f http://localhost:3001', { stdio: 'pipe' });
        log('✅ Container test passed', 'green');
      } catch {
        log('⚠️  Container test failed, but continuing...', 'yellow');
      }
      
      // Clean up test container
      execSync('docker stop test-container && docker rm test-container', { stdio: 'pipe' });
    } catch (error) {
      log('⚠️  Container testing skipped due to error', 'yellow');
    }
  }
  
  // Step 9: Deployment instructions
  log('\n🎉 Build completed successfully!', 'green');
  log('\n📋 Next steps for deployment:', 'cyan');
  log(`   1. Push Docker image: docker push ${dockerTag}`, 'blue');
  log('   2. Deploy to your hosting platform', 'blue');
  log('   3. Update environment variables on the platform', 'blue');
  log('   4. Verify deployment health', 'blue');
  
  // Platform-specific deployment commands
  if (environment === 'production') {
    log('\n🚢 Railway deployment commands:', 'cyan');
    log('   railway login', 'blue');
    log('   railway link', 'blue');
    log('   railway up', 'blue');
  }
  
  log('\n✨ Deployment preparation complete!', 'magenta');
}

main().catch(error => {
  log(`❌ Deployment failed: ${error.message}`, 'red');
  process.exit(1);
});