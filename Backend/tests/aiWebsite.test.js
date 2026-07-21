const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeSpec,
  validateSpec,
  validateAiResponse,
  createEmptySpec,
  getRelevantContext,
} = require("../services/websiteSchema");
const { applyChanges } = require("../services/specPatcher");
const { processAiResult, mapApiError } = require("../services/aiService");
const { exportToHtml } = require("../services/htmlExporter");

describe("websiteSchema", () => {
  it("rejects empty prompt validation at service level", () => {
    const spec = createEmptySpec("Test Site");
    assert.ok(spec.project.name);
    assert.ok(spec.sections.length >= 2);
  });

  it("validates a normalized spec", () => {
    const spec = normalizeSpec({
      project: { name: "Coffee Shop", description: "Modern cafe" },
      theme: { primaryColor: "#5c4ef8", mode: "dark" },
      sections: [
        { id: "nav", type: "navbar", logo: "Brew", links: [{ label: "Home", href: "#" }] },
        { id: "hero", type: "hero", title: "Welcome" },
        { id: "foot", type: "footer", copyright: "2026" },
      ],
      pages: [{ name: "Home", path: "/", sectionIds: ["nav", "hero", "foot"] }],
    });
    const result = validateSpec(spec);
    assert.equal(result.valid, true);
  });

  it("strips unsafe content", () => {
    const spec = normalizeSpec({
      project: { name: "<script>alert(1)</script>Cafe" },
      sections: [{ id: "h", type: "hero", title: "javascript:alert(1)" }],
    });
    assert.ok(!spec.project.name.includes("<script>"));
  });
});

describe("validateAiResponse", () => {
  it("accepts create_website response", () => {
    const r = validateAiResponse({
      action: "create_website",
      message: "Done",
      spec: { project: { name: "X" }, sections: [] },
    });
    assert.equal(r.valid, true);
  });

  it("rejects invalid action", () => {
    const r = validateAiResponse({ action: "hack", message: "x" });
    assert.equal(r.valid, false);
  });
});

describe("specPatcher", () => {
  it("updates theme incrementally", () => {
    const base = createEmptySpec("Site");
    const updated = applyChanges(base, [
      { target: "theme", operation: "update", changes: { primaryColor: "#9333ea", mode: "dark" } },
    ]);
    assert.equal(updated.theme.primaryColor, "#9333ea");
    assert.equal(updated.theme.mode, "dark");
    assert.ok(updated.sections.length >= base.sections.length);
  });

  it("adds a pricing section", () => {
    const base = createEmptySpec("SaaS");
    const updated = applyChanges(base, [
      {
        target: "pricing",
        operation: "add",
        changes: {
          id: "pricing_main",
          type: "pricing",
          title: "Plans",
          items: [{ title: "Pro", price: "$29", period: "/mo", features: ["Unlimited"] }],
        },
      },
    ]);
    assert.ok(updated.sections.some((s) => s.type === "pricing"));
  });
});

describe("processAiResult", () => {
  it("processes create response", () => {
    const result = processAiResult({
      action: "create_website",
      message: "Built your portfolio",
      spec: {
        project: { name: "Portfolio", description: "AI engineer" },
        sections: [
          { id: "n", type: "navbar", logo: "Dev" },
          { id: "h", type: "hero", title: "Hello" },
          { id: "f", type: "footer" },
        ],
        pages: [{ name: "Home", path: "/", sectionIds: ["n", "h", "f"] }],
      },
    });
    assert.equal(result.action, "create_website");
    assert.equal(result.spec.project.name, "Portfolio");
  });

  it("maps API errors safely", () => {
    assert.match(mapApiError(new Error("NVIDIA_API_KEY missing")), /not configured/i);
    assert.match(mapApiError(new Error("random fail")), /couldn't generate/i);
  });
});

describe("htmlExporter", () => {
  it("exports valid HTML", () => {
    const html = exportToHtml(createEmptySpec("Export Test"));
    assert.ok(html.includes("<!DOCTYPE html>"));
    assert.ok(html.includes("Export Test"));
    assert.ok(!html.includes("<script>alert"));
  });
});

describe("context management", () => {
  it("returns relevant sections for hero edit", () => {
    const spec = normalizeSpec({
      project: { name: "X" },
      sections: [
        { id: "hero_main", type: "hero", title: "Hero" },
        { id: "about", type: "about", title: "About" },
        { id: "foot", type: "footer" },
      ],
    });
    const ctx = getRelevantContext(spec, "update the hero section");
    assert.ok(ctx.relevantSections.some((s) => s.type === "hero"));
  });
});
