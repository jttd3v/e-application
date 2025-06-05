const request = require('supertest');
const fs = require('fs');

jest.mock('fs');

const serverModule = require('../server');
const { app } = serverModule;

beforeEach(() => {
  jest.spyOn(global.Date, 'now').mockReturnValue(123456789); // deterministic filename
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('POST /submit returns success on valid submission', async () => {
  fs.writeFileSync.mockImplementation(() => {});
  jest.spyOn(serverModule, 'generatePDF').mockResolvedValue();
  jest.spyOn(serverModule, 'sendEmail').mockResolvedValue();

  const res = await request(app)
    .post('/submit')
    .send({ name: 'test' })
    .expect('Content-Type', /json/)
    .expect(200);

  expect(res.body).toEqual({ success: true });
});

test('POST /submit returns 500 on failure', async () => {
  fs.writeFileSync.mockImplementation(() => {
    throw new Error('disk error');
  });
  const res = await request(app)
    .post('/submit')
    .send({ name: 'bad' })
    .expect('Content-Type', /json/)
    .expect(500);

  expect(res.body).toEqual({ success: false });
});

