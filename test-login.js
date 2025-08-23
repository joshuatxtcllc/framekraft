const fetch = require('node-fetch');

async function testLogin() {
  try {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@framecraft.com',
        password: 'FrameCraft2024!'
      })
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.headers.get('set-cookie')) {
      console.log('Cookies set:', response.headers.get('set-cookie'));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testLogin();