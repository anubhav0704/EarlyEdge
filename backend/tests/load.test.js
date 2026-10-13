/**
 * LOAD & PERFORMANCE TESTS (Autocannon)
 * Measures: requests/sec, latency percentiles, error rate, and throughput
 * under concurrent load for the most critical EarlyEdge endpoints.
 *
 * Run directly: node --experimental-vm-modules backend/tests/load.test.js
 */
import { createRequire } from 'module';
import http from 'http';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const require = createRequire(import.meta.url);
const autocannon = require('autocannon');

const MONGO_URI = process.env.MONGO_TEST_URI || 'mongodb://127.0.0.1:27017/earlyedge_loadtest';
const TEST_PORT = 5099;

// ── Thresholds ────────────────────────────────────────────────────────────────
const THRESHOLDS = {
  minRPS: 50,          // Minimum acceptable requests/sec
  maxP99Latency: 500,  // Max 99th percentile latency in ms
  maxErrorRate: 0.05   // Max 5% error rate
};

let server;
let authToken = '';

// ── Utility: format autocannon result ────────────────────────────────────────
function printResult(title, result) {
  const rps = result.requests.average;
  const p99 = result.latency.p99;
  const errors = result.errors;
  const total = result.requests.total;
  const errorRate = errors / (total || 1);

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  📊 ${title}`);
  console.log(`${'─'.repeat(60)}`);
  console.log(`  Requests/sec (avg):  ${rps.toFixed(1)}`);
  console.log(`  Throughput:          ${(result.throughput.average / 1024).toFixed(1)} KB/s`);
  console.log(`  Latency P50:         ${result.latency.p50} ms`);
  console.log(`  Latency P95:         ${result.latency.p95} ms`);
  console.log(`  Latency P99:         ${p99} ms`);
  console.log(`  Total Requests:      ${total}`);
  console.log(`  Errors:              ${errors} (${(errorRate * 100).toFixed(1)}%)`);
  console.log(`${'─'.repeat(60)}`);

  // Assert thresholds
  const failures = [];
  if (rps < THRESHOLDS.minRPS) failures.push(`RPS ${rps.toFixed(1)} < min ${THRESHOLDS.minRPS}`);
  if (p99 > THRESHOLDS.maxP99Latency) failures.push(`P99 ${p99}ms > max ${THRESHOLDS.maxP99Latency}ms`);
  if (errorRate > THRESHOLDS.maxErrorRate) failures.push(`Error rate ${(errorRate * 100).toFixed(1)}% > max ${THRESHOLDS.maxErrorRate * 100}%`);

  if (failures.length === 0) {
    console.log(`  ✅ PASS — all thresholds met`);
  } else {
    console.log(`  ❌ FAIL:`);
    failures.forEach(f => console.log(`     • ${f}`));
    process.exitCode = 1;
  }
  console.log(`${'═'.repeat(60)}\n`);
}

async function runCannonTest({ title, url, method = 'GET', body, headers = {}, duration = 10, connections = 50 }) {
  return new Promise((resolve, reject) => {
    const opts = {
      url,
      method,
      connections,
      duration,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    if (body) opts.body = JSON.stringify(body);

    autocannon(opts, (err, result) => {
      if (err) return reject(err);
      printResult(title, result);
      resolve(result);
    });
  });
}

async function bootstrapServer() {
  await mongoose.connect(MONGO_URI);
  const { default: authRoutes } = await import('../routes/auth.js');
  const { default: jobRoutes }  = await import('../routes/jobs.js');

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '15mb' }));
  app.use('/api/auth', authRoutes);
  app.use('/api/jobs', jobRoutes);
  app.get('/health', (_req, res) => res.json({ ok: true }));

  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(TEST_PORT, () => resolve());
  });
}

async function createTestUser() {
  // Clean slate
  const collections = mongoose.connection.collections;
  for (const key in collections) await collections[key].deleteMany({});

  const res = await fetch(`http://localhost:${TEST_PORT}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Load Tester', email: 'load@test.com', password: 'loadpass',
      role: 'student', university: 'Test U'
    })
  });
  const data = await res.json();
  authToken = data.token || '';
  console.log(`\n🔑 Test user created. Token acquired: ${authToken ? 'YES' : 'FAILED'}`);
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🚀 EarlyEdge Load & Performance Test Suite');
  console.log('='.repeat(60));
  console.log(`Target: http://localhost:${TEST_PORT}`);
  console.log(`Thresholds: ≥${THRESHOLDS.minRPS} RPS | P99 ≤${THRESHOLDS.maxP99Latency}ms | Error ≤${THRESHOLDS.maxErrorRate * 100}%`);

  await bootstrapServer();
  await createTestUser();

  const BASE = `http://localhost:${TEST_PORT}`;
  const AUTH_HEADER = { Authorization: `Bearer ${authToken}` };

  // ── TEST 1: Health / No-DB endpoint ─────────────────────────────────────
  await runCannonTest({
    title: 'HEALTH ENDPOINT (no DB) — 100 concurrent',
    url: `${BASE}/health`,
    connections: 100,
    duration: 8
  });

  // ── TEST 2: Login endpoint under high load ────────────────────────────────
  await runCannonTest({
    title: 'POST /api/auth/login — 50 concurrent, 10s',
    url: `${BASE}/api/auth/login`,
    method: 'POST',
    body: { email: 'load@test.com', password: 'loadpass' },
    connections: 50,
    duration: 10
  });

  // ── TEST 3: Authenticated GET /me endpoint ────────────────────────────────
  await runCannonTest({
    title: 'GET /api/auth/me (JWT auth) — 50 concurrent, 10s',
    url: `${BASE}/api/auth/me`,
    method: 'GET',
    headers: AUTH_HEADER,
    connections: 50,
    duration: 10
  });

  // ── TEST 4: Public job listings (DB read) ─────────────────────────────────
  await runCannonTest({
    title: 'GET /api/jobs (DB read) — 50 concurrent, 10s',
    url: `${BASE}/api/jobs`,
    method: 'GET',
    headers: AUTH_HEADER,
    connections: 50,
    duration: 10
  });

  // ── TEST 5: Signup under concurrent load (DB write) ───────────────────────
  let counter = 0;
  console.log('\n  [INFO] Running signup load test with unique emails...');
  const results = await Promise.all(
    Array.from({ length: 20 }, async (_, i) => {
      const r = await fetch(`${BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `BulkUser${i}`, email: `bulk${i}_${Date.now()}@test.com`,
          password: 'bulkpass', role: 'student'
        })
      });
      if (r.ok) counter++;
    })
  );
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  📊 CONCURRENT SIGNUP STRESS TEST (20 parallel)`);
  console.log(`${'─'.repeat(60)}`);
  console.log(`  Successful signups: ${counter}/20`);
  console.log(counter === 20 ? `  ✅ PASS` : `  ❌ FAIL — ${20 - counter} signups failed`);
  console.log(`${'═'.repeat(60)}\n`);
  if (counter !== 20) process.exitCode = 1;

  server.close();
  await mongoose.connection.close();

  console.log('\n✅ Load testing complete.\n');
}

main().catch((err) => {
  console.error('Load test error:', err);
  process.exit(1);
});
