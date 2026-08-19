import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  initialSeconds?: number;
  onExpire: () => void;
  isActive: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  initialSeconds = 60,
  onExpire,
  isActive,
}) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);

  useEffect(() => {
    setTimeLeft(initialSeconds);
  }, [initialSeconds, isActive]);

  useEffect(() => {
    if (!isActive) return;

    if (timeLeft <= 0) {
      onExpire();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, timeLeft, onExpire]);

  const percentage = (timeLeft / initialSeconds) * 100;
  const isUrgent = timeLeft <= 15;

  return (
    <div className="w-full flex flex-col items-center py-2">
      <div className="flex items-baseline justify-center gap-1 mb-1">
        <span
          className={`font-mono text-4xl font-black transition-colors ${
            isUrgent ? 'text-rose-600 animate-pulse' : 'text-amber-600'
          }`}
        >
          {timeLeft}
        </span>
        <span className="text-xs font-semibold uppercase text-slate-500">seconds remaining</span>
      </div>

      {/* Visual countdown bar */}
      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ease-linear rounded-full ${
            isUrgent ? 'bg-rose-600' : 'bg-amber-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="text-[12px] text-slate-600 font-medium text-center mt-2">
        If you do not respond, emergency alerts will automatically be dispatched to your trusted contact.
      </p>
    </div>
  );
};
