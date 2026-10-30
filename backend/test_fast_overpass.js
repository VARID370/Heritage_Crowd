const axios = require('axios');

async function testFastOverpass() {
  const endpoints = [
    'https://overpass.private.coffee/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
    'https://overpass-api.de/api/interpreter',
  ];

  // 1. Searching for "Red Fort" with name filter:
  // In Overpass, searching with exact or prefix tag or area geocode:
  // If we geocode "Delhi" or use area:
  const queryRedFort = `
    [out:json][timeout:8];
    (
      nwr["historic"]["name"~"Red Fort",i];
      nwr["historic"]["name:en"~"Red Fort",i];
      nwr["historic"]["name"~"Lal Qila",i];
    );
    out center tags 5;
  `;

  for (const ep of endpoints) {
    console.log(`\nTesting endpoint ${ep} for Red Fort...`);
    const t0 = Date.now();
    try {
      const res = await axios.post(ep, `data=${encodeURIComponent(queryRedFort.trim())}`, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'HeritageConnect/1.0' },
        timeout: 8000,
      });
      console.log(`Success in ${Date.now() - t0}ms! Elements count:`, res.data.elements?.length);
      if (res.data.elements?.length > 0) {
        res.data.elements.forEach(el => console.log('  -', el.type + '/' + el.id, el.tags?.name, el.tags?.['addr:city'] || el.tags?.historic));
      }
      return;
    } catch (e) {
      console.log(`Failed in ${Date.now() - t0}ms:`, e.message);
    }
  }
}

testFastOverpass();

