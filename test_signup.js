async function testSignup() {
  try {
    const res = await fetch('http://127.0.0.1:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test${Date.now()}@example.com`,
        password: 'password123',
        name: 'Test User'
      })
    });
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      if (res.ok) console.log('Success:', data);
      else console.error('Error JSON:', data);
    } catch (e) {
      console.error('Error Text (status ' + res.status + '):', text);
    }
  } catch (err) {
    console.error('Fetch Error:', err);
  }
}
testSignup();
