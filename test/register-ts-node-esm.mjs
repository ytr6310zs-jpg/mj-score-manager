import { register } from "node:module";

/**
 * Registers the ts-node ESM loader for Node test commands so ESM tests can import
 * TypeScript modules directly after the package is marked as type=module.
 */
register("ts-node/esm", new URL("../", import.meta.url));
