/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Absolute origin of the Tikerino API, or unset/empty for same origin.
   * Inlined at build time. See resolveApiBaseUrl in src/api.ts.
   */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
