import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Users,
  History,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Phone,
  Clock,
  Compass,
  Radio,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { journeyService } from '../services/journeyService';
import { alertService } from '../services/alertService';
import { Journey, SafetyAlert } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { RiskScore } from '../components/RiskScore';
import { SOSButton } from '../components/SOSButton';
import { DemoModeBar } from '../components/DemoModeBar';
import { JourneyCard } from '../components/JourneyCard';
import { AlertCard } from '../components/AlertCard';

export const DashboardPage: React.FC = () => {
  const { user, primaryContact, activeJourney, setActiveJourney } = useAuth();
  const navigate = useNavigate();

  const [recentJourneys, setRecentJourneys] = useState<Journey[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<SafetyAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sosNotificationBanner, setSosNotificationBanner] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const [journeyRes, alertList, activeRes] = await Promise.all([
        journeyService.getJourneys(),
        alertService.getAlerts(),
        journeyService.getActiveJourney(),
      ]);
      setRecentJourneys(journeyRes.slice(0, 3));
      setRecentAlerts(alertList.slice(0, 3));
      setActiveJourney(activeRes.journey);
    } catch (err) {
      console.warn('Dashboard data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleGlobalSOS = async () => {
    try {
      const res = await alertService.triggerSOS({
        journeyId: activeJourney?.id,
      });
      setSosNotificationBanner(res.dispatchResult.message);
      await fetchDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to dispatch SOS alert.');
    }
  };

  const handleDemoSimulation = async (
    eventType: 'NORMAL' | 'ROUTE_DEVIATION' | 'INACTIVITY' | 'MISSED_CHECKIN' | 'HIGH_RISK' | 'SOS'
  ) => {
    if (eventType === 'SOS') {
      await handleGlobalSOS();
      return;
    }

    if (!activeJourney) {
      const newJ = await journeyService.createJourney({
        startLocation: { latitude: 28.5355, longitude: 77.391, name: 'University Campus' },
        destination: { latitude: 28.57, longitude: 77.32, name: 'Home Residence', address: 'B-44 Green Park' },
        expectedDuration: 35,
      });
      setActiveJourney(newJ);
      navigate(`/journey/${newJ.id}?simulate=${eventType}`);
    } else {
      navigate(`/journey/${activeJourney.id}?simulate=${eventType}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Demo Simulation Bar */}
      <DemoModeBar onSimulate={handleDemoSimulation} />

      {/* SOS Dispatched Banner */}
      {sosNotificationBanner && (
        <div
          id="sos-dispatched-alert-box"
          className="bg-rose-50 border border-rose-300 rounded-xl p-4 flex items-start justify-between gap-3 text-rose-950 shadow-sm animate-in fade-in"
        >
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">
                EMERGENCY DISPATCH INITIATED
              </p>
              <p className="text-xs text-rose-800 mt-1 font-mono">
                {sosNotificationBanner}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSosNotificationBanner(null)}
            className="text-xs font-bold text-rose-700 hover:text-rose-900 underline shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Contact Warning if missing */}
      {!primaryContact && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-amber-200 text-amber-900 flex items-center justify-center font-bold text-xs">
              !
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">
                Primary Emergency Contact Required
              </p>
              <p className="text-xs text-amber-700">
                Configure a primary guardian to receive instant alerts and coordinates.
              </p>
            </div>
          </div>
          <Link
            to="/contacts"
            className="py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors"
          >
            Set Guardian Contact
          </Link>
        </div>
      )}

      {/* Professional Polish Metric Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1 */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">
            Active System Status
          </p>
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {activeJourney ? 'IN TRANSIT' : 'STANDBY'}
            </h2>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded border ${
                activeJourney
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                  : 'text-slate-600 bg-slate-50 border-slate-200'
              }`}
            >
              {activeJourney ? 'ACTIVE' : 'READY'}
            </span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">
            Current Risk Index
          </p>
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {activeJourney ? `${activeJourney.riskScore}/100` : '0/100'}
            </h2>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
              {activeJourney ? activeJourney.riskLevel : 'LOW'}
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">
            Primary Guardian
          </p>
          <div className="flex items-end justify-between">
            <h2 className="text-base font-bold text-slate-900 tracking-tight truncate max-w-[140px]">
              {primaryContact ? primaryContact.name.split(' ')[0] : 'Sunita'}
            </h2>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
              VERIFIED
            </span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">
            Total Journeys Logged
          </p>
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {recentJourneys.length}
            </h2>
            <span className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
              PROTECTED
            </span>
          </div>
        </div>
      </div>

      {/* Main Structural Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Safety Assessment & Start Journey */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 tracking-tight">
                  Area A • Real-Time Safety Assessment
                </h3>
                <p className="text-xs text-slate-500">Autonomous corridor monitoring & anomaly detection</p>
              </div>
              {activeJourney ? (
                <RiskBadge level={activeJourney.riskLevel} score={activeJourney.riskScore} />
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  SYSTEM READY
                </span>
              )}
            </div>

            {activeJourney ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <RiskScore score={activeJourney.riskScore} level={activeJourney.riskLevel} />
                  <Link
                    to={`/journey/${activeJourney.id}`}
                    className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-xs transition-colors"
                  >
                    <span>Open Live Map</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                      Active Corridor
                    </span>
                    <p className="font-bold text-slate-900 text-sm mt-1">
                      {activeJourney.startLocation.name} → {activeJourney.destination.name}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                      Estimated Transit Time
                    </span>
                    <p className="font-bold text-slate-900 text-sm mt-1">
                      {activeJourney.expectedDuration} minutes
                    </p>
                  </div>
                </div>

                {activeJourney.lastRiskAnalysis?.summary && (
                  <div className="bg-slate-900 rounded-lg p-4 text-white text-xs relative overflow-hidden">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      AI Safety Intelligence
                    </p>
                    <p className="text-slate-200 font-sans text-xs font-medium">
                      "{activeJourney.lastRiskAnalysis.summary}"
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 mb-3">
                  <ShieldCheck className="w-6 h-6 text-slate-900" />
                </div>
                <h4 className="text-base font-bold text-slate-900">Current Status: Clear</h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  No active journey in progress. Activate SafeWalk telemetry before starting your commute.
                </p>
              </div>
            )}
          </div>

          {/* Area B: Start Journey CTA */}
          <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs font-bold text-slate-900">Heading somewhere solo?</p>
              <p className="text-xs text-slate-500">
                Engages continuous corridor tracking and automated check-ins.
              </p>
            </div>
            <Link
              id="btn-dashboard-start-journey"
              to="/start-journey"
              className="py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>START SAFE JOURNEY</span>
            </Link>
          </div>
        </div>

        {/* Right Column: Area C Direct SOS */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Area C • Emergency Dispatch
              </span>
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
            </div>

            <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
              Instant SOS Escalation
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Dispatches live GPS coordinates and automated voice/SMS calls directly to your primary contact:
            </p>

            <div className="my-5 bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                Designated Recipient
              </span>
              <p className="font-bold text-slate-900 mt-0.5">
                {primaryContact ? primaryContact.name : 'Sunita Sharma (Mother)'}
              </p>
              <p className="text-slate-500 font-mono text-[11px]">
                {primaryContact ? primaryContact.phone : '+91 98111 22334'}
              </p>
            </div>
          </div>

          <SOSButton
            onTriggerSOS={handleGlobalSOS}
            size="normal"
            contactName={primaryContact?.name}
            className="w-full"
          />
        </div>
      </div>

      {/* Area D: Recent Activity */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 tracking-tight">Area D • Recent Telemetry & Alerts</h3>
            <p className="text-xs text-slate-500">Historical logs and dispatch records</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/history"
              className="text-xs font-bold text-slate-900 hover:text-emerald-700 flex items-center gap-1 transition-colors"
            >
              <span>All Journeys</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
            <span className="text-slate-300">|</span>
            <Link
              to="/alerts"
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors"
            >
              <span>All Alerts</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Journeys column */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Latest Journeys
            </p>
            {recentJourneys.length > 0 ? (
              recentJourneys.map((j) => <JourneyCard key={j.id} journey={j} />)
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-xs text-slate-500">
                No past journeys recorded yet.
              </div>
            )}
          </div>

          {/* Alerts column */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Latest Safety Alerts
            </p>
            {recentAlerts.length > 0 ? (
              recentAlerts.map((a) => <AlertCard key={a.id} alert={a} />)
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-xs text-slate-500">
                No safety alerts recorded.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
