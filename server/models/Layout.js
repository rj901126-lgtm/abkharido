import mongoose from 'mongoose';

const layoutSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    unique: true, // e.g., 'home_page', 'footer', 'header'
  },
  components: [
    {
      id: { type: String, required: true },
      type: { type: String, required: true }, // e.g., 'banner_carousel', 'category_row', 'deals_row'
      title: { type: String }, // e.g., "Smart Mobiles & Accessories"
      order: { type: Number }, // To control sorting in UI
      data: { type: mongoose.Schema.Types.Mixed } // Can hold array of image URLs or Category references
    }
  ],
  seo: {
    title: { type: String, default: '' },
    metaDesc: { type: String, default: '' },
    ogImage: { type: String, default: '' }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Layout = mongoose.models.Layout || mongoose.model('Layout', layoutSchema);
export default Layout;
