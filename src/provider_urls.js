"use strict";
const PROVIDER_URLS_URL = "https://raw.githubusercontent.com/realbestia1/easystreams/refs/heads/main/provider_urls.json";
const REMOTE_RELOAD_INTERVAL_MS = 10000;
const REMOTE_FETCH_TIMEOUT_MS = 5000;

const ALIASES = {
  animeunity: ["animeunuty", "anime_unity"],
  animeworld: ["anime_world"],
  animesaturn: ["anime_saturn"],
  streamingcommunity: ["streaming_community"],
  guardahd: ["guarda_hd"],
  guardaserie: ["guarda_serie"],
  guardoserie: ["guardo_serie"],
  mapping_api: ["mappingapi", "mapping_api_url", "mapping_url"]
};

let lastData = {};
let lastRemoteCheckAt = 0;
let remoteInFlight = null;

function normalizeKey(key) {
  return String(key || "").trim().toLowerCase();
}

function normalizeUrl(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.replace(/\/+$/, "");
}

function toNormalizedMap(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out = {};
  for (const [key, value] of Object.entries(raw)) {
    const normalizedKey = normalizeKey(key);
    const normalizedValue = normalizeUrl(value);
    if (!normalizedKey || !normalizedValue) continue;
    out[normalizedKey] = normalizedValue;
  }
  return out;
}

function reloadProviderUrlsIfNeeded() {
  // Local provider URLs are intentionally disabled; only remote is used.
}

function getFetchImpl() {
  if (typeof fetch === "function") return fetch.bind(globalThis);
  return null;
}

function createTimeoutSignal(timeoutMs) {
  const parsed = Number.parseInt(String(timeoutMs), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return { signal: undefined, cleanup: null };
  }

  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return { signal: AbortSignal.timeout(parsed), cleanup: null };
  }

  if (typeof AbortController !== "undefined" && typeof setTimeout === "function") {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), parsed);
    return {
      signal: controller.signal,
      cleanup: () => clearTimeout(timeoutId)
    };
  }

  return { signal: undefined, cleanup: null };
}

async function refreshProviderUrlsFromRemoteIfNeeded(force = false) {
  if (!PROVIDER_URLS_URL) return;
  if (remoteInFlight) return;

  const now = Date.now();
  if (!force && now - lastRemoteCheckAt < REMOTE_RELOAD_INTERVAL_MS) return;
  lastRemoteCheckAt = now;

  const fetchImpl = getFetchImpl();
  if (!fetchImpl) return;

  remoteInFlight = (async () => {
    const timeoutConfig = createTimeoutSignal(REMOTE_FETCH_TIMEOUT_MS);

    try {
      const response = await fetchImpl(PROVIDER_URLS_URL, {
        signal: timeoutConfig.signal,
        headers: {
          "accept": "application/json"
        }
      });
      if (!response || !response.ok) return;
      const payload = await response.json();
      const parsed = toNormalizedMap(payload);
      if (Object.keys(parsed).length > 0) {
        lastData = parsed;
      }
    } catch {
      // Ignore remote refresh errors: keep last known values.
    } finally {
      if (typeof timeoutConfig.cleanup === "function") timeoutConfig.cleanup();
      remoteInFlight = null;
    }
  })();
}

function findFromJson(providerKey) {
  refreshProviderUrlsFromRemoteIfNeeded(false);
  const key = normalizeKey(providerKey);
  const candidates = [key, ...(ALIASES[key] || [])].map(normalizeKey);
  for (const candidate of candidates) {
    const value = normalizeUrl(lastData[candidate]);
    if (value) return value;
  }
  return "";
}

function getProviderUrl(providerKey) {
  const fromJson = findFromJson(providerKey);
  return fromJson || "";
}

function getProviderUrlsFilePath() {
  return "";
}

function getProviderUrlsSourceUrl() {
  return PROVIDER_URLS_URL;
}

module.exports = {
  getProviderUrl,
  reloadProviderUrlsIfNeeded,
  getProviderUrlsFilePath,
  getProviderUrlsSourceUrl
};

// Start with empty data; remote refresh will populate in background.
lastData = {};
refreshProviderUrlsFromRemoteIfNeeded(true);
