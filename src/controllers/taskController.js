const db = require('../db/database');

const getAllTasks = (req, res) => {
  const { status } = req.query;
  const tasks = status
    ? db.prepare('SELECT * FROM tasks WHERE status = ?').all(status)
    : db.prepare('SELECT * FROM tasks').all();
  res.json(tasks);
};

const getTaskById = (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
};

const createTask = (req, res) => {
  const { title, description, status } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const validStatuses = ['pending', 'in_progress', 'done'];
  const taskStatus = validStatuses.includes(status) ? status : 'pending';

  const result = db.prepare(
    'INSERT INTO tasks (title, description, status) VALUES (?, ?, ?)'
  ).run(title, description || null, taskStatus);

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(task);
};

const updateTask = (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  const { title, description, status } = req.body;
  const validStatuses = ['pending', 'in_progress', 'done'];

  const updated = db.prepare(`
    UPDATE tasks SET
      title = ?,
      description = ?,
      status = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    title ?? task.title,
    description !== undefined ? description : task.description,
    validStatuses.includes(status) ? status : task.status,
    req.params.id
  );

  res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id));
};

const deleteTask = (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.status(204).send();
};

module.exports = { getAllTasks, getTaskById, createTask, updateTask, deleteTask };
