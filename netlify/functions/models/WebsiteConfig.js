import mongoose from 'mongoose';

const WebsiteConfigSchema = new mongoose.Schema({
  _id: { type: String, default: "main" },
  siteSettings: {
    siteName: { type: String, default: "Regrow Hair Care Bangladesh" },
    logoText: { type: String, default: "REGROW" },
    logoUrl: { type: String, default: "" },
    tagline: { type: String, default: "Science-Backed Hair Restoration & Scalp Wellness" },
    currency: { type: String, default: "৳" },
    contactPhone: { type: String, default: "+880 1711-234567" },
    contactEmail: { type: String, default: "support@regrowhaircare.bd" },
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
    capiAccessToken: String,
    testEventCode: String,
    isPixelEnabled: { type: Boolean, default: true },
    isCapiEnabled: { type: Boolean, default: true },
    isLoggingEnabled: { type: Boolean, default: true },
    logRetentionDays: { type: Number, default: 7 }
  }
}, { timestamps: true });

export default mongoose.models.WebsiteConfig || mongoose.model('WebsiteConfig', WebsiteConfigSchema);

