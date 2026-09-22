import React, { useState } from 'react';
import { HelpCircle, Send, CheckCircle2, X } from 'lucide-react';
import { api } from '../api';

export default function SupportModal({ onClose }) {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Company Verification');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createSupportTicket({ subject, category, message });
      setSuccess(true);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-7 shadow-2xl text-white relative">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold flex items-center gap-2 text-white">
            <HelpCircle className="w-5 h-5 text-indigo-400" /> Uptrix Support Desk
          </h3>
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-6 px-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h4 className="text-lg font-bold mb-2 text-white">Support Ticket Raised!</h4>
            <p className="text-slate-400 text-xs mb-6 max-w-xs mx-auto leading-relaxed">
              Our dedicated account management team will contact you via email within 24 hours.
            </p>
            <button 
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow transition-colors" 
              onClick={onClose}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Support Category
              </label>
              <select 
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-indigo-500 transition-colors"
                value={category} 
                onChange={e => setCategory(e.target.value)}
              >
                <option value="Company Verification">Company Verification Request</option>
                <option value="Job Posting Issues">Job Posting & Management</option>
                <option value="Candidate Applications">Candidate Applications & ATS</option>
                <option value="General Support">General Platform Inquiries</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Subject
              </label>
              <input
                type="text"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-indigo-500 transition-colors placeholder-slate-500"
                placeholder="Brief summary of your query..."
                value={subject}
                onChange={e => setSubject(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Detailed Message
              </label>
              <textarea
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-indigo-500 transition-colors placeholder-slate-500"
                rows={4}
                placeholder="Explain the issue or question in detail..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-2" 
              disabled={loading}
            >
              {loading ? 'Submitting...' : <><Send className="w-4 h-4" /> Submit Support Request</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

