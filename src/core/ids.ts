import { randomInt } from "node:crypto";

/** Lowercase letters and digits without i, l, o, 0 and 1. */
export const ID_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
export const ID_LENGTH = 4;
/** Never given to a task. */
export const RESERVED_ID = "xxxx";

export function isValidId(id: unknown): id is string {
  if (typeof id !== "string" || id.length !== ID_LENGTH || id === RESERVED_ID) return false;
  return [...id].every((c) => ID_ALPHABET.includes(c));
}

/** A random ID not in `taken` (pass the IDs of every open and resolved task). */
export function mintId(taken: ReadonlySet<string>): string {
  for (;;) {
    let id = "";
    for (let i = 0; i < ID_LENGTH; i++) id += ID_ALPHABET[randomInt(ID_ALPHABET.length)];
    if (id !== RESERVED_ID && !taken.has(id)) return id;
  }
}
