/**
 * Access rule tests.
 *
 * These cover the decisions that matter most in this project: who may read a
 * health record, who may open a file someone attached, and what a connection
 * does and does not allow. The database is mocked, so they run anywhere.
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_TOKEN = process.env.JWT_TOKEN || 'test-secret';

jest.mock('../utils/db', () => ({
  execute: jest.fn(),
  getConnection: jest.fn(),
  query: jest.fn(),
}));

const pool = require('../utils/db');
const { forgetSession } = require('../middleware/roleGuard');
const app = require('../backend-server');

const tokenFor = (user) => jwt.sign(
  { id: user.id, email: `${user.id}@example.com`, role: user.role, name: 'Test', sv: 1 },
  process.env.JWT_TOKEN,
  { expiresIn: '1h' },
);

const DOCTOR = tokenFor({ id: 10, role: 'doctor' });
const OTHER_DOCTOR = tokenFor({ id: 11, role: 'doctor' });
const PATIENT = tokenFor({ id: 20, role: 'patient' });
const ADMIN = tokenFor({ id: 30, role: 'admin' });

// Every request first checks the session is still valid
const allowSession = () => pool.execute.mockResolvedValueOnce([[{ session_version: 1, suspended: 0 }]]);

beforeEach(() => {
  jest.clearAllMocks();
  // The session check keeps a short lived cache, which would otherwise carry
  // between tests and swallow the mocked lookup
  [10, 11, 20, 30].forEach(forgetSession);
});

describe('A doctor reading a patient file', () => {
  it('is refused when the two are not connected', async () => {
    allowSession();
    pool.execute
      .mockResolvedValueOnce([[{ id: 20, full_name: 'Grace', patient_id: 'BC-2026-00001' }]]) // find patient
      .mockResolvedValueOnce([[]]);                                                          // no link

    const res = await request(app)
      .get('/api/doctor/patient/BC-2026-00001')
      .set('Authorization', `Bearer ${DOCTOR}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/connect/i);
  });

  it('sees only their own notes when connected without records permission', async () => {
    allowSession();
    pool.execute
      .mockResolvedValueOnce([[{ id: 20, full_name: 'Grace', patient_id: 'BC-2026-00001' }]])
      .mockResolvedValueOnce([[{ id: 1, status: 'accepted', records_status: 'none' }]])
      .mockResolvedValueOnce([[{ id: 5, diagnosis: 'Malaria', doctor_id: 10 }]])
      .mockResolvedValueOnce([{}]); // the access log write

    const res = await request(app)
      .get('/api/doctor/patient/BC-2026-00001')
      .set('Authorization', `Bearer ${DOCTOR}`);

    expect(res.status).toBe(200);
    expect(res.body.can_read_records).toBe(false);

    // The query that ran must have been the one filtered to this doctor
    const historyQuery = pool.execute.mock.calls[3][0];
    expect(historyQuery).toMatch(/doctor_id = \?/);
  });

  it('sees the whole history once the patient allows it', async () => {
    allowSession();
    pool.execute
      .mockResolvedValueOnce([[{ id: 20, full_name: 'Grace', patient_id: 'BC-2026-00001' }]])
      .mockResolvedValueOnce([[{ id: 1, status: 'accepted', records_status: 'granted' }]])
      .mockResolvedValueOnce([[
        { id: 5, diagnosis: 'Malaria', doctor_name: 'Dr One' },
        { id: 6, diagnosis: 'Hypertension', doctor_name: 'Dr Two' },
      ]])
      .mockResolvedValueOnce([{}]);

    const res = await request(app)
      .get('/api/doctor/patient/BC-2026-00001')
      .set('Authorization', `Bearer ${DOCTOR}`);

    expect(res.status).toBe(200);
    expect(res.body.can_read_records).toBe(true);
    expect(res.body.consultations).toHaveLength(2);
  });

  it('cannot reach the history endpoint without records permission', async () => {
    allowSession();
    pool.execute.mockResolvedValueOnce([[]]); // no granted link

    const res = await request(app)
      .get('/api/doctor/patients/20/consultations')
      .set('Authorization', `Bearer ${DOCTOR}`);

    expect(res.status).toBe(403);
  });
});

describe('A file attached to a report', () => {
  const reportRow = [[{ reporter_id: 20, evidence_file: 'x.png', evidence_mime: 'image/png', evidence_name: 'x.png' }]];

  it('is refused to someone who did not send the report', async () => {
    allowSession();
    pool.execute.mockResolvedValueOnce(reportRow);

    const res = await request(app)
      .get('/api/reports/1/evidence')
      .set('Authorization', `Bearer ${OTHER_DOCTOR}`);

    expect(res.status).toBe(403);
  });

  it('is refused when nobody is signed in', async () => {
    const res = await request(app).get('/api/reports/1/evidence');
    expect(res.status).toBe(401);
  });
});

describe('Ratings', () => {
  it('cannot be left by a doctor', async () => {
    allowSession();

    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${DOCTOR}`)
      .send({ doctor_id: 11, rating: 5, comment: 'Rating another doctor here' });

    expect(res.status).toBe(403);
  });

  it('cannot be left without a connection', async () => {
    allowSession();
    pool.execute
      .mockResolvedValueOnce([[{ id: 10 }]])  // the doctor exists
      .mockResolvedValueOnce([[]]);           // no link

    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${PATIENT}`)
      .send({ doctor_id: 10, rating: 5, comment: 'They were very helpful to me' });

    expect(res.status).toBe(403);
  });

  it('needs a written reason', async () => {
    allowSession();

    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${PATIENT}`)
      .send({ doctor_id: 10, rating: 5, comment: 'good' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/why/i);
  });

  it('are readable by anyone, with no account', async () => {
    pool.execute
      .mockResolvedValueOnce([[{ count: 1, average: 4 }]])
      .mockResolvedValueOnce([[{
        id: 1, rating: 4, comment: 'Explained everything clearly', patient_id: 20,
        has_evidence: 1, created_at: new Date(), updated_at: new Date(),
      }]]);

    const res = await request(app).get('/api/doctors/10/reviews');

    expect(res.status).toBe(200);
    expect(res.body.reviews[0].comment).toMatch(/clearly/);
    // A stranger is not told that a file exists
    expect(res.body.reviews[0].has_evidence).toBe(false);
  });
});

describe('Administrators', () => {
  it('cannot reach a patient file through the doctor routes', async () => {
    allowSession();

    const res = await request(app)
      .get('/api/doctor/patient/BC-2026-00001')
      .set('Authorization', `Bearer ${ADMIN}`);

    expect(res.status).toBe(403);
  });

  it('are the only ones who can list the doctors waiting to be checked', async () => {
    allowSession();

    const res = await request(app)
      .get('/api/admin/doctors')
      .set('Authorization', `Bearer ${PATIENT}`);

    expect(res.status).toBe(403);
  });
});

describe('A session that has been ended', () => {
  it('is refused even though the token has not expired', async () => {
    // The account now carries a newer session version than the token does
    pool.execute.mockResolvedValueOnce([[{ session_version: 2, suspended: 0 }]]);

    const res = await request(app)
      .get('/api/patient/record-access')
      .set('Authorization', `Bearer ${PATIENT}`);

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/session/i);
  });

  it('is refused for a blocked account', async () => {
    pool.execute.mockResolvedValueOnce([[{ session_version: 1, suspended: 1 }]]);

    const res = await request(app)
      .get('/api/patient/record-access')
      .set('Authorization', `Bearer ${PATIENT}`);

    expect(res.status).toBe(401);
  });
});
