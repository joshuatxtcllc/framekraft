import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

async function testAuth() {
  console.log('Testing authentication endpoints...\n');
  
  try {
    // Test 1: Check auth status without credentials
    console.log('1. Testing /api/auth/user without credentials...');
    try {
      const response = await axios.get(`${API_URL}/auth/user`);
      console.log('   ✅ Success:', response.data);
    } catch (error) {
      console.log('   ❌ Error:', error.response?.status, error.response?.data?.message || error.message);
    }
    
    // Test 2: Login with test credentials
    console.log('\n2. Testing login with test credentials...');
    try {
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: 'test@framecraft.com',
        password: 'Test123!'
      }, {
        withCredentials: true
      });
      console.log('   ✅ Login successful:', loginResponse.data.message);
      
      const accessToken = loginResponse.data.accessToken;
      const cookies = loginResponse.headers['set-cookie'];
      console.log('   Token received:', accessToken ? 'Yes' : 'No');
      
      // Test 3: Check auth status with token
      console.log('\n3. Testing /api/auth/user with credentials...');
      try {
        const authResponse = await axios.get(`${API_URL}/auth/user`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Cookie': cookies ? cookies.join('; ') : ''
          }
        });
        console.log('   ✅ Authenticated user:', authResponse.data.user?.email);
      } catch (error) {
        console.log('   ❌ Error:', error.response?.status, error.response?.data?.message || error.message);
      }
      
      // Test 4: Test pricing structure endpoint
      console.log('\n4. Testing /api/pricing/structure with credentials...');
      try {
        const pricingResponse = await axios.get(`${API_URL}/pricing/structure`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Cookie': cookies ? cookies.join('; ') : ''
          }
        });
        console.log('   ✅ Pricing data received:', Array.isArray(pricingResponse.data) ? `${pricingResponse.data.length} items` : 'Invalid response');
      } catch (error) {
        console.log('   ❌ Error:', error.response?.status, error.response?.data?.message || error.message);
      }
      
      // Test 5: Create a new price structure item
      console.log('\n5. Testing POST /api/pricing/structure...');
      try {
        const newPriceItem = {
          category: 'Frame',
          itemName: 'Test Frame',
          unitType: 'linear_foot',
          basePrice: 10.00,
          markupPercentage: 30,
          retailPrice: 13.00,
          isActive: true
        };
        
        const createResponse = await axios.post(`${API_URL}/pricing/structure`, newPriceItem, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Cookie': cookies ? cookies.join('; ') : ''
          }
        });
        console.log('   ✅ Price item created:', createResponse.data._id ? 'Success' : 'Failed');
      } catch (error) {
        console.log('   ❌ Error:', error.response?.status, error.response?.data?.message || error.message);
      }
      
    } catch (error) {
      console.log('   ❌ Login failed:', error.response?.status, error.response?.data?.message || error.message);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAuth();