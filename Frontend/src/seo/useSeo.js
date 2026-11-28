import { useEffect } from "react";
import { PAGES } from "./pages.js";
import { applyHead, buildHead, privateHead } from "./head.js";

/* Keeps <head> in sync with the current page. The pre-rendered HTML already has the same tags. */
export default function useSeo(key, ctx) {
  usePageHead(PAGES[key], ctx);
}

/* Same, for pages built from data (portfolio projects). `page` null = leave the head alone. */
export function usePageHead(page, ctx) {
  const head = page ? buildHead(page, ctx) : null;
  const sig = head ? JSON.stringify(head) : "";
  useEffect(() => { if (sig) applyHead(JSON.parse(sig)); }, [sig]);
}

export function usePrivateHead(title, robots) {
  useEffect(() => { applyHead(privateHead(title, robots)); }, [title, robots]);
}
