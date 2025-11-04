/**
 * Deployment configuration for different environments
 */

const deploymentConfig = {
  development: {
    apiUrl: 'http://localhost:8080/api',
    buildCommand: 'npm run build:dev',
    outputDir: 'dist',
    publicPath: '/',
    sourcemap: true,
    minify: false,
    optimization: false
  },
  
  staging: {
    apiUrl: 'https://staging-api.dominica-news.com/api',
    buildCommand: 'npm run build',
    outputDir: 'dist',
    publicPath: '/',
    sourcemap: 'hidden',
    minify: true,
    optimization: true,
    environmentChecks: true
  },
  
  production: {
    apiUrl: 'https://web-production-af44.up.railway.app/api',
    buildCommand: 'npm run build:prod',
    outputDir: 'dist',
    publicPath: '/',
    sourcemap: 'hidden',
    minify: true,
    optimization: true,
    environmentChecks: true,
    performanceChecks: true,
    securityHeaders: true
  }
};

// Validation function
function validateDeploymentConfig(env) {
  const config = deploymentConfig[env];
  if (!config) {
    throw new Error(`Invalid environment: ${env}`);
  }
  
  const required = ['apiUrl', 'buildCommand', 'outputDir'];
  for (const field of required) {
    if (!config[field]) {
      throw new Error(`Missing required field '${field}' for environment '${env}'`);
    }
  }
  
  return config;
}

// Get configuration for environment
function getDeploymentConfig(env = 'production') {
  return validateDeploymentConfig(env);
}

module.exports = {
  deploymentConfig,
  validateDeploymentConfig,
  getDeploymentConfig
};