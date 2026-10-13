import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { connectDB, clearDB, closeDB, buildTestApp } from './setup.js';
import User from '../models/User.js';
import Resume from '../models/Resume.js';
import MockTest from '../models/MockTest.js';
import VerificationTest from '../models/VerificationTest.js';
import Interview from '../models/Interview.js';
import PracticeSubmission from '../models/PracticeSubmission.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';

let app;
let recruiterToken, studentToken;
let recruiterId, studentId, jobId, applicationId;

test.before(async () => {
  await connectDB();
  app = await buildTestApp();

  // Create recruiter
  const rRes = await request(app).post('/api/auth/signup').send({
    name: 'Top Talent Recruiter',
    email: 'recruiter.dossier@corp.com',
    password: 'recruiterpass123',
    role: 'recruiter',
    company: 'Alpha Tech Corp'
  });
  recruiterToken = rRes.body.token;
  recruiterId = rRes.body.user.uid;

  // Create student
  const sRes = await request(app).post('/api/auth/signup').send({
    name: 'Ada Lovelace',
    email: 'ada.lovelace@university.edu',
    password: 'studentpass123',
    role: 'student',
    phoneNumber: '+1-555-0199',
    university: 'Oxford University',
    stream: 'B.Tech Computer Science',
    branch: 'Artificial Intelligence'
  });
  studentToken = sRes.body.token;
  studentId = sRes.body.user.uid;

  // Add resume for student
  await Resume.create({
    userId: studentId,
    fileName: 'Ada_Lovelace_CV.pdf',
    fileSize: 102400,
    fileType: 'application/pdf',
    resumeData: 'data:application/pdf;base64,JVBERi0xLjQKJ...'
  });

  // Add Practice Submission
  await PracticeSubmission.create({
    userId: studentId,
    problemId: 'two-sum',
    problemNumber: 1,
    title: 'Two Sum',
    category: 'dsa',
    difficulty: 'Easy',
    status: 'Solved',
    attemptsCount: 2,
    acceptedCount: 1,
    firstSolvedAt: new Date(),
    lastSolvedAt: new Date(),
    lastLanguage: 'python',
    lastCode: 'def twoSum(nums, target): return [0, 1]'
  });

  // Add Mock Test with Part A/B/C & code
  await MockTest.create({
    userId: studentId,
    type: 'Full Stack Assessment',
    score: 88,
    total: 100,
    accuracy: 88,
    domain: 'Full Stack',
    partAScore: 90,
    partBScore: 85,
    partCScore: 90,
    codeSubmitted: 'function solution() { return true; }',
    aiEvaluation: {
      aiSummary: 'Outstanding full stack algorithmic understanding and architectural depth.',
      partAEvaluation: 'Top 5% core CS accuracy.',
      partBEvaluation: 'Clean system design explanation.',
      partCEvaluation: 'O(N) optimal implementation.',
      recommendation: 'Highly Recommended for Senior Frontend / Fullstack roles.'
    }
  });

  // Add Verification Test
  await VerificationTest.create({
    userId: studentId,
    type: 'Premium Assessment',
    score: 5,
    total: 5,
    passed: true,
    certificateId: 'CERT-ADA100'
  });
  await User.findByIdAndUpdate(studentId, { isVerified: true, rank: 1, tqScore: 950 });

  // Add AI Interview
  await Interview.create({
    userId: studentId,
    type: 'Dynamic Technical Interview',
    scores: { technical: 92, communication: 95 },
    report: 'Exceptional communication and deep understanding of distributed systems.',
    techStack: 'Python, React, Node.js',
    questionsAsked: 8,
    duration: 15,
    chatHistory: [
      { question: 'Explain how Node event loop handles async I/O', answer: 'Node uses libuv with epoll/kqueue...' }
    ]
  });

  // Recruiter posts a job
  const jobRes = await request(app).post('/api/jobs').send({
    title: 'Senior Software Engineer',
    company: 'Alpha Tech Corp',
    location: 'Remote',
    type: 'Full Time',
    requirementsText: 'Strong CS fundamentals\nNode.js and React expertise'
  }).set('Authorization', `Bearer ${recruiterToken}`);
  jobId = jobRes.body.job._id;

  // Student applies for job
  const appRes = await request(app)
    .post(`/api/jobs/${jobId}/apply`)
    .set('Authorization', `Bearer ${studentToken}`);
  applicationId = appRes.body.application._id;
});

test.after(async () => {
  await clearDB();
  await closeDB();
});

