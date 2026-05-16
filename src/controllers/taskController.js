const db = require('../db/database');

const getAllTasks = async (req, res) => {
	try {
		const { status } = req.query;
		const result = status
			? await db.query('SELECT * FROM tasks WHERE status = $1', [status])
			: await db.query('SELECT * FROM tasks ORDER BY created_at DESC');
		res.json(result.rows);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

const getTaskById = async (req, res) => {
	try {
		const result = await db.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
		if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
		res.json(result.rows[0]);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

const createTask = async (req, res) => {
	try {
		const { title, description, status } = req.body;
		const result = await db.query(
			'INSERT INTO tasks (title, description, status) VALUES ($1, $2, $3) RETURNING *',
			[title, description || null, status || 'pending']
		);
		res.status(201).json(result.rows[0]);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

const updateTask = async (req, res) => {
	try {
		const existing = await db.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
		if (existing.rows.length === 0) return res.status(404).json({ error: 'Task not found' });

		const task = existing.rows[0];
		const { title, description, status } = req.body;

		const result = await db.query(
			`UPDATE tasks SET
				title = $1,
				description = $2,
				status = $3,
				updated_at = NOW()
			WHERE id = $4 RETURNING *`,
			[
				title ?? task.title,
				description !== undefined ? description : task.description,
				status ?? task.status,
				req.params.id
			]
		);
		res.json(result.rows[0]);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

const deleteTask = async (req, res) => {
	try {
		const result = await db.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
		if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });

		await db.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
		res.status(204).send();
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

module.exports = { getAllTasks, getTaskById, createTask, updateTask, deleteTask };
