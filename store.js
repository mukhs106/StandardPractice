/* Standard Practice / Office for Exceptions
   All persistence: one namespaced localStorage key, a schema version, and an
   in-memory fallback when storage is unavailable. */

import { STAGES, initialState } from './machine.js';

const KEY = 'standard-practice.case';
const SCHEMA = 2;

const LEGACY_KEY = 'standard-practice';
const LEGACY_NAME_PREFIX = 'standard-practice:';

// Used only once storage has failed in this session.
let memory = null;
let storageFailed = false;

// The previous build kept its state in sessionStorage and window.name.
function removeLegacyState() {
  try { window.sessionStorage.removeItem(LEGACY_KEY); } catch (e) {}
  try {
    if (window.name.indexOf(LEGACY_NAME_PREFIX) === 0) window.name = '';
  } catch (e) {}
}

function isUsable(stored) {
  return !!stored
    && stored.schema === SCHEMA
    && STAGES.includes(stored.state && stored.state.stage)
    && Array.isArray(stored.state.events)
    && Array.isArray(stored.state.documents);
}

// Returns the saved case, or a fresh one if nothing usable is stored.
export function load() {
  removeLegacyState();

  if (storageFailed && memory) return memory;

  let stored = null;
  try {
    stored = JSON.parse(window.localStorage.getItem(KEY));
  } catch (e) {
    stored = null;
  }
  return isUsable(stored) ? stored.state : initialState();
}

export function save(state) {
  memory = state;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ schema: SCHEMA, state }));
    storageFailed = false;
  } catch (e) {
    storageFailed = true;
  }
}

export function clear() {
  memory = null;
  storageFailed = false;
  try { window.localStorage.removeItem(KEY); } catch (e) {}
}