test.describe('Recruiter Candidate Details & Applicants Verification', () => {
  test('recruiter receives enriched applicant list with practice, test, and interview stats', async () => {
    const res = await request(app)
      .get(`/api/jobs/${jobId}/applicants`)
      .set('Authorization', `Bearer ${recruiterToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.applicants.length, 1);

    const candidate = res.body.applicants[0];
    assert.equal(candidate.studentName, 'Ada Lovelace');
    assert.equal(candidate.studentEmail, 'ada.lovelace@university.edu');
    assert.equal(candidate.phoneNumber, '+1-555-0199');
    assert.equal(candidate.university, 'Oxford University');
    assert.equal(candidate.isVerified, true);
    assert.equal(candidate.rank, 1);
    assert.equal(candidate.tqScore, 950);
    assert.equal(candidate.hasResume, true);
    assert.equal(candidate.resumeFileName, 'Ada_Lovelace_CV.pdf');

    // Aggregated metrics
    assert.ok(candidate.practiceStats);
    assert.equal(candidate.practiceStats.totalSolved, 1);
    assert.equal(candidate.practiceStats.dsaSolved, 1);

    assert.ok(candidate.mockTestStats);
    assert.equal(candidate.mockTestStats.count, 1);
    assert.equal(candidate.mockTestStats.avgAccuracy, 88);

    assert.ok(candidate.interviewStats);
    assert.equal(candidate.interviewStats.count, 1);
    assert.equal(candidate.interviewStats.avgTech, 92);
    assert.equal(candidate.interviewStats.avgComm, 95);

    assert.ok(candidate.verificationStatus);
    assert.equal(candidate.verificationStatus.isVerified, true);
    assert.equal(candidate.verificationStatus.certificateId, 'CERT-ADA100');
  });

  test('recruiter fetches comprehensive candidate dossier via /api/auth/student/:id', async () => {
    const res = await request(app)
      .get(`/api/auth/student/${studentId}`)
      .set('Authorization', `Bearer ${recruiterToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);

    const user = res.body.user;
    assert.equal(user.name, 'Ada Lovelace');
    assert.equal(user.university, 'Oxford University');
    assert.equal(user.rank, 1);
    assert.equal(user.tqScore, 950);

    // Resume
    assert.ok(user.resume);
    assert.equal(user.resume.fileName, 'Ada_Lovelace_CV.pdf');
    assert.ok(user.resume.resumeData.startsWith('data:application/pdf'));

    // Practice stats & submissions
    assert.ok(user.practiceStats);
    assert.equal(user.practiceStats.totalSolved, 1);
    assert.equal(user.practiceStats.easySolved, 1);
    assert.equal(user.practiceSubmissions.length, 1);
    assert.equal(user.practiceSubmissions[0].title, 'Two Sum');
    assert.ok(user.practiceSubmissions[0].lastCode.includes('twoSum'));

    // Mock tests
    assert.ok(user.mockStats);
    assert.equal(user.mockStats.totalTests, 1);
    assert.equal(user.mockStats.avgAccuracy, 88);
    assert.equal(user.mockTests.length, 1);
    assert.equal(user.mockTests[0].partAScore, 90);
    assert.equal(user.mockTests[0].partBScore, 85);
    assert.equal(user.mockTests[0].partCScore, 90);
    assert.ok(user.mockTests[0].aiEvaluation.recommendation);

    // AI Interviews
    assert.ok(user.interviewStats);
    assert.equal(user.interviewStats.totalInterviews, 1);
    assert.equal(user.interviews.length, 1);
    assert.equal(user.interviews[0].scores.technical, 92);
    assert.equal(user.interviews[0].chatHistory.length, 1);

    // Verification Tests
    assert.ok(user.latestVerification);
    assert.equal(user.latestVerification.passed, true);
    assert.equal(user.latestVerification.certificateId, 'CERT-ADA100');

    // Applications history
    assert.ok(Array.isArray(user.applications));
    assert.equal(user.applications.length, 1);
    assert.equal(user.applications[0].jobTitle, 'Senior Software Engineer');
  });

  test('recruiter can update application status to shortlisted, accepted, rejected, and pending', async () => {
    // 1. Shortlist
    let res = await request(app)
      .put(`/api/jobs/applications/${applicationId}`)
      .send({ status: 'shortlisted' })
      .set('Authorization', `Bearer ${recruiterToken}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.application.status, 'shortlisted');

    // 2. Accept
    res = await request(app)
      .put(`/api/jobs/applications/${applicationId}`)
      .send({ status: 'accepted' })
      .set('Authorization', `Bearer ${recruiterToken}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.application.status, 'accepted');

    // 3. Reject
    res = await request(app)
      .put(`/api/jobs/applications/${applicationId}`)
      .send({ status: 'rejected' })
      .set('Authorization', `Bearer ${recruiterToken}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.application.status, 'rejected');

    // 4. Reset to pending
    res = await request(app)
      .put(`/api/jobs/applications/${applicationId}`)
      .send({ status: 'pending' })
      .set('Authorization', `Bearer ${recruiterToken}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.application.status, 'pending');
  });
});
