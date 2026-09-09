import test from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { connectDB, clearDB, closeDB } from './setup.js';
import Application from '../models/Application.js';

test.describe('Application Model Tests', () => {
  test.before(async () => {
    await connectDB();
  });

  test.afterEach(async () => {
    await clearDB();
  });

  test.after(async () => {
    await closeDB();
  });

  test('should create application with default pending status', async () => {
    const appData = {
      jobId: new mongoose.Types.ObjectId(),
      jobTitle: 'Software Engineer',
      company: 'Swiggy',
      studentId: new mongoose.Types.ObjectId(),
      studentName: 'Candidate Name',
      studentEmail: 'candidate@university.edu',
      hasResume: true,
      resumeFileName: 'resume.pdf'
    };

    const app = await Application.create(appData);

    assert.strictEqual(app.jobTitle, 'Software Engineer');
    assert.strictEqual(app.studentName, 'Candidate Name');
    assert.strictEqual(app.status, 'pending'); // Default status
  });
});
