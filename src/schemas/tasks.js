const { z } = require('zod');

const validStatuses = ['pending', 'in_progress', 'done'];

const createTaskSchema = z.object({
	title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
	description: z.string().max(1000, 'Description too long').optional(),
	status: z.enum(validStatuses, { message: 'Status must be pending, in_progress, or done' }).optional()
});

const updateTaskSchema = z.object({
	title: z.string().min(1, 'Title cannot be empty').max(255, 'Title too long').optional(),
	description: z.string().max(1000, 'Description too long').optional(),
	status: z.enum(validStatuses, { message: 'Status must be pending, in_progress, or done' }).optional()
}).refine(data => Object.keys(data).length > 0, {
	message: 'At least one field must be provided'
});

module.exports = { createTaskSchema, updateTaskSchema };
