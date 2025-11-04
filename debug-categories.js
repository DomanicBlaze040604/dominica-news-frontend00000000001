// Debug categories response format
const debugCategories = async () => {
  console.log('🔍 Debugging categories response format...');
  
  const baseUrl = 'https://web-production-af44.up.railway.app/api';
  
  try {
    // Test public categories endpoint
    console.log('\n📡 Testing public categories endpoint...');
    const publicResponse = await fetch(`${baseUrl}/categories`);
    const publicData = await publicResponse.json();
    
    console.log('Public categories response:');
    console.log('Status:', publicResponse.status);
    console.log('Data structure:', JSON.stringify(publicData, null, 2));
    console.log('Categories count:', publicData.data?.length || 'No length property');
    
    // Test admin categories endpoint with auth
    console.log('\n🔐 Testing admin categories endpoint...');
    
    // First login to get token
    const loginResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@dominicanews.com',
        password: 'Pass@12345'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (loginData.success && loginData.data.token) {
      const token = loginData.data.token;
      console.log('✅ Login successful, testing admin endpoint...');
      
      const adminResponse = await fetch(`${baseUrl}/admin/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const adminData = await adminResponse.json();
      
      console.log('Admin categories response:');
      console.log('Status:', adminResponse.status);
      console.log('Data structure:', JSON.stringify(adminData, null, 2));
      console.log('Categories count:', adminData.data?.length || 'No length property');
      
      // Compare the two responses
      console.log('\n🔍 COMPARISON:');
      console.log('Public endpoint count:', publicData.data?.length || 0);
      console.log('Admin endpoint count:', adminData.data?.length || 0);
      
      if (publicData.data?.length !== adminData.data?.length) {
        console.log('⚠️ Different counts between public and admin endpoints!');
      }
      
    } else {
      console.log('❌ Login failed:', loginData.message);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
};

debugCategories();