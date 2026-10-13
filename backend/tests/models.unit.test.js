/**
 * UNIT TESTS — All Mongoose Models
 * Covers: User, Job, Application, MockTest, Squad, Resume, CoachMemory
 * Each test uses data matching the actual schema required fields.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { connectDB, clearDB, closeDB } from './setup.js';
import User from '../models/User.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import MockTest from '../models/MockTest.js';
import Squad from '../models/Squad.js';
import Resume from '../models/Resume.js';
import CoachMemory from '../models/CoachMemory.js';

test.before(async () => { await connectDB(); });
test.afterEach(async () => { await clearDB(); });
test.after(async () => { await closeDB(); });

// ─────────────────────────────────────────────────────────────────────────────
// USER MODEL
// ─────────────────────────────────────────────────────────────────────────────
test.describe('User Model', () => {
  test('creates a student with correct defaults', async () => {
    const user = await User.create({
      name: 'Alice', email: 'alice@test.com', password: 'pass123', role: 'student'
    });
    assert.equal(user.role, 'student');
    assert.equal(user.tqScore, 500);
    assert.equal(user.isVerified, false);
    assert.equal(user.rank, 1);
    assert.ok(user.createdAt);
  });

  test('hashes password before save (pre-save hook)', async () => {
    const user = await User.create({
      name: 'Bob', email: 'bob@test.com', password: 'plaintext', role: 'student'
    });
    assert.notEqual(user.password, 'plaintext');
    assert.ok(user.password.startsWith('$2'));
  });

  test('comparePassword returns true for correct password', async () => {
    const user = await User.create({
      name: 'Carol', email: 'carol@test.com', password: 'secret123', role: 'student'
    });
    assert.equal(await user.comparePassword('secret123'), true);
    assert.equal(await user.comparePassword('wrong'), false);
  });

  test('email must be unique — duplicate throws', async () => {
    await User.create({ name: 'A', email: 'dup@test.com', password: 'pass123', role: 'student' });
    await assert.rejects(
      () => User.create({ name: 'B', email: 'dup@test.com', password: 'pass123', role: 'student' }),
      (err) => { assert.equal(err.code, 11000); return true; }
    );
  });

  test('email is lowercased and trimmed on save', async () => {
    const user = await User.create({
      name: 'Dan', email: '  DAN@TEST.COM  ', password: 'pass123', role: 'student'
    });
    assert.equal(user.email, 'dan@test.com');
  });

  test('role enum rejects invalid values', async () => {
    await assert.rejects(
      () => User.create({
        name: 'Eve', email: 'eve@test.com', password: 'pass123', role: 'admin'
      })
    );
  });

  test('recruiter has company field', async () => {
    const rec = await User.create({
      name: 'Frank', email: 'frank@corp.com', password: 'pass123', role: 'recruiter', company: 'BigCo'
    });
    assert.equal(rec.company, 'BigCo');
  });

  test('password change triggers re-hash via isModified', async () => {
    const user = await User.create({
      name: 'Grace', email: 'grace@test.com', password: 'initial1', role: 'student'
    });
    const firstHash = user.password;
    // Modify and save directly on the same document
    user.password = 'changed1';
    const savedUser = await user.save();
    assert.notEqual(savedUser.password, firstHash, 'Hash should change');
    assert.notEqual(savedUser.password, 'changed1', 'Password should be hashed, not plain');
    const isCorrect = await savedUser.comparePassword('changed1');
    assert.equal(isCorrect, true, 'comparePassword should match the new password');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// JOB MODEL
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Job Model', () => {
  test('creates a job with required fields', async () => {
    const rec = await User.create({
      name: 'HR', email: 'hr_job@test.com', password: 'pass123', role: 'recruiter', company: 'Tech Inc'
    });
    const job = await Job.create({
      title: 'SDE-1',
      company: 'Tech Inc',
      description: 'Build stuff',
      recruiterId: rec._id,
      location: 'Bangalore'
    });
    assert.equal(job.title, 'SDE-1');
    assert.equal(job.type, 'Full Time');
    assert.equal(job.lockDuration, 20);
    assert.ok(job.createdAt);
  });

  test('job type enum rejects invalid values', async () => {
    const rec = await User.create({
      name: 'HR2', email: 'hr2_job@test.com', password: 'pass123', role: 'recruiter'
    });
    await assert.rejects(
      () => Job.create({
        title: 'Bad', company: 'Co', recruiterId: rec._id, type: 'Permanent'
      })
    );
  });

  test('job defaults views to 0', async () => {
    const rec = await User.create({
      name: 'HR3', email: 'hr3_job@test.com', password: 'pass123', role: 'recruiter'
    });
    const job = await Job.create({
      title: 'DevOps', company: 'Tech Inc', description: 'CI/CD', recruiterId: rec._id
    });
    assert.equal(job.views, 0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// APPLICATION MODEL
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Application Model', () => {
  test('creates application with pending status', async () => {
    const s = await User.create({
      name: 'Applicant', email: 'app@test.com', password: 'pass123', role: 'student'
    });
    const r = await User.create({
      name: 'Rec', email: 'rec@test.com', password: 'pass123', role: 'recruiter'
    });
    const j = await Job.create({
      title: 'Dev', company: 'Co', description: '...', recruiterId: r._id
    });
    const app = await Application.create({
      jobId: j._id,
      jobTitle: 'Dev',
      company: 'Co',
      studentId: s._id,
      studentName: 'Applicant',
      studentEmail: 'app@test.com'
    });
    assert.equal(app.status, 'pending');
    assert.ok(app.appliedAt);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// MOCK TEST MODEL
// ─────────────────────────────────────────────────────────────────────────────
test.describe('MockTest Model', () => {
  test('creates a mock test result record', async () => {
    const u = await User.create({
      name: 'Tester', email: 'tester@test.com', password: 'pass123', role: 'student'
    });
    const mt = await MockTest.create({
      userId: u._id,
      type: 'Skill Test',
      score: 82,
      total: 100,
      accuracy: 82,
      domain: 'Full Stack',
      partAScore: 80,
      partBScore: 75,
      partCScore: 90
    });
    assert.equal(mt.domain, 'Full Stack');
    assert.equal(mt.score, 82);
    assert.equal(mt.total, 100);
    assert.equal(mt.accuracy, 82);
    assert.equal(mt.type, 'Skill Test');
    assert.ok(mt.timestamp);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SQUAD MODEL
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Squad Model', () => {
  test('creates a squad with correct structure', async () => {
    const leader = await User.create({
      name: 'Leader', email: 'leader@test.com', password: 'pass123', role: 'student'
    });
    const squad = await Squad.create({
      name: 'Alpha Squad',
      creatorId: leader._id,
      creatorName: 'Leader',
      members: [{ id: leader._id, name: 'Leader', email: 'leader@test.com', role: 'Lead' }]
    });
    assert.equal(squad.name, 'Alpha Squad');
    assert.equal(squad.creatorName, 'Leader');
    assert.equal(squad.members.length, 1);
    assert.equal(squad.members[0].role, 'Lead');
    assert.equal(squad.memberCount, 1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// RESUME MODEL
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Resume Model', () => {
  test('creates resume record with correct fields', async () => {
    const u = await User.create({
      name: 'Res User', email: 'res@test.com', password: 'pass123', role: 'student'
    });
    const resume = await Resume.create({
      userId: u._id,
      fileName: 'my_resume.pdf',
      fileSize: 204800,
      fileType: 'application/pdf',
      resumeData: 'data:application/pdf;base64,AABBCC=='
    });
    assert.equal(resume.fileName, 'my_resume.pdf');
    assert.ok(resume.uploadedAt);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// COACH MEMORY MODEL
// ─────────────────────────────────────────────────────────────────────────────
test.describe('CoachMemory Model', () => {
  test('creates coach memory with empty messages array', async () => {
    const u = await User.create({
      name: 'Coachee', email: 'coachee@test.com', password: 'pass123', role: 'student'
    });
    const mem = await CoachMemory.create({ userId: u._id, messages: [], memoryNotes: [] });
    assert.ok(Array.isArray(mem.messages));
    assert.equal(mem.messages.length, 0);
  });
});
