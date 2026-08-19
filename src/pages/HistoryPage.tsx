import React, { useState, useEffect } from 'react';
import { History, Search, RefreshCw, Filter, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { journeyService } from '../services/journeyService';
import { Journey } from '../types';
import { JourneyCard } from '../components/JourneyCard';

export const HistoryPage: React.FC = () => {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const loadJourneys = async () => {
    setIsLoading(true);
    try {
      const list = await journeyService.getJourneys();
      setJourneys(list);
    } catch (err) {
      console.warn('History fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJourneys();
  }, []);

  const filtered = journeys.filter((j) => {
    const matchesSearch =
      j.destination.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (j.destination.address && j.destination.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (j.startLocation.name && j.startLocation.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filterStatus === 'ALL') return matchesSearch;
    return matchesSearch && j.status === filterStatus;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-black">
              <History className="w-4 h-4" />
            </span>
            Journey Telemetry History
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Archived GPS path logs, telemetry risk scores, and AI incident analysis.
          </p>
        </div>

        <Link
          to="/start-journey"
          className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>New Safe Journey</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by origin or destination..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="ALERT">Alert</option>
            <option value="SOS">SOS</option>
          </select>
        </div>
      </div>

      {/* Journeys List */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-slate-900" />
          <span>Loading telemetry archives...</span>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((j) => (
            <JourneyCard key={j.id} journey={j} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Journey Logs Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            {searchTerm ? 'No results matched your search criteria.' : 'Begin tracking your routes to populate telemetry logs.'}
          </p>
        </div>
      )}
    </div>
  );
};
