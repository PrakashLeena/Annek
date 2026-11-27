/**
 * /api/catalog — Sector 1: Client Services & built-in packages
 *
 * Public
 *   GET    /api/catalog                    visible categories, templates, packages, maintenance plans
 * Admin (Firebase admin token required)
 *   GET    /api/catalog/admin              everything, including hidden items
 *   POST   /api/catalog/:resource          create   (resource = categories | templates | packages | maintenance)
 *   PUT    /api/catalog/:resource/:id      update
 *   DELETE /api/catalog/:resource/:id      delete
 */
const express = require("express");
const router = express.Router();
const { ServiceCategory, ShowcaseTemplate, ServicePackage, MaintenancePlan } = require("../models/Catalog");
const { requireAdmin } = require("../middleware/adminAuth");
const { upload, readBody, isId, uploadImage, sendError, publicCache } = require("../services/adminCrud");

const RESOURCES = {
  categories:  { Model: ServiceCategory },
  templates:   { Model: ShowcaseTemplate, image: "annek/templates" },
  packages:    { Model: ServicePackage },
  maintenance: { Model: MaintenancePlan },
};
const SORT = { order: 1, createdAt: 1 };

async function loadAll(onlyVisible) {
  const q = onlyVisible ? { visible: true } : {};
  const [categories, templates, packages, maintenancePlans] = await Promise.all([
    ServiceCategory.find(q).sort(SORT).lean(),
    ShowcaseTemplate.find(q).sort(SORT).lean(),
    ServicePackage.find(q).sort(SORT).lean(),
    MaintenancePlan.find(q).sort(SORT).lean(),
  ]);
  if (onlyVisible) {
    // Hide items whose category (or parent category) is hidden.
    const ok = new Set(categories.map((c) => String(c._id)));
    const visibleCats = categories.filter((c) => !c.parent || ok.has(String(c.parent)));
    const okCats = new Set(visibleCats.map((c) => String(c._id)));
    return {
      categories: visibleCats,
      templates: templates.filter((t) => okCats.has(String(t.category))),
      packages: packages.filter((p) => okCats.has(String(p.category))),
      maintenancePlans,
    };
  }
  return { categories, templates, packages, maintenancePlans };
}

router.get("/", async (req, res) => {
  try {
    publicCache(res);
    res.json(await loadAll(true));
  } catch (err) { sendError(res, err, "Failed to load catalog."); }
});

router.get("/admin", requireAdmin, async (req, res) => {
  try { res.json(await loadAll(false)); }
  catch (err) { sendError(res, err, "Failed to load catalog."); }
});

// Starter structure from the revamp plan (only when the catalog is empty).
const STARTER = [
  { name: "Mobile Applications", icon: "📱", description: "Ready-made app templates, customised for your business and maintained every month.",
    subs: ["E-Commerce / Online Selling Apps", "Marketing Apps", "Business Apps"] },
  { name: "Web Applications", icon: "🌐", description: "Websites and web apps built from proven templates, with monthly maintenance included.",
    subs: ["E-Commerce", "Portfolio", "Institute Platforms", "Industry Solutions"] },
  { name: "Custom Software", icon: "🛠️", description: "Software tailored to how your business works, with ongoing support.",
    subs: ["Business Management", "Inventory & POS", "Custom Automation"] },
];

router.post("/admin/seed", requireAdmin, async (req, res) => {
  try {
    if (await ServiceCategory.exists({})) {
      return res.status(409).json({ error: "Categories already exist. Starter structure was not added." });
    }
    let order = 0;
    for (const main of STARTER) {
      const parent = await ServiceCategory.create({ name: main.name, icon: main.icon, description: main.description, order: order++ });
      let subOrder = 0;
      for (const name of main.subs) await ServiceCategory.create({ name, parent: parent._id, order: subOrder++ });
    }
    res.status(201).json(await loadAll(false));
  } catch (err) { sendError(res, err, "Failed to add starter structure."); }
});

function resource(req, res, next) {
  const def = RESOURCES[req.params.resource];
  if (!def) return res.status(404).json({ error: "Unknown catalog resource." });
  req.resource = def;
  next();
}

function maybeUpload(req, res, next) {
  if (!req.resource.image) return next();
  upload.single("image")(req, res, (err) => (err ? res.status(400).json({ error: err.message }) : next()));
}

async function validateRefs(name, data, selfId) {
  const fail = (msg) => { const e = new Error(msg); e.status = 400; throw e; };
  if (name === "categories") {
    if (data.parent === "" || data.parent === undefined) data.parent = null;
    if (data.parent) {
      if (!isId(data.parent)) fail("Invalid parent category.");
      if (selfId && String(data.parent) === String(selfId)) fail("A category cannot be its own parent.");
      const parent = await ServiceCategory.findById(data.parent).lean();
      if (!parent) fail("Parent category not found.");
      if (parent.parent) fail("Subcategories can only sit under a main category.");
      if (selfId && (await ServiceCategory.exists({ parent: selfId }))) fail("This category has subcategories, so it must stay a main category.");
    }
  }
  if (name === "templates" || name === "packages") {
    if (data.category !== undefined) {
      if (!isId(data.category) || !(await ServiceCategory.exists({ _id: data.category }))) fail("Choose a valid category.");
    }
  }
  if (name === "packages") {
    if (data.maintenancePlan === "" || data.maintenancePlan === undefined) data.maintenancePlan = null;
    if (data.maintenancePlan && (!isId(data.maintenancePlan) || !(await MaintenancePlan.exists({ _id: data.maintenancePlan })))) {
      fail("Choose a valid maintenance plan.");
    }
  }
}

router.post("/:resource", requireAdmin, resource, maybeUpload, async (req, res) => {
  try {
    const data = readBody(req);
    await validateRefs(req.params.resource, data);
    const imageUrl = await uploadImage(req.file, req.resource.image);
    if (imageUrl) data.imageUrl = imageUrl;
    const doc = await req.resource.Model.create(data);
    res.status(201).json(doc);
  } catch (err) { sendError(res, err, "Failed to create item."); }
});

router.put("/:resource/:id", requireAdmin, resource, maybeUpload, async (req, res) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ error: "Invalid id." });
    const doc = await req.resource.Model.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found." });
    const data = readBody(req);
    await validateRefs(req.params.resource, data, req.params.id);
    const imageUrl = await uploadImage(req.file, req.resource.image);
    if (imageUrl) data.imageUrl = imageUrl;
    doc.set(data);
    await doc.save();
    res.json(doc);
  } catch (err) { sendError(res, err, "Failed to update item."); }
});

router.delete("/:resource/:id", requireAdmin, resource, async (req, res) => {
  try {
    const { id, resource: name } = req.params;
    if (!isId(id)) return res.status(400).json({ error: "Invalid id." });
    if (name === "categories") {
      const [subs, tpls, pkgs] = await Promise.all([
        ServiceCategory.countDocuments({ parent: id }),
        ShowcaseTemplate.countDocuments({ category: id }),
        ServicePackage.countDocuments({ category: id }),
      ]);
      if (subs || tpls || pkgs) {
        return res.status(409).json({ error: `Move or delete its ${subs} subcategories, ${tpls} templates and ${pkgs} packages first.` });
      }
    }
    if (name === "maintenance") {
      await ServicePackage.updateMany({ maintenancePlan: id }, { $set: { maintenancePlan: null } });
    }
    const gone = await req.resource.Model.findByIdAndDelete(id);
    if (!gone) return res.status(404).json({ error: "Not found." });
    res.json({ success: true });
  } catch (err) { sendError(res, err, "Failed to delete item."); }
});

module.exports = router;
