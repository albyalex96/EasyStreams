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

// src/corsaroviola/index.js
var USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
var TMDB_API_KEY = "024c5dee9af18585c60e92fa104e3f8c";
var BASE_URL = "https://icv.stremio-italia.eu/eyJ0bWRiX2tleSI6IjU0NjJmNzg0NjlmM2Q4MGJmNTIwMTY0NTI5NGMxNmU0IiwidXNlX3RvcmJveCI6dHJ1ZSwidXNlX3JhcmJnIjp0cnVlLCJ1c2VfamFja2V0dCI6dHJ1ZSwiZnVsbF9pdGEiOnRydWUsImRiX29ubHkiOmZhbHNlLCJ1c2VfZ2xvYmFsX2NhY2hlIjpmYWxzZSwib25seV9kZWJyaWRfY2FjaGUiOmZhbHNlLCJoeWJyaWRfbW9kZSI6dHJ1ZSwibWF4X3Jlc19saW1pdCI6MywiZXhjbHVkZV83MjBwIjp0cnVlLCJleGNsdWRlX3NkIjp0cnVlLCJleGNsdWRlX3Vua25vd24iOnRydWUsImV4Y2x1ZGVfZHYiOnRydWV9";
var MAX_RESULTS = 10;
var QUALITY_RANKING = { "4K": 4, "1080p": 3, "720p": 2, "480p": 1, "Unknown": 0 };
var LANGUAGES = [
  [/\beng\b|english/i, "ENG"],
  [/\bita\b|italiano?/i, "ITA"],
  [/\bspa\b|spanish|espa/i, "SPA"],
  [/\bfre\b|\bfra\b|french/i, "FRA"],
  [/\bger\b|\bdeu\b|german/i, "GER"]
];
function getQuality(videoInfo, filename) {
  let info = String(videoInfo || "").toLowerCase();
  if (info.includes("2160") || info === "4k" || info.includes("4k")) return "4K";
  if (info.includes("1080")) return "1080p";
  if (info.includes("720")) return "720p";
  let name = String(filename || "").toLowerCase();
  if (name.includes("2160") || name.includes("4k")) return "4K";
  if (name.includes("1080")) return "1080p";
  return "Unknown";
}
function formatSize(bytes) {
  if (!bytes || bytes <= 0) return "";
  let units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes, i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return value.toFixed(value < 10 ? 2 : 1) + " " + units[i];
}
function parseLanguages(filename) {
  let found = [];
  for (let [regex, code] of LANGUAGES) {
    if (regex.test(filename) && found.indexOf(code) === -1) found.push(code);
  }
  if (/\bmulti\b/i.test(filename) && found.length === 0) return "MULTI";
  return found.join(" | ") || "ITA";
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
  else if (/\b(x264|h\.?\s?264|avc)\b/i.test(s)) attrs.push("AVC");
  else if (/\bav1\b/i.test(s)) attrs.push("AV1");
  return attrs;
}
function formatStreamItem(stream, tmdbInfo) {
  let hints = stream.behaviorHints || {};
  let vidInfo = stream.videoInfo || {};
  let filename = hints.filename || stream.name || stream.filename || stream.title || "Unknown";
  let quality = getQuality(vidInfo.resolution, filename);
  let seeders = typeof vidInfo.seeders === "number" ? vidInfo.seeders : 0;
  let size = typeof hints.videoSize === "number" ? hints.videoSize : typeof stream.fileSize === "number" ? stream.fileSize : 0;
  let sizeStr = formatSize(size);
  let cached = hints.cached === true;
  let langs = parseLanguages(filename);
  let attrs = parseAttributes(filename);
  let cachedTag = cached ? "\u26A1 " : "";
  let attrStr = attrs.join(" | ") || "N/A";
  let title = (tmdbInfo == null ? void 0 : tmdbInfo.title) ? tmdbInfo.title : filename;
  let year = (tmdbInfo == null ? void 0 : tmdbInfo.year) ? " - " + tmdbInfo.year : "";
  return {
    _quality: quality,
    _seeders: seeders,
    _cached: cached,
    name: "CorsaroViola | " + cachedTag + quality + " | \u{1F465} " + seeders + " | " + langs,
    title: ["\u{1F3AC} " + title + year, "\u{1F4E6} " + attrStr + " | \u{1F4BE} " + (sizeStr || "N/A")].join("\n"),
    url: stream.url,
    quality,
    size: sizeStr,
    seeders,
    type: "movie",
    provider: "CorsaroViola",
    infoHash: stream.infoHash,
    behaviorHints: { bingeGroup: "nuvio-icv-" + quality, filename: stream.behaviorHints.filename || null, videoSize: size || stream.behaviorHints.videoSize, cached: cached || stream._meta.cached }
  };
}
function getStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    var _a;
    try {
      if (!BASE_URL) {
        console.log("[CorsaroViola] CORSARO_VIOLA_URL non configurato");
        return [];
      }
      let type = mediaType === "tv" || mediaType === "series" ? "tv" : "movie";
      const tmdbInfo = yield (() => __async(null, null, function* () {
        var _a2;
        if (!TMDB_API_KEY) return { imdb: null };
        try {
          let url = `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=external_ids`;
          let res2 = yield fetch(url, { headers: { "User-Agent": USER_AGENT, "Accept": "application/json" } });
          let data2 = yield res2.json();
          let date = data2.release_date || data2.first_air_date || "";
          return {
            imdb: ((_a2 = data2.external_ids) == null ? void 0 : _a2.imdb_id) || data2.imdb_id || null,
            title: data2.title || data2.name || "",
            year: date ? date.slice(0, 4) : ""
          };
        } catch (e) {
          return { imdb: null };
        }
      }))();
      if (!tmdbInfo.imdb) {
        console.log("[CorsaroViola] IMDB id non trovato");
        return [];
      }
      let endpoint = type === "tv" ? `stream/series/${tmdbInfo.imdb}:${season || 1}:${episode || 1}.json` : `stream/movie/${tmdbInfo.imdb}.json`;
      let res = yield fetch(`${BASE_URL}/${endpoint}`, {
        headers: { "User-Agent": USER_AGENT, "Accept": "application/json" }
      });
      if (!res.ok) {
        console.log("No fetch implementation found! " + res.status);
        return [];
      }
      let data = yield res.json();
      let streams = Array.isArray(data.streams) ? data.streams : [];
      let results = streams.map((s) => formatStreamItem(s, tmdbInfo)).filter((s) => s._quality === "4K" || s._quality === "1080p");
      results.sort((a, b) => {
        let byCached = (b._cached ? 1 : 0) - (a._cached ? 1 : 0);
        if (byCached !== 0) return byCached;
        let byQuality = (QUALITY_RANKING[b._quality] || 0) - (QUALITY_RANKING[a._quality] || 0);
        if (byQuality !== 0) return byQuality;
        return (b._seeders || 0) - (a._seeders || 0);
      });
      console.log(`[CorsaroViola] Trovati ${results.length}`);
      results = results.filter((s) => s.seeders > 0);
      console.log(`[CorsaroViola] Filtrati ${results.length}`);
      return results.slice(0, MAX_RESULTS).map((s) => {
        delete s._cached;
        delete s._seeders;
        delete s._quality;
        return s;
      });
    } catch (err) {
      console.log("[CorsaroViola] errore: " + ((_a = err == null ? void 0 : err.message) != null ? _a : err));
      return [];
    }
  });
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { getStreams };
} else {
  global.getStreams = getStreams;
}
