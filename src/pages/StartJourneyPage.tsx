import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Navigation,
  ArrowRight,
  AlertCircle,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { journeyService } from '../services/journeyService';
import { LocationPoint } from '../types';

export const StartJourneyPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, primaryContact, setActiveJourney } = useAuth();

  const [destinationName, setDestinationName] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [expectedDuration, setExpectedDuration] = useState('35');
  const [startLocation, setStartLocation] = useState<LocationPoint>({
    latitude: 28.5355,
    longitude: 77.391,
    name: 'University Campus',
  });

  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>('Standard University coordinate baseline');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const presets = [
    { name: 'Home Residence', address: 'B-44 Green Park', duration: '35' },
    { name: 'Student Hostel', address: 'Block C, University Hostel', duration: '15' },
    { name: 'Metro Station Gate 2', address: 'Central Metro Corridor', duration: '20' },
    { name: 'City Central Library', address: 'Sector 14 Library Complex', duration: '25' },
  ];

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation unsupported; using calibrated baseline.');
      return;
    }

    setIsLocating(true);
    setLocationStatus('Acquiring precise GPS fix from device sensors...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStartLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          name: 'Current Live GPS Location',
        });
        setLocationStatus(`GPS Locked: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)} (±${Math.round(pos.coords.accuracy)}m)`);
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation warning:', err);
        setLocationStatus('Using calibrated coordinate baseline.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    detectLocation();
  }, []);

  const handleApplyPreset = (p: typeof presets[0]) => {
    setDestinationName(p.name);
    setDestinationAddress(p.address);
    setExpectedDuration(p.duration);
    setError(null);
  };

  const handleStartJourney = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!destinationName.trim()) {
      setError('Please provide a destination name.');
      return;
    }

    const durationNum = parseInt(expectedDuration, 10);
    if (isNaN(durationNum) || durationNum <= 0) {
      setError('Please provide a valid duration in minutes.');
      return;
    }

    setIsLoading(true);
    try {
      const destCoordinates = {
        latitude: startLocation.latitude + 0.016,
        longitude: startLocation.longitude + 0.014,
        name: destinationName.trim(),
        address: destinationAddress.trim() || destinationName.trim(),
      };

      const journey = await journeyService.createJourney({
        startLocation,
        destination: destCoordinates,
        expectedDuration: durationNum,
      });

      setActiveJourney(journey);
      navigate(`/journey/${journey.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to initialize journey.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
        <Link to="/dashboard" className="hover:text-slate-900">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-bold">Start Safe Journey</span>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6 pb-6 border-b border-slate-100 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-black">
                <Navigation className="w-4 h-4" />
              </span>
              Initialize Route Monitoring
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Engages automatic route deviation, stationary intervals, and safety check-ins.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <Users className="w-3.5 h-3.5 text-slate-700 shrink-0" />
            <div className="text-left">
              <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Guardian</span>
              <span className="font-bold text-slate-800">
                {primaryContact ? primaryContact.name : 'Sunita Sharma'}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium rounded-lg p-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Presets */}
        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2.5">
            Scenario Quick Presets
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {presets.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left transition-all cursor-pointer group"
              >
                <p className="text-xs font-bold text-slate-900 truncate">
                  {p.name}
                </p>
                <p className="text-[10px] text-slate-500">{p.duration} mins expected</p>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleStartJourney} className="space-y-5">
          {/* Starting Location */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                Origin Point
              </label>
              <button
                type="button"
                onClick={detectLocation}
                disabled={isLocating}
                className="text-[11px] font-bold text-slate-900 hover:text-emerald-700 flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Navigation className="w-3 h-3" />
                <span>{isLocating ? 'Acquiring...' : 'Refresh GPS'}</span>
              </button>
            </div>

            <p className="text-sm font-bold text-slate-900">{startLocation.name}</p>
            <p className="text-xs font-mono text-slate-500 mt-0.5">{locationStatus}</p>
          </div>

          {/* Destination */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Destination Name *
            </label>
            <input
              id="input-dest-name"
              type="text"
              required
              value={destinationName}
              onChange={(e) => setDestinationName(e.target.value)}
              placeholder="e.g. Home Residence, Hostel, Central Library"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all"
            />
          </div>

          {/* Landmark */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Landmark / Specific Address (Optional)
            </label>
            <input
              id="input-dest-address"
              type="text"
              value={destinationAddress}
              onChange={(e) => setDestinationAddress(e.target.value)}
              placeholder="e.g. B-44 Green Park Main Gate"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Expected Duration (Minutes) *
            </label>
            <div className="flex items-center gap-3">
              <input
                id="input-expected-duration"
                type="number"
                min={1}
                max={300}
                required
                value={expectedDuration}
                onChange={(e) => setExpectedDuration(e.target.value)}
                className="w-32 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all"
              />
              <span className="text-xs text-slate-500">
                SafeWalk AI will evaluate transit delay if exceeded by 5+ mins.
              </span>
            </div>
          </div>

          {/* Start Journey Button */}
          <div className="pt-4">
            <button
              id="btn-confirm-start-journey"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
            >
              <Shield className="w-4 h-4" />
              <span>{isLoading ? 'INITIALIZING MONITOR...' : 'START SAFE JOURNEY'}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
