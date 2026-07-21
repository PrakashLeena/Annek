const express = require("express");
const WebsiteProject = require("../models/WebsiteProject");
const {
  generateWebsite,
  updateWebsite,
  mapApiError,
} = require("../services/aiService");
const {
  normalizeSpec,
  validateSpec,
  getRelevantContext,
  sanitizeString,
} = require("../services/websiteSchema");
const { exportToHtml } = require("../services/htmlExporter");
const { optionalAuth, requireAuth } = require("../middleware/auth");
const {
  aiGenerateLimiter,
  aiUpdateLimiter,
  aiProjectLimiter,
  validatePromptBody,
} = require("../middleware/aiSecurity");

const router = express.Router();

router.use(aiProjectLimiter);
router.use(validatePromptBody);

function sendSse(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function setupSse(res) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
}

async function assertProjectAccess(project, user) {
  if (!project.userId) return true;
  if (!user?.uid) return false;
  return project.userId === user.uid;
}

function pushVersion(project, spec, label) {
  const version = (project.currentVersion || 0) + 1;
  project.versions.push({
    version,
    label: sanitizeString(label, 200) || `Version ${version}`,
    websiteSpecification: spec,
    createdAt: new Date(),
  });
  if (project.versions.length > 20) {
    project.versions = project.versions.slice(-20);
  }
  project.currentVersion = version;
  project.websiteSpecification = spec;
  return version;
}

// POST /api/ai/website/generate — SSE stream
router.post("/generate", optionalAuth, aiGenerateLimiter, async (req, res) => {
  setupSse(res);
  const { prompt } = req.body || {};

  try {
    const result = await generateWebsite(prompt, {
      onStatus: (stage) => sendSse(res, "status", stage),
    });

    sendSse(res, "message", { role: "assistant", content: result.message });
    sendSse(res, "complete", {
      action: result.action,
      spec: result.spec,
      message: result.message,
    });
    res.end();
  } catch (err) {
    console.error("AI generate error:", err.message);
    sendSse(res, "error", { error: mapApiError(err) });
    res.end();
  }
});

// POST /api/ai/website/update — SSE stream
router.post("/update", optionalAuth, aiUpdateLimiter, async (req, res) => {
  setupSse(res);
  const { message, spec, projectId, conversationHistory } = req.body || {};

  try {
    let existingSpec = spec ? normalizeSpec(spec) : null;

    if (projectId) {
      const project = await WebsiteProject.findById(projectId);
      if (!project) throw new Error("Project not found.");
      if (!(await assertProjectAccess(project, req.user))) {
        sendSse(res, "error", { error: "Unauthorized." });
        return res.end();
      }
      existingSpec = project.websiteSpecification;
    }

    const context = getRelevantContext(existingSpec, message);
    const recentConversation = Array.isArray(conversationHistory)
      ? conversationHistory.slice(-6)
      : [];

    const result = await updateWebsite(
      message,
      existingSpec,
      { ...context, recentConversation },
      { onStatus: (stage) => sendSse(res, "status", stage) }
    );

    sendSse(res, "message", { role: "assistant", content: result.message });
    sendSse(res, "complete", {
      action: result.action,
      spec: result.spec,
      message: result.message,
      changes: result.changes,
    });
    res.end();
  } catch (err) {
    console.error("AI update error:", err.message);
    sendSse(res, "error", { error: mapApiError(err) });
    res.end();
  }
});

// GET /api/ai/website/projects — list user projects
router.get("/projects", requireAuth, async (req, res) => {
  try {
    const projects = await WebsiteProject.find({ userId: req.user.uid })
      .select("name description currentVersion createdAt updatedAt originalPrompt")
      .sort({ updatedAt: -1 })
      .limit(50);
    res.json(projects);
  } catch {
    res.status(500).json({ error: "Failed to load projects." });
  }
});

// GET /api/ai/website/project/:id
router.get("/project/:id", optionalAuth, async (req, res) => {
  try {
    const project = await WebsiteProject.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found." });
    if (!(await assertProjectAccess(project, req.user))) {
      return res.status(403).json({ error: "Unauthorized." });
    }
    res.json(project);
  } catch {
    res.status(500).json({ error: "Failed to load project." });
  }
});

