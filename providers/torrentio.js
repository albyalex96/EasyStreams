var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/formatter.js
var require_formatter = __commonJS({
  "src/formatter.js"(exports2, module2) {
    function normalizePlaybackHeaders(headers) {
      if (!headers || typeof headers !== "object") return headers;
      const normalized = {};
      for (const [key, value] of Object.entries(headers)) {
        if (value == null) continue;
        const lowerKey = String(key).toLowerCase();
        if (lowerKey === "user-agent") normalized["User-Agent"] = value;
        else if (lowerKey === "referer" || lowerKey === "referrer") normalized["Referer"] = value;
        else if (lowerKey === "origin") normalized["Origin"] = value;
        else if (lowerKey === "accept") normalized["Accept"] = value;
        else if (lowerKey === "accept-language") normalized["Accept-Language"] = value;
        else normalized[key] = value;
      }
      return normalized;
    }
    function shouldForceNotWebReadyForPlugin(stream, providerName, headers, behaviorHints) {
      const text = [
        stream == null ? void 0 : stream.url,
        stream == null ? void 0 : stream.name,
        stream == null ? void 0 : stream.title,
        stream == null ? void 0 : stream.server,
        providerName
      ].filter(Boolean).join(" ").toLowerCase();
      if (text.includes("loadm") || text.includes("loadm.cam") || text.includes("mixdrop") || text.includes("mxcontent")) {
        return true;
      }
      return false;
    }
    function normalizeProviderId(providerName) {
      const normalized = String(providerName || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
      return normalized || void 0;
    }
    function formatStream2(stream, providerName) {
      let quality = stream.quality || "";
      if (quality === "2160p") quality = "\u{1F525}4K UHD";
      else if (quality === "1440p") quality = "\u2728 QHD";
      else if (quality === "1080p") quality = "\u{1F680} FHD";
      else if (quality === "720p") quality = "\u{1F4BF} HD";
      else if (quality === "576p" || quality === "480p" || quality === "360p" || quality === "240p") quality = "\u{1F4A9} Low Quality";
      else if (!quality || ["auto", "unknown", "unknow"].includes(String(quality).toLowerCase())) quality = "\u{1F4BF} HD";
      let title = `\u{1F4C1} ${stream.title || "Stream"}`;
      let language = stream.language;
      if (language === "Italian") {
        language = "\u{1F1EE}\u{1F1F9}";
      } else if (stream.name && (stream.name.includes("SUB ITA") || stream.name.includes("SUB"))) {
        language = "\u{1F1EF}\u{1F1F5} \u{1F1EE}\u{1F1F9}";
      } else if (stream.title && (stream.title.includes("SUB ITA") || stream.title.includes("SUB"))) {
        language = "\u{1F1EF}\u{1F1F5} \u{1F1EE}\u{1F1F9}";
      } else if (language === void 0 || language === null) {
        language = "";
      }
      let details = [];
      if (stream.size) details.push(`\u{1F4E6} ${stream.size}`);
      const desc = details.join(" | ");
      let pName = stream.name || stream.server || providerName;
      if (pName) {
        pName = pName.replace(/\s*\[?\(?\s*SUB\s*ITA\s*\)?\]?/i, "").replace(/\s*\[?\(?\s*ITA\s*\)?\]?/i, "").replace(/\s*\[?\(?\s*SUB\s*\)?\]?/i, "").replace(/\(\s*\)/g, "").replace(/\[\s*\]/g, "").trim();
      }
      if (pName === providerName) {
        pName = pName.charAt(0).toUpperCase() + pName.slice(1);
      }
      if (pName) {
        pName = `\u{1F4E1} ${pName}`;
      }
      const behaviorHints = stream.behaviorHints && typeof stream.behaviorHints === "object" ? __spreadValues({}, stream.behaviorHints) : {};
      let finalHeaders = stream.headers;
      if (behaviorHints.proxyHeaders && behaviorHints.proxyHeaders.request) {
        finalHeaders = behaviorHints.proxyHeaders.request;
      } else if (behaviorHints.headers) {
        finalHeaders = behaviorHints.headers;
      }
      finalHeaders = normalizePlaybackHeaders(finalHeaders);
      const isStreamingCommunityProvider = String(providerName || "").toLowerCase() === "streamingcommunity" || String((stream == null ? void 0 : stream.name) || "").toLowerCase().includes("streamingcommunity");
      if (isStreamingCommunityProvider && !finalHeaders) {
        delete behaviorHints.proxyHeaders;
        delete behaviorHints.headers;
        delete behaviorHints.notWebReady;
      }
      if (finalHeaders) {
        behaviorHints.proxyHeaders = behaviorHints.proxyHeaders || {};
        behaviorHints.proxyHeaders.request = finalHeaders;
        behaviorHints.headers = finalHeaders;
      }
      const providerExplicitNotWebReady = stream.behaviorHints && "notWebReady" in stream.behaviorHints;
      const shouldForceNotWebReady = shouldForceNotWebReadyForPlugin(stream, providerName, finalHeaders, behaviorHints);
      if (!isStreamingCommunityProvider && shouldForceNotWebReady) {
        behaviorHints.notWebReady = true;
      } else if (!providerExplicitNotWebReady) {
        delete behaviorHints.notWebReady;
      }
      const finalName = pName;
      let finalTitle = `\u{1F4C1} ${stream.title || "Stream"}`;
      if (desc) finalTitle += ` | ${desc}`;
      if (language) finalTitle += ` | ${language}`;
      const playbackReferer = stream.referer || (finalHeaders == null ? void 0 : finalHeaders.Referer) || (finalHeaders == null ? void 0 : finalHeaders.referer);
      const playbackUserAgent = stream.userAgent || (finalHeaders == null ? void 0 : finalHeaders["User-Agent"]) || (finalHeaders == null ? void 0 : finalHeaders["user-agent"]);
      return __spreadProps(__spreadValues({}, stream), {
        // Keep original properties
        name: finalName,
        title: finalTitle,
        // Metadata for Stremio UI reconstruction (safer names for RN)
        providerName: pName,
        qualityTag: quality,
        description: desc,
        originalTitle: stream.title || "Stream",
        // Ensure language is set for Stremio/Nuvio sorting
        language,
        // Mark as formatted
        _nuvio_formatted: true,
        behaviorHints,
        provider: stream.provider || normalizeProviderId(providerName),
        referer: playbackReferer,
        userAgent: playbackUserAgent,
        // Explicitly ensure root headers are preserved for Nuvio
        headers: finalHeaders
      });
    }
    module2.exports = { formatStream: formatStream2 };
  }
});

// src/fetch_helper.js
var require_fetch_helper = __commonJS({
  "src/fetch_helper.js"(exports2, module2) {
    var FETCH_TIMEOUT = 3e4;
    function createTimeoutSignal(timeoutMs) {
      const parsed = Number.parseInt(String(timeoutMs), 10);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return { signal: void 0, cleanup: null, timed: false };
      }
      if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
        return { signal: AbortSignal.timeout(parsed), cleanup: null, timed: true };
      }
      if (typeof AbortController !== "undefined" && typeof setTimeout === "function") {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, parsed);
        return {
          signal: controller.signal,
          cleanup: () => clearTimeout(timeoutId),
          timed: true
        };
      }
      return { signal: void 0, cleanup: null, timed: false };
    }
    function fetchWithTimeout2(_0) {
      return __async(this, arguments, function* (url, options = {}) {
        if (typeof fetch === "undefined") {
          throw new Error("No fetch implementation found!");
        }
        const _a = options, { timeout } = _a, fetchOptions = __objRest(_a, ["timeout"]);
        const requestTimeout = timeout || FETCH_TIMEOUT;
        const timeoutConfig = createTimeoutSignal(requestTimeout);
        const requestOptions = __spreadValues({}, fetchOptions);
        if (timeoutConfig.signal) {
          if (requestOptions.signal && typeof AbortSignal !== "undefined" && typeof AbortSignal.any === "function") {
            requestOptions.signal = AbortSignal.any([requestOptions.signal, timeoutConfig.signal]);
          } else if (!requestOptions.signal) {
            requestOptions.signal = timeoutConfig.signal;
          }
        }
        try {
          const response = yield fetch(url, requestOptions);
          return response;
        } catch (error) {
          if (error && error.name === "AbortError" && timeoutConfig.timed) {
            throw new Error(`Request to ${url} timed out after ${requestTimeout}ms`);
          }
          throw error;
        } finally {
          if (typeof timeoutConfig.cleanup === "function") {
            timeoutConfig.cleanup();
          }
        }
      });
    }
    module2.exports = { fetchWithTimeout: fetchWithTimeout2, createTimeoutSignal };
  }
});

