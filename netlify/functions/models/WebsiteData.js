import mongoose from 'mongoose';

// Category Subschema (for embedding in website_data)
const CategorySubschema = new mongoose.Schema({
  _id: { type: String },
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: "" },
  image: { type: String, default: "" },
  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { _id: false });

// Product Subschema (for embedding in website_data)
const ProductSubschema = new mongoose.Schema({
  _id: { type: String },
  name: { type: String, trim: true },
  title: { type: String, trim: true },
  slug: { type: String, trim: true },
  shortDescription: { type: String, trim: true, default: "" },
  description: { type: String, trim: true, default: "" },
  images: [{ type: String }],
  category: { type: String, required: true },
  regularPrice: { type: Number, required: true },
  salePrice: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  productType: {
    type: String,
    enum: ['minoxidil', 'derma_roller', 'combo', 'shampoo', 'other'],
    default: 'minoxidil'
  },
  comboItems: [
    {
      name: String,
      quantity: Number,
      description: String
    }
  ],
  badge: { type: String, default: "" },
  keyBenefits: [{ type: String }],
  specifications: [
    {
      label: String,
      value: String
    }
  ],
  carouselOrder: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { _id: false });

// Main Consolidated Website Data Schema
const WebsiteDataSchema = new mongoose.Schema({
  _id: { type: String, default: "main" },
  version: { type: Number, default: 1 },

  siteSettings: {
    siteName: { type: String, default: "Hair Shurokkha Bangladesh" },
    logoText: { type: String, default: "Hair Shurokkha" },
    logoUrl: { type: String, default: "" },
    tagline: { type: String, default: "Science-Backed Hair Restoration & Scalp Wellness" },
    currency: { type: String, default: "৳" },
    contactPhone: { type: String, default: "+880 1711-234567" },
    contactEmail: { type: String, default: "support@hairshurokkha.bd" },
    whatsappNumber: { type: String, default: "+8801711234567" },
    address: { type: String, default: "Banani, Dhaka, Bangladesh" },
    socialLinks: {
      facebook: { type: String, default: "" },
      instagram: { type: String, default: "" },
      youtube: { type: String, default: "" }
    }
  },

  navigation: {
    items: [
      {
        label: String,
        href: String,
        isSection: Boolean
      }
    ]
  },

  hero: {
    badge: String,
    title: String,
    subtitle: String,
    primaryBtnText: String,
    primaryBtnLink: String,
    secondaryBtnText: String,
    secondaryBtnLink: String,
    heroImage: String,
    desktopImage: String,
    mobileImage: String,
    rating: String,
    trustBadges: [
      {
        label: String,
        sub: String
      }
    ]
  },

  productCarousel: {
    enabled: { type: Boolean, default: true },
    title: String,
    subtitle: String
  },

  sections: {
    startNow: {
      enabled: { type: Boolean, default: true },
      title: String,
      subtitle: String,
      content: String,
      bulletPoints: [String],
      ctaText: String,
      ctaLink: String,
      image: String,
      desktopImage: String,
      mobileImage: String
    },
    hairThinning: {
      enabled: { type: Boolean, default: true },
      title: String,
      subtitle: String,
      intro: String,
      stages: [
        {
          stageNumber: String,
          title: String,
          description: String,
          badge: String,
          icon: String,
          image: String
        }
      ],
      ctaText: String,
      ctaLink: String
    },
    howMinoxidilWorks: {
      enabled: { type: Boolean, default: true },
      title: String,
      subtitle: String,
      mechanismPoints: [
        {
          step: String,
          title: String,
          description: String
        }
      ],
      scienceNote: String,
      image: String,
      desktopImage: String,
      mobileImage: String,
      ctaText: String,
      ctaLink: String
    },
    progressTimeline: {
      enabled: { type: Boolean, default: true },
      title: String,
      subtitle: String,
      disclaimer: String,
      stages: [
        {
          stage: String,
          period: String,
          title: String,
          description: String,
          image: String,
          highlight: String
        }
      ]
    },
    usageGuide: {
      enabled: { type: Boolean, default: true },
      title: String,
      subtitle: String,
      safetyNotice: String,
      steps: [
        {
          stepNumber: String,
          title: String,
          description: String,
          image: String
        }
      ],
      image: String,
      desktopImage: String,
      mobileImage: String
    }
  },

  featuredProducts: {
    title: String,
    subtitle: String,
    enabled: { type: Boolean, default: true }
  },

  deliverySettings: {
    insideDhakaFee: { type: Number, default: 70 },
    outsideDhakaFee: { type: Number, default: 130 },
    estimatedInsideDays: { type: String, default: "1-2 Business Days" },
    estimatedOutsideDays: { type: String, default: "2-4 Business Days" },
    freeShippingThreshold: { type: Number, default: 0 }
  },

  footer: {
    aboutText: String,
    copyrightText: String,
    quickLinks: [{ label: String, href: String }],
    legalLinks: [{ label: String, href: String }],
    showCODNotice: { type: Boolean, default: true }
  },

  seo: {
    metaTitle: String,
    metaDescription: String,
    ogImage: String
  },

  metaSettings: {
    pixelId: String,
    capiAccessToken: String, // Kept server-side, stripped from public website-data responses!
    testEventCode: String,
    isPixelEnabled: { type: Boolean, default: true },
    isCapiEnabled: { type: Boolean, default: true },
    isLoggingEnabled: { type: Boolean, default: true },
    logRetentionDays: { type: Number, default: 7 }
  },

  categories: [CategorySubschema],
  products: [ProductSubschema]
}, {
  collection: 'website_data',
  timestamps: true,
  strict: false // allows flexible nested fields without unintentional stripping
});

export default mongoose.models.WebsiteData || mongoose.model('WebsiteData', WebsiteDataSchema);

