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

// src/torrentio/index.js
var USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
var BASE_URL = "https://instance-1-prowlarr.duckdns.org/nuvio";
var TOKEN = "nv_5b91a4f2c8e3";
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
    try {
      if (!BASE_URL) {
        console.log("[torrentio] MIDDLEWARE_URL non configurato");
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
if (typeof module !== "undefined" && module.exports) {
  module.exports = { getStreams };
} else {
  global.getStreams = getStreams;
}