// POST /api/ai/website/project — create/save
router.post("/project", requireAuth, async (req, res) => {
  try {
    const { name, description, originalPrompt, spec, conversationHistory } = req.body || {};
    const normalized = normalizeSpec(spec);
    const validation = validateSpec(normalized);
    if (!validation.valid) {
      return res.status(400).json({ error: "Invalid website specification." });
    }

    const project = await WebsiteProject.create({
      userId: req.user.uid,
      name: sanitizeString(name || normalized.project?.name, 120) || "Untitled Website",
      description: sanitizeString(description || normalized.project?.description, 500),
      originalPrompt: sanitizeString(originalPrompt, 8000),
      websiteSpecification: normalized,
      conversationHistory: Array.isArray(conversationHistory)
        ? conversationHistory.slice(-50).map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: sanitizeString(m.content, 5000),
            timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
          }))
        : [],
      currentVersion: 1,
      versions: [
        {
          version: 1,
          label: "Initial website",
          websiteSpecification: normalized,
          createdAt: new Date(),
        },
      ],
      metadata: { lastAction: "create" },
    });

    res.status(201).json(project);
  } catch (err) {
    console.error("Save project error:", err.message);
    res.status(500).json({ error: "Failed to save project." });
  }
});

// PUT /api/ai/website/project/:id
router.put("/project/:id", requireAuth, async (req, res) => {
  try {
    const project = await WebsiteProject.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found." });
    if (project.userId !== req.user.uid) {
      return res.status(403).json({ error: "Unauthorized." });
    }

    const { name, spec, conversationHistory, versionLabel } = req.body || {};
    if (spec) {
      const normalized = normalizeSpec(spec);
      const validation = validateSpec(normalized);
      if (!validation.valid) {
        return res.status(400).json({ error: "Invalid website specification." });
      }
      pushVersion(project, normalized, versionLabel || "Manual save");
    }
    if (name) project.name = sanitizeString(name, 120);
    if (Array.isArray(conversationHistory)) {
      project.conversationHistory = conversationHistory.slice(-50).map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: sanitizeString(m.content, 5000),
        timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
      }));
    }

    await project.save();
    res.json(project);
  } catch {
    res.status(500).json({ error: "Failed to update project." });
  }
});

// POST /api/ai/website/project/:id/restore
router.post("/project/:id/restore", requireAuth, async (req, res) => {
  try {
    const project = await WebsiteProject.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found." });
    if (project.userId !== req.user.uid) {
      return res.status(403).json({ error: "Unauthorized." });
    }

    const { version } = req.body || {};
    const snapshot = project.versions.find((v) => v.version === Number(version));
    if (!snapshot) return res.status(404).json({ error: "Version not found." });

    pushVersion(
      project,
      snapshot.websiteSpecification,
      `Restored version ${version}`
    );
    await project.save();
    res.json(project);
  } catch {
    res.status(500).json({ error: "Failed to restore version." });
  }
});

// GET /api/ai/website/project/:id/export
router.get("/project/:id/export", optionalAuth, async (req, res) => {
  try {
    let spec = null;
    if (req.params.id === "preview" && req.query.spec) {
      spec = normalizeSpec(JSON.parse(req.query.spec));
    } else {
      const project = await WebsiteProject.findById(req.params.id);
      if (!project) return res.status(404).json({ error: "Project not found." });
      if (!(await assertProjectAccess(project, req.user))) {
        return res.status(403).json({ error: "Unauthorized." });
      }
      spec = project.websiteSpecification;
    }

    const html = exportToHtml(normalizeSpec(spec));
    const filename = `${sanitizeString(spec.project?.name, 40) || "website"}.html`.replace(/\s+/g, "-");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(html);
  } catch {
    res.status(500).json({ error: "Failed to export website." });
  }
});

// POST /api/ai/website/export — export from spec without saving
router.post("/export", optionalAuth, async (req, res) => {
  try {
    const { spec } = req.body || {};
    const normalized = normalizeSpec(spec);
    const validation = validateSpec(normalized);
    if (!validation.valid) {
      return res.status(400).json({ error: "Invalid website specification." });
    }
    const html = exportToHtml(normalized);
    const filename = `${sanitizeString(normalized.project?.name, 40) || "website"}.html`.replace(/\s+/g, "-");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(html);
  } catch {
    res.status(500).json({ error: "Failed to export website." });
  }
});

module.exports = router;
