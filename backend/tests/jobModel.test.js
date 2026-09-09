import test from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { connectDB, clearDB, closeDB } from './setup.js';
import Job from '../models/Job.js';

test.describe('Job Model Tests', () => {
  test.before(async () => {
    await connectDB();
  });

  test.afterEach(async () => {
    await clearDB();
  });

  test.after(async () => {
    await closeDB();
  });

  test('should save a job posting with default lock duration', async () => {
    const jobData = {
      title: 'Full Stack Engineer',
      company: 'Test Company',
      location: 'Remote',
      type: 'Full Time',
      requirements: '• React<br>• Node.js',
      rawRequirements: 'React\nNode.js',
      recruiterId: new mongoose.Types.ObjectId(),
      description: 'Join our growing engineering team.'
    };

    const job = await Job.create(jobData);

    assert.strictEqual(job.title, 'Full Stack Engineer');
    assert.strictEqual(job.company, 'Test Company');
    assert.strictEqual(job.lockDuration, 20); // Default lock duration in schema
    assert.strictEqual(job.views, 0);
  });
});
