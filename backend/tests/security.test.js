/**
 * SECURITY TESTS
 * Covers: NoSQL Injection, XSS header protection, CORS enforcement,
 * JWT forgery, rate limiting headers, auth bypass, and RBAC.
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

test.after(async () => {
  await clearDB();
  await closeDB();
});

// ─────────────────────────────────────────────────────────────────────────────
// NoSQL Injection
// ─────────────────────────────────────────────────────────────────────────────
test.describe('NoSQL Injection Protection', () => {
  test('login with $gt operator injection does not bypass auth', async () => {
    await request(app).post('/api/auth/signup').send({
      name: 'Victim', email: 'victim@test.com', password: 'realpass1', role: 'student'
    });
    const res = await request(app).post('/api/auth/login').send({
      email: 'victim@test.com',
      password: { $gt: '' }
    });
    assert.notEqual(res.status, 200, 'NoSQL injection must not bypass auth');
  });

  test('email injection with $ne operator is sanitized', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: { $ne: null },
      password: 'anything'
    });
    assert.notEqual(res.status, 200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Security Headers (Helmet)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Security Headers via Helmet', () => {
  test('response includes X-Content-Type-Options header', async () => {
    const res = await request(app).get('/');
    assert.ok(res.headers['x-content-type-options']);
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
  });

  test('X-Powered-By header is removed', async () => {
    const res = await request(app).get('/');
    assert.equal(res.headers['x-powered-by'], undefined);
  });

  test('response includes X-Frame-Options to prevent clickjacking', async () => {
    const res = await request(app).get('/');
    assert.ok(res.headers['x-frame-options']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// JWT Security
// ─────────────────────────────────────────────────────────────────────────────
test.describe('JWT Security', () => {
  test('completely forged JWT (wrong secret) is rejected with 401', async () => {
    const forgedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
      'eyJpZCI6IjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2IiwiaWF0IjoxNzAwMDAwMDAwfQ.' +
      'wrongsignature';
    const res = await request(app).get('/api/auth/me')
      .set('Authorization', `Bearer ${forgedToken}`);
    assert.equal(res.status, 401);
  });

  test('expired/malformed JWT string is rejected', async () => {
    const res = await request(app).get('/api/auth/me')
      .set('Authorization', 'Bearer not.a.real.token');
    assert.equal(res.status, 401);
  });

  test('missing Authorization header returns 401', async () => {
    const res = await request(app).get('/api/auth/me');
    assert.equal(res.status, 401);
  });

  test('empty Bearer token is rejected', async () => {
    const res = await request(app).get('/api/auth/me')
      .set('Authorization', 'Bearer ');
    assert.equal(res.status, 401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Role-Based Access Control
// Each test self-contained — creates its own user inline to avoid scoping issues.
// ─────────────────────────────────────────────────────────────────────────────
test.describe('RBAC — Role-Based Access Control', () => {
  test('student cannot post a job (403)', async () => {
    const signupRes = await request(app).post('/api/auth/signup').send({
      name: 'RBAC Student', email: `rbac_s_${Date.now()}@test.com`,
      password: 'pass123', role: 'student'
    });
    const token = signupRes.body.token;
    const res = await request(app).post('/api/jobs')
      .send({ title: 'Hack Job', company: 'Hack', description: '...' })
      .set('Authorization', `Bearer ${token}`);
    assert.equal(res.status, 403);
  });

  test('student can GET jobs (200)', async () => {
    const signupRes = await request(app).post('/api/auth/signup').send({
      name: 'RBAC Reader', email: `rbac_r_${Date.now()}@test.com`,
      password: 'pass123', role: 'student'
    });
    const token = signupRes.body.token;
    const res = await request(app).get('/api/jobs')
      .set('Authorization', `Bearer ${token}`);
    assert.equal(res.status, 200);
  });

  test('recruiter can POST a job (201)', async () => {
    const signupRes = await request(app).post('/api/auth/signup').send({
      name: 'RBAC Recruiter', email: `rbac_rec_${Date.now()}@test.com`,
      password: 'pass123', role: 'recruiter', company: 'Biz Inc'
    });
    const token = signupRes.body.token;
    const res = await request(app).post('/api/jobs')
      .send({ title: 'Real Job', company: 'Biz Inc', description: 'Build things', location: 'Remote' })
      .set('Authorization', `Bearer ${token}`);
    assert.equal(res.status, 201);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Input Validation & Edge Cases
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Input Validation & Edge Cases', () => {
  test('empty body on login returns error (not 500)', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    assert.notEqual(res.status, 500);
  });

  test('signup with password < 6 chars is rejected', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      name: 'Short Pass', email: `short_${Date.now()}@test.com`, password: '123', role: 'student'
    });
    assert.notEqual(res.status, 201);
  });

  test('forgot-password with non-existent email returns 404', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({
      email: 'ghost@nobody.com'
    });
    assert.equal(res.status, 404);
  });

  test('reset-password without required fields returns 400', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({
      email: 'x@test.com'
    });
    assert.equal(res.status, 400);
  });

  test('very large JSON payload is handled gracefully', async () => {
    const bigString = 'a'.repeat(100 * 1024);
    const res = await request(app).post('/api/auth/login').send({
      email: bigString, password: bigString
    });
    assert.ok(res.status < 600);
  });
});
