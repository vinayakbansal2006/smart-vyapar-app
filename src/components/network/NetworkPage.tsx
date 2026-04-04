/**
 * =========================================================================
 * Connection & Network Page (NetworkPage.tsx)
 * -------------------------------------------------------------------------
 * Lists connected business peers, displays recommendation engine results,
 * and maintains pending/active connection requests.
 * Uses `connectionsService` to subscribe/push updates to Supabase.
 * Features tabs for recommendations, pending invites, and current list.
 * =========================================================================
 */
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Search, CheckCircle, Clock, Users, Link2, UserPlus, Fingerprint, MapPin, 
  X, Check, Plus, Loader2, UserCheck, Activity, User, Sun, Moon
} from 'lucide-react';
import { AppState, UserRole, BusinessConnection } from '../../types';
import {
  followBusiness,
  acceptConnection,
  rejectConnection,
  unfollowBusiness,
  fetchConnections,
  searchBusinesses,
  fetchProfilesByIds,
  subscribeToConnections,
  fetchRecommendedBusinesses
} from '../../services/connectionsService';

interface NetworkPageProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  t: any;
}

const NetworkPage: React.FC<NetworkPageProps> = ({ state, setState, t }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'connected' | 'sent' | 'pending'>('all');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'MANUFACTURER' | 'DISTRIBUTOR' | 'RETAILER'>('ALL');
  const [connectionProfiles, setConnectionProfiles] = useState<Record<string, any>>({});
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const myId = state.profile.id;

  const showToastMsg = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }, []);



  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const rows = await fetchConnections(myId);
      if (!cancelled) { applyConnectionRows(rows); setInitialLoad(false); }
    };
    load();

    const unsubscribe = subscribeToConnections(myId, (rows) => {
      if (!cancelled) applyConnectionRows(rows);
    });
    return () => { cancelled = true; unsubscribe(); };
  }, [myId]);

  const applyConnectionRows = async (rows: any[]) => {
    const otherIds = rows.map(r => r.sender_id === myId ? r.receiver_id : r.sender_id);
    const profiles = otherIds.length ? await fetchProfilesByIds(otherIds) : [];
    const profileMap: Record<string, any> = {};
    profiles.forEach(p => { profileMap[p.id] = p; });
    setConnectionProfiles(prev => ({ ...prev, ...profileMap }));

    const connections: BusinessConnection[] = rows.map(r => {
      const isOutgoing = r.sender_id === myId;
      const otherId = isOutgoing ? r.receiver_id : r.sender_id;
      const p = profileMap[otherId];
      return {
        id: r.id,
        businessId: otherId,
        name: p?.name || p?.shop_name || otherId,
        shopName: p?.shop_name || '',
        role: (p?.role as UserRole) || UserRole.RETAILER,
        senderRole: (r.sender_role as UserRole) || UserRole.RETAILER,
        receiverRole: (r.receiver_role as UserRole) || UserRole.RETAILER,
        city: p?.city || '',
        status: r.status === 'ACCEPTED' ? 'CONNECTED' : (r.status === 'REJECTED' ? 'REJECTED' : 'PENDING'),
        direction: isOutgoing ? 'outgoing' : 'incoming',
      };
    });
    setState(s => ({ ...s, connections }));
  };

  const loadRecommendations = useCallback(async () => {
    setRecsLoading(true);
    try {
      const excludeIds = state.connections.map(c => c.businessId);
      const recs = await fetchRecommendedBusinesses(
        myId,
        state.profile.city || '',
        state.role || UserRole.RETAILER,
        excludeIds,
        8
      );
      setRecommendations(recs);
    } catch {
      // ignore
    } finally {
      setRecsLoading(false);
    }
  }, [myId, state.connections, state.profile.city, state.role]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!searchQuery || searchQuery.length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    searchTimerRef.current = setTimeout(async () => {
      const results = await searchBusinesses(searchQuery, myId);
      setSearchResults(results);
      setSearchLoading(false);
    }, 350);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [searchQuery, myId]);

  const handleFollow = async (targetId: string, receiverRole: string) => {
    setFollowLoading(targetId);
    try {
      await followBusiness(myId, targetId, state.role || UserRole.RETAILER, receiverRole);
      showToastMsg('Follow request sent!');
      setSearchQuery('');
      setSearchResults([]);
    } catch (err: any) {
      showToastMsg('Follow failed. Try again.');
      console.warn('Follow failed:', err.message);
    } finally {
      setFollowLoading(null);
    }
  };

  const handleAccept = async (connectionId: string) => {
    try {
      await acceptConnection(connectionId);
      showToastMsg('Connection accepted!');
    } catch (err: any) {
      showToastMsg('Accept failed. Try again.');
      console.warn('Accept failed:', err.message);
    }
  };

  const handleReject = async (connectionId: string) => {
    try {
      await rejectConnection(connectionId);
      showToastMsg('Request declined.');
    } catch (err: any) {
      showToastMsg('Decline failed. Try again.');
      console.warn('Reject failed:', err.message);
    }
  };

  const handleUnfollow = async (connectionId: string) => {
    try {
      await unfollowBusiness(connectionId);
      showToastMsg('Unfollowed successfully.');
    } catch (err: any) {
      showToastMsg('Unfollow failed. Try again.');
      console.warn('Unfollow failed:', err.message);
    }
  };

  const followedIds = useMemo(() => new Set(state.connections.map(c => c.businessId)), [state.connections]);

  const filteredConnections = useMemo(() => state.connections.filter(c => {
    if (activeFilter === 'connected' && c.status !== 'CONNECTED') return false;
    if (activeFilter === 'sent' && (c.direction !== 'outgoing' || c.status !== 'PENDING')) return false;
    if (activeFilter === 'pending' && (c.direction !== 'incoming' || c.status !== 'PENDING')) return false;
    if (roleFilter !== 'ALL' && c.role !== roleFilter) return false;
    return true;
  }), [state.connections, activeFilter, roleFilter]);

  const stats = useMemo(() => ({
    total: state.connections.length,
    connected: state.connections.filter(c => c.status === 'CONNECTED').length,
    pending: state.connections.filter(c => c.status === 'PENDING').length,
    outgoing: state.connections.filter(c => c.direction === 'outgoing').length,
  }), [state.connections]);

  const roleConfig = useCallback((role: UserRole) => {
    if (role === UserRole.MANUFACTURER) return { bg: '#DBEAFE', bgDark: 'rgba(59,130,246,0.12)', border: '#BFDBFE', text: '#1E40AF', accent: '#3B82F6', emoji: '🏭', label: 'Manufacturer' };
    if (role === UserRole.DISTRIBUTOR) return { bg: '#FFEDD5', bgDark: 'rgba(249,115,22,0.12)', border: '#FED7AA', text: '#9A3412', accent: '#F97316', emoji: '🚛', label: 'Distributor' };
    return { bg: '#D1FAE5', bgDark: 'rgba(16,185,129,0.12)', border: '#A7F3D0', text: '#065F46', accent: '#10B981', emoji: '🏪', label: 'Retailer' };
  }, []);

  const getRoleLabel = (roleStr: string) => {
    return roleStr.charAt(0) + roleStr.slice(1).toLowerCase();
  };

  // Modern pill tabs
  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'connected', label: 'Connected Users' },
    { id: 'sent', label: 'Sent Requests' },
    { id: 'pending', label: 'Pending Requests' },
  ];

  return (
    <div className="max-w-5xl mx-auto w-full font-sans transition-colors duration-300"
         style={{ background: 'var(--network-bg, transparent)' }}>
      
      {/* Required CSS Variable definition container */}
      <style>{`
        :root {
          --page-bg: #f8fafc;
          --card-bg: #ffffff;
          --text-main: #0f172a;
          --text-sub: #64748b;
          --border: #e2e8f0;
          --card-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }
        .dark {
          --page-bg: #0f172a;
          --card-bg: #1e293b;
          --text-main: #f8fafc;
          --text-sub: #94a3b8;
          --border: #334155;
          --card-shadow: 0 4px 20px rgba(0,0,0,0.25);
        }
        
        .net-card {
          background-color: var(--card-bg);
          border-radius: 20px;
          border: 1px solid var(--border);
          box-shadow: var(--card-shadow);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .net-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.08);
        }
        .dark .net-card:hover {
          box-shadow: 0 8px 30px rgba(0,0,0,0.4);
        }

        .gradient-pill {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
        }
      `}</style>

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pt-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black" style={{ color: 'var(--text-main)' }}>
              Hello, {state.profile.name || "Business"}
            </h1>
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
              {getRoleLabel(state.profile.role || 'Retailer')}
            </span>
          </div>
          <p className="text-sm font-semibold mt-1" style={{ color: 'var(--text-sub)' }}>
            ⚡ Powering Your Business Network
          </p>
        </div>

      </div>

      {/* Search Bar */}
      <div className="relative mb-8 group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input
            type="text"
            className="w-full py-4 pl-14 pr-12 rounded-[20px] outline-none text-base font-semibold transition-all focus:ring-4 focus:ring-indigo-500/20"
            style={{ 
              backgroundColor: 'var(--card-bg)', 
              color: 'var(--text-main)', 
              border: '2px solid var(--border)' 
            }}
            placeholder="Search businesses by name, shop, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchLoading && (
            <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none">
              <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
            </div>
          )}
          {searchQuery && !searchLoading && (
            <button
               onClick={() => { setSearchQuery(''); setSearchResults([]); }}
               className="absolute inset-y-0 right-5 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          {/* Search Dropdown */}
          {searchQuery.length >= 2 && (
            <div className="absolute top-16 left-0 w-full z-50 rounded-[20px] overflow-hidden max-h-80 overflow-y-auto"
                 style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
              {searchResults.length === 0 && !searchLoading ? (
                 <div className="px-6 py-8 text-center" style={{ color: 'var(--text-sub)' }}>
                    <Search className="w-8 h-8 opacity-50 mx-auto mb-2" />
                    <p className="font-bold">No businesses found</p>
                 </div>
              ) : (
                searchResults.map(biz => {
                  const isFollowed = followedIds.has(biz.id);
                  const rc = roleConfig((biz.role as UserRole) || UserRole.RETAILER);
                  return (
                    <div key={biz.id} className="flex items-center justify-between p-4 border-b last:border-0 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30"
                         style={{ borderColor: 'var(--border)' }}>
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm"
                               style={{ backgroundColor: rc.bg, border: `1px solid ${rc.border}` }}>
                             {rc.emoji}
                          </div>
                          <div>
                            <p className="font-bold text-base" style={{ color: 'var(--text-main)' }}>{biz.shop_name || biz.name}</p>
                            <p className="text-xs font-semibold" style={{ color: 'var(--text-sub)' }}>{getRoleLabel(biz.role || 'Retailer')} • {biz.city || 'Unknown Location'}</p>
                          </div>
                       </div>
                       
                       {isFollowed ? (
                          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                             <CheckCircle className="w-4 h-4" /> Connected
                          </span>
                       ) : (
                          <button onClick={() => handleFollow(biz.id, biz.role)} disabled={followLoading === biz.id}
                             className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50"
                             style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                             {followLoading === biz.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Connect'}
                          </button>
                       )}
                    </div>
                  );
                })
              )}
            </div>
          )}
      </div>

      {/* Recommended (Only shown when not searching) */}
      {!searchQuery && recommendations.length > 0 && (
         <div className="mb-10">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black" style={{ color: 'var(--text-main)' }}>Suggested For You</h3>
           </div>
           <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
              {recommendations.map(biz => {
                const isFollowed = followedIds.has(biz.id);
                const rc = roleConfig((biz.role as UserRole) || UserRole.RETAILER);
                return (
                  <div key={biz.id} className="net-card min-w-[220px] p-5 flex flex-col items-center text-center snap-center">
                     <div className="w-16 h-16 rounded-[20px] flex items-center justify-center text-2xl mb-3 shadow-md transition-transform hover:scale-105"
                          style={{ backgroundColor: rc.bg, border: `2px solid ${rc.border}` }}>
                        {rc.emoji}
                     </div>
                     <p className="font-bold text-base w-full truncate" style={{ color: 'var(--text-main)' }}>{biz.shop_name || biz.name}</p>
                     <p className="text-xs font-bold mt-1 px-2 py-0.5 rounded-md mb-4" style={{ backgroundColor: rc.bgDark, color: rc.accent }}>{getRoleLabel(biz.role || 'Retailer')}</p>
                     
                     {isFollowed ? (
                        <div className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                           <CheckCircle className="w-4 h-4" /> Connected
                        </div>
                     ) : (
                        <button onClick={() => handleFollow(biz.id, biz.role)} disabled={followLoading === biz.id}
                           className="w-full py-2.5 rounded-xl text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-800 transition-all active:scale-95 disabled:opacity-50">
                           {followLoading === biz.id ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Connect'}
                        </button>
                     )}
                  </div>
                );
              })}
           </div>
         </div>
      )}

      {/* 3 Big Stat Cards */}
      {!searchQuery && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="net-card p-6 flex items-center gap-5">
             <div className="w-16 h-16 rounded-[20px] flex items-center justify-center shrink-0" 
                  style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' }}>
               <CheckCircle className="w-8 h-8 text-white" />
             </div>
             <div>
               <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-sub)' }}>Connected</p>
               <p className="text-3xl font-black leading-none" style={{ color: 'var(--text-main)' }}>{stats.connected}</p>
             </div>
          </div>
          
          <div className="net-card p-6 flex items-center gap-5">
             <div className="w-16 h-16 rounded-[20px] flex items-center justify-center shrink-0" 
                  style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', boxShadow: '0 4px 15px rgba(59,130,246,0.3)' }}>
               <Users className="w-8 h-8 text-white" />
             </div>
             <div>
               <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-sub)' }}>Following</p>
               <p className="text-3xl font-black leading-none" style={{ color: 'var(--text-main)' }}>{stats.outgoing}</p>
             </div>
          </div>

          <div className="net-card p-6 flex items-center gap-5">
             <div className="w-16 h-16 rounded-[20px] flex items-center justify-center shrink-0" 
                  style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', boxShadow: '0 4px 15px rgba(245,158,11,0.3)' }}>
               <Clock className="w-8 h-8 text-white" />
             </div>
             <div>
               <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-sub)' }}>Pending</p>
               <p className="text-3xl font-black leading-none" style={{ color: 'var(--text-main)' }}>{stats.pending}</p>
             </div>
          </div>
        </div>
      )}

      {/* Tabs and Filters */}
      {!searchQuery && (
        <div className="flex flex-col gap-4 mb-8">
           {/* Primary Tabs */}
           <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
             {tabs.map(tab => (
                <button
                   key={tab.id}
                   onClick={() => setActiveFilter(tab.id as typeof activeFilter)}
                   className={`px-6 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                     activeFilter === tab.id ? 'gradient-pill' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                   }`}
                   style={activeFilter !== tab.id ? { color: 'var(--text-sub)', border: '1px solid var(--border)', background: 'var(--card-bg)' } : {}}
                >
                  {tab.label}
                </button>
             ))}
           </div>
           
           {/* Role Filters */}
           <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide mt-2">
              <span className="text-xs font-bold uppercase tracking-widest mr-2" style={{ color: 'var(--text-sub)' }}>Role:</span>
              {['ALL', 'MANUFACTURER', 'DISTRIBUTOR', 'RETAILER'].map(role => {
                 const isActive = roleFilter === role;
                 return (
                    <button
                       key={role}
                       onClick={() => setRoleFilter(role as any)}
                       className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                         isActive ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-md scale-105' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                       }`}
                       style={!isActive ? { color: 'var(--text-main)', border: '1px solid var(--border)', background: 'var(--card-bg)' } : {}}
                    >
                       {role === 'ALL' ? 'All Roles' : getRoleLabel(role)}
                    </button>
                 );
              })}
           </div>
        </div>
      )}

      {/* Connection List */}
      {!searchQuery && (
        <div className="space-y-4">
          {filteredConnections.length === 0 ? (
             <div className="py-20 text-center net-card opacity-80 border-dashed border-2">
                <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                   <UserPlus className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-black" style={{ color: 'var(--text-main)' }}>No connections here</h3>
                <p className="text-sm font-semibold mt-2" style={{ color: 'var(--text-sub)' }}>Try searching for a business or expanding your filters.</p>
             </div>
          ) : (
            filteredConnections.map(c => {
               const rc = roleConfig(c.role);
               const isIncomingPending = c.direction === 'incoming' && c.status === 'PENDING';
               
               return (
                  <div key={c.id} className="net-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 group">
                     {/* Info Section */}
                     <div className="flex items-center gap-4 sm:gap-6 flex-1">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] shadow-sm flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform"
                             style={{ backgroundColor: rc.bg, border: `2px solid ${rc.border}` }}>
                           {rc.emoji}
                        </div>
                        <div className="min-w-0">
                           <div className="flex items-center gap-2">
                              <h3 className="font-black text-lg sm:text-xl truncate" style={{ color: 'var(--text-main)' }}>{c.shopName || c.name}</h3>
                              {c.status === 'CONNECTED' && <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />}
                           </div>
                           <div className="flex items-center gap-2 sm:gap-3 mt-1 flex-wrap">
                              <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: rc.bgDark, color: rc.accent }}>{getRoleLabel(c.role)}</span>
                              {c.city && <span className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--text-sub)' }}><MapPin className="w-3 h-3"/> {c.city}</span>}
                              <span className="text-xs font-semibold font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800" style={{ color: 'var(--text-sub)' }}>ID: {c.businessId.slice(0, 8)}</span>
                           </div>
                        </div>
                     </div>

                     {/* Action Section */}
                     <div className="flex items-center gap-3 shrink-0">
                        {isIncomingPending ? (
                           <div className="flex items-center gap-2 w-full sm:w-auto">
                              <button onClick={() => handleAccept(c.id)} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl font-bold text-white transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                                      style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                                 <Check className="w-4 h-4"/> Accept
                              </button>
                              <button onClick={() => handleReject(c.id)} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl font-bold text-rose-600 bg-rose-50 border border-rose-200 transition-all active:scale-95 dark:bg-rose-900/20 dark:border-rose-800">
                                 <X className="w-4 h-4"/> Decline
                              </button>
                           </div>
                        ) : c.status === 'CONNECTED' ? (
                           <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800">
                                 <UserCheck className="w-4 h-4"/> {c.direction === 'outgoing' ? 'Following' : 'Follower'}
                              </span>
                              {c.direction === 'outgoing' && (
                                <button onClick={() => handleUnfollow(c.id)} title="Unfollow" className="p-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all border border-transparent dark:border-slate-700/50 hover:border-rose-200">
                                   <X className="w-5 h-5"/>
                                </button>
                              )}
                           </div>
                        ) : (
                           <span className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-amber-600 bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 w-full sm:w-auto">
                              <Clock className="w-4 h-4"/> {c.direction === 'outgoing' ? 'Requested' : 'Pending'}
                           </span>
                        )}
                     </div>
                  </div>
               );
            })
          )}
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-xl flex items-center gap-3 shadow-2xl transition-all"
             style={{ background: 'var(--text-main)', color: 'var(--page-bg)', animation: 'slideUp 0.3s ease-out' }}>
           <CheckCircle className="w-6 h-6 text-emerald-400" />
           <span className="font-bold">{toast}</span>
        </div>
      )}
    </div>
  );
};

export default NetworkPage;
