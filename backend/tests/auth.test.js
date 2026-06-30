/**
 * Auth route tests.
 *
 * These tests run against the real Express app.
 * They do NOT require a live database because they mock the DB pool and
 * bcrypt/JWT utilities, so they run in CI without any infrastructure setup.
 */

const request = require('supertest');

// Mock the DB pool before requiring the app so no real connections are made.
jest.mock('../utils/db', () => ({
  execute: jest.fn(),
  getConnection: jest.fn(),
  query: jest.fn(),
}));

const pool = require('../utils/db');
const app  = require('../backend-server');

// Helper: build a mock DB connection that supports transactions.
const mockConnection = () => ({
  beginTransaction: jest.fn().mockResolvedValue(),
  execute: jest.fn(),
  commit: jest.fn().mockResolvedValue(),
  rollback: jest.fn().mockResolvedValue(),
  release: jest.fn(),
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Registration ────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  it('returns 400 when the email format is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ full_name: 'Test User', email: 'not-an-email', phone: '+250780000001', password: 'Password1' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it('returns 400 when the password is too weak', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ full_name: 'Test User', email: 'test@example.com', phone: '+250780000001', password: 'weak' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/password/i);
  });

  it('returns 400 when a doctor omits specialization', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ full_name: 'Dr Test', email: 'dr@example.com', phone: '+250780000002', password: 'Password1', role: 'doctor' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/specialization/i);
  });

  it('registers a patient successfully and returns a token', async () => {
    const conn = mockConnection();
    pool.getConnection.mockResolvedValue(conn);

    // No existing user with that email.
    conn.execute
      .mockResolvedValueOnce([[]])               // SELECT existing user check
      .mockResolvedValueOnce([[]])               // SELECT patient_id for generation
      .mockResolvedValueOnce([{ insertId: 42 }]) // INSERT into users
      .mockResolvedValueOnce([{}]);              // INSERT into patients

    const res = await request(app)
      .post('/api/auth/register')
      .send({ full_name: 'Alice', email: 'alice@example.com', phone: '+250780000003', password: 'Password1' });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('alice@example.com');
    expect(res.body.user.role).toBe('patient');
    expect(res.body.token).toBeDefined();
    expect(conn.commit).toHaveBeenCalled();
  });

  it('silently downgrades role to patient when role=admin is submitted', async () => {
    const conn = mockConnection();
    pool.getConnection.mockResolvedValue(conn);

    conn.execute
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ insertId: 99 }])
      .mockResolvedValueOnce([{}]);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ full_name: 'Hacker', email: 'hacker@example.com', phone: '+250780000099', password: 'Password1', role: 'admin' });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('patient');
  });
});

// ─── Login ───────────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  it('returns 400 when credentials are missing', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  it('returns 401 when the user does not exist', async () => {
    pool.execute.mockResolvedValueOnce([[]]); // no user found

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'Password1' });

    expect(res.status).toBe(401);
  });

  it('returns 401 when the password is wrong', async () => {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('CorrectPassword1', 10);

    pool.execute.mockResolvedValueOnce([[{
      id: 1, full_name: 'Bob', email: 'bob@example.com',
      password_hash: hash, role: 'patient', patient_id: 'BC-2026-00001',
      specialization: null, hospital: null, suspended: 0,
    }]]);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bob@example.com', password: 'WrongPassword1' });

    expect(res.status).toBe(401);
  });

  it('returns 401 when the account is suspended', async () => {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('Password1', 10);

    pool.execute.mockResolvedValueOnce([[{
      id: 2, full_name: 'Carol', email: 'carol@example.com',
      password_hash: hash, role: 'patient', patient_id: 'BC-2026-00002',
      specialization: null, hospital: null, suspended: 1,
    }]]);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'carol@example.com', password: 'Password1' });

    expect(res.status).toBe(401);
  });

  it('logs in a valid user and returns a token', async () => {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('Password1', 10);

    pool.execute.mockResolvedValueOnce([[{
      id: 3, full_name: 'Dave', email: 'dave@example.com',
      password_hash: hash, role: 'doctor', patient_id: null,
      specialization: 'Cardiology', hospital: 'KHC', suspended: 0,
    }]]);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'dave@example.com', password: 'Password1' });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('doctor');
    expect(res.body.token).toBeDefined();
  });
});

// ─── Role protection ─────────────────────────────────────────────────────────

describe('Role-based access control', () => {
  it('returns 401 when no token is sent to a protected route', async () => {
    const res = await request(app).get('/api/patient/dashboard');
    expect(res.status).toBe(401);
  });

  it('returns 401 when a bad token is sent', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', 'Bearer totally.fake.token');
    expect(res.status).toBe(401);
  });
});
