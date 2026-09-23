import mongoose from 'mongoose';
import Joi from 'joi';
import { Item } from '../models/Item.js';

const allowedCategories = ['electronics', 'clothing', 'documents', 'accessories', 'other'];
const allowedStatuses = ['lost', 'found', 'claimed'];

const createSchema = Joi.object({
  title: Joi.string().trim().required(),
  description: Joi.string().trim().allow('').optional(),
  category: Joi.string().valid(...allowedCategories).optional(),
  status: Joi.string().valid(...allowedStatuses).optional(),
  location: Joi.string().trim().allow('').optional(),
  reportedBy: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).optional()
}).unknown(false);

const updateSchema = Joi.object({
  title: Joi.string().trim(),
  description: Joi.string().trim().allow(''),
  category: Joi.string().valid(...allowedCategories),
  status: Joi.string().valid(...allowedStatuses),
  location: Joi.string().trim().allow(''),
  reportedBy: Joi.string().pattern(/^[0-9a-fA-F]{24}$/)
}).min(1).unknown(false);

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// GET /api/items
export async function getAllItems(req, res, next) {
  try {
    const status = Array.isArray(req.query.status) ? req.query.status[0] : req.query.status;
    const category = Array.isArray(req.query.category) ? req.query.category[0] : req.query.category;
    const filter = {};

    if (status !== undefined) {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }
      filter.status = status;
    }

    if (category !== undefined) {
      if (!allowedCategories.includes(category)) {
        return res.status(400).json({ message: 'Invalid category value' });
      }
      filter.category = category;
    }

    const items = await Item.find(filter)
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ items });
  } catch (err) { next(err); }
}

// GET /api/items/:id
export async function getItem(req, res, next) {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid item id' });
    }

    const item = await Item.findById(req.params.id).populate('reportedBy', 'name email');
    if (!item) return res.status(404).json({ message: 'Item not found' });

    res.json({ item });
  } catch (err) { next(err); }
}

// POST /api/items
export async function createItem(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });

    const item = await Item.create(value);
    await item.populate('reportedBy', 'name email');
    res.status(201).json({ item });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ message: 'An item with this title and location already exists' });
    }
    next(err);
  }
}

// PATCH /api/items/:id
export async function updateItem(req, res, next) {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid item id' });
    }

    const { value, error } = updateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ message: error.message });
    if (!Object.keys(value).length) {
      return res.status(400).json({ message: 'At least one item field is required for update' });
    }

    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { $set: value },
      { new: true, runValidators: true }
    ).populate('reportedBy', 'name email');

    if (!item) return res.status(404).json({ message: 'Item not found' });

    res.json({ item });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ message: 'An item with this title and location already exists' });
    }
    next(err);
  }
}

// DELETE /api/items/:id
export async function deleteItem(req, res, next) {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid item id' });
    }

    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    res.json({ ok: true });
  } catch (err) { next(err); }
}
