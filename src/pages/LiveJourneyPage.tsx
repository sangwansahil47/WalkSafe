import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  MapPin,
  Clock,
  Navigation,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Radio,
  CheckCircle2,
  RefreshCw,
  PhoneCall,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { journeyService } from '../services/journeyService';
import { alertService } from '../services/alertService';
import { Journey, LocationLog, LocationPoint, SafetyAlert } from '../types';
import { JourneyMap } from '../components/JourneyMap';
import { RiskBadge } from '../components/RiskBadge';
import { RiskScore } from '../components/RiskScore';
import { SOSButton } from '../components/SOSButton';
import { SafetyCheckInModal } from '../components/SafetyCheckInModal';
import { DemoModeBar } from '../components/DemoModeBar';

export const LiveJourneyPage: React.FC = () => {
  const { journeyId } = useParams<{ journeyId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, primaryContact, setActiveJourney } = useAuth();

  const [journey, setJourney] = useState<Journey | null>(null);
  const [locationLogs, setLocationLogs] = useState<LocationLog[]>([]);
  const [currentLocation, setCurrentLocation] = useState<LocationPoint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [secondsAgo, setSecondsAgo] = useState<number>(0);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [alertDispatchInfo, setAlertDispatchInfo] = useState<any | null>(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInReasons, setCheckInReasons] = useState<string[]>([]);
  const [gpsStatus, setGpsStatus] = useState<'ACTIVE' | 'SIMULATED' | 'DENIED'>('ACTIVE');

  const watchIdRef = useRef<number | null>(null);
  const periodicTimerRef = useRef<any>(null);

  // 1. Fetch Journey initial data
  const loadJourney = async () => {
    if (!journeyId) return;
    try {
      const data = await journeyService.getJourneyById(journeyId);
      setJourney(data.journey);
      setLocationLogs(data.locationLogs);
      setActiveJourney(data.journey.status === 'ACTIVE' || data.journey.status === 'ALERT' ? data.journey : null);

      if (data.locationLogs.length > 0) {
        const latest = data.locationLogs[data.locationLogs.length - 1];
        setCurrentLocation({
          latitude: latest.latitude,
          longitude: latest.longitude,
        });
      }

      if (data.journey.checkInRequired && (data.journey.riskLevel === 'HIGH' || data.journey.riskLevel === 'CRITICAL')) {
        setShowCheckInModal(true);
        setCheckInReasons(data.journey.lastRiskAnalysis?.signals || ['Unusual journey anomaly detected']);
      }
    } catch (err) {
      console.warn('Failed to load journey:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJourney();
  }, [journeyId]);

  // Handle URL simulate parameter
  useEffect(() => {
    const simulateParam = searchParams.get('simulate');
    if (simulateParam && journeyId && !isLoading) {
      handleSimulateEvent(simulateParam as any);
    }
  }, [searchParams, journeyId, isLoading]);

  // 2. Real-time GPS Watcher and periodic update
  useEffect(() => {
    if (!journey || (journey.status !== 'ACTIVE' && journey.status !== 'ALERT')) return;

    if (navigator.geolocation) {
      try {
        watchIdRef.current = navigator.geolocation.watchPosition(
          async (pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            setCurrentLocation({ latitude: lat, longitude: lon });
            setGpsStatus('ACTIVE');
          },
          (err) => {
            console.warn('GPS watch warning:', err);
            setGpsStatus('SIMULATED');
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
        );
      } catch (e) {
        setGpsStatus('SIMULATED');
      }
    }

    periodicTimerRef.current = setInterval(async () => {
      if (!currentLocation && locationLogs.length === 0) return;
      const lat = currentLocation?.latitude || journey.startLocation.latitude;
      const lon = currentLocation?.longitude || journey.startLocation.longitude;
      await sendLocationTelemetry(lat, lon, 3.5);
    }, 15000);

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (periodicTimerRef.current) {
        clearInterval(periodicTimerRef.current);
      }
    };
  }, [journey?.status, currentLocation?.latitude, currentLocation?.longitude]);

  // Seconds ago counter
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsAgo(Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const sendLocationTelemetry = async (latitude: number, longitude: number, speed: number = 0) => {
    if (!journeyId || !journey) return;
    setIsUpdatingLocation(true);
    try {
      const res = await journeyService.recordLocation(journeyId, { latitude, longitude, speed });
      setJourney(res.journey);
      setLocationLogs(res.locationLogs);
      setLastUpdated(new Date());
      setSecondsAgo(0);

      if (res.journey.checkInRequired || res.riskAnalysis.riskLevel === 'HIGH' || res.riskAnalysis.riskLevel === 'CRITICAL') {
        setShowCheckInModal(true);
        setCheckInReasons(res.riskAnalysis.signals);
      }
    } catch (err) {
      console.warn('Failed to record location update:', err);
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  const handleImSafe = async () => {
    if (!journeyId) return;
    try {
      const updated = await journeyService.checkIn(journeyId);
      setJourney(updated);
      setShowCheckInModal(false);
      setAlertDispatchInfo(null);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to record check-in.');
    }
  };

  const handleNeedHelp = async () => {
    if (!journeyId) return;
    setShowCheckInModal(false);
    try {
      const res = await alertService.requestHelp(journeyId);
      setJourney((prev) => (prev ? { ...prev, status: 'ALERT', riskLevel: 'CRITICAL', riskScore: 90 } : null));
      setAlertDispatchInfo(res.dispatchResult);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to dispatch help request.');
    }
  };

  const handleCountdownExpire = async () => {
    if (!journeyId) return;
    setShowCheckInModal(false);
    try {
      const res = await alertService.autoEscalate(journeyId);
      setJourney((prev) => (prev ? { ...prev, status: 'ALERT', riskLevel: 'CRITICAL', riskScore: 95 } : null));
      setAlertDispatchInfo(res.dispatchResult);
    } catch (err: any) {
      console.warn('Auto-escalation warning:', err);
    }
  };

  const handleSOS = async () => {
    if (!journeyId) return;
    setShowCheckInModal(false);
    try {
      const res = await alertService.triggerSOS({
        journeyId,
        latitude: currentLocation?.latitude,
        longitude: currentLocation?.longitude,
      });
      setJourney((prev) => (prev ? { ...prev, status: 'SOS', riskLevel: 'CRITICAL', riskScore: 100 } : null));
      setAlertDispatchInfo(res.dispatchResult);
    } catch (err: any) {
      alert(err.response?.data?.error || 'SOS trigger failed.');
    }
  };

  const handleEndJourney = async () => {
    if (!journeyId) return;
    const confirmEnd = window.confirm('Are you sure you want to conclude this safe journey?');
    if (!confirmEnd) return;

    try {
      await journeyService.endJourney(journeyId, 'COMPLETED');
      setActiveJourney(null);
      navigate('/history');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to end journey.');
    }
  };

  const handleSimulateEvent = async (
    eventType: 'NORMAL' | 'ROUTE_DEVIATION' | 'INACTIVITY' | 'MISSED_CHECKIN' | 'HIGH_RISK' | 'SOS'
  ) => {
    if (!journeyId) return;

    if (eventType === 'SOS') {
      await handleSOS();
      return;
    }

    try {
      const res = await journeyService.simulateEvent(journeyId, eventType as any);
      setJourney(res.journey);
      setLocationLogs(res.locationLogs);
      setLastUpdated(new Date());
      setSecondsAgo(0);

      if (res.locationLogs.length > 0) {
        const latest = res.locationLogs[res.locationLogs.length - 1];
        setCurrentLocation({ latitude: latest.latitude, longitude: latest.longitude });
      }

      if (res.journey.checkInRequired || res.riskAnalysis.riskLevel === 'HIGH' || res.riskAnalysis.riskLevel === 'CRITICAL') {
        setShowCheckInModal(true);
        setCheckInReasons(res.riskAnalysis.signals);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Simulation failed.');
    }
  };

  if (isLoading || !journey) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-white animate-spin">
          <RefreshCw className="w-5 h-5" />
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Connecting Telemetry Engine...</p>
      </div>
    );
  }

  const isHighRisk = journey.riskLevel === 'HIGH' || journey.riskLevel === 'CRITICAL';
  const isAlertState = journey.status === 'ALERT' || journey.status === 'SOS';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Demo Simulation Bar */}
      <DemoModeBar onSimulate={handleSimulateEvent} />

      {/* Safety Check-In Modal */}
      <SafetyCheckInModal
        isOpen={showCheckInModal}
        reasons={checkInReasons}
        onSafe={handleImSafe}
        onNeedHelp={handleNeedHelp}
        onSOS={handleSOS}
        onCountdownExpire={handleCountdownExpire}
        primaryContactName={primaryContact?.name}
      />

      {/* Alert Dispatch Confirmation Banner */}
      {alertDispatchInfo && (
        <div
          id="live-journey-alert-banner"
          className="bg-rose-50 border border-rose-300 rounded-xl p-5 text-rose-950 shadow-sm animate-in fade-in"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-rose-950">
                    EMERGENCY ALERT GENERATED & DISPATCHED
                  </span>
                  {alertDispatchInfo.simulated && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      DEMO DISPATCH
                    </span>
                  )}
                </div>
                <p className="text-xs text-rose-800 mt-1">
                  Recipient: <strong>{alertDispatchInfo.recipient.name}</strong> ({alertDispatchInfo.recipient.phone})
                </p>
                <div className="mt-2 bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-[11px] whitespace-pre-wrap">
                  {alertDispatchInfo.formattedAlertText}
                </div>
              </div>
            </div>
            <button
              onClick={() => setAlertDispatchInfo(null)}
              className="text-xs font-bold text-rose-700 hover:text-rose-900 underline shrink-0 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Main Live Journey Container */}
      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-4 pb-6 border-b border-slate-100 flex-wrap">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white shadow-xs ${
                isAlertState
                  ? 'bg-rose-600'
                  : isHighRisk
                  ? 'bg-orange-500'
                  : 'bg-slate-900'
              }`}
            >
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Live Telemetry Monitor
                </h1>
                <RiskBadge level={journey.riskLevel} score={journey.riskScore} />
              </div>
              <p className="text-xs text-slate-400 font-medium flex items-center gap-2 mt-0.5">
                <span>ID: <span className="font-mono text-slate-600">{journey.id.substring(0, 14)}...</span></span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-700 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  GPS ACTIVE
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-right text-xs text-slate-400">
              <span className="block text-[9px] uppercase font-bold tracking-widest text-slate-400">Last Fix</span>
              <span className="font-mono font-bold text-slate-700">
                {secondsAgo === 0 ? 'Live' : `${secondsAgo}s ago`}
              </span>
            </div>
            <button
              onClick={() => sendLocationTelemetry(
                currentLocation?.latitude || journey.startLocation.latitude + 0.001,
                currentLocation?.longitude || journey.startLocation.longitude + 0.001,
                4.2
              )}
              disabled={isUpdatingLocation}
              className="py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingLocation ? 'animate-spin' : ''}`} />
              <span>Ping Sensor</span>
            </button>
          </div>
        </div>

        {/* Middle Section: Risk Score + Live Map */}
        <div className="my-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Risk Score & Signals */}
          <div className="space-y-4 bg-slate-50 rounded-lg p-5 border border-slate-200">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Deterministic Engine
            </p>

            <RiskScore score={journey.riskScore} level={journey.riskLevel} />

            {/* AI Explanation Box */}
            <div className="bg-slate-900 text-white rounded-lg p-4 shadow-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>AI Context Synthesis</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-normal">
                "{journey.lastRiskAnalysis?.summary ||
                  'Telemetry streams verified. No active corridor deviation.'}"
              </p>
            </div>

            {/* Monitored Signals */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">
                Monitored Signal Matrix
              </span>
              <div className="space-y-1.5 text-xs">
                {journey.lastRiskAnalysis?.signals && journey.lastRiskAnalysis.signals.length > 0 ? (
                  journey.lastRiskAnalysis.signals.map((sig, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 font-medium"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span className="leading-tight">{sig}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-slate-200 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Path alignment: On corridor track</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Live Map */}
          <div className="lg:col-span-2 space-y-4">
            <JourneyMap
              startLocation={journey.startLocation}
              destination={journey.destination}
              currentLocation={currentLocation || undefined}
              locationLogs={locationLogs}
              className="h-80 sm:h-96 w-full"
              isHighRisk={isHighRisk}
            />

            {/* Route Meta & Timers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <div className="truncate">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Origin</span>
                  <span className="font-bold text-slate-800 truncate">{journey.startLocation.name}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <div className="truncate">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Destination</span>
                  <span className="font-bold text-slate-800 truncate">{journey.destination.name}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Expected Time</span>
                  <span className="font-bold text-slate-800">{journey.expectedDuration} mins</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Controls */}
        <div className="pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
          {/* I'M SAFE */}
          <button
            id="btn-live-im-safe"
            onClick={handleImSafe}
            className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>I'M SAFE</span>
          </button>

          {/* I NEED HELP */}
          <button
            id="btn-live-need-help"
            onClick={handleNeedHelp}
            className="py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>I NEED HELP</span>
          </button>

          {/* END JOURNEY */}
          <button
            id="btn-live-end-journey"
            onClick={handleEndJourney}
            className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>END JOURNEY</span>
          </button>

          {/* SOS Prominent Button */}
          <SOSButton
            onTriggerSOS={handleSOS}
            contactName={primaryContact?.name}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};
