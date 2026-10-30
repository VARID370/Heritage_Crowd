const axios = require('axios');

// ─── In-memory image cache (60-minute TTL) ───────────────────────────────────
const imageCache = new Map();
const IMAGE_CACHE_TTL_MS = 60 * 60 * 1000; // 60 minutes

// Wikimedia Commons / Wikipedia API base
const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';

// User-Agent required by Wikimedia policy
const WIKIMEDIA_USER_AGENT =
  'HeritageConnect/1.0 (College CSE Project; contact: admin@heritageconnect.org)';

// Neutral placeholder for monuments without a verified photo
// Uses neutral architectural vector graphic — NEVER a photo of a different monument!
const NEUTRAL_PLACEHOLDER = {
  imageUrl: '/placeholder-monument.svg',
  attribution: 'HeritageConnect / Architectural Collection',
  license: 'Public Domain / CC0',
  isPlaceholder: true,
};

// ─── Curated verified photos for specific monuments (exact keyword matching) ─
// Used as high-reliability direct fallback ONLY when Wikipedia API lookup times out
// NEVER used for generic categories or mismatched places!
const CURATED_MONUMENT_IMAGES = [
  {
    keywords: ['taj mahal', 'tajmahal'],
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Taj_Mahal_%28Edited%29.jpeg/1280px-Taj_Mahal_%28Edited%29.jpeg',
    attribution: 'Wikimedia Commons / Yann Forget (CC BY-SA 4.0)',
    license: 'CC BY-SA 4.0',
  },
  {
    keywords: ['red fort', 'lal qila', 'lal qilaa'],
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Delhi_fort.jpg/1280px-Delhi_fort.jpg',
    attribution: 'Wikimedia Commons / Bernard Gagnon (CC BY-SA 3.0)',
    license: 'CC BY-SA 3.0',
  },
  {
    keywords: ['qutub minar', 'qutb minar'],
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Qutb_Minar_-_2003.JPG/1280px-Qutb_Minar_-_2003.JPG',
    attribution: 'Wikimedia Commons / Flickr upload bot (CC BY-SA 2.0)',
    license: 'CC BY-SA 2.0',
  },
  {
    keywords: ['hawa mahal', 'palace of winds'],
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/East_facade_Hawa_Mahal_Jaipur_from_ground_level_%28July_2022%29_-_img_01.jpg/1280px-East_facade_Hawa_Mahal_Jaipur_from_ground_level_%28July_2022%29_-_img_01.jpg',
    attribution: 'Wikimedia Commons / David Castor (CC0)',
    license: 'CC0',
  },
  {
    keywords: ['amber fort', 'amer fort', 'amber palace'],
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Amer_Fort%2C_Amer%2C_Jaipur_rajasthan.jpg/1280px-Amer_Fort%2C_Amer%2C_Jaipur_rajasthan.jpg',
    attribution: 'Wikimedia Commons / Narender9 (CC BY-SA 3.0)',
    license: 'CC BY-SA 3.0',
  },
  {
    keywords: ['india gate'],
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/India_Gate_in_New_Delhi_03-2016.jpg/1280px-India_Gate_in_New_Delhi_03-2016.jpg',
    attribution: 'Wikimedia Commons / Godot13 (CC BY-SA 4.0)',
    license: 'CC BY-SA 4.0',
  },
  {
    keywords: ['gateway of india'],
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Mumbai_03-2016_30_Gateway_of_India.jpg/1280px-Mumbai_03-2016_30_Gateway_of_India.jpg',
    attribution: 'Wikimedia Commons / Calvinkrishy (CC BY-SA 4.0)',
    license: 'CC BY-SA 4.0',
  },
  {
    keywords: ['charminar'],
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Charminar_2_wiki.jpg/1280px-Charminar_2_wiki.jpg',
    attribution: 'Wikimedia Commons / Sanyam Bahga (CC BY-SA 3.0)',
    license: 'CC BY-SA 3.0',
  },
  {
    keywords: ['golden temple', 'harmandir sahib'],
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Golden_Temple_Amritsar_4.JPG/1280px-Golden_Temple_Amritsar_4.JPG',
    attribution: 'Wikimedia Commons / Sanyam Bahga (CC BY-SA 3.0)',
    license: 'CC BY-SA 3.0',
  },
  {
    keywords: ['humayun', 'humayun tomb'],
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Humayun%27s_Tomb%2C_Delhi.jpg/1280px-Humayun%27s_Tomb%2C_Delhi.jpg',
    attribution: 'Wikimedia Commons / Jorge Lascar (CC BY 2.0)',
    license: 'CC BY 2.0',
  },
  {
    keywords: ['konark', 'sun temple'],
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Konarka_Temple.jpg/1280px-Konarka_Temple.jpg',
    attribution: 'Wikimedia Commons / Biswarup Ganguly (CC BY 3.0)',
    license: 'CC BY 3.0',
  },
  {
    keywords: ['victoria memorial'],
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Victoria_Memorial_Kolkata_2014-01-31.jpg/1280px-Victoria_Memorial_Kolkata_2014-01-31.jpg',
    attribution: 'Wikimedia Commons / Arnab Dutta (CC BY-SA 4.0)',
    license: 'CC BY-SA 4.0',
  },
  {
    keywords: ['mysore palace', 'mysuru palace'],
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Mysore_palace_illuminated.jpg/1280px-Mysore_palace_illuminated.jpg',
    attribution: 'Wikimedia Commons / Nilkanthpatel1966 (CC BY-SA 4.0)',
    license: 'CC BY-SA 4.0',
  },
  {
    keywords: ['meenakshi', 'madurai temple'],
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Madurai_Meenakshi_Amman_Temple.jpg/1280px-Madurai_Meenakshi_Amman_Temple.jpg',
    attribution: 'Wikimedia Commons / Legolas (CC BY-SA 3.0)',
    license: 'CC BY-SA 3.0',
  },
  {
    keywords: ['khajuraho'],
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Kandariya_Mahadeva_Temple.jpg/1280px-Kandariya_Mahadeva_Temple.jpg',
    attribution: 'Wikimedia Commons / Valerian Guillot (CC BY 2.0)',
    license: 'CC BY 2.0',
  },
  {
    keywords: ['golconda fort', 'golconda'],
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Golconda_Fort%2C_Hyderabad.jpg/1280px-Golconda_Fort%2C_Hyderabad.jpg',
    attribution: 'Wikimedia Commons / Bernard Gagnon (CC BY-SA 3.0)',
    license: 'CC BY-SA 3.0',
  },
  {
    keywords: ['city palace jaipur', 'city palace, jaipur'],
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Chandra_Mahal_Jaipur.jpg/1280px-Chandra_Mahal_Jaipur.jpg',
    attribution: 'Wikimedia Commons / Vberger (CC0)',
    license: 'CC0',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Sanitize and fix Wikimedia image URLs:
 * 1. Replace 'thumb.wikimedia.org' with 'upload.wikimedia.org' (avoids 403 Forbidden).
 * 2. Strip tracking query parameters like '?utm_source=...'.
 * 3. Ensure HTTPS protocol.
 */
const sanitizeWikimediaUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  let cleaned = url.trim().split('?')[0]; // Strip tracking query parameters
  if (cleaned.startsWith('//')) {
    cleaned = `https:${cleaned}`;
  }
  // Replace thumb.wikimedia.org domain with upload.wikimedia.org
  cleaned = cleaned.replace('thumb.wikimedia.org', 'upload.wikimedia.org');
  return cleaned;
};

/**
 * Build a cache key from name + city/state (normalised, lowercased)
 */
const makeCacheKey = (name, city = '', state = '') =>
  `${name.toLowerCase().trim()}|${city.toLowerCase().trim()}|${state.toLowerCase().trim()}`;

/**
 * Return a cached entry if it is still within the TTL, otherwise null
 */
const getFromCache = (key) => {
  const entry = imageCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > IMAGE_CACHE_TTL_MS) {
    imageCache.delete(key);
    return null;
  }
  return entry.value;
};

