import type { DocumentTypeDefinition } from '../types';

// ── Document type registry ─────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const registry = new Map<string, DocumentTypeDefinition<any>>();

/**
 * Register a document type definition.
 * Called at module scope by each document type file.
 */
export function registerDocumentType<T extends Record<string, unknown>>(
  definition: DocumentTypeDefinition<T>,
): void {
  if (registry.has(definition.id)) {
    console.warn(`Document type "${definition.id}" is already registered. Overwriting.`);
  }
  registry.set(definition.id, definition);
}

/**
 * Get a document type by ID. Throws if not found.
 */
export function getDocumentType<T extends Record<string, unknown>>(
  id: string,
): DocumentTypeDefinition<T> {
  const def = registry.get(id);
  if (!def) {
    const available = Array.from(registry.keys()).join(', ') || '(none)';
    throw new Error(
      `Unknown document type: "${id}". Available types: ${available}`
    );
  }
  return def as DocumentTypeDefinition<T>;
}

/**
 * List all registered document types. Useful for UI dropdowns.
 */
export function getAvailableDocumentTypes(): { id: string; label: string }[] {
  return Array.from(registry.values()).map((d) => ({ id: d.id, label: d.label }));
}

// ── Auto-register all document types ────────────────────────────────
// Call this once before using the registry (called by extractor.ts)

let initialized = false;

export function ensureDocumentTypesRegistered(): void {
  if (initialized) return;
  initialized = true;

  // Import each document type to trigger its registerDocumentType() call.
  // Adding a new document type = add require() here + create file.
  require('./tax-bill');
  // require('./tax-ordinance');  // uncomment when ready
}
