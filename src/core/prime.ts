/** A project or role name that is safe to use as one path segment. */
export const SEGMENT_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

/** The element names the prime and guide text use; text inside them cannot forge these. */
const ENVELOPE = [
  "flume_prime",
  "workflow",
  "workflow_missing",
  "server_not_running",
  "flume_not_set_up",
  "guides",
  "guide",
  "guide_missing",
];
const ENVELOPE_RE = new RegExp(`<(/?)(${ENVELOPE.join("|")})(?=[\\s>/]|$)`, "g");

/** Text for inside an element: any tag of ours in it (opening or closing) is neutralized. */
export function xmlText(text: string): string {
  return text.replace(ENVELOPE_RE, "&lt;$1$2");
}

/** A value for inside a double-quoted attribute. */
export function xmlAttr(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** `<tag attrs>`, the text on its own lines, `</tag>`; attrs with an empty value are left out. */
export function xmlBlock(
  tag: string,
  attrs: Record<string, string | undefined>,
  text: string,
): string {
  return `${xmlOpen(tag, attrs)}\n${xmlText(text.replace(/\n+$/, ""))}\n</${tag}>\n`;
}

export function xmlOpen(tag: string, attrs: Record<string, string | undefined>): string {
  const a = Object.entries(attrs)
    .filter(([, v]) => v)
    .map(([k, v]) => ` ${k}="${xmlAttr(v as string)}"`)
    .join("");
  return `<${tag}${a}>`;
}
