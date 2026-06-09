const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"; // stringa offuscata
const TMDB_API_KEY = "024c5dee9af18585c60e92fa104e3f8c";           // chiave API offuscata
const BASE_URL = "https://icv.stremio-italia.eu/eyJ0bWRiX2tleSI6IjU0NjJmNzg0NjlmM2Q4MGJmNTIwMTY0NTI5NGMxNmU0IiwidXNlX3RvcmJveCI6dHJ1ZSwidXNlX3JhcmJnIjp0cnVlLCJ1c2VfamFja2V0dCI6dHJ1ZSwiZnVsbF9pdGEiOnRydWUsImRiX29ubHkiOmZhbHNlLCJ1c2VfZ2xvYmFsX2NhY2hlIjpmYWxzZSwib25seV9kZWJyaWRfY2FjaGUiOmZhbHNlLCJoeWJyaWRfbW9kZSI6dHJ1ZSwibWF4X3Jlc19saW1pdCI6MywiZXhjbHVkZV83MjBwIjp0cnVlLCJleGNsdWRlX3NkIjp0cnVlLCJleGNsdWRlX3Vua25vd24iOnRydWUsImV4Y2x1ZGVfZHYiOnRydWV9";               // URL base offuscato
const MAX_RESULTS = 10;

const QUALITY_RANKING = { '4K': 4, '1080p': 3, '720p': 2, '480p': 1, 'Unknown': 0 };

const LANGUAGES = [
  [/\beng\b|english/i, 'ENG'],
  [/\bita\b|italiano?/i, 'ITA'],
  [/\bspa\b|spanish|espa/i, 'SPA'],
  [/\bfre\b|\bfra\b|french/i, 'FRA'],
  [/\bger\b|\bdeu\b|german/i, 'GER'],
];

function getQuality(videoInfo, filename) {
  let info = String(videoInfo || '').toLowerCase();
  if (info.includes('2160') || info === '4k' || info.includes('4k')) return '4K';
  if (info.includes('1080')) return '1080p';
  if (info.includes('720')) return '720p';

  let name = String(filename || '').toLowerCase();
  if (name.includes('2160') || name.includes('4k')) return '4K';
  if (name.includes('1080')) return '1080p';
  return 'Unknown';
}

function formatSize(bytes) {
  if (!bytes || bytes <= 0) return '';
  let units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes, i = 0;
  while (value >= 1024 && i < units.length - 1) { value /= 1024; i++; }
  return value.toFixed(value < 10 ? 2 : 1) + ' ' + units[i];
}

function parseLanguages(filename) {
  let found = [];
  for (let [regex, code] of LANGUAGES) {
    if (regex.test(filename) && found.indexOf(code) === -1) found.push(code);
  }
  if (/\bmulti\b/i.test(filename) && found.length === 0) return 'MULTI';
  return found.join(' | ') || 'ITA';
}

function parseAttributes(filename) {
  let s = String(filename || ''), attrs = [];
  if (/\bremux\b/i.test(s))                              attrs.push('REMUX');
  if (/\b(bluray|blu-ray|bdrip|brrip|bdmux)\b/i.test(s)) attrs.push('BluRay');
  else if (/\bweb[\s._-]?dl\b/i.test(s))                 attrs.push('WEB-DL');
  else if (/\bwebrip\b/i.test(s))                        attrs.push('WEBRip');
  if (/\b(dolby\s*vision|dovi|dv)\b/i.test(s))           attrs.push('DV');
  if (/hdr10\+?|\bhdr\b/i.test(s))                       attrs.push('HDR');
  if (/\b(x265|h\.?\s?265|hevc)\b/i.test(s))             attrs.push('HEVC');
  else if (/\b(x264|h\.?\s?264|avc)\b/i.test(s))         attrs.push('AVC');
  else if (/\bav1\b/i.test(s))                           attrs.push('AV1');
  return attrs;
}

