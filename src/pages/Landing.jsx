import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { COUNTRIES, applyPalette } from '../destinations';
import TfxOverlay from '../components/TfxOverlay';
import PageWrapper from '../components/PageWrapper';

function SparkLine({ heights, c1 }) {
  return (
    <div className="flex items-end gap-0.5 h-6">
      {heights.map((h, i) => (
        <motion.div key={i} className="spark-bar w-1.5 rounded-sm"
          initial={{ height: 2 }}
          animate={{ height: h * 0.24 }}
          transition={{ delay: i * 0.04, duration: 0.5, ease: 'easeOut' }}
          style={{ background: c1 }}
        />
      ))}
    </div>
  );
}

function CountryCard({ country, active, onClick }) {
  return (
    <motion.div
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className={`dest-card glass rounded-2xl p-4 select-none cursor-pointer ${active ? 'active' : ''}`}
      style={active ? { borderColor: country.c1, borderWidth: 2 } : {}}
    >
      <div className="scene-floor rounded-b-2xl" />
      <div className="text-center mb-2 relative z-10">
        {/* Big flag emoji */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3 + Math.random(), repeat: Infinity, ease: 'easeInOut' }}
          style={{ fontSize: 40, lineHeight: 1.2 }}
        >
          {country.emoji}
        </motion.div>
        {/* Mirror */}
        <div style={{ fontSize: 24, opacity: 0.15, transform: 'scaleY(-1)', marginTop: -4, filter: 'blur(1px)' }}>
          {country.emoji}
        </div>
      </div>
      <div className="relative z-10">
        <div className="flex items-baseline justify-between mb-0.5">
          <span className="font-display text-base" style={{ color: country.c1 }}>{country.name}</span>
          <span className="text-xs opacity-40">{country.native}</span>
        </div>
        <SparkLine heights={country.sparkHeights} c1={country.c1} />
        <div className="flex gap-1 mt-1.5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="edge-dot" style={{ background: country.c1, opacity: active ? 0.8 : 0.25 }} />
          ))}
        </div>
      </div>
      {active && (
        <motion.div layoutId="active-ring" className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ border: `2px solid ${country.c1}`, boxShadow: `0 0 20px ${country.c1}44` }} />
      )}
    </motion.div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [activeCountry, setActiveCountry] = useState(COUNTRIES[0]);
  const [tfxTrigger, setTfxTrigger] = useState(0);
  const [form, setForm] = useState({
    city: COUNTRIES[0].cities[0],
    days: '5',
    budget: 'moderate',
    interests: '',
    travelBudgetUSD: '500',
  });

  useEffect(() => { applyPalette(COUNTRIES[0]); }, []);

  const selectCountry = useCallback((country) => {
    if (country.id === activeCountry.id) return;
    setTfxTrigger(t => t + 1);
    setTimeout(() => {
      applyPalette(country);
      setActiveCountry(country);
      setForm(f => ({ ...f, city: country.cities[0] }));
    }, 120);
  }, [activeCountry]);

  const handleSubmit = (e) => {
    e.preventDefault();
    sessionStorage.setItem('tripForm', JSON.stringify({
      ...form,
      country: activeCountry.name,
      countryId: activeCountry.id,
      destination: form.city,
      translateLang: activeCountry.translateLang,
      weatherSuffix: activeCountry.weatherSuffix,
    }));
    navigate('/checkout');
  };

  return (
    <PageWrapper>
      <TfxOverlay trigger={tfxTrigger} />
      <div className="animated-bg min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-10">

          {/* Hero */}
          <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-10">
            <motion.div
              animate={{ rotateY: [0, 12, 0, -12, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              style={{ display: 'inline-block', fontSize: 72 }}
            >
              ✈️
            </motion.div>
            <div style={{ fontSize: 40, opacity: 0.12, transform: 'scaleY(-1)', marginTop: -8, filter: 'blur(2px)' }}>✈️</div>
            <h1 className="font-display mt-2" style={{ fontSize: 64, color: 'var(--c1)', lineHeight: 1.1 }}>Tabibito</h1>
            <p style={{ letterSpacing: '0.3em', opacity: 0.4, fontSize: 12, marginTop: 4 }}>THE AI TRAVEL PLANNER</p>
            <p style={{ opacity: 0.6, marginTop: 12, maxWidth: 420, margin: '12px auto 0' }}>
              Pick a country. Pick a city. Get weather, itinerary, translations, and a travel card — in one shot.
            </p>
          </motion.div>

          {/* Step 1: Country selector */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6">
            <p className="text-center text-xs font-bold opacity-40 mb-3 tracking-widest uppercase">Step 1 — Choose Country</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {COUNTRIES.map(c => (
                <CountryCard key={c.id} country={c} active={activeCountry.id === c.id} onClick={() => selectCountry(c)} />
              ))}
            </div>
          </motion.div>

          {/* Vibe pills for selected country */}
          <AnimatePresence mode="wait">
            <motion.div key={activeCountry.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="flex gap-2 justify-center mb-6 flex-wrap"
            >
              {activeCountry.vibe.map((v, i) => (
                <motion.span key={v} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}
                  className="px-3 py-1.5 rounded-full text-sm font-semibold"
                  style={{ background: `${activeCountry.c1}18`, border: `1px solid ${activeCountry.c1}40`, color: activeCountry.c3 }}>
                  {v}
                </motion.span>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Step 2: Trip form */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="glass rounded-3xl p-8 max-w-2xl mx-auto"
            style={{ borderColor: `${activeCountry.c1}44` }}
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="breathe" style={{ fontSize: 36 }}>{activeCountry.emoji}</span>
              <div>
                <h2 className="font-display text-2xl" style={{ color: 'var(--c1)' }}>{activeCountry.name} Trip</h2>
                <p style={{ fontSize: 12, opacity: 0.45 }}>Step 2 — Fill in your details</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* City selector */}
              <div>
                <label className="block text-xs font-bold opacity-50 mb-1.5 uppercase tracking-wider">
                  📍 City
                </label>
                <div className="flex gap-2 flex-wrap">
                  {activeCountry.cities.map(city => (
                    <motion.button key={city} type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => setForm(f => ({ ...f, city }))}
                      className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                      style={form.city === city
                        ? { background: 'var(--c1)', color: 'white' }
                        : { background: 'rgba(255,255,255,0.6)', color: 'var(--c3)', border: '1px solid rgba(0,0,0,0.08)' }}>
                      {city}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold opacity-50 mb-1.5 uppercase tracking-wider">📅 Days</label>
                  <input type="number" min="1" max="14" value={form.days}
                    onChange={e => setForm(f => ({ ...f, days: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-black/10 focus:outline-none focus:ring-2 transition"
                    style={{ '--tw-ring-color': 'var(--c1)' }} />
                </div>
                <div>
                  <label className="block text-xs font-bold opacity-50 mb-1.5 uppercase tracking-wider">💰 Budget</label>
                  <select value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-black/10 focus:outline-none transition">
                    <option value="budget">Budget</option>
                    <option value="moderate">Moderate</option>
                    <option value="luxury">Luxury</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold opacity-50 mb-1.5 uppercase tracking-wider">✨ Interests (optional)</label>
                <input value={form.interests} onChange={e => setForm(f => ({ ...f, interests: e.target.value }))}
                  placeholder="food, history, hiking, art..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-black/10 focus:outline-none transition" />
              </div>

              <div>
                <label className="block text-xs font-bold opacity-50 mb-1.5 uppercase tracking-wider">
                  💳 Travel Card Budget — ${form.travelBudgetUSD} USD
                </label>
                <input type="range" min="100" max="1000" step="50" value={form.travelBudgetUSD}
                  onChange={e => setForm(f => ({ ...f, travelBudgetUSD: e.target.value }))}
                  className="w-full" style={{ accentColor: 'var(--c1)' }} />
                <div className="flex justify-between text-xs opacity-30 mt-1"><span>$100</span><span>$1000</span></div>
              </div>

              <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="w-full py-4 rounded-2xl font-display text-xl text-white shadow-lg palette-pulse"
                style={{ background: `linear-gradient(135deg, ${activeCountry.c1}, ${activeCountry.c3})`, fontSize: 20 }}>
                {activeCountry.emoji} Plan My {form.city} Trip
              </motion.button>
            </form>
          </motion.div>

          {/* Feature pills */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            className="flex flex-wrap gap-2 justify-center mt-6">
            {['🌤️ Live Weather', '🤖 AI Itinerary', '🗺️ Walking Distances', '🔤 Translations', '💳 Global Travel Card', '🏨 Hotel Search'].map((f, i) => (
              <motion.span key={f} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 + i * 0.07 }}
                className="glass px-3 py-1.5 rounded-full text-xs font-semibold" style={{ opacity: 0.7 }}>
                {f}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </div>
    </PageWrapper>
  );
}
