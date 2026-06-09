const { formatStream } = require('../formatter.js');
const { fetchWithTimeout } = require('../fetch_helper.js');

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const MAX_RESULTS = 12;

const QUALITY_RANKING = { '4K': 4, '1080p': 3, '720p': 2, '480p': 1, 'Unknown': 0 };

const TRACKERS = [
  'udp://tracker.opentrackr.org:1337/announce',
  'udp://open.stealth.si:80/announce',
  'udp://tracker.torrent.eu.org:451/announce',
  'udp://exodus.desync.com:6969/announce',
  'udp://tracker.openbittorrent.com:6969/announce',
  'udp://open.demonii.com:1337/announce',
  'udp://tracker.dler.org:6969/announce',
  'udp://explodie.org:6969/announce',
];

const LANGUAGES = [
  [/\bita\b|italiano?/i,        '🇮🇹'],
  [/\beng\b|english/i,          '🇬🇧'],
  [/\bspa\b|spanish|espa/i,     '🇪🇸'],
  [/\bfre\b|\bfra\b|french/i,   '🇫🇷'],
  [/\bger\b|\bdeu\b|german/i,   '🇩🇪'],
  [/\bmulti\b/i,                '🌐'],
];

function buildMagnet(infoHash) {
  const trackerParams = TRACKERS.map(t => '&tr=' + encodeURIComponent(t)).join('');
  return 'magnet:?xt=urn:btih:' + infoHash + trackerParams;
}

function formatSize(bytes) {
  if (!bytes || bytes <= 0) return '';
  let units = ['B', 'KB', 'MB', 'GB', 'TB'], v = bytes, i = 0;
  for (; v >= 1024 && i < units.length - 1; ) { v /= 1024; i++; }
  return v.toFixed(v < 10 ? 2 : 1) + ' ' + units[i];
}

function parseLanguages(filename) {
  let found = [];
  for (let [regex, flag] of LANGUAGES)
    if (regex.test(filename) && found.indexOf(flag) === -1) found.push(flag);
  return found.join(' ') || '🇮🇹';
}

function parseAttributes(filename) {
  let s = String(filename || ''), attrs = [];
  if (/\bremux\b/i.test(s))                               attrs.push('REMUX');
  if (/\b(bluray|blu-ray|bdrip|brrip|bdmux)\b/i.test(s)) attrs.push('BluRay');
  else if (/\bweb[\s._-]?dl\b/i.test(s))                  attrs.push('WEB-DL');
  else if (/\bwebrip\b/i.test(s))                         attrs.push('WEBRip');
  if (/\b(dolby\s*vision|dovi|dv)\b/i.test(s))            attrs.push('DV');
  if (/hdr10\+?|\bhdr\b/i.test(s))                        attrs.push('HDR');
  if (/\b(x265|h\.?\s?265|hevc)\b/i.test(s))              attrs.push('HEVC');
  else if (/\b(x264|h\.?\s?264|avc)\b/i.test(s))          attrs.push('H264');
  else if (/\bav1\b/i.test(s))                            attrs.push('AV1');
  return attrs;
}

function formatStreamItem(stream, mediaInfo) {
  const langs    = parseLanguages(stream.title);
  const sizeStr  = formatSize(stream.size);
  const attrs    = parseAttributes(stream.title);
  const cached   = stream.cached ? '⚡ ' : '';

  const infoLine = ['🌱 ' + stream.seeders, sizeStr ? '💾 ' + sizeStr : '', ...attrs].filter(Boolean);
  const title    = mediaInfo?.title ? mediaInfo.title : stream.title;
  const year     = mediaInfo?.year  ? ' (' + mediaInfo.year + ')' : '';

  const result = {
    name:  cached + '🧲 ' + stream.quality + ' · 🌱' + stream.seeders + ' · ' + langs,
    title: [
      stream.cached ? '⚡ TorBox cached' : '',
      '🎬 ' + title + year,
      '📁 ' + stream.title,
      infoLine.join(' · '),
      '🗣️ ' + langs + ' · 📡 ' + stream.indexer,
    ].filter(Boolean).join('\n'),
    url:      stream.url ? stream.url : buildMagnet(stream.infoHash),
    quality:  stream.quality,
    size:     sizeStr,
    seeders:  stream.seeders,
    type:     stream.url ? 'torrent' : 'torrent',
    provider: 'torrentio',
    behaviorHints: { bingeGroup: 'nuvio-torrentio-' + stream.quality },
  };

  if (stream.infoHash) result.infoHash = stream.infoHash;
  return result;
}

async function getStreams(imdbId, mediaType, season, episode) {
  const settings = globalThis.SCRAPER_SETTINGS || {};
  const BASE_URL   = settings.prowlarr_base_url || null;
  const TOKEN   = settings.prowlarr_api_key || null;  
  try {
    if (!BASE_URL || !TOKEN) {
      console.log('[torrentio] MIDDLEWARE_URL o API Key non configurati');
      return [];
    }

    const type     = (mediaType === 'tv' || mediaType === 'series') ? 'tv' : 'movie';
    const endpoint = type === 'tv'
      ? `tv/${imdbId}/${season || 1}/${episode || 1}`
      : `movie/${imdbId}`;

    let url = `${BASE_URL}/${endpoint}`;
    if (TOKEN) url += '?token=' + encodeURIComponent(TOKEN);

    const res = await fetchWithTimeout(url, {
      headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
      timeout: 20000,
      skipSizeCheck: true,
    });

    if (!res.ok) {
      console.log('[torrentio] middleware HTTP ' + res.status);
      return [];
    }

    const data    = await res.json();
    const results = (Array.isArray(data.results) ? data.results : [])
      .filter(s => s && (s.url || s.infoHash));
    const mediaInfo = data.media || null;

    results.sort((a, b) => {
      let byCached  = (b.cached ? 1 : 0) - (a.cached ? 1 : 0);
      if (byCached !== 0) return byCached;
      let byQuality = (QUALITY_RANKING[b.quality] || 0) - (QUALITY_RANKING[a.quality] || 0);
      if (byQuality !== 0) return byQuality;
      return (b.seeders || 0) - (a.seeders || 0);
    });

    return results.slice(0, MAX_RESULTS).map(s => formatStreamItem(s, mediaInfo));

  } catch (err) {
    console.log('[torrentio] errore: ' + (err?.message ?? err));
    return [];
  }
}

async function onSettings() {
    return [
        { type: "header", label: "Prowlare Base URL" },
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
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getStreams, onSettings };
} else {
  global.getStreams = getStreams;
  global.onSettings = onSettings;
}