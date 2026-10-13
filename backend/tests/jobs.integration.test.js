/**
 * INTEGRATION TESTS — Jobs & Applications Routes
 * Tests job CRUD, application submission, and recruiter analytics.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { connectDB, clearDB, closeDB, buildTestApp } from './setup.js';

let app;
let recruiterToken, studentToken;
let jobId;

const createRecruiter = () => request(app).post('/api/auth/signup').send({
  name: 'HR Manager', email: 'hr@company.com', password: 'hrpass123',
  role: 'recruiter', company: 'ACME Corp'
});

const createStudent = () => request(app).post('/api/auth/signup').send({
  name: 'Job Seeker', email: 'jobseeker@test.com', password: 'seekpass',
  role: 'student', university: 'IIT Delhi', stream: 'B.Tech', branch: 'CSE'
});

test.before(async () => {
  await connectDB();
  app = await buildTestApp();
  const r = await createRecruiter();
  const s = await createStudent();
  recruiterToken = r.body.token;
  studentToken = s.body.token;
});

test.after(async () => {
  await clearDB();
  await closeDB();
});

// ─────────────────────────────────────────────────────────────────────────────
// Job CRUD
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Job Posting (Recruiter)', () => {
  test('recruiter can post a job listing', async () => {
    const res = await request(app).post('/api/jobs').send({
      title: 'Backend Engineer',
      company: 'ACME Corp',
      description: 'Build scalable APIs',
      techStack: ['Node.js', 'MongoDB'],
      location: 'Remote',
      salary: '12 LPA',
      jobType: 'full-time',
      minTQScore: 600
    }).set('Authorization', `Bearer ${recruiterToken}`);

    assert.equal(res.status, 201);
    assert.ok(res.body.job._id);
    jobId = res.body.job._id;
  });

  test('student cannot post a job (403)', async () => {
    const res = await request(app).post('/api/jobs').send({
      title: 'Fake Job', company: 'Fake Co', description: '...'
    }).set('Authorization', `Bearer ${studentToken}`);
    assert.equal(res.status, 403);
  });

  test('unauthenticated user cannot post a job (401)', async () => {
    const res = await request(app).post('/api/jobs').send({
      title: 'No Auth Job', company: 'X', description: '...'
    });
    assert.equal(res.status, 401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Job Listing
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Job Listings (Student)', () => {
  test('student can browse all active job listings', async () => {
    const res = await request(app).get('/api/jobs')
      .set('Authorization', `Bearer ${studentToken}`);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.jobs));
    assert.ok(res.body.jobs.length >= 1);
  });

  test('returns correct job details by ID', async () => {
    const res = await request(app).get(`/api/jobs/${jobId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.job.title, 'Backend Engineer');
    assert.equal(res.body.job.company, 'ACME Corp');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Job Applications
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Job Applications', () => {
  test('student can apply to a job', async () => {
    const res = await request(app)
      .post(`/api/jobs/${jobId}/apply`)
      .set('Authorization', `Bearer ${studentToken}`);
    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
  });

  test('student cannot apply to the same job twice', async () => {
    const res = await request(app)
      .post(`/api/jobs/${jobId}/apply`)
      .set('Authorization', `Bearer ${studentToken}`);
    assert.notEqual(res.status, 201);
  });

  test('student can view their own applications', async () => {
    const res = await request(app).get('/api/jobs/applications/me')
      .set('Authorization', `Bearer ${studentToken}`);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.applications));
    assert.ok(res.body.applications.length >= 1);
  });

  test('recruiter can view applicants for their job', async () => {
    const res = await request(app).get(`/api/jobs/${jobId}/applicants`)
      .set('Authorization', `Bearer ${recruiterToken}`);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.applicants));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Job Management
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Job Management (Recruiter)', () => {
  test('recruiter can update their job listing', async () => {
    const res = await request(app).put(`/api/jobs/${jobId}`).send({
      salary: '15 LPA'
    }).set('Authorization', `Bearer ${recruiterToken}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.job.salary, '15 LPA');
  });

  test('recruiter can delete their job listing', async () => {
    const res = await request(app).delete(`/api/jobs/${jobId}`)
      .set('Authorization', `Bearer ${recruiterToken}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });
});
