const axios = require('axios');
const { resolveSiteImage } = require('./imageService');
const BookableSite = require('../models/BookableSite');
const TimeSlot = require('../models/TimeSlot');
const { getCrowdLevel } = require('./crowdService');

// In-memory query cache with TTL (15 minutes)
const cache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000;

// Standard OpenStreetMap API endpoints
const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_LOOKUP_URL = 'https://nominatim.openstreetmap.org/lookup';
const OSM_DIRECT_API = 'https://api.openstreetmap.org/api/0.6';
const OSM_USER_AGENT =
  'HeritageConnect/1.0 (College CSE Project; contact: admin@heritageconnect.org)';

// Overpass API Endpoints with fallback
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

// Non-heritage terms that must NEVER be returned as monuments
const NON_HERITAGE_TERMS = [
  'college',
  'university',
  'school',
  'vidyalaya',
  'polytechnic',
  'campus',
  'hospital',
  'clinic',
  'pharmacy',
  'dispensary',
  'hotel',
  'resort',
  'motel',
  'lodge',
  'guest house',
  'restaurant',
  'cafe',
  'dhaba',
  'bakery',
  'sweets',
  'bank',
  'atm',
  'police station',
  'railway station',
  'bus stand',
  'bus stop',
  'metro station',
  'petrol pump',
  'shopping mall',
  'market',
  'apartment',
  'residential',
];

/**
 * Check if an OSM item is an authentic heritage landmark
 */
const isAuthenticHeritage = (item) => {
  const name = (item.name || item.display_name?.split(',')[0] || '').toLowerCase();
  const c = (item.class || '').toLowerCase();
  const t = (item.type || '').toLowerCase();
  const extratags = item.extratags || {};
  const historicTag = (extratags.historic || '').toLowerCase();

  // 1. Explicit negative match: reject schools, colleges, hotels, hospitals, shops, etc.
  for (const term of NON_HERITAGE_TERMS) {
    if (name.includes(term)) {
      // Unless it is explicitly an archaeological site / ancient ruin with historic tag
      if (!historicTag || ['college', 'school', 'hospital', 'hotel'].includes(t)) {
        return false;
      }
    }
  }

  // 2. Reject non-cultural classes
  if (['railway', 'highway', 'shop', 'office', 'craft', 'commercial', 'industrial'].includes(c)) {
    return false;
  }

  // 3. Reject administrative boundaries or bare city/town areas
  if (['boundary', 'place'].includes(c) && ['administrative', 'city', 'town', 'village', 'state', 'suburb'].includes(t)) {
    return false;
  }

  // 4. Reject regular amenities that are not places of worship
  if (c === 'amenity' && t !== 'place_of_worship') {
    return false;
  }

  return true;
};

/**
 * Determine standardized heritage category from OSM tags or class/type
 */
const categorizeTags = (tags = {}, itemClass = '', itemType = '', displayName = '') => {
  const historic = (tags.historic || '').toLowerCase();
  const tourism = (tags.tourism || '').toLowerCase();
  const amenity = (tags.amenity || '').toLowerCase();
  const religion = (tags.religion || '').toLowerCase();
  const heritage = (tags.heritage || '').toLowerCase();
  const c = (itemClass || '').toLowerCase();
  const t = (itemType || '').toLowerCase();
  const d = (displayName || '').toLowerCase();

  if (
    historic === 'fort' || historic === 'castle' || historic === 'city_gate' ||
    t === 'fort' || t === 'castle' || t === 'city_gate' ||
    d.includes('fort') || d.includes('qila') || d.includes('rampart')
  ) {
    return 'fort';
  }
  if (
    historic === 'palace' || historic === 'manor' ||
    t === 'palace' || t === 'manor' ||
    d.includes('palace') || d.includes('mahal') || d.includes('haveli')
  ) {
    return 'palace';
  }
  if (
    historic === 'archaeological_site' || historic === 'ruins' ||
    t === 'archaeological_site' || t === 'ruins' ||
    d.includes('ruins') || d.includes('caves') || d.includes('excavation')
  ) {
    return 'archaeological_site';
  }
  if (
    religion === 'hindu' || religion === 'buddhist' || religion === 'jain' || religion === 'sikh' ||
    amenity === 'place_of_worship' || (c === 'amenity' && t === 'place_of_worship') ||
    d.includes('temple') || d.includes('mandir') || d.includes('gurdwara') || d.includes('stupa')
  ) {
    return 'temple_heritage';
  }
  if (
    historic === 'monument' || historic === 'memorial' ||
    t === 'monument' || t === 'memorial' ||
    d.includes('monument') || d.includes('pillar') || d.includes('minar')
  ) {
    return 'monument';
  }
  if (historic || heritage || tourism === 'attraction' || t === 'attraction') {
    return 'historic';
  }
  return 'other';
};

