// Test production backend connection
const testProduction = async () => {
  console.log('🔍 Testing production backend connection...');
  
  const baseUrl = 'https://web-production-af44.up.railway.app/api';
  const endpoints = [
    `${baseUrl}/articles`,
    `${baseUrl}/categories`, 
    `${baseUrl}/settings`,
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Testing: ${endpoint}`);
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log(`✅ Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.text();
        console.log(`📄 Response: ${data.substring(0, 200)}${data.length > 200 ? '...' : ''}`);
      } else {
        const errorText = await response.text();
        console.log(`❌ Error Response: ${errorText.substring(0, 200)}`);
      }
    } catch (error) {
      console.log(`❌ Network Error: ${error.message}`);
    }
  }
};

// Run the test
testProduction();