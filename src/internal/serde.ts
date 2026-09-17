/**
 * Wire-format helpers shared by every control-plane model.
 *
 * The control plane speaks `snake_case`, the TypeScript API speaks
 * `camelCase`. Conversion happens in exactly two places: request bodies are
 * converted to the wire form before they are serialized, and decoded response
 * bodies are converted to the API form before they are typed.
 *
 * @internal
 */

/** Reports whether a decoded JSON value is a plain object. @internal */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Converts a `camelCase` property name to the `snake_case` name the control
 * plane expects.
 *
 * @internal
 */
function toSnakeCase(name: string): string {
  return name.replace(/[A-Z]/g, (character, offset: number) =>
    offset === 0 ? character.toLowerCase() : `_${character.toLowerCase()}`,
  );
}

/**
 * Converts a `snake_case` wire property name to the `camelCase` API name.
 *
 * @internal
 */
function toCamelCase(name: string): string {
  return name.replace(/_([a-z0-9])/g, (_match, character: string) => character.toUpperCase());
}

/**
 * Recursively converts every key of a decoded JSON value from `snake_case` to
 * `camelCase`, leaving values untouched.
 *
 * @param value - A value decoded from a JSON response body.
 * @returns The same shape with `camelCase` keys.
 *
 * @internal
 */
export function fromWire(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => fromWire(item));
  }
  if (!isRecord(value)) {
    return value;
  }
  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    result[toCamelCase(key)] = fromWire(entry);
  }
  return result;
}

/**
 * Recursively converts every key of a request value from `camelCase` to
 * `snake_case`.
 *
 * `undefined` properties are omitted, matching the control plane's treatment of
 * unset optionals. `null` is preserved on purpose: request models use `null` to
 * clear a required-but-nullable field even though `undefined` means "leave it
 * alone".
 *
 * @param value - A request model.
 * @returns A JSON-ready value with `snake_case` keys.
 *
 * @internal
 */
export function toWire(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => toWire(item));
  }
  if (!isRecord(value)) {
    return value;
  }
  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (entry === undefined) {
      continue;
    }
    result[toSnakeCase(key)] = toWire(entry);
  }
  return result;
}