/**
 * Calculate geographical distance in kilometers between two coordinates (Haversine formula)
 */
const calculateDistanceKm = (coord1, coord2) => {
  if (!coord1 || !coord2) return Infinity;
  const R = 6371; // Earth's radius in km
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.lat * Math.PI) / 180) *
      Math.cos((coord2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Normalize site name for deduplication comparison (e.g. "Qutb Minar" vs "Qutb Minar Complex")
 */
const normalizeSiteName = (name = '') => {
  return name
    .toLowerCase()
    .replace(/\b(complex|monument|fortress|temple|palace|memorial)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
};

/**
 * Fetch places dynamically from OpenStreetMap Nominatim
 */
const fetchNominatimSearch = async (searchQuery, limit = 15) => {
  const response = await axios.get(NOMINATIM_SEARCH_URL, {
    params: {
      q: searchQuery,
      format: 'json',
      addressdetails: 1,
      extratags: 1,
      limit: Math.min(Math.max(1, limit), 50),
      countrycodes: 'in',
    },
    headers: {
      'User-Agent': OSM_USER_AGENT,
    },
    timeout: 7000,
  });

  if (Array.isArray(response.data)) {
    return response.data;
  }
  return [];
};

/**
 * Build Overpass QL Query based on search parameters
 */
const buildOverpassQuery = ({ q, city, state, category, limit = 20 }) => {
  const timeout = 10;
  const maxResults = Math.min(Math.max(1, parseInt(limit, 10) || 20), 40);

  const sanitize = (str) => (str ? str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '');
  const cleanQ = sanitize(q);
  const cleanCity = sanitize(city);

  let tagFilter = '["historic"]';
  if (category === 'fort') {
    tagFilter = '["historic"~"^(fort|castle|city_gate)$"]';
  } else if (category === 'palace') {
    tagFilter = '["historic"="palace"]';
  } else if (category === 'archaeological_site') {
    tagFilter = '["historic"~"^(archaeological_site|ruins)$"]';
  } else if (category === 'monument') {
    tagFilter = '["historic"~"^(monument|memorial)$"]';
  } else if (category === 'temple_heritage') {
    tagFilter = '["historic"]["religion"~"^(hindu|buddhist|jain|sikh)$"]';
  }

  let nameFilter = '';
  if (cleanQ) {
    nameFilter = `["name"~"${cleanQ}",i]`;
  }

  let areaClause = '';
  let inArea = '';
  if (cleanCity) {
    areaClause = `area["name"~"${cleanCity}",i]["admin_level"~"^(4|6|7|8)$"]->.a;`;
    inArea = '(area.a)';
  } else {
    // Focused geographic search
    inArea = '(8.0,68.0,37.0,97.5)';
  }

  const query = `
    [out:json][timeout:${timeout}];
    ${areaClause}
    (
      node${tagFilter}${nameFilter}${inArea};
      way${tagFilter}${nameFilter}${inArea};
    );
    out center tags ${maxResults};
  `;

  return query.trim();
};

/**
 * Execute Overpass query with failover and timeout
 */
const executeOverpassQuery = async (queryText) => {
  let lastError = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await axios.post(
        endpoint,
        `data=${encodeURIComponent(queryText)}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': OSM_USER_AGENT,
          },
          timeout: 5000,
        }
      );

      if (response.data && Array.isArray(response.data.elements)) {
        return response.data.elements;
      }
    } catch (err) {
      lastError = err;
      console.warn(`[OSM Overpass] Endpoint ${endpoint} failed: ${err.message}. Trying next endpoint...`);
    }
  }

  throw new Error(`All Overpass API endpoints failed or timed out: ${lastError ? lastError.message : 'Unknown error'}`);
};

/**
 * Discover heritage sites dynamically using OpenStreetMap
 * Supports Nominatim search with Overpass failover, strict authenticity filtering,
 * and robust deduplication (stable osmId + normalized name and coordinate proximity).
 */
const discoverSites = async (params = {}) => {
  const { q = '', city = '', state = '', category = '', limit = 30 } = params;
  const maxLimit = Math.min(Math.max(1, parseInt(limit, 10) || 30), 50);

  const cleanQ = q.trim();
  const cleanCity = city.trim();
  const cleanState = state.trim();

  const cacheKey = JSON.stringify({
    q: cleanQ.toLowerCase(),
    city: cleanCity.toLowerCase(),
    state: cleanState.toLowerCase(),
    category,
    limit: maxLimit,
  });

  // 1. Check TTL cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return {
      success: true,
      data: cached.data,
      total: cached.data.length,
      isFromCache: true,
      cachedAt: new Date(cached.timestamp).toISOString(),
    };
  }

  const seenIds = new Set();
  const normalizedList = [];

  // 2. Build search queries for OpenStreetMap Nominatim
  let searchQueries = [];

  if (cleanQ) {
    // Targeted monument search: include city/state for disambiguation
    const qWithLocation = [cleanQ, cleanCity, cleanState].filter(Boolean).join(', ');
    searchQueries.push(qWithLocation);
    if (cleanCity && cleanQ.toLowerCase() !== cleanCity.toLowerCase()) {
      searchQueries.push(`${cleanQ} ${cleanCity}`);
    }
    // Also try bare monument name if location-qualified might be too narrow
    searchQueries.push(`${cleanQ} India`);
  } else if (cleanCity || cleanState) {
    // If single prefix of 1-2 letters (e.g. "j" or "jo"), require at least 3 chars for region scan
    if (cleanCity && cleanCity.length < 3 && !cleanState) {
      searchQueries = [];
    } else {
      // Region-based exploration: search for forts, palaces, monuments, and temples in that region
      const locationStr = [cleanCity, cleanState].filter(Boolean).join(' ');
      if (!category || category === 'fort') searchQueries.push(`fort in ${locationStr}`);
      if (!category || category === 'palace') searchQueries.push(`palace in ${locationStr}`);
      if (!category || category === 'monument') searchQueries.push(`monument in ${locationStr}`);
      if (!category || category === 'temple_heritage') searchQueries.push(`temple in ${locationStr}`);
    }
  } else {
    // Default directory view: discover top genuine Indian heritage landmarks
    if (category === 'fort') {
      searchQueries = ['Red Fort Delhi', 'Amer Fort Jaipur', 'Golconda Fort Hyderabad', 'Mehrangarh Fort Jodhpur', 'Chittorgarh Fort'];
    } else if (category === 'palace') {
      searchQueries = ['Hawa Mahal Jaipur', 'City Palace Jaipur', 'Mysore Palace', 'Umaid Bhawan Palace Jodhpur'];
    } else if (category === 'monument') {
      searchQueries = ['Qutb Minar Delhi', 'India Gate Delhi', 'Charminar Hyderabad', 'Victoria Memorial Kolkata'];
    } else if (category === 'temple_heritage') {
      searchQueries = ['Golden Temple Amritsar', 'Sun Temple Konark', 'Meenakshi Temple Madurai', 'Khajuraho Temples'];
    } else {
      searchQueries = [
        'Taj Mahal Agra',
        'Red Fort Delhi',
        'Hawa Mahal Jaipur',
        'Qutb Minar Delhi',
        'Charminar Hyderabad',
        'Golden Temple Amritsar',
        'Amer Fort Jaipur',
        'Victoria Memorial Kolkata',
        'Mysore Palace',
        'Sun Temple Konark',
        'Meenakshi Temple Madurai',
      ];
    }
  }

  let nominatimFailed = false;
  let lastNominatimError = null;

  // Execute Nominatim search in parallel for speed
  let successfulBatches = 0;
  const searchPromises = searchQueries.slice(0, 5).map(async (sq) => {
    try {
      const items = await fetchNominatimSearch(sq, 5);
      successfulBatches++;
      return items;
    } catch (nomErr) {
      lastNominatimError = nomErr;
      return [];
    }
  });

  const searchBatches = await Promise.all(searchPromises);
  if (successfulBatches === 0 && searchQueries.length > 0) {
    nominatimFailed = true;
  }

  for (const items of searchBatches) {
    if (normalizedList.length >= maxLimit) break;
    for (const item of items) {
      if (normalizedList.length >= maxLimit) break;

      const osmId = `${item.osm_type}/${item.osm_id}`;
      if (seenIds.has(osmId)) continue;

      // ── Filter: Ensure place is authentic heritage (NO colleges, schools, offices, etc.) ──
      if (!isAuthenticHeritage(item)) {
        continue;
      }

      const name = item.name || item.display_name?.split(',')[0]?.trim();
      if (!name || name.length < 2) continue;

      // ── Query Relevance Check ──
      // If user searched for a specific monument (e.g. "Red Fort"), verify the result actually matches "Red Fort"
      if (cleanQ) {
        const nameLower = name.toLowerCase();
        const qLower = cleanQ.toLowerCase();
        const displayLower = (item.display_name || '').toLowerCase();

        // Check if query words appear in name or display name
        const qWords = qLower.split(/\s+/).filter((w) => w.length > 2);
        const matchesQuery =
          nameLower.includes(qLower) ||
          displayLower.includes(qLower) ||
          (qWords.length > 0 && qWords.every((w) => displayLower.includes(w)));

        if (!matchesQuery) {
          continue; // Discard unrelated places!
        }
      }

      // ── City & State Verification ──
      const resolvedCity =
        item.address?.city ||
        item.address?.town ||
        item.address?.county ||
        item.address?.state_district ||
        cleanCity ||
        '';

      const resolvedState = item.address?.state || cleanState || '';

      if (cleanCity) {
        const cityLower = cleanCity.toLowerCase();
        const itemCityMatch =
          resolvedCity.toLowerCase().includes(cityLower) ||
          (item.display_name || '').toLowerCase().includes(cityLower);
        if (!itemCityMatch) {
          continue; // Must be in the requested city
        }
      }

      if (cleanState) {
        const stateLower = cleanState.toLowerCase();
        const itemStateMatch =
          resolvedState.toLowerCase().includes(stateLower) ||
          (item.display_name || '').toLowerCase().includes(stateLower);
        if (!itemStateMatch) {
          continue; // Must be in the requested state
        }
      }

      const assignedCategory = categorizeTags(
        item.extratags || {},
        item.class,
        item.type,
        name
      );

      // Category filter check
      if (category && assignedCategory !== category) {
        continue;
      }

      const lat = item.lat ? parseFloat(item.lat) : null;
      const lng = item.lon ? parseFloat(item.lon) : null;
      const currentCoords = lat !== null && lng !== null ? { lat, lng } : null;

      // ── Robust Deduplication (Fix Qutb Minar Appearing Twice) ──
      // Check if a monument with the same normalized name is already in the list nearby (within 2 km)
      const currentNormName = normalizeSiteName(name);
      const isDuplicate = normalizedList.some((existing) => {
        const existingNormName = normalizeSiteName(existing.name);
        if (currentNormName === existingNormName) {
          // If in same city or within 2 km, it is the same physical monument
          if (
            (resolvedCity && existing.city && resolvedCity.toLowerCase() === existing.city.toLowerCase()) ||
            calculateDistanceKm(currentCoords, existing.coordinates) < 2.0
          ) {
            return true;
          }
        }
        return false;
      });

      if (isDuplicate) {
        continue; // Discard duplicate entry!
      }

      seenIds.add(osmId);

      const { imageUrl, attribution } = await resolveSiteImage(
        name,
        assignedCategory,
        item.extratags || {},
        resolvedCity,
        resolvedState
      );

      normalizedList.push({
        osmId,
        name,
        city: resolvedCity,
        state: resolvedState,
        category: assignedCategory,
        coordinates: currentCoords,
        imageUrl,
        imageAttribution: attribution,
        description:
          item.extratags?.description ||
          item.display_name ||
          'Discovered cultural heritage site via OpenStreetMap.',
        osmTags: {
          class: item.class,
          type: item.type,
          wikidata: item.extratags?.wikidata || null,
          wikipedia: item.extratags?.wikipedia || null,
        },
      });
    }
  }

  // 3. Fallback to Overpass API ONLY if Nominatim experienced an error AND returned 0 results
  if (normalizedList.length === 0 && nominatimFailed) {
    try {
      const queryText = buildOverpassQuery({
        q: cleanQ,
        city: cleanCity,
        state: cleanState,
        category,
        limit: maxLimit,
      });
      const rawElements = await executeOverpassQuery(queryText);

      for (const el of rawElements) {
        const osmId = `${el.type}/${el.id}`;
        if (seenIds.has(osmId)) continue;

        const tags = el.tags || {};
        const name = tags['name:en'] || tags.name || tags['name:hi'];
        if (!name || name.trim().length === 0) continue;

        let lat = null;
        let lng = null;
        if (el.lat !== undefined && el.lon !== undefined) {
          lat = el.lat;
          lng = el.lon;
        } else if (el.center && el.center.lat !== undefined && el.center.lon !== undefined) {
          lat = el.center.lat;
          lng = el.center.lon;
        }
        const coords = lat !== null && lng !== null ? { lat, lng } : null;

        const assignedCategory = categorizeTags(tags);
        if (category && assignedCategory !== category) continue;

        const resolvedCity = tags['addr:city'] || tags['is_in:city'] || tags['city'] || cleanCity || '';
        const resolvedState = tags['addr:state'] || tags['is_in:state'] || cleanState || '';

        // Deduplication check
        const currentNorm = normalizeSiteName(name);
        const isDup = normalizedList.some(
          (ex) => normalizeSiteName(ex.name) === currentNorm && calculateDistanceKm(coords, ex.coordinates) < 2.0
        );
        if (isDup) continue;

        seenIds.add(osmId);

        const { imageUrl, attribution } = await resolveSiteImage(
          name,
          assignedCategory,
          tags,
          resolvedCity,
          resolvedState
        );

        normalizedList.push({
          osmId,
          name: name.trim(),
          city: resolvedCity,
          state: resolvedState,
          category: assignedCategory,
          coordinates: coords,
          imageUrl,
          imageAttribution: attribution,
          description:
            tags.description ||
            tags['historic:civilization'] ||
            (tags.wikipedia
              ? `Historical landmark documented on Wikipedia (${tags.wikipedia})`
              : 'Discovered cultural heritage site via OpenStreetMap.'),
          osmTags: {
            historic: tags.historic || null,
            heritage: tags.heritage || null,
            wikipedia: tags.wikipedia || null,
            wikidata: tags.wikidata || null,
            opening_hours: tags.opening_hours || null,
          },
        });
      }
    } catch (overpassErr) {
      if (normalizedList.length === 0) {
        throw new Error(
          `OpenStreetMap discovery service temporarily unavailable: ${overpassErr.message || lastNominatimError?.message || 'Connection timeout'}`
        );
      }
    }
  }

  // 4. Cross-reference with database BookableSites to attach verified booking configuration
  const allConfigs = await BookableSite.find({ isActive: true }).lean();
  const configuredMap = new Map(allConfigs.map((cs) => [cs.osmId, cs]));

  const todayStr = new Date().toISOString().slice(0, 10);

  const enrichedResults = await Promise.all(
    normalizedList.map(async (site) => {
      // Find configuration by exact osmId, or by normalized name proximity
      let config = configuredMap.get(site.osmId);
      if (!config) {
        const siteNorm = normalizeSiteName(site.name);
        config = allConfigs.find((cs) => {
          const csNorm = normalizeSiteName(cs.name);
          if (siteNorm && csNorm && (siteNorm.includes(csNorm) || csNorm.includes(siteNorm))) {
            if (
              (site.city && cs.city && site.city.toLowerCase() === cs.city.toLowerCase()) ||
              calculateDistanceKm(site.coordinates, cs.coordinates) < 15.0
            ) {
              return true;
            }
          }
          return false;
        });
      }

      if (config) {
        // Site IS configured for online booking in MongoDB
        const slots = await TimeSlot.find({ siteId: config._id, date: todayStr, isActive: true }).lean();
        const totalCapacity = slots.reduce((acc, s) => acc + s.capacity, 0);
        const totalBooked = slots.reduce((acc, s) => acc + s.bookedVisitors, 0);
        const crowdInfo = getCrowdLevel(totalBooked, totalCapacity);

        return {
          ...site,
          isBookable: config.isActive,
          bookableSiteId: config._id,
          entryFee: config.entryFee,
          crowdCapacityPerSlot: config.crowdCapacityPerSlot,
          openingHours: config.openingHours || '09:00 AM - 05:30 PM',
          crowdStatus: crowdInfo,
        };
      } else {
        // Site is dynamically discovered from OSM and NOT configured in DB
        // Clearly and honestly label crowd information as unavailable
        return {
          ...site,
          isBookable: false,
          bookableSiteId: null,
          entryFee: null,
          crowdStatus: {
            level: 'unavailable',
            label: 'Crowd Data Unavailable',
            percent: null,
            color: 'gray',
            description: 'Online booking and crowd tracking is not yet configured for this site.',
          },
        };
      }
    })
  );

  // Store in cache
  cache.set(cacheKey, {
    data: enrichedResults,
    timestamp: Date.now(),
  });

  return {
    success: true,
    data: enrichedResults,
    total: enrichedResults.length,
    isFromCache: false,
  };
};

/**
 * Fetch details for a specific site by osmId
 * Primary: Nominatim Lookup & Direct OSM API; Fallback: Overpass API
 */
const getSiteByOsmId = async (osmId) => {
  let config = await BookableSite.findOne({ osmId }).lean();

  const [type, id] = osmId.includes('/') ? osmId.split('/') : ['', ''];
  if (!config && (!type || !id || isNaN(id))) {
    return null;
  }

  let element = null;
  let resolvedAddress = {};
  let resolvedExtratags = {};

  // 1. Try Nominatim Lookup by OSM ID (fastest, full address)
  try {
    const osmTypeLetter = type === 'node' ? 'N' : type === 'way' ? 'W' : 'R';
    const res = await axios.get(NOMINATIM_LOOKUP_URL, {
      params: {
        osm_ids: `${osmTypeLetter}${id}`,
        format: 'json',
        addressdetails: 1,
        extratags: 1,
      },
      headers: { 'User-Agent': OSM_USER_AGENT },
      timeout: 4000,
    });

    if (Array.isArray(res.data) && res.data.length > 0) {
      const item = res.data[0];
      element = {
        type: item.osm_type,
        id: item.osm_id,
        lat: item.lat ? parseFloat(item.lat) : undefined,
        lon: item.lon ? parseFloat(item.lon) : undefined,
        tags: {
          name: item.name || item.display_name?.split(',')[0],
          historic: item.type === 'monument' ? 'monument' : item.class === 'historic' ? item.type : undefined,
          ...item.extratags,
        },
      };
      resolvedAddress = item.address || {};
      resolvedExtratags = item.extratags || {};
    }
  } catch (lookupErr) {
    console.warn(`[OSM Service] Nominatim lookup failed for ${osmId}: ${lookupErr.message}`);
  }

  // 2. Try Direct OpenStreetMap REST API if not yet found
  if (!element && type && id) {
    try {
      const directRes = await axios.get(`${OSM_DIRECT_API}/${type}/${id}.json`, {
        headers: { 'User-Agent': OSM_USER_AGENT },
        timeout: 4000,
      });

      if (directRes.data && Array.isArray(directRes.data.elements) && directRes.data.elements.length > 0) {
        element = directRes.data.elements[0];
      }
    } catch (directErr) {
      console.warn(`[OSM Service] Direct OSM API failed for ${osmId}: ${directErr.message}`);
    }
  }

  // 3. Fallback to Overpass
  if (!element && type && id) {
    const query = `
      [out:json][timeout:8];
      ${type}(${id});
      out center tags;
    `;
    try {
      const elements = await executeOverpassQuery(query);
      if (elements.length > 0) {
        element = elements[0];
      }
    } catch (overpassErr) {
      console.warn(`[OSM Service] Overpass failed for ${osmId}: ${overpassErr.message}`);
    }
  }

  // If not matched by exact osmId, attempt name-based lookup against configured BookableSites
  if (!config && element) {
    const rawName = element.tags?.['name:en'] || element.tags?.name || element.tags?.['name:hi'];
    if (rawName) {
      const targetNorm = normalizeSiteName(rawName);
      const allActive = await BookableSite.find({ isActive: true }).lean();
      config = allActive.find((cs) => {
        const csNorm = normalizeSiteName(cs.name);
        return targetNorm && csNorm && (targetNorm.includes(csNorm) || csNorm.includes(targetNorm));
      }) || null;
    }
  }

  if (!element && !config) {
    return null;
  }

  const tags = element ? element.tags || {} : {};
  const name = config ? config.name : (tags['name:en'] || tags.name || tags['name:hi'] || 'Heritage Landmark');
  const category = config ? config.category : categorizeTags(tags, '', '', name);
  const city = config
    ? config.city
    : (resolvedAddress.city || resolvedAddress.town || resolvedAddress.county || tags['addr:city'] || tags['is_in:city'] || '');
  const state = config
    ? config.state
    : (resolvedAddress.state || tags['addr:state'] || tags['is_in:state'] || '');

  let coordinates = null;
  if (config && config.coordinates) {
    coordinates = config.coordinates;
  } else if (element) {
    if (element.lat !== undefined && element.lon !== undefined) {
      coordinates = { lat: parseFloat(element.lat), lng: parseFloat(element.lon) };
    } else if (element.center) {
      coordinates = { lat: parseFloat(element.center.lat), lng: parseFloat(element.center.lon) };
    }
  }

  const { imageUrl, attribution } = (config && config.imageUrl)
    ? { imageUrl: config.imageUrl, attribution: config.imageAttribution || 'HeritageConnect Verified Imagery' }
    : await resolveSiteImage(name, category, tags, city, state);

  let crowdInfo = {
    level: 'unavailable',
    label: 'Crowd Data Unavailable',
    percent: null,
    color: 'gray',
    description: 'Online booking and crowd tracking is not yet configured for this site.',
  };

  let availableSlots = [];
  if (config) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const slots = await TimeSlot.find({ siteId: config._id, date: { $gte: todayStr }, isActive: true }).sort({ date: 1, startTime: 1 }).lean();
    const todaySlots = slots.filter((s) => s.date === todayStr);
    const totalCapacity = todaySlots.reduce((acc, s) => acc + s.capacity, 0);
    const totalBooked = todaySlots.reduce((acc, s) => acc + s.bookedVisitors, 0);
    crowdInfo = getCrowdLevel(totalBooked, totalCapacity);
    availableSlots = slots;
  }

  return {
    osmId,
    name,
    city,
    state,
    category,
    coordinates,
    imageUrl,
    imageAttribution: attribution,
    description:
      (config && config.description) ||
      resolvedExtratags.description ||
      tags.description ||
      tags['historic:civilization'] ||
      (tags.wikipedia ? `Historical landmark documented on Wikipedia (${tags.wikipedia})` : 'Discovered cultural heritage site via OpenStreetMap.'),
    isBookable: !!(config && config.isActive),
    bookableSiteId: config ? config._id : null,
    entryFee: config ? config.entryFee : null,
    crowdCapacityPerSlot: config ? config.crowdCapacityPerSlot : null,
    openingHours: config ? config.openingHours : (tags.opening_hours || '09:00 AM - 05:30 PM'),
    rules: config ? config.rules : ['Government ID required for entry verification.'],
    crowdStatus: crowdInfo,
    availableSlots,
  };
};

module.exports = {
  discoverSites,
  getSiteByOsmId,
  buildOverpassQuery,
  executeOverpassQuery,
  isAuthenticHeritage,
  normalizeSiteName,
  calculateDistanceKm,
};
