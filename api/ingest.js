// api/ingest.js
const { Pool } = require('pg');

function loadKeys() {
  const pairs = [];
  for (let i = 1; i <= 5; i++) {
    const id = process.env['ADZUNA_APP_ID_' + i];
    const key = process.env['ADZUNA_APP_KEY_' + i];
    if (id && key) pairs.push({ id, key });
  }
  if (!pairs.length) throw new Error('Adzuna API anahtarı bulunamadı');
  return pairs;
}
const keys = loadKeys();
let keyIndex = 0;
function nextAuth() {
  const a = keys[keyIndex];
  keyIndex = (keyIndex + 1) % keys.length;
  return a;
}

function countriesFromEnvOrQuery(req) {
  const fromQuery = (req.query.countries || '').trim();
  const raw = fromQuery || process.env.ADZUNA_COUNTRIES ||
    'gb,us,tr,de,fr,ca,au,nl,pl,in,za,br,mx,sg,nz,it,es,ie,be,at,ch,dk,no,fi,se,pt';
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

async function insertJob(client, cc, j) {
  const city = Array.isArray(j.location?.area) ? j.location.area.slice(-1)[0] : null;
  const region = Array.isArray(j.location?.area) ? j.location.area.slice(-2, -1)[0] : null;
  const q = `
    INSERT INTO jobs
    (provider, provider_id, title, company, city, region, country, lat, lon, url, posted_at,
     salary_min, salary_max, currency, contract_time, remote, raw)
    VALUES
    ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,
     $12,$13,$14,$15,$16,$17)
    ON CONFLICT (provider, provider_id) DO NOTHING
  `;
  const vals = [
    'adzuna',
    String(j.id),
    j.title || null,
    j.company?.display_name || null,
    city || null,
    region || null,
    cc.toUpperCase(),
    j.latitude ?? null,
    j.longitude ?? null,
    j.redirect_url || null,
    j.created ? new Date(j.created) : null,
    j.salary_min ?? null,
    j.salary_max ?? null,
    j.salary_currency || null,
    j.contract_time || null,
    false, // 'remote' bilgisi tutarsız; istersen sonra işlersin
    j
  ];
  await client.query(q, vals);
}

async function fetchPage(cc, page, days, perPage) {
  const auth = nextAuth();
  const base = `https://api.adzuna.com/v1/api/jobs/${cc}/search/${page}`;
  const params = new URLSearchParams({
    app_id: auth.id,
    app_key: auth.key,
    max_days_old: String(days),
    results_per_page: String(perPage),
    sort_by: 'date',
    content_type: 'json'
  });
  const url = `${base}?${params.toString()}`;
  const r = await fetch(url);
  if (!r.ok) {
    // 429 veya 5xx durumlarında anahtar değiştirip devam edeceğiz (basitçe geçiyoruz)
    return { results: [] };
  }
  return r.json();
}

module.exports = async (req, res) => {
  const days = parseInt(req.query.days || '7', 10);
  const perPage = parseInt(process.env.ADZUNA_RESULTS_PER_PAGE || '50', 10);
  const maxPages = parseInt(process.env.ADZUNA_MAX_PAGES || '20', 10);
  const countries = countriesFromEnvOrQuery(req);

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const summary = {};
  const client = await pool.connect();
  try {
    for (const cc of countries) {
      let inserted = 0;
      for (let page = 1; page <= maxPages; page++) {
        const data = await fetchPage(cc, page, days, perPage);
        const arr = data.results || [];
        if (!arr.length) break;
        for (const j of arr) {
          try { await insertJob(client, cc, j); inserted++; } catch (e) { /* yut */ }
        }
        // Güvenli duruş: veri azsa sayfalama biter
        if (arr.length < perPage) break;
      }
      summary[cc] = inserted;
    }
    res.status(200).json({ ok: true, days, summary });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  } finally {
    client.release();
    await pool.end();
  }
};