/**
 * Store a result in cache
 */
const setInCache = (key, value) => {
  imageCache.set(key, { value, timestamp: Date.now() });
};

// ─── Wikimedia / Wikipedia API calls ─────────────────────────────────────────

/**
 * Try Wikipedia page-image for a given search title string.
 * Returns { imageUrl, attribution, license } or null.
 */
const fetchWikipediaPageImage = async (searchTitle) => {
  try {
    const params = new URLSearchParams({
      action: 'query',
      titles: searchTitle,
      prop: 'pageimages|pageterms',
      format: 'json',
      pithumbsize: '1280',
      redirects: '1',
      origin: '*',
    });

    const response = await axios.get(`${WIKIPEDIA_API}?${params.toString()}`, {
      headers: { 'User-Agent': WIKIMEDIA_USER_AGENT },
      timeout: 5000,
    });

    const pages = response.data?.query?.pages;
    if (!pages) return null;

    for (const pageId of Object.keys(pages)) {
      if (pageId === '-1') continue; // page not found
      const page = pages[pageId];
      if (page.thumbnail && page.thumbnail.source) {
        const imageUrl = sanitizeWikimediaUrl(page.thumbnail.source);
        if (!imageUrl) continue;

        return {
          imageUrl,
          attribution: `Wikipedia / ${page.title} (Wikimedia Commons)`,
          license: 'Wikimedia Commons / CC',
          isPlaceholder: false,
        };
      }
    }
    return null;
  } catch (err) {
    return null;
  }
};

