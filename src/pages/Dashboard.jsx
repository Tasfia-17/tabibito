import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { DESTINATIONS, applyPalette } from '../destinations';
import PageWrapper from '../components/PageWrapper';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const weatherIcon = (code) => {
  if (!code) return '🌤️';
  if (code >= 200 && code < 300) return '⛈️';
  if (code >= 300 && code < 600) return '🌧️';
  if (code >= 600 && code < 700) return '❄️';
  if (code === 800) return '☀️';
  if (code > 800) return '⛅';
  return '🌤️';
};

function Section({ title, children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45 }}
      className="glass rounded-3xl p-6 relative overflow-hidden"
    >
      {/* Floor reflection */}
      <div className="scene-floor rounded-b-3xl" />
      <h3 className="font-display text-xl mb-4" style={{ color: 'var(--c1)' }}>{title}</h3>
      {children}
    </motion.div>
  );
}

function WeatherCard({ weather, location }) {
  if (!weather) return null;
  const cur = weather.current;
  const daily = weather.daily?.slice(0, 5) || [];
  return (
    <Section title={`${weatherIcon(cur?.weather?.[0]?.id)} Weather · ${location?.name || ''}`} delay={0}>
      <div className="flex items-center gap-4 mb-4">
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-5xl"
        >
          {weatherIcon(cur?.weather?.[0]?.id)}
        </motion.div>
        <div>
          <div className="font-display text-4xl">{Math.round(cur?.temp)}°C</div>
          <div className="text-sm opacity-60 capitalize font-body">{cur?.weather?.[0]?.description}</div>
          <div className="text-xs opacity-40 font-body">Feels {Math.round(cur?.feels_like)}° · {cur?.humidity}% humidity</div>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {daily.map((d, i) => (
          <div key={i} className="glass rounded-2xl p-2 text-center">
            <div className="text-xs opacity-40 font-body">
              {i === 0 ? 'Today' : new Date(d.dt * 1000).toLocaleDateString('en', { weekday: 'short' })}
            </div>
            <div className="text-xl my-1">{weatherIcon(d.weather?.[0]?.id)}</div>
            <div className="text-xs font-bold">{Math.round(d.temp?.max)}°</div>
            <div className="text-xs opacity-40">{Math.round(d.temp?.min)}°</div>
          </div>
        ))}
      </div>
      <div className="mt-4 p-3 rounded-2xl text-sm font-body" style={{ background: 'rgba(245,158,11,0.10)' }}>
        🎒 {cur?.temp < 10 ? 'Heavy coat, gloves, scarf' : cur?.temp < 18 ? 'Light jacket, layers' : cur?.temp < 25 ? 'T-shirts, light cardigan' : 'Light clothes, sunscreen'}
        {cur?.weather?.[0]?.id >= 500 && cur?.weather?.[0]?.id < 600 ? ' · ☂️ Umbrella!' : ''}
      </div>
    </Section>
  );
}

