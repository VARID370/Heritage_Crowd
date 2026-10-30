const request = require('supertest');
const mongoose = require('mongoose');
const axios = require('axios');
const app = require('../app');
const { resolveSiteImage, _internal, NEUTRAL_PLACEHOLDER } = require('../services/imageService');
const { isAuthenticHeritage, normalizeSiteName, calculateDistanceKm } = require('../services/osmService');

jest.mock('axios');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Build a mock Wikipedia pageimages response for a given pageId / thumbUrl */
const buildWikipediaResponse = (pageId, thumbUrl) => ({
  data: {
    query: {
      pages: {
        [pageId]: {
          pageid: pageId,
          title: 'Test Page',
          thumbnail: { source: thumbUrl, width: 1200, height: 800 },
        },
      },
    },
  },
});

/** Build a mock Wikipedia response with no thumbnail (page exists but no image) */
const buildWikipediaNoImageResponse = (pageId) => ({
  data: {
    query: {
      pages: {
        [pageId]: { pageid: pageId, title: 'Test Page' },
      },
    },
  },
});

/** Build a mock Wikipedia "page not found" response (-1 pageId) */
const buildWikipediaNotFoundResponse = () => ({
  data: { query: { pages: { '-1': { ns: 0, title: 'Not found' } } } },
});

/** Build a minimal Wikimedia Commons search + fileinfo mock */
const buildCommonsImageResponse = (fileTitle, thumbUrl) => ({
  searchResponse: {
    data: {
      query: {
        search: [{ title: fileTitle, ns: 6 }],
      },
    },
  },
  fileInfoResponse: {
    data: {
      query: {
        pages: {
          '12345': {
            pageid: 12345,
            title: fileTitle,
            imageinfo: [
              {
                thumburl: thumbUrl,
                extmetadata: {
                  Artist: { value: 'Test Author' },
                  LicenseShortName: { value: 'CC BY-SA 4.0' },
                },
              },
            ],
          },
        },
      },
    },
  },
});

// ─── Test suite ──────────────────────────────────────────────────────────────