/**
 * Try a Wikimedia Commons file search for the given query string.
 * Picks the first file result that is a genuine photograph.
 * Returns { imageUrl, attribution, license } or null.
 */
const fetchCommonsSearch = async (searchQuery) => {
  try {
    const params = new URLSearchParams({
      action: 'query',
      list: 'search',
      srnamespace: '6', // File namespace
      srsearch: `${searchQuery} haswbstatement:P180`, // Prefer files depicting the topic
      srlimit: '5',
      format: 'json',
      origin: '*',
    });

    let searchRes;
    try {
      searchRes = await axios.get(`${COMMONS_API}?${params.toString()}`, {
        headers: { 'User-Agent': WIKIMEDIA_USER_AGENT },
        timeout: 5000,
      });
    } catch {
      // Fallback to simple file search without P180 filter
      const simpleParams = new URLSearchParams({
        action: 'query',
        list: 'search',
        srnamespace: '6',
        srsearch: searchQuery,
        srlimit: '5',
        format: 'json',
        origin: '*',
      });
      searchRes = await axios.get(`${COMMONS_API}?${simpleParams.toString()}`, {
        headers: { 'User-Agent': WIKIMEDIA_USER_AGENT },
        timeout: 5000,
      });
    }

    const searchResults = searchRes.data?.query?.search;
    if (!searchResults || searchResults.length === 0) return null;

    // Prefer JPG/JPEG photographs
    const preferred = searchResults.find((r) =>
      /\.(jpe?g|png)$/i.test(r.title)
    );
    const chosen = preferred || searchResults[0];

    // Fetch the thumbnail URL from imageinfo
    const fileParams = new URLSearchParams({
      action: 'query',
      titles: chosen.title,
      prop: 'imageinfo',
      iiprop: 'url|extmetadata',
      iiurlwidth: '1280',
      format: 'json',
      origin: '*',
    });

    const fileRes = await axios.get(`${COMMONS_API}?${fileParams.toString()}`, {
      headers: { 'User-Agent': WIKIMEDIA_USER_AGENT },
      timeout: 5000,
    });

    const filePages = fileRes.data?.query?.pages;
    if (!filePages) return null;

    for (const pageId of Object.keys(filePages)) {
      const page = filePages[pageId];
      const info = page.imageinfo && page.imageinfo[0];
      if (info && (info.thumburl || info.url)) {
        const rawUrl = info.thumburl || info.url;
        const imageUrl = sanitizeWikimediaUrl(rawUrl);
        if (!imageUrl) continue;

        const meta = info.extmetadata || {};
        const author =
          meta.Artist?.value?.replace(/<[^>]+>/g, '') ||
          meta.Credit?.value?.replace(/<[^>]+>/g, '') ||
          'Wikimedia Commons contributor';
        const license = meta.LicenseShortName?.value || 'CC BY-SA';

        return {
          imageUrl,
          attribution: `Wikimedia Commons / ${author} (${license})`,
          license,
          isPlaceholder: false,
        };
      }
    }
    return null;
  } catch (err) {
    return null;
  }
};

