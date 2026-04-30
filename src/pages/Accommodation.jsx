import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { DESTINATIONS, applyPalette } from '../destinations';
import PageWrapper from '../components/PageWrapper';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Accommodation() {
  const form = JSON.parse(sessionStorage.getItem('tripForm') || '{"destination":"Tokyo","days":5,"budget":"moderate"}');
  const [loading, setLoading] = useState(false);
  const [hotels, setHotels] = useState(null);
  const [error, setError] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const dest = DESTINATIONS.find(d => d.name === form.destination) || DESTINATIONS[0];
    applyPalette(dest);
  }, []);

  // Tick elapsed time while loading
  useEffect(() => {
    if (!loading) { setElapsed(0); return; }
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [loading]);

  const search = async () => {
    setLoading(true);
    setError(null);
    setHotels(null);
    try {
      const res = await axios.post(`${API}/api/accommodation`, {
        destination: form.destination,
        days: form.days,
        budget: form.budget,
      });
      setHotels(res.data.hotels || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadingMessages = [
    '🌐 Opening booking.com...',
    '🔍 Searching hotels...',
    '📋 Reading availability...',
    '💰 Comparing prices...',
    '✅ Compiling results...',
  ];
  const msgIndex = Math.min(Math.floor(elapsed / 18), loadingMessages.length - 1);

  return (
    <PageWrapper>
      <div className="animated-bg min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <h1 className="font-display text-4xl" style={{ color: 'var(--c1)' }}>🏨 Accommodation</h1>
            <p className="font-body opacity-50 mt-1 text-sm">
              AI browser agent searches booking.com for you
            </p>
          </motion.div>

          {/* Trip summary */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-3xl p-5 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl breathe">
                  {DESTINATIONS.find(d => d.name === form.destination)?.emoji || '🗾'}
                </span>
                <div>
                  <p className="font-display text-xl" style={{ color: 'var(--c1)' }}>{form.destination}</p>
                  <p className="text-sm opacity-50 font-body">{form.days} nights · {form.budget} budget</p>
                </div>
              </div>
              {!loading && !hotels && (
                <motion.button
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  onClick={search}
                  className="px-6 py-3 rounded-2xl font-display text-lg text-white"
                  style={{ background: 'linear-gradient(135deg, var(--c1), var(--c3))' }}
                >
                  🔍 Find Hotels
                </motion.button>
              )}
            </div>
          </motion.div>

          {/* Loading — Browser Use agent progress */}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-3xl p-8 text-center mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="text-5xl mb-4 inline-block"
              >
                🤖
              </motion.div>
              <p className="font-display text-xl mb-2" style={{ color: 'var(--c1)' }}>
                Browser agent searching...
              </p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={msgIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="text-sm opacity-60 font-body mb-4"
                >
                  {loadingMessages[msgIndex]}
                </motion.p>
              </AnimatePresence>
              {/* Progress bar */}
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'var(--c1)' }}
                  animate={{ width: `${Math.min((elapsed / 90) * 100, 95)}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
              <p className="text-xs opacity-30 mt-2 font-body">{elapsed}s · typically 60–90s</p>
            </motion.div>
          )}

          {/* Error */}
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-3xl p-6 mb-6 text-center">
              <p className="text-4xl mb-2">😅</p>
              <p className="font-display text-xl" style={{ color: 'var(--c1)' }}>Search failed</p>
              <p className="text-sm opacity-60 font-body mt-2">{error}</p>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={search}
                className="mt-4 px-6 py-2 rounded-2xl font-body font-bold glass">
                🔄 Retry
              </motion.button>
            </motion.div>
          )}

          {/* Hotel results */}
          {hotels && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="text-sm opacity-50 font-body mb-3 text-center">
                Found {hotels.length} option{hotels.length !== 1 ? 's' : ''} · tap to book
              </p>
              <div className="space-y-4">
                {hotels.map((hotel, i) => (
                  <motion.a
                    key={i}
                    href={hotel.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    className="glass rounded-3xl p-5 flex items-center justify-between gap-4 cursor-pointer block relative overflow-hidden"
                    style={{ borderColor: i === 0 ? `${DESTINATIONS.find(d=>d.name===form.destination)?.c1 || '#F59E0B'}44` : undefined }}
                  >
                    {/* Floor reflection */}
                    <div className="scene-floor rounded-b-3xl" />
                    {i === 0 && (
                      <div className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full font-body font-bold text-white"
                        style={{ background: 'var(--c1)' }}>
                        ⭐ Best match
                      </div>
                    )}
                    <div className="flex items-center gap-4 relative z-10">
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 3 + i, repeat: Infinity }}
                        className="text-4xl"
                      >
                        🏨
                      </motion.div>
                      <div>
                        <p className="font-display text-lg" style={{ color: 'var(--c1)' }}>{hotel.name}</p>
                        <p className="text-sm opacity-60 font-body">
                          {hotel.stars && hotel.stars !== '—' ? `${'⭐'.repeat(Math.min(Number(hotel.stars) || 3, 5))} · ` : ''}
                          {hotel.address || form.destination}
                        </p>
                      </div>
                    </div>
                    <div className="text-right relative z-10 flex-shrink-0">
                      <p className="font-display text-xl" style={{ color: 'var(--c1)' }}>{hotel.pricePerNight}</p>
                      <p className="text-xs opacity-40 font-body">per night</p>
                      <p className="text-xs mt-1 font-body opacity-60">Book →</p>
                    </div>
                  </motion.a>
                ))}
              </div>

              <motion.button
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={search}
                className="w-full mt-5 py-3 rounded-2xl font-body font-bold glass opacity-60 hover:opacity-100 transition-all text-sm"
              >
                🔄 Search again
              </motion.button>
            </motion.div>
          )}

          {/* How it works note */}
          {!loading && !hotels && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="glass rounded-3xl p-5 text-center">
              <p className="text-3xl mb-2">🤖</p>
              <p className="font-display text-lg opacity-70">Powered by Browser Use</p>
              <p className="text-sm opacity-50 font-body mt-1">
                A real AI browser agent opens booking.com, searches for hotels matching your budget, and returns the top options. Takes ~60–90 seconds.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