describe('Dynamic Heritage Discovery, Quality Filtering & Image Resolution Tests', () => {
  beforeAll(async () => {
    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/heritage_connect';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(() => {
    _internal.imageCache.clear();
    jest.clearAllMocks();
  });

  // ── 1. Heritage Authenticity & Negative Filter Tests ───────────────────────

  it('isAuthenticHeritage strictly rejects colleges, schools, hospitals, and hotels', () => {
    expect(isAuthenticHeritage({ name: 'Presidency College Chennai', class: 'amenity', type: 'college' })).toBe(false);
    expect(isAuthenticHeritage({ name: 'Loyola College', class: 'building', type: 'college' })).toBe(false);
    expect(isAuthenticHeritage({ name: 'Fort View Hotel & Resort', class: 'tourism', type: 'hotel' })).toBe(false);
    expect(isAuthenticHeritage({ name: 'Heritage Public School', class: 'amenity', type: 'school' })).toBe(false);
    expect(isAuthenticHeritage({ name: 'City Civil Hospital', class: 'amenity', type: 'hospital' })).toBe(false);
    expect(isAuthenticHeritage({ name: 'Jaipur', class: 'place', type: 'city' })).toBe(false);
  });

  it('isAuthenticHeritage accepts authentic historic forts, palaces, and monuments', () => {
    expect(isAuthenticHeritage({ name: 'Red Fort', class: 'historic', type: 'castle', extratags: { historic: 'fort' } })).toBe(true);
    expect(isAuthenticHeritage({ name: 'Hawa Mahal', class: 'historic', type: 'monument', extratags: { historic: 'palace' } })).toBe(true);
    expect(isAuthenticHeritage({ name: 'Qutb Minar', class: 'historic', type: 'monument' })).toBe(true);
    expect(isAuthenticHeritage({ name: 'Sun Temple', class: 'amenity', type: 'place_of_worship' })).toBe(true);
    expect(isAuthenticHeritage({ name: 'Nalanda Archaeological Ruins', class: 'historic', type: 'archaeological_site' })).toBe(true);
  });

  // ── 2. Deduplication Logic Tests ──────────────────────────────────────────

  it('normalizeSiteName and calculateDistanceKm correctly identifies duplicate Qutb Minar entries', () => {
    const name1 = 'Qutb Minar';
    const name2 = 'Qutb Minar Complex';
    expect(normalizeSiteName(name1)).toBe(normalizeSiteName(name2));

    const coordTower = { lat: 28.5244, lng: 77.1855 };
    const coordComplex = { lat: 28.5248, lng: 77.1859 };
    const distanceKm = calculateDistanceKm(coordTower, coordComplex);
    expect(distanceKm).toBeLessThan(0.5); // Less than 500 meters
  });

  it('calculateDistanceKm does not falsely deduplicate sites with same name in different cities', () => {
    const coordDelhiFort = { lat: 28.6562, lng: 77.2410 };
    const coordKolkataFort = { lat: 22.5542, lng: 88.3364 };
    const distanceKm = calculateDistanceKm(coordDelhiFort, coordKolkataFort);
    expect(distanceKm).toBeGreaterThan(1000); // 1300+ km apart
  });

  // ── 3. Image URL Sanitization & Neutral Placeholder Tests ───────────────────

  it('sanitizeWikimediaUrl rewrites thumb.wikimedia.org to upload.wikimedia.org and strips tracking parameters', () => {
    const brokenThumbUrl =
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2a/Delhi_fort.jpg/1280px-Delhi_fort.jpg?utm_source=en.wikipedia.org&utm_campaign=api';
    const cleaned = _internal.sanitizeWikimediaUrl(brokenThumbUrl);
    expect(cleaned).toContain('upload.wikimedia.org');
    expect(cleaned).not.toContain('thumb.wikimedia.org');
    expect(cleaned).not.toContain('utm_source');
  });

  it('resolveSiteImage falls back to neutral placeholder SVG and NEVER returns a different monument photo', async () => {
    axios.get.mockRejectedValue(new Error('Network timeout'));

    // An unknown fort or college must NEVER get a Taj Mahal or Amer Fort photo!
    const unknownSite = await resolveSiteImage('Uncatalogued Remote Site XYZ', 'other', {}, 'Chennai', 'Tamil Nadu');
    expect(unknownSite.imageUrl).toBe('/placeholder-monument.svg');
    expect(unknownSite.isPlaceholder).toBe(true);
    expect(unknownSite.imageUrl).not.toContain('Taj_Mahal');
    expect(unknownSite.imageUrl).not.toContain('Amer_Fort');
  });

  it('resolveSiteImage matches specific curated photo ONLY when monument name strictly matches', async () => {
    axios.get.mockRejectedValue(new Error('Network timeout'));

    const redFortResult = await resolveSiteImage('Red Fort', 'fort', {}, 'Delhi', 'Delhi');
    expect(redFortResult.imageUrl).toContain('upload.wikimedia.org');
    expect(redFortResult.imageUrl).toContain('Delhi_fort.jpg');
    expect(redFortResult.isPlaceholder).toBe(false);

    const tajResult = await resolveSiteImage('Taj Mahal', 'monument', {}, 'Agra', 'Uttar Pradesh');
    expect(tajResult.imageUrl).toContain('upload.wikimedia.org');
    expect(tajResult.imageUrl).toContain('Taj_Mahal');
  });

  // ── 4. Image Resolution Wikimedia Happy Path Tests ────────────────────────

  it('fetchWikimediaImage returns correct public upload.wikimedia.org URL when Wikipedia has page image', async () => {
    const thumbUrl =
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Fort.jpg/1280px-Fort.jpg';
    axios.get.mockResolvedValueOnce(buildWikipediaResponse(12345, thumbUrl));

    const result = await _internal.fetchWikimediaImage('Golconda Fort', 'Hyderabad');
    expect(result).not.toBeNull();
    expect(result.imageUrl).toContain('upload.wikimedia.org');
    expect(result.attribution).toMatch(/Wikipedia/i);
    expect(result.isPlaceholder).toBe(false);
  });

  it('cache stores result and prevents repeated API calls for same monument', async () => {
    const thumbUrl =
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Fort2.jpg/1200px-Fort2.jpg';
    axios.get.mockResolvedValueOnce(buildWikipediaResponse(777, thumbUrl));

    const r1 = await resolveSiteImage('Mehrangarh Fort', 'fort', {}, 'Jodhpur', 'Rajasthan');
    expect(axios.get).toHaveBeenCalledTimes(1);

    const r2 = await resolveSiteImage('Mehrangarh Fort', 'fort', {}, 'Jodhpur', 'Rajasthan');
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(r2.imageUrl).toBe(r1.imageUrl);
  });

  // ── 5. Discovery API Endpoint Tests ───────────────────────────────────────

  it('should query discovery endpoint and normalize external OSM elements', async () => {
    // Mock Nominatim search response with authentic heritage landmarks
    axios.get.mockResolvedValue({
      data: [
        {
          osm_type: 'way',
          osm_id: 11223344,
          name: 'Delhi Historic Rampart',
          class: 'historic',
          type: 'fort',
          lat: '28.65',
          lon: '77.24',
          address: { city: 'Delhi', state: 'Delhi' },
        },
      ],
    });

    const res = await request(app).get('/api/sites/discover?q=Delhi&limit=5');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);

    const site = res.body.data[0];
    expect(site.osmId).toBe('way/11223344');
    expect(site.name).toBe('Delhi Historic Rampart');
    expect(site.coordinates).toEqual({ lat: 28.65, lng: 77.24 });
    expect(site.isBookable).toBe(false);
    expect(site.crowdStatus.label).toBe('Crowd Data Unavailable');
  });

  it('should handle discovery provider failure and return 503 honest error', async () => {
    axios.get.mockRejectedValue(new Error('timeout of 7000ms exceeded'));
    axios.post.mockRejectedValue(new Error('timeout of 5000ms exceeded'));

    const res = await request(app).get('/api/sites/discover?q=TimeoutTest&limit=5');

    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/unavailable/i);
  });

  it('should fetch single site details by ID and handle 404 for nonexistent sites', async () => {
    const res = await request(app).get('/api/sites/nonexistent-id-99999');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/not found/i);
  });
});
