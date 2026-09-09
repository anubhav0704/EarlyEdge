import test from 'node:test';
import assert from 'node:assert';
import { connectDB, clearDB, closeDB } from './setup.js';
import User from '../models/User.js';

test.describe('User Model Tests', () => {
  test.before(async () => {
    await connectDB();
  });

  test.afterEach(async () => {
    await clearDB();
  });

  test.after(async () => {
    await closeDB();
  });

  test('should create a student user and hash password', async () => {
    const userData = {
      name: 'Test Student',
      email: 'student@test.edu',
      password: 'password123',
      role: 'student',
      university: 'Test University',
      stream: 'B.Tech',
      branch: 'CSE'
    };

    const user = await User.create(userData);

    assert.strictEqual(user.name, 'Test Student');
    assert.strictEqual(user.email, 'student@test.edu');
    assert.strictEqual(user.role, 'student');
    assert.notStrictEqual(user.password, 'password123'); // Password must be hashed
  });

  test('should verify password comparePassword helper', async () => {
    const userData = {
      name: 'Test Recruiter',
      email: 'recruiter@test.com',
      password: 'secure_password',
      role: 'recruiter',
      company: 'Test Company'
    };

    const user = await User.create(userData);

    const isMatch = await user.comparePassword('secure_password');
    assert.strictEqual(isMatch, true);

    const isFail = await user.comparePassword('wrong_password');
    assert.strictEqual(isFail, false);
  });
});
