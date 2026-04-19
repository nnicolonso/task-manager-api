const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Task Manager API',
    version: '1.0.0',
    endpoints: {
      tasks: '/api/tasks'
    }
  });
});

app.use('/api/tasks', require('./routes/tasks'));

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

module.exports = app;
