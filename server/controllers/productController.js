import Product from '../models/Product.js';
// eslint-disable-next-line
import productsData from '../data/productsData.js';
import { clearCache } from '../middleware/cacheMiddleware.js';
// @access  Public
// eslint-disable-next-line
export const getProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', category = '' } = req.query;
    

    let filter = {};
    if (category && category !== 'all') filter.category = category;
    
    let sortOptions = {};
    let projection = {};
    
    if (search) {
      // Try using Advanced Search Engine ($text index)
      filter.$text = { $search: search };
      projection = { score: { $meta: 'textScore' } };
      sortOptions = { score: { $meta: 'textScore' } };
    }

    let total = 0;
    try {
      total = await Product.countDocuments(filter);
    // eslint-disable-next-line
    } catch (err) {
      // Fallback to regex if text index is missing or building
      if (search) {
        delete filter.$text;
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { id: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
        projection = {};
        sortOptions = {};
        total = await Product.countDocuments(filter);
      }
    }
    
    let query = Product.find(filter, projection);
    
    if (Object.keys(sortOptions).length > 0) {
      query = query.sort(sortOptions);
    }
    
    if (Number(limit) > 0) {
      const skip = (Number(page) - 1) * Number(limit);
      query = query.skip(skip).limit(Number(limit));
    }
    
    const products = await query;
    
    res.json({
      products,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Number(limit) > 0 ? Math.ceil(total / Number(limit)) : 1
    });
  } catch (error) {
    res.status(500).json({ error: 'Products API Error', message: error.message });
  }
};

// @desc    Fetch single product by ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res, next) => {
  try {

    // Lookup by the custom string `id` field, not the MongoDB `_id`
    const product = await Product.findOne({ id: req.params.id });

    if (product) {
      res.json(product);
    } else {
      res.status(404);
      throw new Error('Product not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin or Seller
export const createProduct = async (req, res, next) => {
  try {
    const product = new Product({
      ...req.body,
      sellerId: req.user._id === 'master_admin_legacy' ? null : req.user._id
    });
    const createdProduct = await product.save();
    await clearCache('cache:/api/products*');
    res.status(201).json(createdProduct);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin or Seller
export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ id: req.params.id });

    if (product) {
      // If seller, ensure they own it (except admin)
      if (req.user.role === 'seller' && product.sellerId?.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to edit this product');
      }

      Object.assign(product, req.body);
      const updatedProduct = await product.save();
      await clearCache('cache:/api/products*');
      res.json(updatedProduct);
    } else {
      res.status(404);
      throw new Error('Product not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin or Seller
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ id: req.params.id });

    if (product) {
      if (req.user.role === 'seller' && product.sellerId?.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to delete this product');
      }
      
      await product.deleteOne();
      await clearCache('cache:/api/products*');
      res.json({ message: 'Product removed' });
    } else {
      res.status(404);
      throw new Error('Product not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Quick inline update for product stock
// @route   POST /api/products/:id/stock
// @access  Private/Admin or Seller
export const updateProductStock = async (req, res, next) => {
  try {
    const { stock } = req.body;
    const product = await Product.findOne({ id: req.params.id });

    if (product) {
      if (req.user.role === 'seller' && product.sellerId?.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to edit this product');
      }

      product.stock = Number(stock);
      // We also update inStock based on the new stock
      product.inStock = product.stock > 0;
      
      const updatedProduct = await product.save();
      await clearCache('cache:/api/products*');
      res.json({ message: 'Stock updated successfully', product: updatedProduct });
    } else {
      res.status(404);
      throw new Error('Product not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get product recommendations (AI/Frequently Bought Together logic)
// @route   GET /api/products/:id/recommendations
// @access  Public
export const getProductRecommendations = async (req, res, next) => {
  try {
    const product = await Product.findOne({ id: req.params.id });
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    // Find products in the same category, excluding the current product
    let recommendations = await Product.find({
      category: product.category,
      _id: { $ne: product._id }
    }).limit(4);

    // If not enough products in the same category, fetch random ones
    if (recommendations.length < 4) {
      const extraProducts = await Product.find({
        _id: { $ne: product._id, $nin: recommendations.map(r => r._id) }
      }).limit(4 - recommendations.length);
      recommendations = [...recommendations, ...extraProducts];
    }

    res.json(recommendations);
  } catch (error) {
    next(error);
  }
};
