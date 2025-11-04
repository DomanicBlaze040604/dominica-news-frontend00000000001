/**
 * Environment validation script
 * Validates environment configuration for different environments
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// Environment files to validate
const envFiles = [
  '.env',
  '.env.development',
  '.env.production',
  '.env.staging'
];

// Required variables for each environment
const requiredVars = {
  production: [
    'VITE_API_URL',
    'VITE_ENVIRONMENT',
    'VITE_SITE_URL',
    'VITE_SITE_NAME'
  ],
  development: [
    'VITE_API_URL',
    'VITE_ENVIRONMENT'
  ],
  staging: [
    'VITE_API_URL',
    'VITE_ENVIRONMENT',
    'VITE_SITE_URL'
  ]
};

// Feature flags that should be set correctly per environment
const featureFlagValidation = {
  production: {
    VITE_DEBUG_MODE: 'false',
    VITE_ANALYTICS: 'true',
    VITE_ERROR_REPORTING: 'true',
    VITE_DEV_TOOLS: 'false',
    VITE_CONSOLE_LOGS: 'false'
  },
  development: {
    VITE_DEBUG_MODE: 'true',
    VITE_ANALYTICS: 'false',
    VITE_ERROR_REPORTING: 'false',
    VITE_DEV_TOOLS: 'true',
    VITE_CONSOLE_LOGS: 'true'
  },
  staging: {
    VITE_DEBUG_MODE: 'false',
    VITE_ANALYTICS: 'false',
    VITE_ERROR_REPORTING: 'true',
    VITE_DEV_TOOLS: 'false',
    VITE_CONSOLE_LOGS: 'false'
  }
};

/**
 * Parse environment file
 */
function parseEnvFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    const vars = {};
    
    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          vars[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    
    return vars;
  } catch (error) {
    console.warn(`Warning: Could not read ${filePath}:`, error.message);
    return {};
  }
}

/**
 * Validate environment file
 */
function validateEnvFile(filePath, envVars) {
  console.log(`\n📋 Validating ${filePath}:`);
  
  const environment = envVars.VITE_ENVIRONMENT;
  if (!environment) {
    console.error('  ❌ Missing VITE_ENVIRONMENT');
    return false;
  }
  
  console.log(`  🏷️  Environment: ${environment}`);
  
  let isValid = true;
  
  // Check required variables
  const required = requiredVars[environment] || [];
  required.forEach(varName => {
    if (!envVars[varName]) {
      console.error(`  ❌ Missing required variable: ${varName}`);
      isValid = false;
    } else {
      console.log(`  ✅ ${varName}: ${envVars[varName]}`);
    }
  });
  
  // Check feature flags
  const expectedFlags = featureFlagValidation[environment] || {};
  Object.entries(expectedFlags).forEach(([flag, expectedValue]) => {
    const actualValue = envVars[flag];
    if (actualValue !== expectedValue) {
      console.warn(`  ⚠️  ${flag}: expected "${expectedValue}", got "${actualValue}"`);
    } else {
      console.log(`  ✅ ${flag}: ${actualValue}`);
    }
  });
  
  // Validate URLs
  if (envVars.VITE_API_URL) {
    try {
      new URL(envVars.VITE_API_URL);
      console.log(`  ✅ API URL format is valid`);
    } catch {
      console.error(`  ❌ Invalid API URL format: ${envVars.VITE_API_URL}`);
      isValid = false;
    }
  }
  
  if (envVars.VITE_SITE_URL) {
    try {
      new URL(envVars.VITE_SITE_URL);
      console.log(`  ✅ Site URL format is valid`);
    } catch {
      console.error(`  ❌ Invalid Site URL format: ${envVars.VITE_SITE_URL}`);
      isValid = false;
    }
  }
  
  return isValid;
}

/**
 * Main validation function
 */
function main() {
  console.log('🔍 Environment Configuration Validation\n');
  
  let allValid = true;
  
  envFiles.forEach(file => {
    const filePath = join(process.cwd(), file);
    const envVars = parseEnvFile(filePath);
    
    if (Object.keys(envVars).length === 0) {
      console.log(`\n📋 ${file}: File not found or empty`);
      return;
    }
    
    const isValid = validateEnvFile(file, envVars);
    if (!isValid) {
      allValid = false;
    }
  });
  
  console.log('\n' + '='.repeat(50));
  if (allValid) {
    console.log('✅ All environment configurations are valid!');
    process.exit(0);
  } else {
    console.log('❌ Some environment configurations have issues.');
    process.exit(1);
  }
}

main();