// src/torrentio/index.js
var { formatStream } = require_formatter();
var { fetchWithTimeout } = require_fetch_helper();
var USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
var MAX_RESULTS = 12;
var QUALITY_RANKING = { "4K": 4, "1080p": 3, "720p": 2, "480p": 1, "Unknown": 0 };
var TRACKERS = [
  "udp://tracker.opentrackr.org:1337/announce",
  "udp://open.stealth.si:80/announce",
  "udp://tracker.torrent.eu.org:451/announce",
  "udp://exodus.desync.com:6969/announce",
  "udp://tracker.openbittorrent.com:6969/announce",
  "udp://open.demonii.com:1337/announce",
  "udp://tracker.dler.org:6969/announce",
  "udp://explodie.org:6969/announce"
];
var LANGUAGES = [
  [/\bita\b|italiano?/i, "\u{1F1EE}\u{1F1F9}"],
  [/\beng\b|english/i, "\u{1F1EC}\u{1F1E7}"],
  [/\bspa\b|spanish|espa/i, "\u{1F1EA}\u{1F1F8}"],
  [/\bfre\b|\bfra\b|french/i, "\u{1F1EB}\u{1F1F7}"],
  [/\bger\b|\bdeu\b|german/i, "\u{1F1E9}\u{1F1EA}"],
  [/\bmulti\b/i, "\u{1F310}"]
];
function buildMagnet(infoHash) {
  const trackerParams = TRACKERS.map((t) => "&tr=" + encodeURIComponent(t)).join("");
  return "magnet:?xt=urn:btih:" + infoHash + trackerParams;
}
function formatSize(bytes) {
  if (!bytes || bytes <= 0) return "";
  let units = ["B", "KB", "MB", "GB", "TB"], v = bytes, i = 0;
  for (; v >= 1024 && i < units.length - 1; ) {
    v /= 1024;
    i++;
  }
  return v.toFixed(v < 10 ? 2 : 1) + " " + units[i];
}
function parseLanguages(filename) {
  let found = [];
  for (let [regex, flag] of LANGUAGES)
    if (regex.test(filename) && found.indexOf(flag) === -1) found.push(flag);
  return found.join(" ") || "\u{1F1EE}\u{1F1F9}";
}
function parseAttributes(filename) {
  let s = String(filename || ""), attrs = [];
  if (/\bremux\b/i.test(s)) attrs.push("REMUX");
  if (/\b(bluray|blu-ray|bdrip|brrip|bdmux)\b/i.test(s)) attrs.push("BluRay");
  else if (/\bweb[\s._-]?dl\b/i.test(s)) attrs.push("WEB-DL");
  else if (/\bwebrip\b/i.test(s)) attrs.push("WEBRip");
  if (/\b(dolby\s*vision|dovi|dv)\b/i.test(s)) attrs.push("DV");
  if (/hdr10\+?|\bhdr\b/i.test(s)) attrs.push("HDR");
  if (/\b(x265|h\.?\s?265|hevc)\b/i.test(s)) attrs.push("HEVC");
  else if (/\b(x264|h\.?\s?264|avc)\b/i.test(s)) attrs.push("H264");
  else if (/\bav1\b/i.test(s)) attrs.push("AV1");
  return attrs;
}
function formatStreamItem(stream, mediaInfo) {
  const langs = parseLanguages(stream.title);
  const sizeStr = formatSize(stream.size);
  const attrs = parseAttributes(stream.title);
  const cached = stream.cached ? "\u26A1 " : "";
  const infoLine = ["\u{1F331} " + stream.seeders, sizeStr ? "\u{1F4BE} " + sizeStr : "", ...attrs].filter(Boolean);
  const title = (mediaInfo == null ? void 0 : mediaInfo.title) ? mediaInfo.title : stream.title;
  const year = (mediaInfo == null ? void 0 : mediaInfo.year) ? " (" + mediaInfo.year + ")" : "";
  const result = {
    name: cached + "\u{1F9F2} " + stream.quality + " \xB7 \u{1F331}" + stream.seeders + " \xB7 " + langs,
    title: [
      stream.cached ? "\u26A1 TorBox cached" : "",
      "\u{1F3AC} " + title + year,
      "\u{1F4C1} " + stream.title,
      infoLine.join(" \xB7 "),
      "\u{1F5E3}\uFE0F " + langs + " \xB7 \u{1F4E1} " + stream.indexer
    ].filter(Boolean).join("\n"),
    url: stream.url ? stream.url : buildMagnet(stream.infoHash),
    quality: stream.quality,
    size: sizeStr,
    seeders: stream.seeders,
    type: stream.url ? "torrent" : "torrent",
    provider: "torrentio",
    behaviorHints: { bingeGroup: "nuvio-torrentio-" + stream.quality }
  };
  if (stream.infoHash) result.infoHash = stream.infoHash;
  return result;
}
function getStreams(imdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    var _a;
    const settings = globalThis.SCRAPER_SETTINGS || {};
    const BASE_URL = settings.prowlarr_base_url || null;
    const TOKEN = settings.prowlarr_api_key || null;
    try {
      if (!BASE_URL || !TOKEN) {
        console.log("[torrentio] MIDDLEWARE_URL o API Key non configurati");
        return [];
      }
      const type = mediaType === "tv" || mediaType === "series" ? "tv" : "movie";
      const endpoint = type === "tv" ? `tv/${imdbId}/${season || 1}/${episode || 1}` : `movie/${imdbId}`;
      let url = `${BASE_URL}/${endpoint}`;
      if (TOKEN) url += "?token=" + encodeURIComponent(TOKEN);
      const res = yield fetchWithTimeout(url, {
        headers: { "User-Agent": USER_AGENT, "Accept": "application/json" },
        timeout: 2e4,
        skipSizeCheck: true
      });
      if (!res.ok) {
        console.log("[torrentio] middleware HTTP " + res.status);
        return [];
      }
      const data = yield res.json();
      const results = (Array.isArray(data.results) ? data.results : []).filter((s) => s && (s.url || s.infoHash));
      const mediaInfo = data.media || null;
      results.sort((a, b) => {
        let byCached = (b.cached ? 1 : 0) - (a.cached ? 1 : 0);
        if (byCached !== 0) return byCached;
        let byQuality = (QUALITY_RANKING[b.quality] || 0) - (QUALITY_RANKING[a.quality] || 0);
        if (byQuality !== 0) return byQuality;
        return (b.seeders || 0) - (a.seeders || 0);
      });
      return results.slice(0, MAX_RESULTS).map((s) => formatStreamItem(s, mediaInfo));
    } catch (err) {
      console.log("[torrentio] errore: " + ((_a = err == null ? void 0 : err.message) != null ? _a : err));
      return [];
    }
  });
}
function onSettings() {
  return __async(this, null, function* () {
    return [
      { type: "header", label: "Torrentio Settings" },
      {
        type: "text",
        key: "prowlarr_base_url",
        label: "Prowlarr Base URL",
        placeholder: "Enter your Prowlarr base URL (e.g. https://prowlarr.example.com)",
        description: "Required."
      },
      { type: "header", label: "API Key" },
      {
        type: "text",
        key: "prowlarr_api_key",
        label: "Prowlarr API Key",
        placeholder: "Enter your Prowlarr API Key",
        description: "Required.",
        isPassword: true
      }
    ];
  });
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { getStreams, onSettings };
} else {
  global.getStreams = getStreams;
  global.onSettings = onSettings;
}
