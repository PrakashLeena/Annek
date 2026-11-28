/* Public site data from the API, fetched once and shared by every page.
   `initial` comes from the pre-rendered page (window.__ANNEK_DATA__) so hydration sees the same
   data the build rendered; the browser then refreshes everything from the live API. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { EMPTY_DATA, publicFeedback, publicPortfolio } from "./data";

const API = import.meta.env.VITE_API_URL || "/api";
const SiteDataContext = createContext(null);

export function SiteDataProvider({ initial, children }) {
  const [data, setData] = useState(() => ({ ...EMPTY_DATA, ...(initial || {}) }));
  const [order, setOrder] = useState(null); // null = closed, string = selected package

  useEffect(() => {
    const put = (key, value) => setData((d) => ({ ...d, [key]: value }));
    const get = (path, key, ok = (d) => d, map = (d) => d) =>
      fetch(`${API}${path}`).then((r) => (r.ok ? r.json() : null)).then((d) => { if (d && ok(d)) put(key, map(d)); }).catch(() => {});
    get("/settings", "settings");
    get("/catalog", "catalog");
    get("/products", "products", Array.isArray);
    get("/portfolio", "portfolio", Array.isArray, publicPortfolio);
    get("/feedback", "feedback", Array.isArray, publicFeedback);
    get("/google-reviews", "google", (d) => Array.isArray(d.reviews));
    get("/stats", "stats");
  }, []);

  const openOrder = useCallback((preset) => setOrder(typeof preset === "string" ? preset : ""), []);
  const closeOrder = useCallback(() => setOrder(null), []);

  const value = useMemo(() => ({ ...data, order, openOrder, closeOrder }), [data, order, openOrder, closeOrder]);
  return <SiteDataContext.Provider value={value}>{children}</SiteDataContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSiteData() {
  const ctx = useContext(SiteDataContext);
  if (!ctx) throw new Error("useSiteData must be used inside <SiteDataProvider>");
  return ctx;
}
