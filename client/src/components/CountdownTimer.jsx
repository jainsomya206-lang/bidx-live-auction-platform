import React, { useState, useEffect } from 'react';
import { Clock, Zap } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export default function CountdownTimer({ endTime, isExtended, onExpire, compact = false }) {
  const { serverOffsetMs } = useSocket();
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft());

  function calculateTimeLeft() {
    if (!endTime) return { totalMs: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    const nowServer = Date.now() + serverOffsetMs;
    const end = new Date(endTime).getTime();
    const difference = end - nowServer;

    if (difference <= 0) {
      return { totalMs: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }

    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return {
      totalMs: difference,
      hours,
      minutes,
      seconds,
      isExpired: false,
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const updated = calculateTimeLeft();
      setTimeLeft(updated);
      if (updated.isExpired && onExpire) {
        onExpire();
      }
    }, 500);

    return () => clearInterval(timer);
  }, [endTime, serverOffsetMs]);

  const pad = (n) => String(n).padStart(2, '0');
  const isUrgent = timeLeft.totalMs > 0 && timeLeft.totalMs <= 30000; // <= 30s snipe zone!

  if (timeLeft.isExpired) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-rose-950/70 text-rose-300 border border-rose-800/60">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
        AUCTION ENDED
      </span>
    );
  }

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono-numbers font-medium ${
        isUrgent
          ? 'bg-rose-950/80 text-rose-300 border border-rose-700 animate-pulse'
          : isExtended
          ? 'bg-amber-950/70 text-amber-300 border border-amber-700/60'
          : 'bg-dark-850 text-slate-300 border border-slate-700/50'
      }`}>
        <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-rose-400' : 'text-slate-400'}`} />
        <span>
          {timeLeft.hours > 0 ? `${pad(timeLeft.hours)}:` : ''}
          {pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
        </span>
        {isUrgent && (
          <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">
            &lt;30s
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-xl transition-all duration-300 ${
      isUrgent
        ? 'bg-gradient-to-r from-rose-950/90 via-dark-900 to-rose-950/90 border-2 border-rose-600/80 shadow-[0_0_25px_rgba(244,63,94,0.35)] animate-pulse'
        : 'bg-dark-900/90 border border-slate-800'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
          <Clock className={`w-4 h-4 ${isUrgent ? 'text-rose-400 animate-spin' : 'text-amber-400'}`} />
          {isUrgent ? '⚡ Anti-Snipe Zone (< 30s)' : 'Time Remaining'}
        </span>
        {isExtended && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <Zap className="w-3 h-3 fill-amber-400" /> EXTENDED +30s
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center font-mono-numbers">
        <div className="bg-dark-800/80 p-2.5 rounded-lg border border-slate-800/70">
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            {pad(timeLeft.hours)}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 mt-0.5">Hours</div>
        </div>

        <div className="bg-dark-800/80 p-2.5 rounded-lg border border-slate-800/70">
          <div className={`text-2xl sm:text-3xl font-extrabold ${isUrgent ? 'text-rose-400' : 'text-amber-400'}`}>
            {pad(timeLeft.minutes)}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 mt-0.5">Mins</div>
        </div>

        <div className="bg-dark-800/80 p-2.5 rounded-lg border border-slate-800/70">
          <div className={`text-2xl sm:text-3xl font-extrabold ${isUrgent ? 'text-rose-400' : 'text-amber-400'}`}>
            {pad(timeLeft.seconds)}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 mt-0.5">Secs</div>
        </div>
      </div>
    </div>
  );
}
