const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:8000/api/v1';

async function run() {
  const email = `test_integration_${Date.now()}@example.com`;
  const password = 'StrongPassword123!';

  console.log('1. Registering user...');
  const registerResponse = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      first_name: 'Integration',
      last_name: 'Tester',
    }),
  });

  if (!registerResponse.ok) {
    throw new Error(`Registration failed: ${registerResponse.status} ${await registerResponse.text()}`);
  }

  const registerData = (await registerResponse.json()) as { access_token: string };

  console.log('2. Logging in...');
  const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!loginResponse.ok) {
    throw new Error(`Login failed: ${loginResponse.status} ${await loginResponse.text()}`);
  }

  console.log('3. Getting profile...');
  const meResponse = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${registerData.access_token}` },
  });

  if (!meResponse.ok) {
    throw new Error(`Get profile failed: ${meResponse.status} ${await meResponse.text()}`);
  }

  console.log('4. Stability smoke...');
  for (let i = 0; i < 5; i += 1) {
    const response = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${registerData.access_token}` },
    });
    if (!response.ok) {
      throw new Error(`Stability check failed on request ${i + 1}`);
    }
  }

  console.log('ALL INTEGRATION CHECKS PASSED');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
