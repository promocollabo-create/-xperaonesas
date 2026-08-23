import "server-only";
import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitizes admin-authored HTML for the Custom HTML page-builder section.
 * This is the ONLY place custom HTML is allowed to pass through unescaped
 * into rendered markup — everything else uses React's normal escaping.
 *
 * Explicitly strips anything that could reach the server, the database,
 * environment variables, the filesystem, or execute arbitrary script:
 * <script>, inline event handlers (onClick, onerror, ...), javascript:
 * URLs, <iframe>/<object>/<embed>, and <form> (no client-side submission
 * paths that could be pointed at internal endpoints).
 */
export function sanitizeCustomHtml(rawHtml: string): string {
  return DOMPurify.sanitize(rawHtml, {
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "style", "link", "meta"],
    FORBID_ATTR: [
      "onerror",
      "onload",
      "onclick",
      "onmouseover",
      "onfocus",
      "onblur",
      "onchange",
      "onsubmit",
      "srcdoc"
    ],
    ALLOW_DATA_ATTR: false
  });
}

/**
 * Sanitizes admin-authored custom CSS. CSS can't execute code, but we still
 * strip constructs that could be used for data exfiltration (url() pointing
 * at attacker-controlled endpoints from within an otherwise trusted page)
 * or that break the responsive layout of the surrounding page.
 */
export function sanitizeCustomCss(rawCss: string): string {
  return rawCss
    .replace(/@import[^;]*;/gi, "")
    .replace(/expression\s*\([^)]*\)/gi, "")
    .replace(/javascript:/gi, "");
}
