import Layout from '../models/Layout.js';
import Category from '../models/Category.js';
import { clearCache } from '../middleware/cacheMiddleware.js';

// @desc    Get Layout by Type
// @route   GET /api/v2/cms/layout/:type
// @access  Public
export const getLayout = async (req, res, next) => {
  try {
    let layout = await Layout.findOne({ type: req.params.type, isActive: true }).lean();
    
    // If no layout exists in DB yet, return a sensible default for the frontend
    if (!layout && req.params.type === 'home_page') {
      layout = {
        type: 'home_page',
        components: [
          { id: '1', type: 'deals_row', title: 'Deals of the Day', order: 1 },
          { id: '2', type: 'category_row', title: 'Smart Mobiles & Accessories', order: 2, data: 'mobiles' },
          { id: '3', type: 'category_row', title: 'Best of Tech & Electronics', order: 3, data: 'electronics' }
        ]
      };
    } else if (!layout) {
      res.status(404);
      throw new Error('Layout not found');
    }

    res.json(layout);
  } catch (error) {
    next(error);
  }
};

// @desc    Update Layout
// @route   PUT /api/v2/cms/layout/:type
// @access  Private/Admin
export const updateLayout = async (req, res, next) => {
  try {
    const { components } = req.body;
    let layout = await Layout.findOne({ type: req.params.type }).lean();

    if (layout) {
      layout.components = components;
      await layout.save();
    } else {
      layout = await Layout.create({
        type: req.params.type,
        components
      });
    }

    await clearCache('cache:/api/v2/cms/layout*');
    res.json(layout);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all categories
// @route   GET /api/v2/cms/categories
// @access  Public
export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).lean();
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a category
// @route   POST /api/v2/cms/categories
// @access  Private/Admin
export const createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    
    await clearCache('cache:/api/v2/cms/categories*');
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};
