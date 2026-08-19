import React, { useState } from 'react';
import { AlertCircle, ShieldAlert, X } from 'lucide-react';

interface SOSButtonProps {
  onTriggerSOS: () => Promise<void> | void;
  isLoading?: boolean;
  contactName?: string;
  size?: 'normal' | 'large' | 'compact';
  className?: string;
}

export const SOSButton: React.FC<SOSButtonProps> = ({
  onTriggerSOS,
  isLoading = false,
  contactName,
  size = 'normal',
  className = '',
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleConfirm = async () => {
    setShowConfirmModal(false);
    await onTriggerSOS();
  };

  const getButtonStyles = () => {
    if (size === 'large') {
      return 'py-3.5 px-6 text-sm font-bold rounded-lg gap-2 shadow-xs';
    }
    if (size === 'compact') {
      return 'py-2 px-3 text-xs font-bold rounded-lg gap-1.5';
    }
    return 'py-2.5 px-4 text-xs font-bold rounded-lg gap-2 shadow-xs';
  };

  return (
    <>
      <button
        id="btn-sos-trigger"
        onClick={() => setShowConfirmModal(true)}
        disabled={isLoading}
        className={`inline-flex items-center justify-center bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white uppercase tracking-wider transition-all cursor-pointer select-none font-bold ${getButtonStyles()} ${className}`}
      >
        <ShieldAlert className="w-4 h-4 shrink-0" />
        <span>{isLoading ? 'DISPATCHING...' : 'EMERGENCY SOS'}</span>
      </button>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div
          id="sos-confirm-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            id="sos-confirm-card"
            className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 p-6 flex flex-col gap-4 relative animate-in zoom-in-95 duration-150"
          >
            <button
              onClick={() => setShowConfirmModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Emergency SOS Broadcast
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Instant Guardian Escalation
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs text-slate-700 leading-relaxed space-y-1">
              <p className="font-bold text-slate-900">
                Are you in immediate need of assistance?
              </p>
              <p className="text-slate-600">
                {contactName ? `Your designated contact (${contactName})` : 'Your primary contact'} will receive high-priority SMS alerts, synthetic voice calls, and your latest GPS coordinate fix.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                id="btn-cancel-sos"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              <button
                id="btn-confirm-sos"
                onClick={handleConfirm}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
              >
                CONFIRM SOS
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
