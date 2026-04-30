import { useEffect, useRef } from 'react';

// fal-roster tfx-sweep pattern: diagonal lines + radial flash on palette swap
export default function TfxOverlay({ trigger }) {
  const ref = useRef();
  const flashRef = useRef();

  useEffect(() => {
    if (!trigger) return;
    const el = ref.current;
    const flash = flashRef.current;
    if (!el || !flash) return;

    el.classList.remove('tfx-active');
    flash.style.display = 'none';
    void el.offsetWidth; // reflow

    el.classList.add('tfx-active');
    flash.style.display = 'block';

    const t = setTimeout(() => {
      el.classList.remove('tfx-active');
      flash.style.display = 'none';
    }, 700);
    return () => clearTimeout(t);
  }, [trigger]);

  return (
    <>
      <div ref={ref} className="tfx-overlay">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="tfx-line" />
        ))}
      </div>
      <div ref={flashRef} className="tfx-flash" style={{ display: 'none' }} />
    </>
  );
}
