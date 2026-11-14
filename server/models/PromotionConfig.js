import mongoose from 'mongoose';

const promotionConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'storefront' },
  announcement: { type: mongoose.Schema.Types.Mixed, default: null },
  flashDeals: { type: mongoose.Schema.Types.Mixed, default: null },
  heroBanners: { type: [mongoose.Schema.Types.Mixed], default: [] },
  categoryBanners: { type: mongoose.Schema.Types.Mixed, default: {} },
  vipCategories: { type: [mongoose.Schema.Types.Mixed], default: [] }
}, { timestamps: true });

const PromotionConfig = mongoose.models.PromotionConfig || mongoose.model('PromotionConfig', promotionConfigSchema);
export default PromotionConfig;
