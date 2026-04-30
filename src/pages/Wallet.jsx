import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { DESTINATIONS, applyPalette } from '../destinations';
import PageWrapper from '../components/PageWrapper';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Wallet() {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const form = JSON.parse(sessionStorage.getItem('tripForm') || '{}');
    const dest = DESTINATIONS.find(d => d.name === form.destination) || DESTINATIONS[0];
    applyPalette(dest);
    axios.get(`${API}/api/balance`)
      .then(r => { setBalance(r.data?.data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const total = balance
    ? (parseFloat(balance.usdc_balance || 0) + parseFloat(balance.promo_credit_balance || 0)).toFixed(3)
    : null;

  return (
    <PageWrapper>
      <div className="animated-bg min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <h1 className="font-display text-4xl" style={{ color: 'var(--c1)' }}>👛 Wallet</h1>
            <p className="font-body opacity-50 mt-1 text-sm">Locus USDC balance on Base</p>
          </motion.div>

          {loading && (
            <div className="flex justify-center py-16">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="text-5xl">💫</motion.div>
            </div>
          )}

          {error && (
            <div className="glass rounded-3xl p-8 text-center">
              <p className="text-4xl mb-3">😅</p>
              <p className="font-display text-xl" style={{ color: 'var(--c1)' }}>Backend not running</p>
              <p className="text-sm opacity-60 font-body mt-2">{error}</p>
              <code className="text-xs opacity-40 block mt-2">cd server && node index.js</code>
            </div>
          )}

          {balance && (
            <div className="space-y-4">
              {/* Main balance */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                className="rounded-3xl p-8 text-center relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, var(--c1), var(--c3))' }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-12 translate-x-12" />
                {/* Floor reflection */}
                <div className="scene-floor rounded-b-3xl" />
                <div className="relative">
                  <motion.div animate={{ y: [0, -8, 0], scale: [1, 1.05, 1] }} transition={{ duration: 3.5, repeat: Infinity }} className="text-6xl mb-3 inline-block breathe">
                    💰
                  </motion.div>
                  {/* Mirror */}
                  <div className="text-3xl opacity-15 scale-y-[-1] -mt-1 blur-sm select-none">💰</div>
                  <p className="text-white/60 font-body text-sm mb-1 mt-2">Total Available</p>
                  <p className="font-display text-5xl text-white">${total}</p>
                  <p className="text-white/50 font-body text-sm mt-1">USDC on Base</p>
                </div>
              </motion.div>

              {/* Breakdown */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-3xl p-6">
                <h3 className="font-display text-xl mb-4" style={{ color: 'var(--c1)' }}>Balance Breakdown</h3>
                <div className="space-y-2">
                  {[
                    { emoji: '💵', label: 'USDC Balance', value: `$${balance.usdc_balance}` },
                    ...(parseFloat(balance.promo_credit_balance) > 0
                      ? [{ emoji: '🎁', label: 'Promo Credits', value: `$${balance.promo_credit_balance}` }]
                      : []),
                    ...(balance.allowance
                      ? [{ emoji: '🔒', label: 'Allowance', value: `$${balance.allowance}` }]
                      : []),
                  ].map(({ emoji, label, value }) => (
                    <div key={label} className="flex justify-between items-center p-3 bg-white/30 rounded-2xl">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{emoji}</span>
                        <span className="font-body font-semibold text-sm">{label}</span>
                      </div>
                      <span className="font-display text-lg" style={{ color: 'var(--c1)' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Wallet address */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-3xl p-5">
                <h3 className="font-display text-lg mb-3" style={{ color: 'var(--c1)' }}>🔗 Wallet Address</h3>
                <div className="bg-white/30 rounded-2xl p-3 flex items-center gap-2">
                  <code className="text-xs opacity-60 font-mono break-all flex-1">{balance.wallet_address}</code>
                  <button onClick={() => navigator.clipboard.writeText(balance.wallet_address)} className="text-xl hover:scale-110 transition-transform flex-shrink-0">📋</button>
                </div>
                <p className="text-xs opacity-40 mt-2 font-body text-center">Send USDC (Base) to fund your wallet</p>
              </motion.div>

              {/* What it powers — sparkline bars */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass rounded-3xl p-5">
                <h3 className="font-display text-lg mb-4" style={{ color: 'var(--c1)' }}>✨ What Your Balance Powers</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { emoji: '🌤️', label: 'Weather', cost: '$0.007' },
                    { emoji: '🤖', label: 'AI Itinerary', cost: '~$0.05' },
                    { emoji: '🈳', label: 'Translations', cost: '$0.025+' },
                    { emoji: '💳', label: 'Travel Card', cost: '$5–$1000' },
                    { emoji: '🗺️', label: 'Directions', cost: '$0.009' },
                    { emoji: '🔍', label: 'Web Search', cost: '$0.035' },
                  ].map(({ emoji, label, cost }) => (
                    <div key={label} className="bg-white/30 rounded-2xl p-3 flex items-center gap-2">
                      <span className="text-2xl">{emoji}</span>
                      <div>
                        <p className="text-sm font-semibold font-body">{label}</p>
                        <p className="text-xs font-body" style={{ color: 'var(--c1)' }}>{cost}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Network status */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="glass rounded-3xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 rounded-full" style={{ background: 'var(--c1)' }} />
                  <span className="text-sm font-body opacity-60">Connected · Base · {balance.chain}</span>
                </div>
                <span className="text-xs opacity-30 font-mono">{balance.workspace_id}</span>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
