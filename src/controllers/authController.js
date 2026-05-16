const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db/database');

const register = async (req, res) => {
	try {
		const { email, password } = req.body;

		const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
		if (existing.rows.length > 0) {
			return res.status(409).json({ error: 'Email already in use' });
		}

		const hashed = await bcrypt.hash(password, 10);
		const result = await db.query(
			'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, created_at',
			[email, hashed]
		);

		const token = jwt.sign({ id: result.rows[0].id, email }, process.env.JWT_SECRET, { expiresIn: '7d' });
		res.status(201).json({ user: result.rows[0], token });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

const login = async (req, res) => {
	try {
		const { email, password } = req.body;

		const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
		const user = result.rows[0];
		if (!user) {
			return res.status(401).json({ error: 'Invalid credentials' });
		}

		const match = await bcrypt.compare(password, user.password);
		if (!match) {
			return res.status(401).json({ error: 'Invalid credentials' });
		}

		const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
		res.json({ token });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

module.exports = { register, login };
