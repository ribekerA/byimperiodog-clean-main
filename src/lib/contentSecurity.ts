type ContentUrlKind = "link" | "image";

type MdastNode = {
  type: string;
  name?: string | null;
  value?: string;
  url?: string;
  alt?: string;
  children?: MdastNode[];
};

const EXECUTABLE_MDX_NODES = new Set([
  "mdxjsEsm",
  "mdxFlowExpression",
  "mdxTextExpression",
]);

const DROP_JSX_ELEMENTS = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "link",
  "meta",
  "svg",
  "math",
]);

const URL_PROTOCOLS: Record<ContentUrlKind, ReadonlySet<string>> = {
  link: new Set(["http:", "https:", "mailto:", "tel:"]),
  image: new Set(["http:", "https:"]),
};

function protocolCandidate(value: string) {
  let candidate = value.trim().replace(/[\u0000-\u0020\u007f]+/g, "");

  // Percent-encoding is not valid inside a URL scheme, but decoding it here
  // closes browser/parser differences such as java%73cript:.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const decoded = decodeURIComponent(candidate);
      if (decoded === candidate) break;
      candidate = decoded;
    } catch {
      break;
    }
  }

  return candidate.toLowerCase();
}

/**
 * Allows navigation URLs used by Markdown while rejecting executable schemes.
 * Relative URLs and anchors are valid; images are limited to HTTP(S) or local
 * paths, so data:/blob: payloads never reach the renderer.
 */
export function sanitizeMdxUrl(value: unknown, kind: ContentUrlKind = "link"): string | undefined {
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 2_048 || /[\u0000-\u001f\u007f]/.test(trimmed)) {
    return undefined;
  }

  const candidate = protocolCandidate(trimmed);
  const scheme = candidate.match(/^([a-z][a-z0-9+.-]*):/i)?.[1];

  if (scheme) {
    const protocol = `${scheme}:`;
    return URL_PROTOCOLS[kind].has(protocol) ? trimmed : undefined;
  }

  // Backslashes are interpreted inconsistently by URL parsers and browsers.
  if (trimmed.includes("\\")) return undefined;

  if (kind === "image" && (!trimmed.startsWith("/") || trimmed.startsWith("//"))) {
    return undefined;
  }

  return trimmed;
}

function sanitizeChildren(parent: MdastNode) {
  if (!Array.isArray(parent.children)) return;
  parent.children = parent.children.flatMap(sanitizeNode);
}

function sanitizeNode(node: MdastNode): MdastNode[] {
  if (EXECUTABLE_MDX_NODES.has(node.type) || node.type === "html") {
    return [];
  }

  if (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") {
    const tagName = node.name?.toLowerCase();
    if (tagName && DROP_JSX_ELEMENTS.has(tagName)) return [];

    // The public blog does not expose arbitrary JSX components. Unwrap benign
    // JSX instead of compiling its attributes, which could include handlers or
    // expressions. Text inside formatting tags is preserved.
    sanitizeChildren(node);
    return node.children ?? [];
  }

  if (node.type === "link") {
    const safeUrl = sanitizeMdxUrl(node.url, "link");
    sanitizeChildren(node);
    if (!safeUrl) return node.children ?? [];
    node.url = safeUrl;
    return [node];
  }

  if (node.type === "image") {
    const safeUrl = sanitizeMdxUrl(node.url, "image");
    if (!safeUrl) {
      return node.alt ? [{ type: "text", value: node.alt }] : [];
    }
    node.url = safeUrl;
    return [node];
  }

  if (node.type === "definition" && !sanitizeMdxUrl(node.url, "link")) {
    return [];
  }

  sanitizeChildren(node);
  return [node];
}

/** Remark plugin applied before any MDX is compiled or evaluated. */
export function remarkMdxSecurityPlugin() {
  return (tree: MdastNode) => {
    sanitizeChildren(tree);
  };
}

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Serializes JSON safely inside a <script type="application/ld+json"> tag. */
export function safeJsonLdStringify(value: unknown): string {
  try {
    const json = JSON.stringify(value) ?? "null";
    return json
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      .replace(/&/g, "\\u0026")
      .replace(/\u2028/g, "\\u2028")
      .replace(/\u2029/g, "\\u2029");
  } catch {
    return "null";
  }
}
