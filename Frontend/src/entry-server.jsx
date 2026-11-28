/* Build-time renderer, bundled by `vite build --ssr` and used by scripts/prerender.mjs.
   Never shipped to the browser. */
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { AppRoutes } from "./Root.jsx";

export { PAGES } from "./seo/pages.js";
export { buildHead, headToHtml, privateHead } from "./seo/head.js";
export { EMPTY_DATA, prerenderSafe, publicFeedback, publicPortfolio } from "./site/data.js";

export function render(url, data) {
  return renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <AppRoutes initialData={data} />
      </StaticRouter>
    </StrictMode>,
  );
}
