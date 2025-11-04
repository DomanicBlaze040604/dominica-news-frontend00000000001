// Test admin endpoints
const testAdminEndpoints = async () => {
  console.log('🔍 Testing admin endpoints...');
  
  const baseUrl = 'https://web-production-af44.up.railway.app/api';
  const endpoints = [
    `${baseUrl}/admin/articles`,
    `${baseUrl}/admin/categories`,
    `${baseUrl}/admin/images`,
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
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.text();
        console.log(`✅ Response: ${data.substring(0, 100)}...`);
      } else {
        const errorText = await response.text();
        console.log(`❌ Error: ${errorText.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`❌ Network Error: ${error.message}`);
    }
  }
  
  // Test with auth token
  console.log('\n🔐 Testing with auth token...');
  try {
    const loginResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@dominicanews.com',
        password: 'Pass@12345'
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      const token = loginData.data?.token;
      
      if (token) {
        console.log('✅ Got auth token, testing admin endpoint...');
        
        const adminResponse = await fetch(`${baseUrl}/admin/articles`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });
        
        console.log(`Admin articles with auth: ${adminResponse.status} ${adminResponse.statusText}`);
        
        if (adminResponse.ok) {
          const data = await adminResponse.text();
          console.log(`✅ Admin Response: ${data.substring(0, 200)}...`);
        } else {
          const errorText = await adminResponse.text();
          console.log(`❌ Admin Error: ${errorText.substring(0, 200)}...`);
        }
      }
    } else {
      console.log('❌ Login failed');
    }
  } catch (error) {
    console.log(`❌ Auth test error: ${error.message}`);
  }
};

testAdminEndpoints();