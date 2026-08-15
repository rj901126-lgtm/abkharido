import Product from '../models/Product.js';
// eslint-disable-next-line
import productsData from '../data/productsData.js';
import { clearCache } from '../middleware/cacheMiddleware.js';

// Public Product DTO Serializer to protect business confidentiality
export const toPublicProductDTO = (product) => {
  if (!product) return null;
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    description: product.description,
    price: product.price,
    originalPrice: product.originalPrice,
    inStock: Boolean(product.inStock !== false && (product.stock === undefined || product.stock > 0)),
    image: product.image,
    images: product.images && product.images.length > 0 ? product.images : (product.image ? [product.image] : []),
    rating: product.rating || 4.5,
    reviewsCount: product.reviewsCount || 0,
    highlights: product.highlights || [],
    features: product.features || [],
    specs: product.specs || [],
    specifications: product.specifications || product.specs || [],
    colorModels: (product.colorModels || []).map(cm => ({
      name: cm.name,
      primaryImage: cm.primaryImage,
      images: cm.images || [],
      variants: (cm.variants || []).map(v => ({
        name: v.name,
        price: v.price,
        originalPrice: v.originalPrice,
        discount: v.discount
      }))
    })),
    hasProCare: Boolean(product.hasProCare),
    flashSale: product.flashSale?.isActive ? {
      isActive: true,
      price: product.flashSale.price,
      endTime: product.flashSale.endTime
    } : undefined
  };
};

// @desc    Fetch all products with strict validation and public sanitization
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res, next) => {
  try {
    const rawPage = parseInt(req.query.page, 10);
    const rawLimit = parseInt(req.query.limit, 10);
    
    // Strict query validation (min 1, limit 1-50)
    const page = !isNaN(rawPage) && rawPage >= 1 ? rawPage : 1;
    const limit = !isNaN(rawLimit) && rawLimit >= 1 && rawLimit <= 50 ? rawLimit : 20;
    const search = typeof req.query.search === 'string' ? req.query.search.trim().substring(0, 100) : '';
    const category = typeof req.query.category === 'string' ? req.query.category.trim().substring(0, 50) : '';

    let filter = {};
    if (category && category.toLowerCase() !== 'all') {
      filter.category = { $regex: new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
    }
    
    let sortOptions = {};
    let projection = {};
    
    if (search) {
      filter.$text = { $search: search };
      projection = { score: { $meta: 'textScore' } };
      sortOptions = { score: { $meta: 'textScore' } };
    }

    let total = 0;
    try {
      total = await Product.countDocuments(filter);
    } catch (err) {
      if (search) {
        delete filter.$text;
        const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        filter.$or = [
          { name: { $regex: escapedSearch, $options: 'i' } },
          { id: { $regex: escapedSearch, $options: 'i' } },
          { description: { $regex: escapedSearch, $options: 'i' } }
        ];
        projection = {};
        sortOptions = {};
        total = await Product.countDocuments(filter);
      }
    }
    
    let query = Product.find(filter, projection).lean();
    
    if (Object.keys(sortOptions).length > 0) {
      query = query.sort(sortOptions);
    }
    
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);
    
    const products = await query;
    
    // Check if requester is admin/seller with privileged access
    const isPrivileged = req.user && ['admin', 'super_admin', 'seller'].includes(req.user.role);
    const sanitizedProducts = isPrivileged ? products : products.map(toPublicProductDTO);

    res.json({
      products: sanitizedProducts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    });
  } catch (error) {
    console.error('Products API Error:', error);
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
};

// @desc    Fetch single product by ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res, next) => {
  try {
    const cleanId = String(req.params.id || '').trim();
    if (!cleanId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const product = await Product.findOne({ id: cleanId }).lean();

    if (product) {
      const isPrivileged = req.user && ['admin', 'super_admin', 'seller'].includes(req.user.role);
      res.json(isPrivileged ? product : toPublicProductDTO(product));
    } else {
      res.status(404).json({ error: 'Product not found' });
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
    // [SEC-PATCH]: Prevent Mass Assignment Vulnerability
    const sanitizedBody = { ...req.body };
    delete sanitizedBody.rating;
    delete sanitizedBody.reviewsCount;
    delete sanitizedBody.reviews;
    delete sanitizedBody.vendorId;
    delete sanitizedBody.sellerId;
    delete sanitizedBody.soldCount;

    const product = new Product({
      ...sanitizedBody,
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

      // [SEC-PATCH]: Prevent Mass Assignment Vulnerability
      const sanitizedBody = { ...req.body };
      delete sanitizedBody.rating;
      delete sanitizedBody.reviewsCount;
      delete sanitizedBody.reviews;
      delete sanitizedBody.vendorId;
      delete sanitizedBody.sellerId;
      delete sanitizedBody.soldCount;

      Object.assign(product, sanitizedBody);
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
    const product = await Product.findOne({ id: req.params.id }).lean();
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    // Find products in the same category, excluding the current product
    let recommendations = await Product.find({
      category: product.category,
      _id: { $ne: product._id }
    }).limit(4).lean();

    // If not enough products in the same category, fetch random ones
    if (recommendations.length < 4) {
      const extraProducts = await Product.find({
        _id: { $ne: product._id, $nin: recommendations.map(r => r._id) }
      }).limit(4 - recommendations.length).lean();
      recommendations = [...recommendations, ...extraProducts];
    }

    res.json(recommendations);
  } catch (error) {
    next(error);
  }
};

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
export const createProductReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findOne({ id: req.params.id });

    if (product) {
      const alreadyReviewed = product.reviews.find(
        (r) => r.user.toString() === req.user._id.toString()
      );

      if (alreadyReviewed) {
        res.status(400);
        throw new Error('Product already reviewed');
      }

      const review = {
        name: req.user.name || 'User',
        rating: Number(rating),
        comment,
        user: req.user._id,
        isVerifiedPurchase: true
      };

      // Calculate new average using moving average to avoid race conditions on the total
      const currentReviewsCount = product.reviewsCount || product.reviews.length || 0;
      const currentRating = product.rating || 0;
      const currentTotalRating = currentRating * currentReviewsCount;
      const newReviewsCount = currentReviewsCount + 1;
      const newRating = (currentTotalRating + Number(rating)) / newReviewsCount;

      await Product.updateOne(
        { _id: product._id },
        {
          $push: { reviews: review },
          $inc: { reviewsCount: 1 },
          $set: { rating: newRating }
        }
      );
      await clearCache('cache:/api/products*');
      res.status(201).json({ message: 'Review added' });
    } else {
      res.status(404);
      throw new Error('Product not found');
    }
  } catch (error) {
    next(error);
  }
};
