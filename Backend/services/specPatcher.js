const { normalizeSection, normalizeSpec, makeId } = require("./websiteSchema");

function applyChanges(spec, changes) {
  if (!Array.isArray(changes) || changes.length === 0) {
    return spec;
  }

  const next = JSON.parse(JSON.stringify(spec));

  for (const change of changes) {
    if (!change || typeof change !== "object") continue;
    const { target, operation = "update", changes: payload } = change;

    if (target === "theme" && payload && typeof payload === "object") {
      next.theme = { ...next.theme, ...payload };
      continue;
    }

    if (target === "project" && payload && typeof payload === "object") {
      next.project = { ...next.project, ...payload };
      continue;
    }

    if (target === "navigation" && payload && typeof payload === "object") {
      next.navigation = { ...next.navigation, ...payload };
      const navIdx = next.sections.findIndex((s) => s.type === "navbar");
      if (navIdx >= 0) {
        next.sections[navIdx] = normalizeSection(
          { ...next.sections[navIdx], ...payload, type: "navbar" },
          navIdx
        );
      }
      continue;
    }

    if (target === "footer") {
      if (operation === "update" && payload) {
        next.footer = { ...next.footer, ...payload };
      }
      continue;
    }

    if (target === "sections" && operation === "replace" && Array.isArray(payload)) {
      next.sections = payload.map(normalizeSection).filter(Boolean);
      next.pages = next.pages?.length
        ? [{ ...next.pages[0], sectionIds: next.sections.map((s) => s.id) }]
        : [{ name: "Home", path: "/", sectionIds: next.sections.map((s) => s.id) }];
      continue;
    }

    const sectionIdx = next.sections.findIndex((s) => s.id === target);
    if (sectionIdx >= 0) {
      if (operation === "remove") {
        next.sections.splice(sectionIdx, 1);
        next.pages = next.pages.map((p) => ({
          ...p,
          sectionIds: p.sectionIds.filter((id) => id !== target),
        }));
      } else if (operation === "replace" && payload) {
        next.sections[sectionIdx] = normalizeSection(
          { ...payload, id: target, type: payload.type || next.sections[sectionIdx].type },
          sectionIdx
        );
      } else if (operation === "update" && payload) {
        next.sections[sectionIdx] = normalizeSection(
          { ...next.sections[sectionIdx], ...payload, id: target },
          sectionIdx
        );
      }
      continue;
    }

    if (operation === "add" && payload) {
      const newSection = normalizeSection(
        { ...payload, id: payload.id || makeId(payload.type || "section") },
        next.sections.length
      );
      if (newSection) {
        next.sections.push(newSection);
        if (next.pages[0]) {
          const footerIdx = next.sections.findIndex((s) => s.type === "footer");
          if (footerIdx >= 0) {
            const ids = next.pages[0].sectionIds.filter((id) => id !== newSection.id);
            ids.splice(footerIdx, 0, newSection.id);
            next.pages[0].sectionIds = ids;
          } else {
            next.pages[0].sectionIds.push(newSection.id);
          }
        }
      }
    }
  }

  return normalizeSpec(next);
}

module.exports = { applyChanges };
