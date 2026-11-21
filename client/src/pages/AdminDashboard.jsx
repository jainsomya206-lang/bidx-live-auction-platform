import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  PlusCircle,
  Clock,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Zap,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Layers,
  Image,
} from 'lucide-react';

export default function AdminDashboard({ onSelectAuction }) {
  const { user, isAdmin } = useAuth();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Luxury Watches',
    startingPrice: '5000',
    durationMinutes: '10',
    minIncrement: '50',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80',
  });

  const categories = [
    'Luxury Watches',
    'Classic Cars',
    'Collectibles',
    'Cameras & Optics',
    'Tech & Hardware',
    'Fine Art',
    'Jewelry & Gems',
  ];

  const presetImages = [
    { label: 'Luxury Watch', url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Classic Car', url: 'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Rare Card', url: 'https://images.unsplash.com/photo-1613770327092-23c8a9ba0027?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Leica Camera', url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Fine Art Canvas', url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80' },
  ];

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const res = await api.auctions.getAll();
      if (res.success) {
        setAuctions(res.auctions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setFeedback(null);

    try {
      const res = await api.auctions.create({
        ...formData,
        startingPrice: Number(formData.startingPrice),
        durationMinutes: Number(formData.durationMinutes),
        minIncrement: Number(formData.minIncrement),
        images: [formData.imageUrl],
      });

      if (res.success) {
        setFeedback({ type: 'success', text: `Auction "${formData.title}" created successfully!` });
        setFormData({
          title: '',
          description: '',
          category: 'Luxury Watches',
          startingPrice: '5000',
          durationMinutes: '10',
          minIncrement: '50',
          imageUrl: presetImages[0].url,
        });
        fetchAuctions();
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to create auction.' });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await api.auctions.delete(id);
      setAuctions((prev) => prev.filter((a) => a._id !== id));
      setFeedback({ type: 'success', text: `Auction deleted.` });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to delete auction.' });
    }
  };

  const handleExtendAll = async () => {
    try {
      const res = await api.auctions.extendDemoTimers(15);
      setFeedback({ type: 'success', text: res.message || 'All timers extended by 15 minutes.' });
      fetchAuctions();
    } catch (err) {
      setFeedback({ type: 'error', text: 'Failed to reset timers.' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Operations & Control
          </span>
          <h1 className="font-display text-3xl font-bold text-slate-100">
            Admin Auction Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Create new auctions, configure starting bids, monitor active lots, and manage system timers.
          </p>
        </div>

        {/* Demo Helper Button */}
        <button
          onClick={handleExtendAll}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-dark-850 hover:bg-dark-800 border border-amber-500/40 text-amber-300 transition-colors flex items-center gap-2 self-start"
        >
          <Zap className="w-4 h-4 text-amber-400" />
          Extend All Timers by 15 Mins
        </button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
          feedback.type === 'error'
            ? 'bg-rose-950/80 border border-rose-800 text-rose-300'
            : 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
        }`}>
          {feedback.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Grid: Create Auction Form (Left 5) & Active Auctions Table (Right 7) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Create Auction Form */}
        <div className="lg:col-span-5 p-6 rounded-2xl glass-panel border border-slate-800 space-y-5">
          <h2 className="font-display font-bold text-lg text-slate-100 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-amber-400" />
            Create New Auction
          </h2>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Product Title / Lot Name
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. 1957 Omega Speedmaster CK2915"
                className="w-full px-3 py-2 bg-dark-850 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-dark-850 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-amber-400"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Starting Price ($)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.startingPrice}
                  onChange={(e) => setFormData({ ...formData, startingPrice: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-850 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-amber-400 font-mono-numbers"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.durationMinutes}
                  onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-850 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-amber-400 font-mono-numbers"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Min. Bid Increment ($)
              </label>
              <input
                type="number"
                min="1"
                value={formData.minIncrement}
                onChange={(e) => setFormData({ ...formData, minIncrement: e.target.value })}
                className="w-full px-3 py-2 bg-dark-850 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-amber-400 font-mono-numbers"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Image URL
              </label>
              <input
                type="url"
                required
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="w-full px-3 py-2 bg-dark-850 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-400"
              />

              {/* Quick image presets */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {presetImages.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setFormData({ ...formData, imageUrl: p.url })}
                    className="text-[10px] px-2 py-1 rounded bg-dark-800 text-slate-300 border border-slate-700 hover:border-amber-500/40"
                  >
                    Preset: {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Lot Description
              </label>
              <textarea
                required
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed condition, provenance, provenance certificate, technical specs..."
                className="w-full px-3 py-2 bg-dark-850 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-400 text-dark-950 transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {creating ? (
                <span className="inline-block w-4 h-4 border-2 border-dark-950 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Launch Live Auction</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Existing Auctions Table & History */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              All Managed Lots ({auctions.length})
            </h2>
            <button
              onClick={fetchAuctions}
              className="text-xs text-amber-400 hover:underline"
            >
              Refresh Table
            </button>
          </div>

          <div className="rounded-2xl glass-panel border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-dark-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Current Bid</th>
                    <th className="px-4 py-3">Bids</th>
                    <th className="px-4 py-3">Leader / Winner</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {auctions.map((auc) => (
                    <tr key={auc._id} className="hover:bg-dark-850/60 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-200 flex items-center gap-2.5">
                        <img
                          src={auc.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=100&q=80'}
                          alt=""
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                        <span className="truncate max-w-[140px]">{auc.title}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          auc.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {auc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono-numbers font-bold text-amber-400">
                        ${auc.currentBid?.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-mono-numbers text-slate-300">
                        {auc.bidCount || 0}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {auc.winner?.name || auc.currentHighestBidder?.name || <span className="text-slate-500 italic">None</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onSelectAuction(auc._id)}
                            className="p-1.5 rounded-lg bg-dark-800 text-slate-300 hover:text-amber-400 transition-colors"
                            title="View Auction"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(auc._id, auc.title)}
                              className="p-1.5 rounded-lg bg-dark-800 text-slate-400 hover:text-rose-400 transition-colors"
                              title="Delete Auction"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
