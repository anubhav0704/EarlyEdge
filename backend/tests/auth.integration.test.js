/**
 * INTEGRATION TESTS — Auth Routes
 * Tests every public and protected auth endpoint end-to-end
 * using supertest against a live test MongoDB instance.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { connectDB, clearDB, closeDB, buildTestApp } from './setup.js';

let app;

test.before(async () => {
  await connectDB();
  app = await buildTestApp();
});

test.afterEach(async () => {
  await clearDB();
});

test.after(async () => {
  await closeDB();
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/signup
// ─────────────────────────────────────────────────────────────────────────────
test.describe('POST /api/auth/signup', () => {
  test('registers a new student and returns JWT', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      name: 'Anubhav Student',
      email: 'student@earlyedge.io',
      password: 'password123',
      role: 'student',
      university: 'IIT Bombay',
      stream: 'B.Tech',
      branch: 'CSE'
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.token, 'JWT token should be returned');
    assert.equal(res.body.user.role, 'student');
    assert.equal(res.body.user.email, 'student@earlyedge.io');
  });

  test('registers a new recruiter and auto-verifies them', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      name: 'TechCorp Recruiter',
      email: 'hr@techcorp.com',
      password: 'secure_pass',
      role: 'recruiter',
      company: 'TechCorp'
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.user.role, 'recruiter');
    assert.equal(res.body.user.isVerified, true, 'Recruiters must be auto-verified');
  });

  test('rejects duplicate email registration', async () => {
    const payload = {
      name: 'Dup User', email: 'dup@test.com', password: 'pass123', role: 'student'
    };
    await request(app).post('/api/auth/signup').send(payload);
    const res = await request(app).post('/api/auth/signup').send(payload);
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  test('rejects signup with missing name', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      email: 'noname@test.com', password: 'pass123', role: 'student'
    });
    assert.notEqual(res.status, 201);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
test.describe('POST /api/auth/login', () => {
  test('logs in with correct credentials and returns JWT', async () => {
    await request(app).post('/api/auth/signup').send({
      name: 'Login User', email: 'login@test.com', password: 'mypassword', role: 'student'
    });
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@test.com', password: 'mypassword'
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.token);
  });

  test('rejects wrong password with 401', async () => {
    await request(app).post('/api/auth/signup').send({
      name: 'Secure User', email: 'secure@test.com', password: 'correct_pass', role: 'student'
    });
    const res = await request(app).post('/api/auth/login').send({
      email: 'secure@test.com', password: 'wrong_pass'
    });
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('rejects non-existent user with 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@test.com', password: 'anything'
    });
    assert.equal(res.status, 401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me  (Protected)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('GET /api/auth/me', () => {
  test('returns current user profile with valid JWT', async () => {
    const { body: { token } } = await request(app).post('/api/auth/signup').send({
      name: 'Me User', email: 'me@test.com', password: 'mypass', role: 'student'
    });
    const res = await request(app).get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.user.email, 'me@test.com');
    assert.equal(res.body.user.tqScore, 500);
  });

  test('rejects requests without token (401)', async () => {
    const res = await request(app).get('/api/auth/me');
    assert.equal(res.status, 401);
  });

  test('rejects requests with tampered/invalid token (401)', async () => {
    const res = await request(app).get('/api/auth/me')
      .set('Authorization', 'Bearer tampered.invalid.jwt');
    assert.equal(res.status, 401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/auth/profile  (Protected)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('PUT /api/auth/profile', () => {
  test('updates user name and phone number', async () => {
    const { body: { token } } = await request(app).post('/api/auth/signup').send({
      name: 'Old Name', email: 'profile@test.com', password: 'pass123', role: 'student'
    });
    const res = await request(app).put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Name', phoneNumber: '+91 9999999999' });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.name, 'New Name');
    assert.equal(res.body.user.phoneNumber, '+91 9999999999');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/auth/password  (Protected)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('PUT /api/auth/password', () => {
  test('successfully changes password with correct current password', async () => {
    const { body: { token } } = await request(app).post('/api/auth/signup').send({
      name: 'Pass User', email: 'pass@test.com', password: 'oldpass123', role: 'student'
    });
    const res = await request(app).put('/api/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'oldpass123', newPassword: 'newpass456' });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);

    // Verify new password works for login
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'pass@test.com', password: 'newpass456'
    });
    assert.equal(loginRes.status, 200);
  });

  test('rejects password change with wrong current password', async () => {
    const { body: { token } } = await request(app).post('/api/auth/signup').send({
      name: 'Pass Guard', email: 'guard@test.com', password: 'mypass', role: 'student'
    });
    const res = await request(app).put('/api/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'wrongpass', newPassword: 'newpass' });
    assert.equal(res.status, 400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password + reset-password
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Password Reset Flow', () => {
  test('full forgot → reset cycle works correctly', async () => {
    await request(app).post('/api/auth/signup').send({
      name: 'Reset User', email: 'reset@test.com', password: 'originalpass', role: 'student'
    });

    // Step 1: Request reset
    const forgotRes = await request(app).post('/api/auth/forgot-password').send({
      email: 'reset@test.com'
    });
    assert.equal(forgotRes.status, 200);
    const { resetCode } = forgotRes.body;
    assert.ok(resetCode, 'Reset code must be returned');

    // Step 2: Use the reset code
    const resetRes = await request(app).post('/api/auth/reset-password').send({
      email: 'reset@test.com', resetCode, newPassword: 'brandnewpass'
    });
    assert.equal(resetRes.status, 200);
    assert.equal(resetRes.body.success, true);

    // Step 3: Login with new password
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'reset@test.com', password: 'brandnewpass'
    });
    assert.equal(loginRes.status, 200);
  });

  test('rejects invalid reset code', async () => {
    await request(app).post('/api/auth/signup').send({
      name: 'Bad Reset', email: 'badreset@test.com', password: 'pass', role: 'student'
    });
    await request(app).post('/api/auth/forgot-password').send({ email: 'badreset@test.com' });

    const res = await request(app).post('/api/auth/reset-password').send({
      email: 'badreset@test.com', resetCode: '000000', newPassword: 'newpass123'
    });
    assert.equal(res.status, 400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/google
// ─────────────────────────────────────────────────────────────────────────────
test.describe('POST /api/auth/google', () => {
  test('creates a new user via Google OAuth payload', async () => {
    const res = await request(app).post('/api/auth/google').send({
      name: 'Google User',
      email: 'guser@gmail.com',
      role: 'student',
      googleId: 'google_abc123',
      photoURL: 'https://lh3.googleusercontent.com/photo.jpg'
    });
    assert.equal(res.status, 200);
    assert.ok(res.body.token);
    assert.equal(res.body.user.email, 'guser@gmail.com');
  });

  test('logs in existing user via Google without creating duplicate', async () => {
    const payload = {
      name: 'Google Existing', email: 'gexist@gmail.com', role: 'student', googleId: 'g_exist'
    };
    await request(app).post('/api/auth/google').send(payload);
    const res = await request(app).post('/api/auth/google').send(payload);
    assert.equal(res.status, 200);
    assert.ok(res.body.token);
  });
});
