require('dotenv').config();
const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db/database');

const TEST_EMAIL = `smoke_${Date.now()}@test.com`;
const TEST_PASSWORD = 'testpass123';

let token;
let taskId;

afterAll(async () => {
	await db.query('DELETE FROM users WHERE email = $1', [TEST_EMAIL]);
	await db.end();
});

describe('Auth', () => {
	test('POST /api/auth/register → 201 with token', async () => {
		const res = await request(app)
			.post('/api/auth/register')
			.send({ email: TEST_EMAIL, password: TEST_PASSWORD });

		expect(res.status).toBe(201);
		expect(res.body.token).toBeDefined();
		expect(res.body.user.email).toBe(TEST_EMAIL);
		token = res.body.token;
	});

	test('POST /api/auth/register duplicate → 409', async () => {
		const res = await request(app)
			.post('/api/auth/register')
			.send({ email: TEST_EMAIL, password: TEST_PASSWORD });

		expect(res.status).toBe(409);
	});

	test('POST /api/auth/register bad email → 400', async () => {
		const res = await request(app)
			.post('/api/auth/register')
			.send({ email: 'notanemail', password: TEST_PASSWORD });

		expect(res.status).toBe(400);
		expect(res.body.errors[0].field).toBe('email');
	});

	test('POST /api/auth/login → 200 with token', async () => {
		const res = await request(app)
			.post('/api/auth/login')
			.send({ email: TEST_EMAIL, password: TEST_PASSWORD });

		expect(res.status).toBe(200);
		expect(res.body.token).toBeDefined();
	});

	test('POST /api/auth/login wrong password → 401', async () => {
		const res = await request(app)
			.post('/api/auth/login')
			.send({ email: TEST_EMAIL, password: 'wrongpass' });

		expect(res.status).toBe(401);
	});
});

describe('Tasks', () => {
	test('GET /api/tasks without token → 401', async () => {
		const res = await request(app).get('/api/tasks');
		expect(res.status).toBe(401);
	});

	test('POST /api/tasks → 201', async () => {
		const res = await request(app)
			.post('/api/tasks')
			.set('Authorization', `Bearer ${token}`)
			.send({ title: 'Smoke test task', description: 'Created by Jest', status: 'pending' });

		expect(res.status).toBe(201);
		expect(res.body.title).toBe('Smoke test task');
		expect(res.body.status).toBe('pending');
		taskId = res.body.id;
	});

	test('POST /api/tasks missing title → 400', async () => {
		const res = await request(app)
			.post('/api/tasks')
			.set('Authorization', `Bearer ${token}`)
			.send({ description: 'No title' });

		expect(res.status).toBe(400);
		expect(res.body.errors[0].field).toBe('title');
	});

	test('POST /api/tasks bad status → 400', async () => {
		const res = await request(app)
			.post('/api/tasks')
			.set('Authorization', `Bearer ${token}`)
			.send({ title: 'Test', status: 'flying' });

		expect(res.status).toBe(400);
	});

	test('GET /api/tasks → 200 array', async () => {
		const res = await request(app)
			.get('/api/tasks')
			.set('Authorization', `Bearer ${token}`);

		expect(res.status).toBe(200);
		expect(Array.isArray(res.body)).toBe(true);
	});

	test('GET /api/tasks/:id → 200', async () => {
		const res = await request(app)
			.get(`/api/tasks/${taskId}`)
			.set('Authorization', `Bearer ${token}`);

		expect(res.status).toBe(200);
		expect(res.body.id).toBe(taskId);
	});

	test('GET /api/tasks/:id not found → 404', async () => {
		const res = await request(app)
			.get('/api/tasks/999999')
			.set('Authorization', `Bearer ${token}`);

		expect(res.status).toBe(404);
	});

	test('PUT /api/tasks/:id → 200 updated', async () => {
		const res = await request(app)
			.put(`/api/tasks/${taskId}`)
			.set('Authorization', `Bearer ${token}`)
			.send({ status: 'done' });

		expect(res.status).toBe(200);
		expect(res.body.status).toBe('done');
	});

	test('PUT /api/tasks/:id empty body → 400', async () => {
		const res = await request(app)
			.put(`/api/tasks/${taskId}`)
			.set('Authorization', `Bearer ${token}`)
			.send({});

		expect(res.status).toBe(400);
	});

	test('DELETE /api/tasks/:id → 204', async () => {
		const res = await request(app)
			.delete(`/api/tasks/${taskId}`)
			.set('Authorization', `Bearer ${token}`);

		expect(res.status).toBe(204);
	});

	test('DELETE /api/tasks/:id already deleted → 404', async () => {
		const res = await request(app)
			.delete(`/api/tasks/${taskId}`)
			.set('Authorization', `Bearer ${token}`);

		expect(res.status).toBe(404);
	});
});