function ItineraryCard({ itinerary }) {
  const [activeDay, setActiveDay] = useState(0);
  if (!itinerary?.days?.length) return null;
  const day = itinerary.days[activeDay];
  return (
    <Section title="🗺️ Itinerary" delay={0.1}>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {itinerary.days.map((d, i) => (
          <motion.button
            key={i} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setActiveDay(i)}
            className="px-3 py-1.5 rounded-full text-sm font-bold font-body whitespace-nowrap transition-all"
            style={activeDay === i
              ? { background: 'var(--c1)', color: 'white' }
              : { background: 'rgba(255,255,255,0.4)', color: 'var(--c3)' }}
          >
            Day {d.day}
          </motion.button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={activeDay} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
          <h4 className="font-display text-lg mb-3">{day.title}</h4>
          {['morning', 'afternoon', 'evening'].map(p => (
            <div key={p} className="mb-2 p-3 rounded-2xl bg-white/30 border border-white/40">
              <div className="flex items-center gap-2 mb-1">
                <span>{p === 'morning' ? '🌅' : p === 'afternoon' ? '☀️' : '🌙'}</span>
                <span className="font-bold text-sm capitalize font-body opacity-70">{p}</span>
              </div>
              <p className="font-semibold text-sm font-body">{day[p]?.activity}</p>
              <p className="text-xs opacity-50 font-body">📍 {day[p]?.location}</p>
              <p className="text-xs mt-1 font-body" style={{ color: 'var(--c1)' }}>💡 {day[p]?.tip}</p>
            </div>
          ))}
          <div className="flex justify-between p-2 rounded-xl mt-2 text-sm font-body" style={{ background: 'rgba(245,158,11,0.10)' }}>
            <span className="opacity-60">Est. daily cost</span>
            <span className="font-bold">{day.estimatedCost}</span>
          </div>

          {/* Mapbox walking distances — only on day 1 */}
          {day.walkingDistances?.length > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-xs opacity-40 font-body uppercase tracking-wider">🗺️ Walking distances</p>
              {day.walkingDistances.map((w, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-body p-2 bg-white/20 rounded-xl">
                  <span className="opacity-50 truncate max-w-[100px]">{w.from}</span>
                  <span className="opacity-30">→</span>
                  <span className="opacity-50 truncate max-w-[100px]">{w.to}</span>
                  <span className="ml-auto font-bold flex-shrink-0" style={{ color: 'var(--c1)' }}>
                    {w.minutes} min · {w.km} km
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </Section>
  );
}

function TranslationsCard({ translations }) {
  const [copied, setCopied] = useState(null);
  if (!translations?.data?.length) return null;
  return (
    <Section title="🈳 Essential Phrases" delay={0.2}>
      <div className="space-y-2">
        {translations.data.map((t, i) => (
          <motion.div
            key={i} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            onClick={() => { navigator.clipboard.writeText(t.translated); setCopied(i); setTimeout(() => setCopied(null), 1500); }}
            className="flex items-center justify-between p-3 rounded-2xl bg-white/30 cursor-pointer hover:bg-white/50 transition-all"
          >
            <div>
              <p className="text-xs opacity-50 font-body">{t.original}</p>
              <p className="font-bold text-lg">{t.translated}</p>
            </div>
            <span className="text-lg">{copied === i ? '✅' : '📋'}</span>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

function PackingCard({ packingList }) {
  const [checked, setChecked] = useState({});
  if (!packingList?.length) return null;
  const done = Object.values(checked).filter(Boolean).length;
  return (
    <Section title="🎒 Packing List" delay={0.3}>
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-2 rounded-full bg-white/30">
          <motion.div
            className="h-2 rounded-full"
            style={{ background: 'var(--c1)' }}
            animate={{ width: `${(done / packingList.length) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <span className="text-xs font-body opacity-50">{done}/{packingList.length}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {packingList.map((item, i) => (
          <motion.div
            key={i} whileTap={{ scale: 0.95 }}
            onClick={() => setChecked(c => ({ ...c, [i]: !c[i] }))}
            className={`flex items-center gap-2 p-2 rounded-xl cursor-pointer transition-all text-sm font-body
              ${checked[i] ? 'opacity-40 line-through bg-white/20' : 'bg-white/30 hover:bg-white/50'}`}
          >
            <span>{checked[i] ? '✅' : '⬜'}</span>
            <span>{item}</span>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const form = JSON.parse(sessionStorage.getItem('tripForm') || '{"destination":"Tokyo","days":5}');

  // Restore palette for this destination
  useEffect(() => {
    const dest = DESTINATIONS.find(d => d.id === form.countryId || d.name === form.country || d.name === form.destination) || DESTINATIONS[0];
    applyPalette(dest);
    axios.post(`${API}/api/plan-trip`, form)
      .then(r => { setData(r.data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  return (
    <PageWrapper>
      <div className="animated-bg min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <h1 className="font-display text-4xl" style={{ color: 'var(--c1)' }}>
              {DESTINATIONS.find(d => d.id === form.countryId || d.name === form.country)?.emoji || '✈️'} {form.destination} · {form.days} Days
            </h1>
            <p className="font-body opacity-50 mt-1 text-sm">Your complete Japan travel plan</p>
          </motion.div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-5">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="text-6xl">
                ⛩️
              </motion.div>
              <p className="font-display text-2xl" style={{ color: 'var(--c1)' }}>Planning your adventure...</p>
              <div className="flex gap-2 flex-wrap justify-center">
                {['🌤️ Weather', '🤖 Itinerary', '🈳 Phrases'].map((s, i) => (
                  <motion.span key={s} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ delay: i * 0.8, duration: 1.6, repeat: Infinity }}
                    className="glass px-3 py-1 rounded-full text-sm font-body">{s}</motion.span>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="glass rounded-3xl p-8 text-center">
              <p className="text-4xl mb-3">😅</p>
              <p className="font-display text-xl" style={{ color: 'var(--c1)' }}>Backend not running</p>
              <p className="text-sm opacity-60 font-body mt-2">{error}</p>
              <code className="text-xs opacity-40 font-body block mt-2">cd server && node index.js</code>
            </div>
          )}

          {data && !loading && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <WeatherCard weather={data.weather?.data} location={data.weather?.location} />
              <ItineraryCard itinerary={data.itinerary?.data} />
              <TranslationsCard translations={data.translations} />
              <PackingCard packingList={data.itinerary?.data?.packingList} />
            </div>
          )}

          {data && !loading && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-8 text-center">
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: '0 0 40px rgba(245,158,11,0.50)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/card')}
                className="px-10 py-4 rounded-2xl font-display text-xl text-white shadow-lg palette-pulse"
                style={{ background: `linear-gradient(135deg, var(--c1), var(--c3))` }}
              >
                💳 Order My Travel Card →
              </motion.button>
              <p className="text-xs opacity-40 mt-2 font-body">Load ${form.travelBudgetUSD} USD onto a virtual Visa via USDC</p>
            </motion.div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
