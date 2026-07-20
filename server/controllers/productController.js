import Product from '../models/Product.js';

// @desc    Fetch all products (with pagination & search)
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', category = '' } = req.query;
    
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
    next(error);
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
      
      await Product.deleteOne({ id: req.params.id });
      res.json({ message: 'Product removed' });
    } else {
      res.status(404);
      throw new Error('Product not found');
    }
  } catch (error) {
    next(error);
  }
};
