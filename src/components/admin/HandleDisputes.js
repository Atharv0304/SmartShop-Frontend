import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const HandleDisputes = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      const response = await api.get('/api/admin/disputes');
      // Sort open disputes first, then by date
      const sorted = response.data.sort((a, b) => {
        if (a.status === 'OPEN' && b.status !== 'OPEN') return -1;
        if (a.status !== 'OPEN' && b.status === 'OPEN') return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setDisputes(sorted);
    } catch (error) {
      console.error('Error fetching disputes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id) => {
    if (!resolutionNotes.trim()) {
      alert('Please enter resolution notes.');
      return;
    }
    
    try {
      await api.put(`/api/admin/disputes/${id}/resolve`, { resolutionNotes });
      setResolvingId(null);
      setResolutionNotes('');
      fetchDisputes();
    } catch (error) {
      console.error('Error resolving dispute:', error);
      alert('Failed to resolve dispute');
    }
  };

  if (loading) return <div className="text-center p-12 text-slate-500 font-bold animate-pulse">Loading Disputes...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Handle Disputes</h2>
        <p className="text-slate-500 font-medium">Manage and resolve issues reported by users</p>
      </div>

      <div className="space-y-4">
        {disputes.map(dispute => (
          <div key={dispute.id} className={`glass p-6 rounded-3xl border ${dispute.status === 'OPEN' ? 'border-rose-200' : 'border-emerald-200'} shadow-sm relative overflow-hidden transition-all hover:shadow-md`}>
            {dispute.status === 'OPEN' && <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />}
            {dispute.status === 'RESOLVED' && <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />}
            
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${dispute.status === 'OPEN' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                    {dispute.status}
                  </span>
                  <span className="text-sm font-bold text-slate-500">
                    Order #{dispute.orderId}
                  </span>
                  <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                    Reported by: {dispute.reportedByRole}
                  </span>
                </div>
                
                <h4 className="font-bold text-slate-800 text-lg mb-1">Reason:</h4>
                <p className="text-slate-600 mb-4 bg-white/50 p-4 rounded-xl border border-slate-100">{dispute.reason}</p>
                
                {dispute.status === 'RESOLVED' && (
                  <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50">
                    <h4 className="font-bold text-emerald-800 text-sm mb-1">Resolution Notes:</h4>
                    <p className="text-emerald-700 text-sm">{dispute.resolutionNotes}</p>
                  </div>
                )}
              </div>
              
              {dispute.status === 'OPEN' && (
                <div className="md:w-1/3 bg-white/40 p-4 rounded-2xl border border-slate-100 flex flex-col gap-3">
                  <h4 className="font-bold text-slate-700 text-sm">Resolve this issue</h4>
                  <textarea
                    value={resolvingId === dispute.id ? resolutionNotes : ''}
                    onChange={(e) => {
                      setResolvingId(dispute.id);
                      setResolutionNotes(e.target.value);
                    }}
                    placeholder="Enter resolution notes..."
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none resize-none h-24"
                  />
                  <button 
                    onClick={() => handleResolve(dispute.id)}
                    disabled={resolvingId !== dispute.id || !resolutionNotes.trim()}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition disabled:opacity-50"
                  >
                    Mark as Resolved
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {disputes.length === 0 && (
          <div className="glass p-12 rounded-3xl border border-white/60 text-center shadow-sm">
            <div className="text-5xl mb-4 opacity-50">⚖️</div>
            <h3 className="text-xl font-bold text-slate-700">No Disputes</h3>
            <p className="text-slate-500">There are currently no disputes to handle.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HandleDisputes;
