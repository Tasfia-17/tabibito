import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { DESTINATIONS, applyPalette } from '../destinations';
import PageWrapper from '../components/PageWrapper';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const STEPS = { IDLE: 'idle', AUTH: 'auth', ORDER: 'order', QUEUED: 'queued', POLL: 'poll', READY: 'ready', ERROR: 'error' };

function VirtualCard({ cardData, amount, flipped, onFlip, isIntl, isQueued }) {
  return (
    <div className="card-scene w-80 h-48 mx-auto cursor-pointer" onClick={onFlip}>
      <div className={`card-inner w-full h-full relative ${flipped ? 'flipped' : ''}`}>
        {/* Front */}
        <div className="card-face absolute inset-0 rounded-3xl p-6 flex flex-col justify-between overflow-hidden"
          style={{ background: 'linear-gradient(135deg, var(--c1), var(--c3))' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
          <div className="relative flex justify-between items-start">
            <span className="text-white/80 font-display text-lg">Tabibito</span>
            <div className="flex items-center gap-1">
              {isIntl && <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-body">🌍 Global</span>}
              <motion.span animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 4, repeat: Infinity }} className="text-xl">⛩️</motion.span>
            </div>
          </div>
          <div className="relative">
            <div className="text-white/50 text-xs font-body mb-1">Travel Card · ${amount} USD</div>
            <div className="text-white font-mono text-lg tracking-widest">
              {isQueued ? '···· ···· ···· ···· (queued)' :
               cardData?.card_number ? `${cardData.card_number.slice(0,4)} •••• •••• ${cardData.card_number.slice(-4)}` :
               '•••• •••• •••• ••••'}
            </div>
          </div>
          <div className="relative flex justify-between items-end">
            <div>
              <div className="text-white/40 text-xs font-body">EXPIRES</div>
              <div className="text-white font-mono text-sm">{cardData ? `${cardData.exp_month}/${cardData.exp_year}` : '••/••'}</div>
            </div>
            <div className="text-white/70 font-body text-xs font-bold">VISA PREPAID</div>
          </div>
        </div>
        {/* Back */}
        <div className="card-face card-back absolute inset-0 rounded-3xl p-6 flex flex-col justify-center"
          style={{ background: 'linear-gradient(135deg, var(--c3), var(--c1))' }}>
          <div className="bg-black/40 h-10 w-full rounded mb-4" />
          <div className="flex justify-end items-center gap-3">
            <div className="bg-white/20 rounded px-3 py-1">
              <span className="text-white font-mono font-bold text-lg">{cardData?.cvv || '•••'}</span>
            </div>
            <span className="text-white/50 text-xs font-body">CVV</span>
          </div>
          <p className="text-white/30 text-xs text-center mt-4 font-body">Tap to flip back</p>
        </div>
      </div>
      {/* Mirror reflection */}
      <div className="w-80 h-10 mx-auto opacity-10 scale-y-[-1] -mt-1 blur-sm rounded-b-3xl"
        style={{ background: `linear-gradient(135deg, var(--c1), var(--c3))` }} />
    </div>
  );
}

export default function PaymentCard() {
  const form = JSON.parse(sessionStorage.getItem('tripForm') || '{"travelBudgetUSD":"500","destination":"Tokyo"}');
  const minAmount = 100; // intl card min
  const [amount, setAmount] = useState(Math.max(Number(form.travelBudgetUSD) || 500, minAmount));
  const [useIntl, setUseIntl] = useState(true); // default: international card
  const [step, setStep] = useState(STEPS.IDLE);
  const [cardId, setCardId] = useState(null);
  const [idToken, setIdToken] = useState(null);
  const [cardData, setCardData] = useState(null);
  const [error, setError] = useState(null);
  const [flipped, setFlipped] = useState(false);
  const [queuedAt, setQueuedAt] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    const dest = DESTINATIONS.find(d => d.name === form.destination) || DESTINATIONS[0];
    applyPalette(dest);
    return () => clearInterval(pollRef.current);
  }, []);

  const orderCard = async () => {
    setError(null);
    try {
      // 1. Auth
      setStep(STEPS.AUTH);
      const authRes = await axios.post(`${API}/api/laso/auth`);
      const token = authRes.data?.data?.auth?.id_token || authRes.data?.data?.id_token;
      if (!token) throw new Error('Auth failed — no token returned');
      setIdToken(token);

      if (useIntl) {
        // 2a. International card — queued, fulfilled within 24h
        setStep(STEPS.ORDER);
        const orderRes = await axios.post(`${API}/api/laso/order-intl-card`, { amount });
        const order = orderRes.data?.data?.intl_card_order || orderRes.data?.data;
        const cid = order?.card_id || orderRes.data?.data?.card?.card_id;
        if (!cid && orderRes.data?.data?.status !== 'queued') {
          throw new Error(JSON.stringify(orderRes.data?.error || orderRes.data));
        }
        setCardId(cid || 'queued');
        setQueuedAt(new Date());
        setStep(STEPS.QUEUED);
        // Poll every 30s for up to 10 min (admin fulfills within 24h, but show live status)
        pollRef.current = setInterval(async () => {
          try {
            const r = await axios.get(`${API}/api/laso/card/${cid || 'queued'}?token=${token}&type=intl`);
            const cd = r.data?.data;
            if (cd?.status === 'ready' && cd?.card_details) {
              clearInterval(pollRef.current);
              setCardData(cd.card_details);
              setStep(STEPS.READY);
            }
          } catch {}
        }, 30000);
      } else {
        // 2b. US card — instant
        setStep(STEPS.ORDER);
        const orderRes = await axios.post(`${API}/api/laso/order-card`, { amount });
        const cid = orderRes.data?.data?.card?.card_id;
        if (!cid) throw new Error(JSON.stringify(orderRes.data?.error || orderRes.data));
        setCardId(cid);
        setStep(STEPS.POLL);
        pollRef.current = setInterval(async () => {
          try {
            const r = await axios.get(`${API}/api/laso/card/${cid}?token=${token}`);
            const cd = r.data?.data;
            if (cd?.status === 'ready' && cd?.card_details) {
              clearInterval(pollRef.current);
              setCardData(cd.card_details);
              setStep(STEPS.READY);
            }
          } catch {}
        }, 2500);
      }
    } catch (e) {
      clearInterval(pollRef.current);
      setError(e.response?.data?.error || e.message);
      setStep(STEPS.ERROR);
    }
  };

  const cancelIntlCard = async () => {
    if (!cardId || !idToken) return;
    try {
      await axios.post(`${API}/api/laso/cancel-intl-card`, { cardId, token: idToken });
      clearInterval(pollRef.current);
      setStep(STEPS.IDLE);
      setCardId(null);
      setQueuedAt(null);
    } catch (e) { setError(e.message); }
  };

  const stepInfo = {
    [STEPS.AUTH]:  { emoji: '🔐', text: 'Authenticating with Laso Finance...' },
    [STEPS.ORDER]: { emoji: '💳', text: `Ordering $${amount} ${useIntl ? 'global' : 'US'} card...` },
    [STEPS.POLL]:  { emoji: '⏳', text: 'Card provisioning... (~10 seconds)' },
  };

  return (
    <PageWrapper>
      <div className="animated-bg min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <h1 className="font-display text-4xl" style={{ color: 'var(--c1)' }}>💳 Travel Card</h1>
            <p className="font-body opacity-50 mt-1 text-sm">Virtual Visa prepaid · powered by Laso Finance + USDC</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="mb-8">
            <VirtualCard cardData={cardData} amount={amount} flipped={flipped}
              onFlip={() => step === STEPS.READY && setFlipped(f => !f)}
              isIntl={useIntl} isQueued={step === STEPS.QUEUED} />
            {step === STEPS.READY && <p className="text-center text-xs opacity-40 mt-2 font-body">Tap card to reveal CVV</p>}
          </motion.div>

          {/* Card type toggle */}
          {step === STEPS.IDLE && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-3xl p-6 mb-5">
              {/* International vs US toggle */}
              <div className="flex gap-2 mb-5">
                {[
                  { val: true,  label: '🌍 International', sub: 'Works globally · 24h queue · min $100' },
                  { val: false, label: '🇺🇸 US Only',       sub: 'Instant · US merchants only · min $5' },
                ].map(({ val, label, sub }) => (
                  <motion.button key={String(val)} whileTap={{ scale: 0.97 }}
                    onClick={() => { setUseIntl(val); if (!val) setAmount(a => Math.max(a, 5)); else setAmount(a => Math.max(a, 100)); }}
                    className="flex-1 p-3 rounded-2xl text-left transition-all"
                    style={useIntl === val
                      ? { background: 'var(--c1)', color: 'white' }
                      : { background: 'rgba(255,255,255,0.4)' }}
                  >
                    <div className="font-bold text-sm font-body">{label}</div>
                    <div className="text-xs opacity-70 font-body mt-0.5">{sub}</div>
                  </motion.button>
                ))}
              </div>

              <label className="block text-xs font-bold opacity-50 mb-3 font-body uppercase tracking-wider">
                Amount (USD) — ${amount}
              </label>
              <div className="flex gap-2 mb-4 flex-wrap">
                {(useIntl ? [100, 200, 500, 1000] : [50, 100, 200, 500]).map(v => (
                  <motion.button key={v} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setAmount(v)}
                    className="px-4 py-2 rounded-full font-bold font-body text-sm transition-all"
                    style={amount === v ? { background: 'var(--c1)', color: 'white' } : { background: 'rgba(255,255,255,0.4)', color: 'var(--c3)' }}>
                    ${v}
                  </motion.button>
                ))}
              </div>
              <input type="range" min={useIntl ? 100 : 5} max="1000" step="5" value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full" style={{ accentColor: 'var(--c1)' }} />

              {useIntl && (
                <div className="mt-4 p-3 rounded-2xl text-sm font-body" style={{ background: 'rgba(245,158,11,0.08)' }}>
                  <p className="font-bold opacity-70">🌍 International card — how it works:</p>
                  <p className="opacity-60 mt-1">Order now → admin fulfills within 24h → card details arrive → use at any merchant globally. Cost: ${(amount * 1.038).toFixed(2)} USDC (+3.8% fee). Cancel anytime before fulfillment for a full refund.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Step progress */}
          <AnimatePresence>
            {[STEPS.AUTH, STEPS.ORDER, STEPS.POLL].includes(step) && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="glass rounded-3xl p-6 mb-5 text-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="text-5xl mb-3 inline-block">{stepInfo[step]?.emoji}</motion.div>
                <p className="font-display text-xl" style={{ color: 'var(--c1)' }}>{stepInfo[step]?.text}</p>
                <div className="flex justify-center gap-2 mt-4">
                  {[STEPS.AUTH, STEPS.ORDER, STEPS.POLL].map((s, i) => (
                    <motion.div key={s} animate={step === s ? { scale: [1, 1.4, 1] } : {}} transition={{ repeat: Infinity, duration: 0.8 }}
                      className="w-3 h-3 rounded-full"
                      style={{ background: [STEPS.AUTH, STEPS.ORDER, STEPS.POLL].indexOf(step) >= i ? 'var(--c1)' : 'rgba(0,0,0,0.1)' }} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Queued state — international card 24h wait */}
          {step === STEPS.QUEUED && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 mb-5">
              <div className="text-center mb-4">
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} className="text-5xl mb-2 inline-block">⏳</motion.div>
                <h3 className="font-display text-2xl" style={{ color: 'var(--c1)' }}>Card Queued!</h3>
                <p className="text-sm opacity-60 font-body mt-1">An admin will fulfill your card within 24 hours</p>
              </div>
              <div className="space-y-2 text-sm font-body">
                <div className="flex justify-between p-3 bg-white/30 rounded-2xl">
                  <span className="opacity-60">Amount</span>
                  <span className="font-bold">${amount} USD</span>
                </div>
                <div className="flex justify-between p-3 bg-white/30 rounded-2xl">
                  <span className="opacity-60">Total charged</span>
                  <span className="font-bold">${(amount * 1.038).toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between p-3 bg-white/30 rounded-2xl">
                  <span className="opacity-60">Queued at</span>
                  <span className="font-bold">{queuedAt?.toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between p-3 bg-white/30 rounded-2xl">
                  <span className="opacity-60">Expected by</span>
                  <span className="font-bold" style={{ color: 'var(--c1)' }}>
                    {queuedAt ? new Date(queuedAt.getTime() + 24*60*60*1000).toLocaleString() : '—'}
                  </span>
                </div>
              </div>
              <div className="mt-4 p-3 rounded-2xl text-xs font-body opacity-60" style={{ background: 'rgba(245,158,11,0.08)' }}>
                💡 Ask on Sunday → card ready Monday morning. Works at any merchant globally — hotels, transport, restaurants.
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={cancelIntlCard}
                className="w-full mt-4 py-3 rounded-2xl font-body font-bold text-sm glass opacity-60 hover:opacity-100 transition-all">
                ✕ Cancel order (full refund)
              </motion.button>
            </motion.div>
          )}

          {/* Ready */}
          {step === STEPS.READY && cardData && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-3xl p-6 mb-5">
              <div className="text-center mb-4">
                <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5 }} className="text-4xl inline-block">🎉</motion.span>
                <h3 className="font-display text-2xl mt-2" style={{ color: 'var(--c1)' }}>Card Ready!</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Card Number', value: cardData.card_number },
                  { label: 'CVV', value: cardData.cvv },
                  { label: 'Expires', value: `${cardData.exp_month}/${cardData.exp_year}` },
                  { label: 'Balance', value: `$${cardData.available_balance}` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white/40 rounded-2xl p-3 text-center">
                    <p className="text-xs opacity-50 font-body">{label}</p>
                    <p className="font-bold font-mono mt-1">{value}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Error */}
          {step === STEPS.ERROR && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-3xl p-6 mb-5 text-center">
              <p className="text-4xl mb-2">😅</p>
              <p className="font-display text-xl" style={{ color: 'var(--c1)' }}>Something went wrong</p>
              <p className="text-sm opacity-60 font-body mt-2 break-all">{error}</p>
            </motion.div>
          )}

          {step === STEPS.IDLE && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={orderCard}
              className="w-full py-4 rounded-2xl font-display text-xl text-white shadow-lg palette-pulse"
              style={{ background: 'linear-gradient(135deg, var(--c1), var(--c3))' }}>
              {useIntl ? `🌍 Order $${amount} Global Card` : `💳 Order $${amount} US Card`}
            </motion.button>
          )}
          {step === STEPS.ERROR && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setStep(STEPS.IDLE)}
              className="w-full py-4 rounded-2xl font-display text-xl glass">
              🔄 Try Again
            </motion.button>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
