import { expect, test } from '@playwright/test';

const backendBaseUrl = process.env.BACKEND_BASE_URL ?? 'http://localhost:8000';

test('homepage is reachable and renders brand content', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.ok()).toBeTruthy();
  await expect(page.getByText(/ImUsum/i).first()).toBeVisible();
});

test('login page renders auth form controls', async ({ page }) => {
  const response = await page.goto('/login');
  expect(response?.ok()).toBeTruthy();

  await expect(page.locator('#email')).toBeVisible();
  await expect(page.locator('#password')).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toBeVisible();
});

test('backend health endpoint is healthy', async ({ request }) => {
  const response = await request.get(`${backendBaseUrl}/health`);
  expect(response.ok()).toBeTruthy();

  const payload = await response.json();
  expect(payload).toMatchObject({
    status: 'healthy',
  });
});
