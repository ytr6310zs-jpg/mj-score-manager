import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { clearSharedFilterState, readSharedFilterState, writeSharedFilterState } from "../lib/filter-state-preference.js";

describe("filter-state sync events", () => {
  it("writeSharedFilterState stores and dispatches event", (t, done) => {
    // Provide a minimal window + localStorage + EventTarget polyfill for Node test runner
    if (typeof globalThis.window === 'undefined') {
      const store = Object.create(null);
      const localStorage = {
        getItem(key) { return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null; },
        setItem(key, value) { store[key] = String(value); },
        removeItem(key) { delete store[key]; },
        clear() { for (const k of Object.keys(store)) delete store[k]; },
      };
      const et = new EventTarget();
      globalThis.window = {
        localStorage,
        addEventListener: et.addEventListener.bind(et),
        removeEventListener: et.removeEventListener.bind(et),
        dispatchEvent: et.dispatchEvent.bind(et),
      };
    }

    // clear storage
    clearSharedFilterState();
    window.localStorage.clear();

    const handler = (e) => {
      try {
        const detail = e.detail;
        assert.strictEqual(detail.filter, 'custom');
        const stored = readSharedFilterState();
        assert.ok(stored);
        assert.strictEqual(stored.filter, 'custom');
        window.removeEventListener('mj:shared-filter-changed', handler);
        done();
      } catch (err) {
        window.removeEventListener('mj:shared-filter-changed', handler);
        done(err);
      }
    };

    window.addEventListener('mj:shared-filter-changed', handler);
    writeSharedFilterState({ filter: 'custom', start: '2024-01-01', end: '2024-01-31' });
  });
});
