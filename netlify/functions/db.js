import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

let cachedConnection = null;
let isConnected = false;

// Default initial website config data
export const defaultWebsiteConfig = {
  _id: "main",
  siteSettings: {
    siteName: "Hair Shurokkha Bangladesh",
    logoText: "Hair Shurokkha",
    logoUrl: "/images/hair-shurokkha-logo-transparent.png",
    tagline: "Science-Backed Hair Restoration & Scalp Wellness",
    currency: "৳",
    contactPhone: "+880 1711-234567",
    contactEmail: "support@hairshurokkha.bd",
    whatsappNumber: "+8801711234567",
    address: "House 42, Road 11, Banani, Dhaka-1213, Bangladesh",
    socialLinks: {
      facebook: "https://facebook.com/hairshurokkhabd",
      instagram: "https://instagram.com/hairshurokkhabd",
      youtube: "https://youtube.com/@hairshurokkhabd"
    }
  },
  navigation: {
    items: [
      { label: "Home", href: "#hero", isSection: true },
      { label: "Shop", href: "/shop", isSection: false },
      { label: "Hair Thinning", href: "#hair-thinning", isSection: true },
      { label: "How It Works", href: "#how-it-works", isSection: true },
      { label: "Progress", href: "#progress", isSection: true },
      { label: "How to Use", href: "#how-to-use", isSection: true },
      { label: "Contact", href: "#contact", isSection: true },
    ]
  },
  hero: {
    badge: "100% Authentic Guaranteed",
    title: "Your Hair Care Journey Starts Here.",
    subtitle: "Reactivate dormant hair follicles, increase scalp blood microcirculation, and reclaim thicker hair with dermatologically proven Minoxidil 5% and micro-needling systems.",
    primaryBtnText: "Shop Now",
    primaryBtnLink: "/shop",
    secondaryBtnText: "How to Use",
    secondaryBtnLink: "#how-to-use",
    heroImage: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=1000&auto=format&fit=crop&q=80",
    rating: "4.9 / 5.0 Rating across Bangladesh",
    trustBadges: [
      { label: "Authentic Sourced", sub: "100% Genuine USA Formulation" },
      { label: "Fast Cash on Delivery", sub: "Inside & Outside Dhaka" },
      { label: "7-Day Inspection", sub: "Check package before payment" }
    ]
  },
  productCarousel: {
    enabled: true,
    title: "Quick Product Selector",
    subtitle: "Tap any product to explore complete details & packages",
  },
  sections: {
    startNow: {
      enabled: true,
      title: "It's Not Too Late to Start Now.",
      subtitle: "Early intervention makes the critical difference between miniaturized and restored follicles.",
      content: "Hair thinning is a progressive biological process. DHT (Dihydrotestosterone) gradually binds to vulnerable receptors, shrinking follicles and shortening growth cycles. However, as long as hair follicles remain alive, targeted topical stimulation can help restore blood flow, nutrients, and cellular regeneration.",
      bulletPoints: [
        "Follicles remain viable years before irreversible dormancy occurs.",
        "Topical Minoxidil dilates micro-capillaries to supply oxygen and vital amino acids.",
        "Derma rolling enhances topical absorption up to 3x while stimulating collagen synthesis."
      ],
      ctaText: "Explore Hair Care Products",
      ctaLink: "/shop",
      image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80"
    },
    hairThinning: {
      enabled: true,
      title: "Understanding Hair Thinning",
      subtitle: "Why hair loses density and how early detection saves thinning crowns & temples.",
      intro: "Pattern thinning is not an overnight event; it develops silently across months. Here is what happens beneath the scalp surface:",
      stages: [
        {
          stageNumber: "01",
          title: "Healthy Hair Follicles",
          description: "Follicles are deeply rooted in the dermal layer. Blood vessels supply ample oxygen and nutrients, keeping 85-90% of hairs in the active growing (Anagen) phase.",
          badge: "Phase 1: Normal",
          icon: "ShieldCheck"
        },
        {
          stageNumber: "02",
          title: "Miniaturization Begins",
          description: "DHT sensitivity constricts micro-vessels. Hair shafts become progressively finer, shorter, and brittle as the growth phase shortens drastically.",
          badge: "Phase 2: Warning",
          icon: "TrendingDown"
        },
        {
          stageNumber: "03",
          title: "Visible Scalp Exposure",
          description: "Without topical stimulation, hairs shed faster than they can regenerate, leading to widened part lines, receding temples, and thinning crowns.",
          badge: "Phase 3: Action Required",
          icon: "AlertCircle"
        }
      ],
      ctaText: "Start Recovery Routine",
      ctaLink: "/shop"
    },
    howMinoxidilWorks: {
      enabled: true,
      title: "How Does Minoxidil Work?",
      subtitle: "The dermatological science behind follicular reactivation and prolonged Anagen growth.",
      mechanismPoints: [
        {
          step: "01",
          title: "Potassium Channel Opening",
          description: "Minoxidil acts as a potassium channel opener, widening cell membranes and encouraging cellular hyperpolarization."
        },
        {
          step: "02",
          title: "Micro-Vascular Vasodilation",
          description: "Expands constricted scalp capillaries, boosting immediate oxygen and nutrient delivery directly to dormant follicle roots."
        },
        {
          step: "03",
          title: "Prolonging the Anagen Phase",
          description: "Transitions prematurely resting (Telogen) follicles back into vigorous, prolonged active growth (Anagen) cycles."
        },
        {
          step: "04",
          title: "Thicker Shaft Diameter",
          description: "Over consistent application, renewed follicles produce visibly thicker, darker terminal hairs with greater root anchorage."
        }
      ],
      scienceNote: "Topical Minoxidil 5% is recommended worldwide by dermatologists as the first-line non-surgical treatment for both vertex and crown hair thinning.",
      image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=80",
      ctaText: "View Minoxidil Solutions",
      ctaLink: "/shop"
    },
    progressTimeline: {
      enabled: true,
      title: "Every Journey Takes Time",
      subtitle: "What to realistically expect with consistent daily application. Results vary by individual.",
      disclaimer: "Important: Consistent twice-daily application is essential. Individual biological response, timeline, and degree of recovery naturally vary.",
      stages: [
        {
          stage: "Stage 1",
          period: "Month 1",
          title: "Adjustment & Shedding Phase",
          description: "Old, miniaturized resting telogen hairs shed to make room for healthier new follicles. This shedding is normal and a sign of active response.",
          image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
          highlight: "Normal Shedding"
        },
        {
          stage: "Stage 2",
          period: "Month 3",
          title: "Early Vellus Hair Emergence",
          description: "Fine, soft baby hairs begin sprouting in previously thinning areas. Follicle roots gain deeper anchorage and improved micro-circulation.",
          image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80",
          highlight: "Soft Sprouting"
        },
        {
          stage: "Stage 3",
          period: "Month 6",
          title: "Terminal Hair Thickening",
          description: "Vellus hairs mature into pigmented, thicker terminal shafts. Noticeable reduction in scalp visibility and visible density restoration.",
          image: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&auto=format&fit=crop&q=80",
          highlight: "Visible Density"
        },
        {
          stage: "Stage 4",
          period: "Month 9 - 12",
          title: "Optimal Density & Maintenance",
          description: "Full cosmetic density achieved in responsive areas. Continued maintenance routine preserves healthy hair cycles permanently.",
          image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80",
          highlight: "Full Routine"
        }
      ]
    },
    usageGuide: {
      enabled: true,
      title: "How to Use Minoxidil",
      subtitle: "Simple 5-step daily routine for maximum absorption and safety.",
      safetyNotice: "For external scalp use only. Do not exceed 1ml per application. Wash hands thoroughly with soap after use. If scalp irritation or dizziness occurs, discontinue and consult a healthcare professional.",
      steps: [
        {
          stepNumber: "01",
          title: "Cleanse & Dry Scalp",
          description: "Wash your scalp with a gentle shampoo. Ensure hair and scalp are 100% dry before application, as moisture impedes optimal absorption."
        },
        {
          stepNumber: "02",
          title: "Measure Exactly 1 mL",
          description: "Draw 1 mL of Minoxidil 5% solution into the calibrated dropper. Never exceed 1 mL per application, regardless of the area size."
        },
        {
          stepNumber: "03",
          title: "Part Hair & Apply to Scalp",
          description: "Part hair in areas of thinning (vertex, crown, temples). Gently release drops directly onto the scalp surface, not on hair strands."
        },
        {
          stepNumber: "04",
          title: "Gentle Finger Spread",
          description: "Lightly spread the liquid over the target scalp area with your fingertips. Do not vigorously rub. Wash hands immediately."
        },
        {
          stepNumber: "05",
          title: "Allow 4 Hours to Dry",
          description: "Let the solution naturally absorb for at least 4 hours before washing hair, wearing tight hats, or going to sleep."
        }
      ],
      image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80"
    }
  },
  featuredProducts: {
    title: "Recommended Hair Restoration Solutions",
    subtitle: "Dermatologically selected formulations & packages delivered straight to your door across Bangladesh.",
    enabled: true
  },
  deliverySettings: {
    insideDhakaFee: 70,
    outsideDhakaFee: 130,
    estimatedInsideDays: "1 - 2 Business Days",
    estimatedOutsideDays: "2 - 4 Business Days",
    freeShippingThreshold: 0
  },
  footer: {
    aboutText: "Regrow Hair Care is Bangladesh's trusted supplier of genuine dermatological Minoxidil 5% solutions, titanium micro-needling derma rollers, and targeted scalp care combos. Verified authentic, shipped Cash on Delivery nationwide.",
    copyrightText: "© 2026 Regrow Hair Care BD. All rights reserved.",
    quickLinks: [
      { label: "Home", href: "/" },
      { label: "Shop All Products", href: "/shop" },
      { label: "Minoxidil 5% Solutions", href: "/shop?category=Minoxidil" },
      { label: "Derma Rollers", href: "/shop?category=Derma%20Roller" },
      { label: "Combo Packages", href: "/shop?category=Combo%20Packages" }
    ],
    legalLinks: [
      { label: "Shipping Policy", href: "/shipping-policy" },
      { label: "Return & Refund Policy", href: "/refund-policy" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms & Conditions", href: "/terms-and-conditions" }
    ],
    showCODNotice: true
  },
  seo: {
    metaTitle: "Regrow Hair Care — Premium Minoxidil & Scalp Wellness Bangladesh",
    metaDescription: "100% Authentic Minoxidil 5%, 540 Titanium Derma Rollers, and hair recovery packages in Bangladesh. Cash on Delivery available.",
    ogImage: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&auto=format&fit=crop&q=80"
  },
  metaSettings: {
    pixelId: process.env.META_PIXEL_ID || "",
    testEventCode: process.env.META_TEST_EVENT_CODE || "",
    isPixelEnabled: true,
    isCapiEnabled: true,
    isLoggingEnabled: true,
    logRetentionDays: 7
  }
};

// Initial default categories
export const defaultCategories = [
  {
    name: "Minoxidil",
    slug: "minoxidil",
    description: "Authentic topical 5% Minoxidil solutions formulated for crown and vertex hair regrowth.",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80",
    isActive: true,
    displayOrder: 1
  },
  {
    name: "Derma Roller",
    slug: "derma-roller",
    description: "Medical-grade 540 Titanium Micro-Needle Rollers (0.5mm) for enhanced serum penetration.",
    image: "https://images.unsplash.com/photo-1512290900672-1f55b9a4c062?w=600&auto=format&fit=crop&q=80",
    isActive: true,
    displayOrder: 2
  },
  {
    name: "Combo Packages",
    slug: "combo-packages",
    description: "Curated cost-saving bundles including Minoxidil + Derma Rollers + Scalp Applicators.",
    image: "https://images.unsplash.com/photo-1608248597359-54378f4a1ad5?w=600&auto=format&fit=crop&q=80",
    isActive: true,
    displayOrder: 3
  },
  {
    name: "Scalp Care & Accessories",
    slug: "scalp-care",
    description: "Silicone scalp massagers, sanitizing sprays, and precision calibrated droppers.",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80",
    isActive: true,
    displayOrder: 4
  }
];

// Initial default products (8 realistic, high-converting products)
export const defaultProducts = [
  {
    name: "Kirkland Minoxidil 5% Extra Strength Solution (60ml)",
    slug: "kirkland-minoxidil-5-extra-strength-60ml",
    shortDescription: "1-Month supply of authentic USA Kirkland Signature 5% topical solution with calibrated dropper.",
    description: "Kirkland Signature Minoxidil Topical Solution USP 5% is a clinically proven hair regrowth treatment for men experiencing thinning on top of the scalp (vertex). Each 60ml bottle provides a full 30-day supply with regular twice-daily application. Sealed, 100% authentic imported formulation.",
    images: [
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80"
    ],
    category: "Minoxidil",
    regularPrice: 1650,
    salePrice: 1350,
    stock: 75,
    isFeatured: true,
    isActive: true,
    productType: "minoxidil",
    comboItems: [],
    badge: "Best Seller",
    keyBenefits: [
      "Clinically proven 5% topical solution for vertex regrowth",
      "Calibrated 1ml child-resistant dropper included",
      "100% Authentic Kirkland USA imported batch",
      "Restores dormant hair follicles in 2-4 months of consistent use"
    ],
    specifications: [
      { label: "Volume", value: "60 mL (1 Fl. Oz)" },
      { label: "Active Ingredient", value: "Minoxidil 5% w/v" },
      { label: "Origin", value: "USA / Israel" },
      { label: "Application", value: "Twice daily (1 mL per application)" }
    ]
  },
  {
    name: "Derma Roller 540 Titanium Micro-Needles (0.5mm)",
    slug: "titanium-derma-roller-540-05mm",
    shortDescription: "Medical-grade 0.5mm titanium micro-needle roller designed to stimulate scalp blood flow and boost serum absorption.",
    description: "The 540 Titanium Needle Derma Roller creates microscopic micro-channels on the scalp without damaging epidermal tissue. This triggers natural wound healing, boosts collagen production, and enhances the absorption rate of topical Minoxidil solution up to 3x.",
    images: [
      "https://images.unsplash.com/photo-1512290900672-1f55b9a4c062?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80"
    ],
    category: "Derma Roller",
    regularPrice: 650,
    salePrice: 450,
    stock: 120,
    isFeatured: true,
    isActive: true,
    productType: "derma_roller",
    comboItems: [],
    badge: "Popular Tool",
    keyBenefits: [
      "540 Sharp Grade-A Titanium needles",
      "Ideal 0.5mm length for safe scalp microneedling",
      "Multiplies topical absorption efficacy by up to 300%",
      "Ergonomic non-slip handle & protective travel storage case"
    ],
    specifications: [
      { label: "Needle Length", value: "0.5 mm" },
      { label: "Needle Material", value: "Titanium Alloy" },
      { label: "Total Needles", value: "540 cross-aligned" },
      { label: "Recommended Frequency", value: "1 - 2 times per week" }
    ]
  },
  {
    name: "Ultimate Hair Growth Starter Combo (Minoxidil + Derma Roller)",
    slug: "ultimate-hair-growth-starter-combo",
    shortDescription: "The #1 recommended duo: 1 Bottle Kirkland Minoxidil 5% (60ml) + 0.5mm Titanium Derma Roller + Calibrated Dropper.",
    description: "Our best-selling starter combination package provides the two essential tools needed to jumpstart dormant hair follicles. The 0.5mm Derma Roller creates micro-channels 1-2 times weekly, followed by daily Minoxidil 5% application for accelerated follicle activation at substantial package savings.",
    images: [
      "https://images.unsplash.com/photo-1608248597359-54378f4a1ad5?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1512290900672-1f55b9a4c062?w=800&auto=format&fit=crop&q=80"
    ],
    category: "Combo Packages",
    regularPrice: 2300,
    salePrice: 1690,
    stock: 60,
    isFeatured: true,
    isActive: true,
    productType: "combo",
    comboItems: [
      { name: "Kirkland Minoxidil 5% Solution (60ml)", quantity: 1, description: "Full 30-day supply" },
      { name: "540 Titanium Derma Roller (0.5mm)", quantity: 1, description: "With protective case" },
      { name: "Original Calibrated Dropper", quantity: 1, description: "Precise 1ml dosage measurement" }
    ],
    badge: "Top Value Combo",
    keyBenefits: [
      "Complete 2-in-1 synergy package for faster visible results",
      "Save ৳610 compared to buying items separately",
      "Includes comprehensive step-by-step routine guide",
      "Free priority packaging & cash on delivery across Bangladesh"
    ],
    specifications: [
      { label: "Package Contents", value: "Minoxidil 60ml + 0.5mm Roller + Dropper" },
      { label: "Supply Duration", value: "30 Days initial routine" },
      { label: "Compatibility", value: "Crown, vertex, hairline, and beard" }
    ]
  },
  {
    name: "3-Month Intensive Hair Regrowth Pack (3x Minoxidil 5%)",
    slug: "3-month-intensive-minoxidil-pack",
    shortDescription: "Complete 90-day clinical commitment pack. 3x 60ml bottles of authentic Kirkland Minoxidil 5%.",
    description: "Hair restoration requires at least 90 days of consistent cellular stimulation to transition from the initial shedding phase into visible terminal hair growth. The 3-Month Intensive Pack provides uninterrupted supply at our most competitive per-bottle discount.",
    images: [
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80"
    ],
    category: "Minoxidil",
    regularPrice: 4950,
    salePrice: 3750,
    stock: 45,
    isFeatured: true,
    isActive: true,
    productType: "minoxidil",
    comboItems: [
      { name: "Kirkland Minoxidil 5% (60ml)", quantity: 3, description: "Factory sealed bottles" },
      { name: "Original Calibrated Dropper", quantity: 1, description: "USA factory dropper" }
    ],
    badge: "90-Day Challenge",
    keyBenefits: [
      "Covers the critical 90-day biological growth cycle",
      "Substantial cost savings: Only ৳1,250 per bottle",
      "Guarantees uninterrupted daily routine without running out",
      "Sealed authentic batches with long expiration dates"
    ],
    specifications: [
      { label: "Total Volume", value: "180 mL (3 x 60 mL)" },
      { label: "Supply Duration", value: "90 Days (3 Months)" },
      { label: "Active Component", value: "Minoxidil 5% USP" }
    ]
  },
  {
    name: "6-Month Full Box Kirkland Minoxidil (6x 60ml Factory Sealed)",
    slug: "6-month-full-box-kirkland-minoxidil",
    shortDescription: "Original factory-sealed box of 6 Kirkland Minoxidil bottles with original consumer leaflet and dropper.",
    description: "The complete 6-month master box directly imported from authorized distributors. Ideal for users committed to long-term follicular density and maintenance. Comes in the original sealed outer cardboard packaging with authenticity markings.",
    images: [
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80"
    ],
    category: "Minoxidil",
    regularPrice: 9500,
    salePrice: 6990,
    stock: 30,
    isFeatured: true,
    isActive: true,
    productType: "minoxidil",
    comboItems: [
      { name: "Kirkland Minoxidil 5% (60ml)", quantity: 6, description: "Full sealed 6-pack box" },
      { name: "Official Kirkland Applicator Dropper", quantity: 1, description: "Child-resistant" }
    ],
    badge: "Master Box",
    keyBenefits: [
      "Original unopened factory sealed outer carton",
      "Lowest price per bottle in Bangladesh: under ৳1,170/bottle",
      "Complete 6-month continuous recovery cycle",
      "Extended batch shelf-life"
    ],
    specifications: [
      { label: "Quantity", value: "6 Bottles x 60 mL (360 mL Total)" },
      { label: "Duration", value: "6 Months supply" },
      { label: "Packaging", value: "Original Sealed Manufacturer Box" }
    ]
  },
  {
    name: "Pro Scalp Massager & Shampoo Brush (Medical Silicone)",
    slug: "pro-scalp-massager-silicone-brush",
    shortDescription: "Ultra-soft silicone bristles to stimulate microcirculation, deep-clean scalp sebum, and exfoliate buildup.",
    description: "Dermatological silicone scalp scrubber designed for daily shower use. Gently dislodges dead skin cells, DHT buildup, and sebum flakes around hair follicles while stimulating capillary blood circulation for optimal serum penetration.",
    images: [
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80"
    ],
    category: "Scalp Care & Accessories",
    regularPrice: 450,
    salePrice: 290,
    stock: 90,
    isFeatured: false,
    isActive: true,
    productType: "other",
    comboItems: [],
    badge: "Scalp Health",
    keyBenefits: [
      "Soft food-grade silicone bristles safe on sensitive scalps",
      "Stimulates micro-vessel circulation without tangling hair",
      "Helps unclog congested follicle pores from sebum buildup",
      "Non-slip ergonomic grip handle for wet shower use"
    ],
    specifications: [
      { label: "Material", value: "100% Medical-grade silicone" },
      { label: "Design", value: "Waterproof one-piece ergonomic handle" },
      { label: "Use", value: "Wet shampooing or dry scalp massage" }
    ]
  },
  {
    name: "Complete Crown & Scalp Mastery Bundle (3 Minoxidil + Roller + Massager)",
    slug: "complete-crown-scalp-mastery-bundle",
    shortDescription: "All-in-one comprehensive solution: 3x Minoxidil 5% + Titanium 0.5mm Derma Roller + Scalp Massager.",
    description: "Designed for individuals looking for the definitive, end-to-end hair restoration regimen. This comprehensive pack bundles three 60ml bottles of Minoxidil (90 days), the 540 Titanium Derma Roller, and the Silicone Scalp Massager brush at an unbeatable bundle discount.",
    images: [
      "https://images.unsplash.com/photo-1608248597359-54378f4a1ad5?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1512290900672-1f55b9a4c062?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80"
    ],
    category: "Combo Packages",
    regularPrice: 6050,
    salePrice: 4350,
    stock: 25,
    isFeatured: true,
    isActive: true,
    productType: "combo",
    comboItems: [
      { name: "Kirkland Minoxidil 5% (60ml)", quantity: 3, description: "3 Months supply" },
      { name: "540 Titanium Derma Roller (0.5mm)", quantity: 1, description: "Needle sanitizing case" },
      { name: "Scalp Massager Silicone Brush", quantity: 1, description: "Deep circulation booster" },
      { name: "Original 1ml Dropper", quantity: 1, description: "Calibrated applicator" }
    ],
    badge: "Ultimate Bundle",
    keyBenefits: [
      "The most complete non-surgical hair restoration regimen",
      "Saves over ৳1,700 compared to individual retail purchases",
      "All necessary accessories included in one delivery",
      "Free expedited shipping inside or outside Dhaka"
    ],
    specifications: [
      { label: "Package Items", value: "3x Minoxidil + Roller + Scalp Brush + Dropper" },
      { label: "Duration", value: "3 Full Months" },
      { label: "Target", value: "Intensive thinning reversal & density" }
    ]
  },
  {
    name: "0.5mm Replacement Titanium Roller Head & Sanitizer Case",
    slug: "replacement-roller-head-case",
    shortDescription: "Sterile replacement 0.5mm micro-needle roller in UV protective carrying pod.",
    description: "Dermatologists advise replacing derma rollers after 3 to 4 months of use to ensure needles remain ultra-sharp and hygienic. This replacement unit ensures your scalp microneedling routine remains 100% effective and sanitary.",
    images: [
      "https://images.unsplash.com/photo-1512290900672-1f55b9a4c062?w=800&auto=format&fit=crop&q=80"
    ],
    category: "Derma Roller",
    regularPrice: 550,
    salePrice: 380,
    stock: 50,
    isFeatured: false,
    isActive: true,
    productType: "derma_roller",
    comboItems: [],
    badge: "Hygiene Pack",
    keyBenefits: [
      "Fresh precision needles prevent micro-tears",
      "Comes sealed in sterile blister pack",
      "Protective travel storage case included"
    ],
    specifications: [
      { label: "Needles", value: "540 Titanium alloy" },
      { label: "Length", value: "0.5mm" },
      { label: "Sanitization", value: "70% Isopropyl alcohol soak compatible" }
    ]
  }
];

// Consolidated Initial Default Website Data (Document _id: "main")
export const defaultWebsiteData = {
  ...defaultWebsiteConfig,
  _id: "main",
  version: 1,
  updatedAt: new Date(),
  categories: defaultCategories.map((c, i) => ({
    _id: `cat_${c.slug || i + 1}`,
    ...c,
    createdAt: new Date(),
    updatedAt: new Date()
  })),
  products: defaultProducts.map((p, i) => ({
    _id: `prod_${p.slug || i + 1}`,
    ...p,
    createdAt: new Date(),
    updatedAt: new Date()
  }))
};

// In-Memory Storage for immediate resilience (used when MongoDB URI is absent or during offline testing)
class InMemoryStore {
  constructor() {
    this.websiteData = JSON.parse(JSON.stringify(defaultWebsiteData));
    this.orders = [];
    this.admins = [];
  }

  async getWebsiteData() {
    return this.websiteData;
  }

  async updateWebsiteData(data, expectedVersion) {
    if (typeof expectedVersion === 'number' && this.websiteData.version !== expectedVersion) {
      const err = new Error('Conflict: Document version mismatch in memory store');
      err.conflict = true;
      err.currentVersion = this.websiteData.version;
      throw err;
    }
    this.websiteData = {
      ...this.websiteData,
      ...data,
      _id: "main",
      version: (this.websiteData.version || 1) + 1,
      updatedAt: new Date()
    };
    return this.websiteData;
  }

  async getWebsiteConfig() {
    return this.websiteData;
  }

  async updateWebsiteConfig(data) {
    this.websiteData = {
      ...this.websiteData,
      ...data,
      _id: "main",
      version: (this.websiteData.version || 1) + 1,
      updatedAt: new Date()
    };
    return this.websiteData;
  }

  async getCategories() {
    return this.websiteData.categories || [];
  }

  async addCategory(cat) {
    const newCat = {
      _id: `cat_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...cat
    };
    this.websiteData.categories = this.websiteData.categories || [];
    this.websiteData.categories.push(newCat);
    this.websiteData.version = (this.websiteData.version || 1) + 1;
    this.websiteData.updatedAt = new Date();
    return newCat;
  }

  async updateCategory(idOrName, data) {
    const categories = this.websiteData.categories || [];
    const idx = categories.findIndex(c => c._id === idOrName || c.name === idOrName || c.slug === idOrName);
    if (idx !== -1) {
      categories[idx] = { ...categories[idx], ...data, updatedAt: new Date() };
      this.websiteData.version = (this.websiteData.version || 1) + 1;
      this.websiteData.updatedAt = new Date();
      return categories[idx];
    }
    return null;
  }

  async deleteCategory(idOrName) {
    const categories = this.websiteData.categories || [];
    this.websiteData.categories = categories.filter(c => c._id !== idOrName && c.name !== idOrName && c.slug !== idOrName);
    this.websiteData.version = (this.websiteData.version || 1) + 1;
    this.websiteData.updatedAt = new Date();
    return true;
  }

  async getProducts(filter = {}) {
    let list = [...(this.websiteData.products || [])];
    if (filter.category && filter.category !== 'All Products') {
      list = list.filter(p => p.category && p.category.toLowerCase() === filter.category.toLowerCase());
    }
    if (filter.isFeatured !== undefined) {
      list = list.filter(p => p.isFeatured === filter.isFeatured);
    }
    if (filter.isActive !== undefined) {
      list = list.filter(p => p.isActive === filter.isActive);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(p => (p.name && p.name.toLowerCase().includes(q)) || (p.shortDescription && p.shortDescription.toLowerCase().includes(q)));
    }
    return list;
  }

  async getProductBySlug(slug) {
    const products = this.websiteData.products || [];
    return products.find(p => p.slug === slug || p._id === slug) || null;
  }

  async addProduct(prod) {
    const newProd = {
      _id: `prod_${Date.now()}`,
      ...prod,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.websiteData.products = this.websiteData.products || [];
    this.websiteData.products.unshift(newProd);
    this.websiteData.version = (this.websiteData.version || 1) + 1;
    this.websiteData.updatedAt = new Date();
    return newProd;
  }

  async updateProduct(id, data) {
    const products = this.websiteData.products || [];
    const idx = products.findIndex(p => p._id === id || p.slug === id);
    if (idx !== -1) {
      products[idx] = { ...products[idx], ...data, updatedAt: new Date() };
      this.websiteData.version = (this.websiteData.version || 1) + 1;
      this.websiteData.updatedAt = new Date();
      return products[idx];
    }
    return null;
  }

  async deleteProduct(id) {
    const products = this.websiteData.products || [];
    this.websiteData.products = products.filter(p => p._id !== id && p.slug !== id);
    this.websiteData.version = (this.websiteData.version || 1) + 1;
    this.websiteData.updatedAt = new Date();
    return true;
  }

  async getOrders(filter = {}) {
    let list = [...this.orders];
    if (filter.status) {
      list = list.filter(o => o.orderStatus === filter.status);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(o =>
        o.orderId.toLowerCase().includes(q) ||
        o.customer?.phoneNumber?.includes(q) ||
        o.customer?.fullName?.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async getOrderById(orderId) {
    return this.orders.find(o => o.orderId === orderId || o._id === orderId) || null;
  }

  async addOrder(order) {
    const newOrder = {
      _id: `ord_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      statusHistory: [
        {
          status: order.orderStatus || 'Pending',
          timestamp: new Date(),
          note: 'Order placed via Cash on Delivery',
          updatedBy: 'Customer'
        }
      ],
      ...order
    };
    this.orders.unshift(newOrder);
    return newOrder;
  }

  async updateOrderStatus(orderId, status, note, adminUser) {
    const order = this.orders.find(o => o.orderId === orderId || o._id === orderId);
    if (!order) return null;
    order.orderStatus = status;
    order.updatedAt = new Date();
    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Status updated to ${status}`,
      updatedBy: adminUser || 'Admin'
    });
    return order;
  }

  async deleteOrder(orderId) {
    this.orders = this.orders.filter(o => o.orderId !== orderId && o._id !== orderId);
    return true;
  }
}

export const memoryStore = new InMemoryStore();

// Mongoose Connection Helper for Netlify Functions & Express
export async function connectToDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('example.mongodb.net') || uri.trim() === '') {
    // Graceful fallback to memory store
    return { isConnected: false, mode: 'memory' };
  }

  if (cachedConnection && mongoose.connection.readyState === 1) {
    return { isConnected: true, mode: 'mongodb', connection: cachedConnection };
  }

  try {
    cachedConnection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log("Connected to MongoDB Atlas successfully");
    return { isConnected: true, mode: 'mongodb', connection: cachedConnection };
  } catch (err) {
    console.warn("MongoDB Atlas connection attempt failed; falling back to resilient memory store:", err.message);
    return { isConnected: false, mode: 'memory', error: err.message };
  }
}

