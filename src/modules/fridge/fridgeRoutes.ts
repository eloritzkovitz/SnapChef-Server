import express from 'express';
import {
  addItem,
  getItems,
  searchItems,
  updateItem,
  deleteItem,
} from './fridgeController';

const router = express.Router();

// Add new item
router.post('/', addItem);

// Get all items / filter by category
router.get('/', getItems);

// Search items by name
router.get('/search', searchItems);

// Update item by ID
router.put('/:id', updateItem);

// Delete item by ID
router.delete('/:id', deleteItem);

export default router;
