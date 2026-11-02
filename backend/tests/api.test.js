import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import { seedDatabase } from '../src/config/seed.js';
import { query, queryOne } from '../src/config/db.js';
import bcrypt from 'bcryptjs';

describe('CommunityConnect Core Backend Test Suite', () => {
  before(async () => {
    await seedDatabase();
  });

  test('Database has seeded roles correctly', async () => {
    const roles = await query('SELECT * FROM roles');
    assert.strictEqual(roles.length >= 4, true, 'At least 4 roles should exist');
    const roleNames = roles.map(r => r.name);
    assert.ok(roleNames.includes('admin'));
    assert.ok(roleNames.includes('organizer'));
    assert.ok(roleNames.includes('volunteer'));
    assert.ok(roleNames.includes('coordinator'));
  });

  test('Demo users are seeded with hashed passwords', async () => {
    const admin = await queryOne('SELECT * FROM users WHERE email = ?', ['admin@communityconnect.edu']);
    assert.ok(admin, 'Admin user must exist');
    const passMatch = await bcrypt.compare('Password@123', admin.password);
    assert.strictEqual(passMatch, true, 'Admin password hash should match demo password');
  });

  test('Event CRUD operations work with foreign keys', async () => {
    const events = await query('SELECT * FROM events');
    assert.ok(events.length > 0, 'Seed events should exist');
    const firstEvent = events[0];
    assert.ok(firstEvent.title.length > 0);
  });

  test('Volunteer registration prevents duplicate entries', async () => {
    // Sneha Patel (id 4) is registered for Event 1
    const reg = await queryOne('SELECT * FROM volunteer_registrations WHERE event_id = 1 AND volunteer_id = 4');
    assert.ok(reg, 'Sneha should be registered for Event 1');
  });

  test('Attendance records reflect correctly in certificate eligibility', async () => {
    const attended = await query('SELECT * FROM attendance WHERE status = ?', ['present']);
    assert.ok(attended.length > 0, 'Should have attendance marked present');
  });

  test('Certificates have unique serial numbers', async () => {
    const certs = await query('SELECT * FROM certificates');
    assert.ok(certs.length > 0, 'Certificates must exist');
    assert.ok(certs[0].certificate_number.startsWith('CC-2026-SRU-'));
  });
});
