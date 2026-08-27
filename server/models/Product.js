import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number, required: true },
  discount: { type: Number },
  stock: { type: Number, default: 0 },
  sku: { type: String }
}, { _id: false });

const colorModelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  primaryImage: { type: String, required: true },
  imagesInput: { type: String }, // Used in admin form context
  images: [{ type: String }],
  variants: [variantSchema]
}, { _id: false });

const specSchema = new mongoose.Schema({
  key: { type: String, required: true },
  value: { type: String, required: true }
}, { _id: false });

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  name: { type: String, required: true },
  rating: { type: Number, required: true },
  comment: { type: String, required: true },
  isVerifiedPurchase: { type: Boolean, default: false }
}, {
  timestamps: true
});


const productSchema = new mongoose.Schema({
  id: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  }, // e.g., iphone-16-pro
  name: { type: String, required: true, index: true },
  category: { type: String, required: true, index: true },
  description: { type: String, required: true },
  
  // Default Pricing & Stock (if no colorModels selected)
  price: { type: Number, required: true },
  originalPrice: { type: Number, required: true },
  inStock: { type: Boolean, default: true },
  stock: { type: Number, default: 0 },
  sku: { type: String, sparse: true },
  hsnCode: { type: String },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Flash Sale Engine
  flashSale: {
    isActive: { type: Boolean, default: false },
    price: { type: Number },
    endTime: { type: Date }
  },

  // Services
  hasProCare: { type: Boolean, default: false },



  // Imagery
  image: { type: String, required: true },
  images: [{ type: String }],
  
  // Ratings & Reviews
  rating: { type: Number, default: 4.5 },
  reviewsCount: { type: Number, default: 0 },
  reviews: [reviewSchema],
  
  // SEO
  seo: {
    metaTitle: { type: String },
    metaDescription: { type: String },
    keywords: { type: String }
  },
  
  // Affiliation / Creator Economy
  userCommissionRate: { type: Number, default: 0.02 },
  sellerId: { type: String, ref: 'User' },
  
  // Nested structured data
  highlights: [{ type: String }],
  features: [{ type: String }],
  specs: [specSchema],
  colorModels: [colorModelSchema]
}, { 
  timestamps: true 
});

// Phase 3: Advanced Search Engine Text Index
productSchema.index({
  name: 'text',
  category: 'text',
  description: 'text',
  'colorModels.name': 'text'
}, {
  weights: {
    name: 10,
    category: 5,
    'colorModels.name': 3,
    description: 1
  },
  name: 'AdvancedProductSearchIndex'
});

// Phase 6: Additional Database Optimization
productSchema.index({ vendorId: 1, createdAt: -1 }); // Fast lookup for seller dashboards
productSchema.index({ sellerId: 1, createdAt: -1 });
productSchema.index({ category: 1, price: 1 }); // Fast lookup for category browsing with price filters

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
export default Product;
