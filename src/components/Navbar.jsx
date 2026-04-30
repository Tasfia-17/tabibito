import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const links = [
  { to: '/',              label: '⛩️ Home' },
  { to: '/dashboard',     label: '🗾 Plan' },
  { to: '/accommodation', label: '🏨 Hotels' },
  { to: '/card',          label: '💳 Card' },
  { to: '/wallet',        label: '👛 Wallet' },
];

export default function Navbar() {
  const { pathname } = useLocation();
  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="glass sticky top-0 z-50 px-4 py-3 flex items-center justify-between"
    >
      <Link to="/" className="flex items-center gap-2 flex-shrink-0">
        <motion.span
          animate={{ rotate: [0, 8, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="text-2xl inline-block"
        >⛩️</motion.span>
        <span className="font-display text-xl" style={{ color: 'var(--c1)' }}>Tabibito</span>
        <span className="text-xs opacity-40 font-body hidden sm:inline">旅人</span>
      </Link>
      <div className="flex gap-1 overflow-x-auto">
        {links.map(({ to, label }) => (
          <Link key={to} to={to}>
            <motion.span
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className="px-3 py-1.5 rounded-full text-sm font-semibold font-body transition-all cursor-pointer block whitespace-nowrap"
              style={pathname === to
                ? { background: 'var(--c1)', color: 'white' }
                : { color: 'var(--c3)', opacity: 0.8 }}
            >
              {label}
            </motion.span>
          </Link>
        ))}
      </div>
    </motion.nav>
  );
}
