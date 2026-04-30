import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LocusCheckout } from '@withlocus/checkout-react';
import axios from 'axios';
import { COUNTRIES, applyPalette } from '../destinations';
import PageWrapper from '../components/PageWrapper';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Checkout() {
  const navigate = useNavigate();
  const form = JSON.parse(sessionStorage.getItem('tripForm') || '{}');
  const country = COUNTRIES.find(c => c.id === form.countryId) || COUNTRIES[0];

  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    applyPalette(country);
    // Create checkout session on mount
    axios.post(`${API}/api/checkout/create`, {
      destination: form.destination,
      country: form.country,
      days: form.days,
      budget: form.budget,
    })
      .then(r => {
        if (r.data.sessionId) setSessionId(r.data.sessionId);
        else throw new Error(r.data.error);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSuccess = (data) => {
    // Payment confirmed — store tx hash and go to dashboard
    sessionStorage.setItem('paymentTx', data.txHash);
    navigate('/dashboard');
  };

  return (
    <PageWrapper>
      <div className="animated-bg min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-10">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <div className="text-5xl mb-3 breathe">{country.emoji}</div>
            <h1 className="font-display text-4xl" style={{ color: 'var(--c1)' }}>
              Your {form.destination} Trip Plan
            </h1>
            <p className="opacity-50 mt-2 text-sm">
              Pay <strong>0.50 USDC</strong> to unlock your complete {form.days}-day travel package
            </p>
          </motion.div>

          {/* What you get */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="glass rounded-3xl p-5 mb-6">
            <p className="text-xs font-bold opacity-40 uppercase tracking-wider mb-3">What you get for 0.50 USDC</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['🌤️', 'Live weather + 5-day forecast'],
                ['🗺️', `${form.days}-day AI itinerary`],
                ['🚶', 'Walking distances (Mapbox)'],
                ['🔤', '7 translated survival phrases'],
                ['🎒', 'Personalised packing list'],
                ['💳', 'Global travel card (Laso)'],
              ].map(([emoji, label]) => (
                <div key={label} className="flex items-center gap-2 text-sm">
                  <span>{emoji}</span>
                  <span className="opacity-70">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Checkout component */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            {loading && (
              <div className="glass rounded-3xl p-10 text-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="text-4xl inline-block mb-3">⏳</motion.div>
                <p className="font-display text-xl" style={{ color: 'var(--c1)' }}>Creating checkout session...</p>
              </div>
            )}

            {error && (
              <div className="glass rounded-3xl p-8 text-center">
                <p className="text-4xl mb-2">😅</p>
                <p className="font-display text-xl" style={{ color: 'var(--c1)' }}>Checkout unavailable</p>
                <p className="text-sm opacity-60 mt-2">{error}</p>
                {/* Fallback: skip payment in dev */}
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/dashboard')}
                  className="mt-4 px-6 py-3 rounded-2xl font-display text-lg text-white"
                  style={{ background: `linear-gradient(135deg, ${country.c1}, ${country.c3})` }}>
                  Continue anyway (dev mode)
                </motion.button>
              </div>
            )}

            {sessionId && !loading && (
              <div className="glass rounded-3xl overflow-hidden">
                <LocusCheckout
                  sessionId={sessionId}
                  mode="embedded"
                  checkoutUrl="https://beta-checkout.paywithlocus.com"
                  onSuccess={handleSuccess}
                  onCancel={() => navigate('/')}
                  onError={(e) => setError(e.message)}
                  style={{ minHeight: 500 }}
                />
              </div>
            )}
          </motion.div>

          {/* Agent-readable note */}
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="text-center text-xs opacity-30 mt-4">
            AI agents can pay this checkout programmatically via Locus wallet
          </motion.p>
        </div>
      </div>
    </PageWrapper>
  );
}