function formatStreamItem(stream, tmdbInfo) {
  let hints    = stream.behaviorHints || {};
  let vidInfo  = stream.videoInfo || {};
  let filename = hints.filename || stream.name || stream.filename || stream.title || 'Unknown';

  let quality  = getQuality(vidInfo.resolution, filename);
  let seeders  = typeof vidInfo.seeders === 'number' ? vidInfo.seeders : 0;
  let size     = typeof hints.videoSize === 'number' ? hints.videoSize
               : typeof stream.fileSize === 'number' ? stream.fileSize : 0;
  let sizeStr  = formatSize(size);
  let cached   = hints.cached === true;
  let langs    = parseLanguages(filename);
  let attrs    = parseAttributes(filename);

  let cachedTag = cached ? '⚡ ' : '';
  let attrStr   = attrs.join(' | ') || 'N/A';
  let title     = tmdbInfo?.title ? tmdbInfo.title : filename;
  let year      = tmdbInfo?.year  ? ' - ' + tmdbInfo.year : '';

  return {
    _quality: quality,
    _seeders: seeders,
    _cached:  cached,
    name:  'CorsaroViola | ' + cachedTag + quality + ' | 👥 ' + seeders + ' | ' + langs,
    title: ['🎬 ' + title + year, '📦 ' + attrStr + ' | 💾 ' + (sizeStr || 'N/A')].join('\n'),
    url:      stream.url,
    quality:  quality,
    size:     sizeStr,
    seeders:  seeders,
    type:     'movie',
    provider: 'CorsaroViola',
    behaviorHints: { bingeGroup: 'nuvio-icv-' + quality },
  };
}

async function getStreams(tmdbId, mediaType, season, episode) {
  try {
    if (!BASE_URL) {
      console.log('[CorsaroViola] CORSARO_VIOLA_URL non configurato');
      return [];
    }

    let type = (mediaType === 'tv' || mediaType === 'series') ? 'tv' : 'movie';

    // Recupera info TMDB (titolo, anno, imdb_id)
    const tmdbInfo = await (async () => {
      if (!TMDB_API_KEY) return { imdb: null };
      try {
        let url = `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=external_ids`;
        let res  = await fetch(url, { headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' } });
        let data = await res.json();
        let date = data.release_date || data.first_air_date || '';
        return {
          imdb:  data.external_ids?.imdb_id || data.imdb_id || null,
          title: data.title || data.name || '',
          year:  date ? date.slice(0, 4) : '',
        };
      } catch { return { imdb: null }; }
    })();

    if (!tmdbInfo.imdb) {
      console.log('[CorsaroViola] IMDB id non trovato');
      return [];
    }

    // Costruisce l'endpoint sull'addon CorsaroViola
    let endpoint = type === 'tv'
      ? `stream/series/${tmdbInfo.imdb}:${season || 1}:${episode || 1}.json`
      : `stream/movie/${tmdbInfo.imdb}.json`;

    let res  = await fetch(`${BASE_URL}/${endpoint}`, {
      headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' }
    });
    if (!res.ok) {
      console.log('No fetch implementation found! ' + res.status);
      return [];
    }

    let data    = await res.json();
    let streams = Array.isArray(data.streams) ? data.streams : [];

    let results = streams
      .filter(s => s && s.url)
      .map(s => formatStreamItem(s, tmdbInfo))
      .filter(s => s._quality === '4K' || s._quality === '1080p');

    // Ordina: cached > qualità > seeders
    results.sort((a, b) => {
      let byCached  = (b._cached ? 1 : 0) - (a._cached ? 1 : 0);
      if (byCached !== 0) return byCached;
      let byQuality = (QUALITY_RANKING[b._quality] || 0) - (QUALITY_RANKING[a._quality] || 0);
      if (byQuality !== 0) return byQuality;
      return (b._seeders || 0) - (a._seeders || 0);
    });

    // Rimuove campi interni e limita i risultati
    return results.slice(0, MAX_RESULTS).map(s => {
      delete s._cached;
      delete s._seeders;
      delete s._quality;
      return s;
    });

  } catch (err) {
    console.log('[CorsaroViola] errore: ' + (err?.message ?? err));
    return [];
  }
}

// Esporta
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getStreams };
} else {
  global.getStreams = getStreams;
}