import { useCallback, useRef, useState } from "react";
import { auth } from "../firebase";
import {
  generateWebsite,
  updateWebsite,
  saveProject,
  updateSavedProject,
  exportWebsite,
  restoreVersion,
} from "../utils/builderApi";

export function useWebsiteBuilder() {
  const [spec, setSpec] = useState(null);
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [projectId, setProjectId] = useState(null);
  const [versions, setVersions] = useState([]);
  const [currentVersion, setCurrentVersion] = useState(0);
  const [device, setDevice] = useState("desktop");
  const abortRef = useRef(false);

  const getToken = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return null;
    return user.getIdToken();
  }, []);

  const appendMessage = useCallback((role, content) => {
    setMessages((prev) => [
      ...prev,
      { role, content, timestamp: new Date().toISOString() },
    ]);
  }, []);

  const handleStream = useCallback(
    (userContent) => ({
      onStatus: (stage) => setStatus(stage?.message || stage),
      onMessage: (msg) => {
        if (msg?.content) appendMessage("assistant", msg.content);
      },
      onComplete: (result) => {
        setSpec(result.spec);
        setStatus(null);
        setLoading(false);
        if (result.message) {
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && last.content === result.message) return prev;
            return [
              ...prev,
              { role: "assistant", content: result.message, timestamp: new Date().toISOString() },
            ];
          });
        }
      },
      onError: (err) => {
        setError(err.error || "Something went wrong.");
        setStatus(null);
        setLoading(false);
      },
    }),
    [appendMessage]
  );

  const generate = useCallback(
    async (prompt) => {
      if (!prompt?.trim() || loading) return;
      setError(null);
      setLoading(true);
      setStatus("Understanding your idea...");
      appendMessage("user", prompt.trim());

      try {
        const token = await getToken();
        await generateWebsite(prompt.trim(), token, handleStream(prompt));
      } catch (err) {
        setError(err.message || "Sorry, I couldn't generate your website right now. Please try again.");
        setLoading(false);
        setStatus(null);
      }
    },
    [appendMessage, getToken, handleStream, loading]
  );

  const edit = useCallback(
    async (message) => {
      if (!message?.trim() || loading || !spec) return;
      setError(null);
      setLoading(true);
      setStatus("Understanding your idea...");
      appendMessage("user", message.trim());

      try {
        const token = await getToken();
        await updateWebsite(
          {
            message: message.trim(),
            spec,
            projectId,
            conversationHistory: messages.slice(-8),
          },
          token,
          handleStream(message)
        );
      } catch (err) {
        setError(err.message || "Sorry, I couldn't update your website right now. Please try again.");
        setLoading(false);
        setStatus(null);
      }
    },
    [appendMessage, getToken, handleStream, loading, messages, projectId, spec]
  );

  const save = useCallback(async () => {
    if (!spec) return null;
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Sign in with Google to save projects.");

      const payload = {
        name: spec.project?.name,
        description: spec.project?.description,
        originalPrompt: messages.find((m) => m.role === "user")?.content || "",
        spec,
        conversationHistory: messages,
        versionLabel: `Version ${(currentVersion || 0) + 1}`,
      };

      let project;
      if (projectId) {
        project = await updateSavedProject(projectId, payload, token);
      } else {
        project = await saveProject(payload, token);
        setProjectId(project._id);
      }
      setVersions(project.versions || []);
      setCurrentVersion(project.currentVersion || 1);
      return project;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, [currentVersion, getToken, messages, projectId, spec]);

  const download = useCallback(async () => {
    if (!spec) return;
    setError(null);
    try {
      const token = await getToken();
      const blob = await exportWebsite(spec, token);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(spec.project?.name || "website").replace(/\s+/g, "-")}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || "Export failed.");
    }
  }, [getToken, spec]);

  const restore = useCallback(
    async (version) => {
      if (!projectId) return;
      setError(null);
      try {
        const token = await getToken();
        const project = await restoreVersion(projectId, version, token);
        setSpec(project.websiteSpecification);
        setVersions(project.versions || []);
        setCurrentVersion(project.currentVersion);
        appendMessage("assistant", `Restored version ${version}.`);
      } catch (err) {
        setError(err.message);
      }
    },
    [appendMessage, getToken, projectId]
  );

  const loadFromProject = useCallback((project) => {
    setSpec(project.websiteSpecification);
    setProjectId(project._id);
    setMessages(project.conversationHistory || []);
    setVersions(project.versions || []);
    setCurrentVersion(project.currentVersion || 1);
  }, []);

  const reset = useCallback(() => {
    abortRef.current = true;
    setSpec(null);
    setMessages([]);
    setStatus(null);
    setLoading(false);
    setError(null);
    setProjectId(null);
    setVersions([]);
    setCurrentVersion(0);
  }, []);

  return {
    spec,
    messages,
    status,
    loading,
    error,
    projectId,
    versions,
    currentVersion,
    device,
    setDevice,
    setError,
    generate,
    edit,
    save,
    download,
    restore,
    loadFromProject,
    reset,
  };
}
