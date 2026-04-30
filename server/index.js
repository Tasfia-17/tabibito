const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const LOCUS_KEY = 'claw_dev__mYSE9qLqytTQWF0IGokmpxzEn1sw9Kb';
const LOCUS_API = 'https://beta-api.paywithlocus.com/api';
const LASO_API = 'https://laso.finance';

const locus = axios.create({
  baseURL: LOCUS_API,
  headers: { Authorization: `Bearer ${LOCUS_KEY}` },
});

// ── Balance ─────────────────────────────────────────────────────────────────
app.get('/api/balance', async (req, res) => {
  try {
    const { data } = await locus.get('/pay/balance');
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Weather ─────────────────────────────────────────────────────────────────
app.post('/api/weather', async (req, res) => {
  const { city = 'Tokyo', weatherSuffix = 'JP' } = req.body;
  try {
    const geo = await locus.post('/wrapped/openweather/geocode', { q: `${city},${weatherSuffix}`, limit: 1 });
    const [loc] = geo.data.data;
    const weather = await locus.post('/wrapped/openweather/one-call', {
      lat: loc.lat, lon: loc.lon, units: 'metric', exclude: 'minutely,alerts',
    });
    res.json({ success: true, data: weather.data.data, location: loc });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Itinerary + Mapbox walking distances ────────────────────────────────────
app.post('/api/itinerary', async (req, res) => {
  const { destination = 'Tokyo', days = 5, budget, interests, country = 'Japan' } = req.body;
  try {
    const prompt = `Create a ${days}-day travel itinerary for ${destination}, ${country}.
Budget: ${budget || 'moderate'}. Interests: ${interests || 'culture, food, sightseeing'}.
Use REAL specific named locations (e.g. actual landmark names).
Return ONLY valid JSON:
{
  "days": [{
    "day": 1, "title": "string",
    "morning":   { "activity": "string", "location": "string", "tip": "string" },
    "afternoon": { "activity": "string", "location": "string", "tip": "string" },
    "evening":   { "activity": "string", "location": "string", "tip": "string" },
    "estimatedCost": "string"
  }],
  "packingList": ["string"],
  "totalEstimatedBudget": "string"
}`;

    const { data } = await locus.post('/wrapped/gemini/chat', {
      model: 'gemini-2.0-flash',
      messages: [{ role: 'user', content: prompt }],
      responseMimeType: 'application/json',
    });
    const raw = data.data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const itinerary = JSON.parse(raw);

    // Enrich day 1 with Mapbox walking distances between the 3 stops
    if (itinerary.days?.[0]) {
      const d1 = itinerary.days[0];
      const stops = ['morning', 'afternoon', 'evening']
        .map(p => d1[p]?.location).filter(Boolean);
      const walkTimes = [];

      for (let i = 0; i < stops.length - 1; i++) {
        try {
          const [g1, g2] = await Promise.all([
            locus.post('/wrapped/mapbox/forward-geocode', { q: `${stops[i]}, ${destination}, Japan`, limit: 1 }),
            locus.post('/wrapped/mapbox/forward-geocode', { q: `${stops[i+1]}, ${destination}, Japan`, limit: 1 }),
          ]);
          const f1 = g1.data.data?.features?.[0];
          const f2 = g2.data.data?.features?.[0];
          if (f1 && f2) {
            const [lon1, lat1] = f1.geometry.coordinates;
            const [lon2, lat2] = f2.geometry.coordinates;
            const dir = await locus.post('/wrapped/mapbox/directions', {
              profile: 'walking',
              coordinates: `${lon1},${lat1};${lon2},${lat2}`,
            });
            const route = dir.data.data?.routes?.[0];
            if (route) walkTimes.push({
              from: stops[i], to: stops[i+1],
              minutes: Math.round(route.duration / 60),
              km: (route.distance / 1000).toFixed(1),
            });
          }
        } catch { /* skip if geocode fails */ }
      }
      d1.walkingDistances = walkTimes;
    }

    res.json({ success: true, data: itinerary });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Translations (DeepL) ────────────────────────────────────────────────────
app.post('/api/translate', async (req, res) => {
  const { phrases, translateLang = 'JA' } = req.body;
  try {
    const results = await Promise.all(
      phrases.map(text =>
        locus.post('/wrapped/deepl/translate', { text, target_lang: translateLang })
          .then(r => ({ original: text, translated: r.data.data?.translations?.[0]?.text || '' }))
          .catch(() => ({ original: text, translated: '—' }))
      )
    );
    res.json({ success: true, data: results });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Browser Use: find accommodation ─────────────────────────────────────────
app.post('/api/accommodation', async (req, res) => {
  const { destination, days, budget } = req.body;
  const priceRange = { budget: 'under $80/night', moderate: '$80-$200/night', luxury: 'over $200/night' }[budget] || '$80-$200/night';
  try {
    const taskRes = await locus.post('/wrapped/browser-use/run-task', {
      task: `Search booking.com for hotels in ${destination}, Japan. Budget: ${priceRange}.
Find the top 3 available hotels. For each return name, price per night, star rating, and booking URL.
Return as JSON array: [{"name":"...","pricePerNight":"...","stars":"...","bookingUrl":"..."}]`,
      llm: 'browser-use-2.0',
      maxSteps: 25,
    });

    const taskId = taskRes.data.data?.id || taskRes.data.data?.task_id;
    if (!taskId) return res.json({ success: false, hotels: [], error: 'No task ID' });

    // Poll up to 90s
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const statusRes = await locus.post('/wrapped/browser-use/get-task-status', { taskId });
      const status = statusRes.data.data?.status;
      if (status === 'finished' || status === 'completed') {
        const taskData = await locus.post('/wrapped/browser-use/get-task', { taskId });
        const result = taskData.data.data?.result || taskData.data.data?.output || '';
        let hotels = [];
        try {
          const match = result.match(/\[[\s\S]*?\]/);
          if (match) hotels = JSON.parse(match[0]);
        } catch {}
        if (!hotels.length) hotels = [{
          name: 'Search complete — view results',
          pricePerNight: priceRange,
          stars: '—',
          bookingUrl: `https://www.booking.com/search.html?ss=${encodeURIComponent(destination + ' Japan')}`,
        }];
        return res.json({ success: true, hotels });
      }
      if (status === 'failed') break;
    }
    // Timeout fallback
    res.json({ success: true, hotels: [{
      name: `Hotels in ${destination}`,
      pricePerNight: priceRange,
      stars: '—',
      bookingUrl: `https://www.booking.com/search.html?ss=${encodeURIComponent(destination + ' Japan')}`,
    }]});
  } catch (e) { res.status(500).json({ error: e.message, hotels: [] }); }
});

// ── Create Locus Checkout session ───────────────────────────────────────────
app.post('/api/checkout/create', async (req, res) => {
  const { destination, country, days, budget } = req.body;
  try {
    // Beta API key only works on beta — session URL will be beta-checkout.paywithlocus.com
    const response = await axios.post(
      `${LOCUS_API}/checkout/sessions`,
      {
        amount: '0.50',
        description: `Tabibito — ${days}-day ${destination}, ${country} trip plan`,
        successUrl: 'https://svc-molqgm3yyf31x8jg.beta.buildwithlocus.com/dashboard',
        cancelUrl: 'https://svc-molqgm3yyf31x8jg.beta.buildwithlocus.com/',
        metadata: { destination, country, days, budget },
        receiptConfig: {
          enabled: true,
          fields: {
            creditorName: 'Tabibito AI Travel',
            lineItems: [
              { description: `${days}-day ${destination} itinerary`, amount: '0.25' },
              { description: 'Live weather + packing list', amount: '0.10' },
              { description: 'Translations (7 phrases)', amount: '0.08' },
              { description: 'Mapbox walking distances', amount: '0.07' },
            ],
            subtotal: '0.50',
            supportEmail: 'hello@tabibito.ai',
          },
        },
      },
      { headers: { Authorization: `Bearer ${LOCUS_KEY}` } }
    );
    if (!response.data.success) throw new Error(response.data.message);
    res.json({ success: true, sessionId: response.data.data.id });
  } catch (e) {
    res.status(500).json({ error: e.response?.data?.message || e.message });
  }
});


app.post('/api/laso/auth', async (req, res) => {
  try {
    const { data } = await locus.post('/x402/laso-auth', {});
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Laso order INTERNATIONAL card (global, 24h queue, min $100) ─────────────
app.post('/api/laso/order-intl-card', async (req, res) => {
  const { amount } = req.body;
  try {
    const { data } = await locus.post('/x402/call', {
      url: `${LASO_API}/order-intl-card?amount=${amount}`,
      method: 'GET',
    });
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.response?.data || e.message }); }
});

// ── Laso order US card (instant, US only, fallback) ─────────────────────────
app.post('/api/laso/order-card', async (req, res) => {
  const { amount } = req.body;
  try {
    const { data } = await locus.post('/x402/laso-get-card', { amount });
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.response?.data || e.message }); }
});

// ── Laso poll card status ───────────────────────────────────────────────────
app.get('/api/laso/card/:cardId', async (req, res) => {
  const { cardId } = req.params;
  const { token, type } = req.query;
  try {
    const params = { card_id: cardId };
    if (type === 'intl') params.card_type = 'Non-Reloadable International';
    const { data } = await axios.get(`${LASO_API}/get-card-data`, {
      params, headers: { Authorization: `Bearer ${token}` },
    });
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Laso cancel intl card ───────────────────────────────────────────────────
app.post('/api/laso/cancel-intl-card', async (req, res) => {
  const { cardId, token } = req.body;
  try {
    const { data } = await axios.post(`${LASO_API}/cancel-intl-order`,
      { card_id: cardId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Full trip plan orchestrator ─────────────────────────────────────────────
app.post('/api/plan-trip', async (req, res) => {
  const { destination, days, budget, interests, translateLang = 'JA', weatherSuffix = 'JP', country = 'Japan' } = req.body;
  try {
    const [weatherRes, itineraryRes] = await Promise.allSettled([
      axios.post('http://localhost:8080/api/weather', { city: destination, weatherSuffix }),
      axios.post('http://localhost:8080/api/itinerary', { destination, days, budget, interests, country }),
    ]);

    const translationsRes = await axios.post('http://localhost:8080/api/translate', {
      translateLang,
      phrases: [
        'Where is the train station?',
        'How much does this cost?',
        'I am allergic to shellfish',
        'Please call an ambulance',
        'Thank you very much',
        'Excuse me, where is...?',
        'Do you speak English?',
      ],
    }).catch(() => ({ data: { data: [] } }));

    res.json({
      success: true,
      weather: weatherRes.status === 'fulfilled' ? weatherRes.value.data : null,
      itinerary: itineraryRes.status === 'fulfilled' ? itineraryRes.value.data : null,
      translations: translationsRes.data,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Tabibito server :${PORT}`));
