import test from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { connectDB, clearDB, closeDB } from './setup.js';
import Squad from '../models/Squad.js';

test.describe('Squad Model Tests', () => {
  test.before(async () => {
    await connectDB();
  });

  test.afterEach(async () => {
    await clearDB();
  });

  test.after(async () => {
    await closeDB();
  });

  test('should create a squad with matching values', async () => {
    const creatorId = new mongoose.Types.ObjectId();
    const squadData = {
      name: 'Code Warriors',
      creatorId: creatorId,
      creatorName: 'Lead Dev',
      members: [
        {
          id: creatorId,
          name: 'Lead Dev',
          email: 'lead@test.com',
          role: 'Lead'
        }
      ],
      memberCount: 1
    };

    const squad = await Squad.create(squadData);

    assert.strictEqual(squad.name, 'Code Warriors');
    assert.strictEqual(squad.creatorName, 'Lead Dev');
    assert.strictEqual(squad.members.length, 1);
    assert.strictEqual(squad.members[0].name, 'Lead Dev');
    assert.strictEqual(squad.members[0].role, 'Lead');
  });
});
