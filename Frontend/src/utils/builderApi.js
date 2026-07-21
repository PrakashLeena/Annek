const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function parseSseStream(response, handlers) {
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Request failed.");
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("Streaming not supported.");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() || "";

    for (const part of parts) {
      const lines = part.split("\n");
      let event = "message";
      let data = "";
      for (const line of lines) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        if (line.startsWith("data:")) data += line.slice(5).trim();
      }
      if (!data) continue;
      try {
        const parsed = JSON.parse(data);
        if (event === "status") handlers.onStatus?.(parsed);
        else if (event === "message") handlers.onMessage?.(parsed);
        else if (event === "complete") handlers.onComplete?.(parsed);
        else if (event === "error") handlers.onError?.(parsed);
      } catch {
        /* ignore malformed chunks */
      }
    }
  }
}

async function streamRequest(path, body, token, handlers) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API}/ai/website${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  await parseSseStream(response, handlers);
}

export async function generateWebsite(prompt, token, handlers) {
  return streamRequest("/generate", { prompt }, token, handlers);
}

export async function updateWebsite(payload, token, handlers) {
  return streamRequest("/update", payload, token, handlers);
}

export async function saveProject(data, token) {
  const res = await fetch(`${API}/ai/website/project`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to save project.");
  return json;
}

export async function updateSavedProject(id, data, token) {
  const res = await fetch(`${API}/ai/website/project/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to update project.");
  return json;
}

export async function loadProject(id, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${API}/ai/website/project/${id}`, { headers });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to load project.");
  return json;
}

export async function listProjects(token) {
  const res = await fetch(`${API}/ai/website/projects`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to list projects.");
  return json;
}

export async function restoreVersion(projectId, version, token) {
  const res = await fetch(`${API}/ai/website/project/${projectId}/restore`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ version }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to restore version.");
  return json;
}

export async function exportWebsite(spec, token) {
  const res = await fetch(`${API}/ai/website/export`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ spec }),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || "Export failed.");
  }
  return res.blob();
}

export { API };