/**
 * Main Wikimedia image lookup strategy:
 * 1. Wikipedia page image for "<name>" (exact)
 * 2. Wikipedia page image for "<name> <city>" (with location context)
 * 3. Wikimedia Commons file search for "<name> <city> India"
 *
 * Returns { imageUrl, attribution, license } or null.
 */
const fetchWikimediaImage = async (name, city = '', state = '') => {
  const cleanName = name.trim();
  const cleanCity = city.trim();

  // Strategy 1 — exact monument name on Wikipedia
  let result = await fetchWikipediaPageImage(cleanName);
  if (result) return result;

  // Strategy 2 — monument name + city for disambiguation
  if (cleanCity) {
    result = await fetchWikipediaPageImage(`${cleanName} ${cleanCity}`);
    if (result) return result;
  }

  // Strategy 3 — Wikimedia Commons file search with location context
  const commonsQuery = cleanCity
    ? `${cleanName} ${cleanCity}`
    : `${cleanName} monument India`;
  result = await fetchCommonsSearch(commonsQuery);
  if (result) return result;

  return null;
};

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Resolve verified photo and attribution for a heritage site.
 *
 * Resolution order:
 *   1. OSM direct image tag (validated HTTPS URL)
 *   2. In-memory cache (60-minute TTL)
 *   3. Live Wikimedia Commons / Wikipedia API search
 *   4. Verified curated photo ONLY if monument name explicitly matches (e.g. Red Fort keyword for Red Fort)
 *   5. Neutral architectural placeholder SVG — NEVER a photo of a different monument!
 *
 * @param {string} siteName
 * @param {string} category - heritage category string
 * @param {object} osmTags  - OSM tag object (may contain `image`, `wikipedia`, `wikidata`)
 * @param {string} city     - city name for disambiguation
 * @param {string} state    - state name for disambiguation
 * @returns {Promise<{ imageUrl: string, attribution: string, license?: string, isPlaceholder?: boolean }>}
 */
const resolveSiteImage = async (
  siteName = '',
  category = 'monument',
  osmTags = {},
  city = '',
  state = ''
) => {
  // ── 1. OSM direct image tag ─────────────────────────────────────────────
  if (osmTags.image && typeof osmTags.image === 'string' && osmTags.image.startsWith('http')) {
    const directUrl = sanitizeWikimediaUrl(osmTags.image);
    return {
      imageUrl: directUrl,
      attribution: 'OpenStreetMap contributor / Open Data',
      license: 'ODbL',
      isPlaceholder: false,
    };
  }

  const cacheKey = makeCacheKey(siteName, city, state);

  // ── 2. In-memory cache ──────────────────────────────────────────────────
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  // ── 3. Live Wikimedia API call ──────────────────────────────────────────
  try {
    const wikimediaResult = await fetchWikimediaImage(siteName, city, state);
    if (wikimediaResult) {
      setInCache(cacheKey, wikimediaResult);
      return wikimediaResult;
    }
  } catch (_err) {
    // Continue to fallback
  }

  // ── 4. Curated verified photo ONLY if monument name explicitly matches ──
  const normalizedName = siteName.toLowerCase().trim();
  for (const item of CURATED_MONUMENT_IMAGES) {
    if (item.keywords.some((k) => normalizedName === k || normalizedName.includes(k))) {
      const result = {
        imageUrl: item.imageUrl,
        attribution: item.attribution,
        license: item.license,
        isPlaceholder: false,
      };
      setInCache(cacheKey, result);
      return result;
    }
  }

  // ── 5. Neutral architectural placeholder SVG ────────────────────────────
  // NEVER return a photo of another monument (like Taj Mahal for a college or unknown fort)!
  return { ...NEUTRAL_PLACEHOLDER };
};

/**
 * Exposed for unit testing only
 */
const _internal = {
  fetchWikipediaPageImage,
  fetchCommonsSearch,
  fetchWikimediaImage,
  getFromCache,
  setInCache,
  makeCacheKey,
  sanitizeWikimediaUrl,
  imageCache,
  NEUTRAL_PLACEHOLDER,
};

module.exports = {
  resolveSiteImage,
  NEUTRAL_PLACEHOLDER,
  _internal,
};
