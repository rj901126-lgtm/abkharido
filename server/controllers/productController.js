import Product from '../models/Product.js';
import productsData from '../data/productsData.js';
import { clearCache } from '../middleware/cacheMiddleware.js';
// @access  Public
export const getProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', category = '' } = req.query;
    
    // JSON Fallback for Vercel if MongoDB is not configured
    if (!process.env.MONGODB_URI) {
      try {
        let allProducts = productsData;
        if (category && category !== 'all') {
          allProducts = allProducts.filter(p => p.category === category);
        }
        if (search) {
          allProducts = allProducts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase()));
        }
        const total = allProducts.length;
        if (Number(limit) > 0) {
          const skip = (Number(page) - 1) * Number(limit);
          allProducts = allProducts.slice(skip, skip + Number(limit));
        }
        return res.json({
          products: allProducts,
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Number(limit) > 0 ? Math.ceil(total / Number(limit)) : 1
        });
      } catch (e) {
        console.error('JSON Fallback Error:', e);
      }
    }

    let filter = {};
    if (category && category !== 'all') filter.category = category;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { id: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Product.countDocuments(filter);
    
    let query = Product.find(filter);
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
    // JSON Fallback for Vercel if MongoDB is not configured
    if (!process.env.MONGODB_URI) {
      try {
        const allProducts = productsData;
        const product = allProducts.find(p => p.id === req.params.id);
        if (product) return res.json(product);
        res.status(404);
        return res.json({ error: 'Product not found' });
      } catch(e) {}
    }

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
