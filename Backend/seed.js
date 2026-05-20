require("dotenv").config();
const mongoose = require("mongoose");
const Portfolio = require("./models/Portfolio");

const projects = [
  {
    title: "Lumina Beauty Studio",
    category: "Booking Site",
    desc: "A sleek appointment booking platform for a premium beauty salon with automated scheduling.",
    accent: "#e91e8c",
    tags: ["Booking System", "Payments", "Mobile-first"],
    imageUrl: "",
    visible: true,
  },
  {
    title: "Verdant Organic Co.",
    category: "E-Commerce",
    desc: "A nature-inspired online store with full product management and checkout flow.",
    accent: "#2e7d32",
    tags: ["E-Commerce", "Shopify", "SEO"],
    imageUrl: "",
    visible: true,
  },
  {
    title: "Nova Architecture",
    category: "Portfolio",
    desc: "An award-winning architectural firm's portfolio showcasing projects with immersive galleries.",
    accent: "#1565c0",
    tags: ["Portfolio", "Gallery", "Animations"],
    imageUrl: "",
    visible: true,
  },
  {
    title: "Apex Fitness Club",
    category: "Business Site",
    desc: "A high-energy gym website with class schedules, memberships, and trainer bios.",
    accent: "#f57f17",
    tags: ["Business", "Membership", "Blog"],
    imageUrl: "",
    visible: true,
  },
  {
    title: "Drift Coffee Roasters",
    category: "Restaurant",
    desc: "A cozy artisan coffee brand site with an online shop and storytelling content.",
    accent: "#4e342e",
    tags: ["Restaurant", "Shop", "Branding"],
    imageUrl: "",
    visible: true,
  },
  {
    title: "Skyline Legal Group",
    category: "Corporate",
    desc: "A professional law firm website with practice areas, team profiles, and consultation booking.",
    accent: "#4527a0",
    tags: ["Corporate", "Booking", "Multi-page"],
    imageUrl: "",
    visible: true,
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { tls: true, serverSelectionTimeoutMS: 10000 });
    console.log("✅ Connected to MongoDB");

    const existing = await Portfolio.countDocuments();
    if (existing > 0) {
      console.log(`ℹ️  Portfolio already has ${existing} items. Skipping seed.`);
      console.log("   To re-seed, delete the collection first.");
    } else {
      await Portfolio.insertMany(projects);
      console.log(`✅ Seeded ${projects.length} portfolio projects.`);
    }
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

seed();
