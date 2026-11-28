import { useEffect } from "react";
import { PAGES } from "./pages.js";
import { applyHead, buildHead, privateHead } from "./head.js";

/* Keeps <head> in sync with the current page. The pre-rendered HTML already has the same tags. */
export default function useSeo(key, ctx) {
  const page = PAGES[key];
  const head = buildHead(page, ctx);
  const sig = JSON.stringify(head);
  useEffect(() => { applyHead(JSON.parse(sig)); }, [sig]);
}

export function usePrivateHead(title, robots) {
  useEffect(() => { applyHead(privateHead(title, robots)); }, [title, robots]);
}
