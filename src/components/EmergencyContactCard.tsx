import React from 'react';
import { Phone, Mail, Star, Trash2, Edit3, ShieldCheck } from 'lucide-react';
import { EmergencyContact } from '../types';

interface EmergencyContactCardProps {
  contact: EmergencyContact;
  onEdit?: (contact: EmergencyContact) => void;
  onDelete?: (id: string) => void;
  onSetPrimary?: (contact: EmergencyContact) => void;
}

export const EmergencyContactCard: React.FC<EmergencyContactCardProps> = ({
  contact,
  onEdit,
  onDelete,
  onSetPrimary,
}) => {
  return (
    <div
      className={`relative rounded-xl border p-5 transition-all shadow-sm ${
        contact.isPrimary
          ? 'bg-white border-emerald-300 ring-1 ring-emerald-100'
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
              contact.isPrimary
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {contact.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight leading-snug">
                {contact.name}
              </h3>
              {contact.isPrimary && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" />
                  Primary Recipient
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Relationship: <span className="text-slate-800 font-medium">{contact.relationship}</span>
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {onEdit && (
            <button
              onClick={() => onEdit(contact)}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
              title="Edit contact"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(contact.id)}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
              title="Delete contact"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-mono font-medium text-slate-800">{contact.phone}</span>
        </div>
        <div className="flex items-center gap-2 truncate">
          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate text-slate-700">{contact.email}</span>
        </div>
      </div>

      {/* Set Primary Button */}
      {!contact.isPrimary && onSetPrimary && (
        <div className="mt-3.5 pt-2 border-t border-slate-100">
          <button
            onClick={() => onSetPrimary(contact)}
            className="w-full py-1.5 px-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Star className="w-3.5 h-3.5 text-slate-400" />
            <span>Set as Primary Contact</span>
          </button>
        </div>
      )}
    </div>
  );
};
