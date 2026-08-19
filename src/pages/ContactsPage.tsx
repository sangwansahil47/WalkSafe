import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Phone,
  Mail,
  UserCheck,
  AlertCircle,
  ShieldCheck,
  X,
  Star,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { contactService } from '../services/contactService';
import { EmergencyContact } from '../types';
import { EmergencyContactCard } from '../components/EmergencyContactCard';

export const ContactsPage: React.FC = () => {
  const { refreshAuth } = useAuth();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    relationship: 'Family',
    isPrimary: false,
  });

  const loadContacts = async () => {
    try {
      const list = await contactService.getContacts();
      setContacts(list);
    } catch (err: any) {
      setError('Failed to fetch emergency contacts.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const openAddModal = () => {
    setEditingContact(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      relationship: 'Family',
      isPrimary: contacts.length === 0,
    });
    setShowModal(true);
    setError(null);
  };

  const openEditModal = (c: EmergencyContact) => {
    setEditingContact(c);
    setFormData({
      name: c.name,
      phone: c.phone,
      email: c.email,
      relationship: c.relationship,
      isPrimary: c.isPrimary,
    });
    setShowModal(true);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Contact name is required.');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required for alert dispatch.');
      return;
    }
    if (!formData.email.includes('@')) {
      setError('A valid email address is required.');
      return;
    }

    try {
      if (editingContact) {
        await contactService.updateContact(editingContact.id, formData);
        setSuccessMessage(`Updated contact details for ${formData.name}`);
      } else {
        await contactService.createContact(formData);
        setSuccessMessage(`Added ${formData.name} to trusted emergency circle`);
      }
      setShowModal(false);
      await loadContacts();
      await refreshAuth();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save contact.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this emergency contact?')) return;
    try {
      await contactService.deleteContact(id);
      setSuccessMessage('Emergency contact removed.');
      await loadContacts();
      await refreshAuth();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete contact.');
    }
  };

  const handleSetPrimary = async (contact: EmergencyContact) => {
    try {
      await contactService.updateContact(contact.id, { isPrimary: true });
      setSuccessMessage(`${contact.name} is now designated as your Primary Emergency Contact.`);
      await loadContacts();
      await refreshAuth();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update primary contact.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-black">
              <Users className="w-4 h-4" />
            </span>
            Trusted Emergency Contacts
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            SafeWalk AI notifies your primary contact upon safety timeouts or SOS escalations.
          </p>
        </div>

        <button
          id="btn-add-contact"
          onClick={openAddModal}
          className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Contact</span>
        </button>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold rounded-lg p-3.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-[11px] text-emerald-700 hover:text-emerald-900 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Primary Contact Guidance Box */}
      <div className="bg-slate-900 text-white rounded-xl p-5 flex items-start gap-3.5 shadow-sm">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold text-slate-100 text-sm">
            Emergency Dispatch Rule
          </p>
          <p className="text-slate-300 leading-relaxed font-normal">
            Your <strong>Primary Emergency Contact</strong> receives automated high-priority SMS, phone voice call synthesis, and Email alerts containing your latest GPS pin whenever a risk threshold is breached or check-in expires.
          </p>
        </div>
      </div>

      {/* Contacts List Grid */}
      {contacts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contacts.map((c) => (
            <EmergencyContactCard
              key={c.id}
              contact={c}
              onEdit={openEditModal}
              onDelete={handleDelete}
              onSetPrimary={handleSetPrimary}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Contacts Configured</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
            Add at least one trusted friend, family member, or guardian so SafeWalk AI knows who to notify during an emergency.
          </p>
          <button
            onClick={openAddModal}
            className="py-2 px-4 bg-slate-900 text-white rounded-lg text-xs font-bold shadow-xs"
          >
            Add First Contact
          </button>
        </div>
      )}

      {/* Add / Edit Contact Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200 p-6 flex flex-col gap-4 relative animate-in zoom-in-95">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingContact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
                </h3>
                <p className="text-xs text-slate-500">Trusted guardian or companion</p>
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Contact Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sunita Sharma (Mother)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Phone Number (For Instant SMS / Voice Calls) *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. +91 98111 22334"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Email Address (For Safety Summaries) *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. sunita.sharma@example.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Relationship
                </label>
                <select
                  value={formData.relationship}
                  onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
                >
                  <option value="Mother">Mother</option>
                  <option value="Father">Father</option>
                  <option value="Parent / Guardian">Parent / Guardian</option>
                  <option value="Spouse / Partner">Spouse / Partner</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Friend">Friend</option>
                  <option value="Colleague">Colleague</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="checkbox-isPrimary"
                  checked={formData.isPrimary}
                  onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                  className="w-3.5 h-3.5 text-slate-900 rounded border-slate-300 focus:ring-slate-900"
                />
                <label htmlFor="checkbox-isPrimary" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Designate as Primary Contact (Default for auto-escalations)
                </label>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs shadow-xs transition-colors"
                >
                  {editingContact ? 'Save Changes' : 'Add Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
