const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// @route  GET /api/tasks
router.get('/', async (req, res) => {
  try {
    const { status, priority, search, sort = '-createdAt' } = req.query;
    const filter = { user: req.user._id };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const tasks = await Task.find(filter).sort(sort);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route  POST /api/tasks
router.post('/', async (req, res) => {
  try {
    const task = await Task.create({ ...req.body, user: req.user._id });

    // Emit real-time event
    req.app.get('io').to(req.user._id.toString()).emit('task_created', task);

    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route  GET /api/tasks/:id
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route  PUT /api/tasks/:id
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Emit real-time event
    req.app.get('io').to(req.user._id.toString()).emit('task_updated', task);

    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route  DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Emit real-time event
    req.app.get('io').to(req.user._id.toString()).emit('task_deleted', req.params.id);

    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route  GET /api/tasks/stats/summary
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await Task.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const summary = { todo: 0, 'in-progress': 0, completed: 0, total: 0 };
    stats.forEach(({ _id, count }) => {
      summary[_id] = count;
      summary.total += count;
    });

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
