import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Landing from './pages/Landing';
import Checkout from './pages/Checkout';
import Dashboard from './pages/Dashboard';
import PaymentCard from './pages/PaymentCard';
import Accommodation from './pages/Accommodation';
import Wallet from './pages/Wallet';
import Navbar from './components/Navbar';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/accommodation" element={<Accommodation />} />
        <Route path="/card" element={<PaymentCard />} />
        <Route path="/wallet" element={<Wallet />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen animated-bg">
        <Navbar />
        <AnimatedRoutes />
      </div>
    </BrowserRouter>
  );
}
