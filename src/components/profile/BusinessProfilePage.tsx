import React, { useState } from 'react';
import {
  Building2, MapPin, Phone, Mail, BarChart3, Package,
  CheckCircle, Shield, Star, Link as LinkIcon, ArrowRight, Send,
  User, Calendar, FileText, Eye, Lock, Clock, Crown
} from 'lucide-react';
import { UserProfile, UserRole } from '../../types';

export type ConnectionStatus = 'not_connected' | 'requested' | 'connected';

interface BusinessProfilePageProps {
  profile: UserProfile;
  role: UserRole;
  isOwnProfile?: boolean;
  onEdit?: () => void;
  stats: {
    totalOrders: number;
    productsListed: number;
    networkPartners: number;
  };
  featuredProducts: Array<{ id: string; name: string; imageUrl?: string }>;
  recentActivity: Array<{ id: string; type: 'shipment' | 'deal' | 'login'; title: string; date: string }>;
  connectionStatus?: ConnectionStatus;
  onRequestConnect?: () => void;
  isPremium?: boolean;
}

const BusinessProfilePage: React.FC<BusinessProfilePageProps> = ({
  profile,
  role,
  isOwnProfile = false,
  onEdit,
  stats,
  featuredProducts,
  recentActivity,
  connectionStatus = 'not_connected',
  onRequestConnect,
  isPremium = false,
}) => {
  const [activeTab, setActiveTab] = useState<'about' | 'products' | 'activity'>('about');

  const isConnected = isOwnProfile || connectionStatus === 'connected';

  const getRoleLabel = (userRole: UserRole): string => {
    switch (userRole) {
      case UserRole.MANUFACTURER:
        return 'Manufacturer';
      case UserRole.DISTRIBUTOR:
        return 'Distributor';
      case UserRole.RETAILER:
        return 'Retailer';
      default:
        return 'Business';
    }
  };

  const coverGradient: Record<UserRole, string> = {
    [UserRole.MANUFACTURER]: 'linear-gradient(135deg, #fbbf24 0%, #eab308 100%)', // warm amber (softer orange)
    [UserRole.DISTRIBUTOR]: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
    [UserRole.RETAILER]: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
  };

  const roleColors: Record<UserRole, { light: string; dark: string; bg: string }> = {
    [UserRole.MANUFACTURER]: { light: '#fef3c7', dark: '#d97706', bg: 'rgba(245, 158, 11, 0.1)' },
    [UserRole.DISTRIBUTOR]: { light: '#dbeafe', dark: '#2563eb', bg: 'rgba(59, 130, 246, 0.1)' },
    [UserRole.RETAILER]: { light: '#d1fae5', dark: '#059669', bg: 'rgba(16, 185, 129, 0.1)' },
  };

  const colors = roleColors[role] || roleColors[UserRole.RETAILER];
  const displayedProducts = isConnected ? featuredProducts.slice(0, 6) : featuredProducts.slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12 dark:bg-slate-900 dark:text-slate-100 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* LEFT SIDEBAR – BUSINESS IDENTITY */}
          <div className="lg:col-span-1 space-y-8">
            {/* Cover Image & Logo Card */}
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.02)] transition-all dark:bg-slate-800 dark:border-slate-700/60 dark:shadow-none relative">
              {/* Cover/Banner */}
              <div
                className="w-full h-36 relative overflow-hidden"
                style={{ background: coverGradient[role] }}
              >
                <div className="absolute inset-0 opacity-10">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    <rect width="100" height="100" fill="url(#grid)" />
                  </svg>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  {role === UserRole.MANUFACTURER && (
                    <Building2 className="w-16 h-16 text-white opacity-30" strokeWidth={1} />
                  )}
                  {role === UserRole.DISTRIBUTOR && (
                    <Package className="w-16 h-16 text-white opacity-30" strokeWidth={1} />
                  )}
                  {role === UserRole.RETAILER && (
                    <BarChart3 className="w-16 h-16 text-white opacity-30" strokeWidth={1} />
                  )}
                </div>
              </div>

              {/* Logo & Badge */}
              <div className="px-8 pt-4 pb-8 relative">
                <div className="flex flex-col items-center -mt-20 mb-6 relative z-10">
                  <div
                    className="w-24 h-24 rounded-full border-[5px] border-white flex items-center justify-center shadow-sm mb-4 bg-gradient-to-br dark:border-slate-800"
                    style={{ backgroundImage: `linear-gradient(135deg, ${colors.light}, #ffffff)` }}
                  >
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="Logo" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <div className="text-3xl font-bold" style={{ color: colors.dark }}>
                        {profile.shopName?.[0]?.toUpperCase() || 'B'}
                      </div>
                    )}
                  </div>
                  {/* Verified Badge */}
                  <div
                    className="absolute bottom-6 right-10 w-8 h-8 rounded-full border-[3px] border-white flex items-center justify-center shadow-sm bg-green-500 dark:border-slate-800"
                  >
                    <CheckCircle className="w-5 h-5 text-white" strokeWidth={2} />
                  </div>
                </div>

                {/* Business Name & Type */}
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-slate-900 mb-1.5 dark:text-white">
                    {profile.shopName || 'Unnamed Business'}
                  </h1>
                  {isPremium && role === UserRole.MANUFACTURER && (
                    <div className="flex items-center justify-center gap-1.5 mt-1 mb-1">
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black text-amber-700 bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-200 dark:from-amber-900/30 dark:to-yellow-900/30 dark:border-amber-700/50 dark:text-amber-400 shadow-sm">
                        <Crown className="w-3.5 h-3.5" /> Premium
                      </span>
                    </div>
                  )}
                  <p className="text-sm font-medium text-slate-700 flex items-center justify-center gap-1.5 dark:text-slate-300">
                    <span style={{ color: colors.dark }}>{getRoleLabel(role)}</span>
                    <span className="text-slate-400 dark:text-slate-600">•</span>
                    <MapPin className="w-4 h-4 text-slate-500 dark:text-slate-400" strokeWidth={1.75} />
                    {profile.city || 'Location'}, {profile.state || 'India'}
                  </p>
                </div>

                {/* Bio/Description */}
                {profile.businessCategory && (
                  <p className={`text-center text-sm text-slate-600 mb-6 leading-relaxed dark:text-slate-400 transition-all ${!isConnected ? 'blur-[3px] opacity-60 select-none' : ''}`}>
                    {profile.businessCategory}
                  </p>
                )}

                {/* Vertical Divider */}
                <hr className="border-t border-slate-200 mb-6 dark:border-slate-700/60" />

                {/* Stats Row */}
                <div className={`grid grid-cols-3 gap-4 mb-8 transition-all ${!isConnected ? 'blur-[3px] opacity-60 select-none' : ''}`}>
                  {[
                    { label: 'Orders', value: stats.totalOrders },
                    { label: 'Products', value: stats.productsListed },
                    { label: 'Partners', value: stats.networkPartners },
                  ].map((item) => (
                    <div key={item.label} className="text-center flex flex-col items-center justify-center min-h-[56px]">
                      <p className="text-xl font-bold text-slate-900 dark:text-white leading-none">
                        {item.value}
                      </p>
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mt-2 dark:text-slate-400 leading-none">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>

                {!isConnected && (
                  <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20 pointer-events-none">
                    <span className="px-4 py-2 bg-slate-900/80 dark:bg-slate-800/80 backdrop-blur text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-2">
                       <Lock className="w-3 h-3" /> Connect to view stats
                    </span>
                  </div>
                )}

                {isOwnProfile && onEdit && (
                  <button
                    onClick={onEdit}
                    className="w-full px-5 py-3 rounded-full font-semibold text-sm text-white transition-all duration-300 flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-md dark:shadow-none"
                    style={{
                      background: `linear-gradient(135deg, ${colors.dark}, ${colors.dark}ee)`,
                    }}
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>

            {/* Product Thumbnails Grid */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-8 dark:bg-slate-800 dark:border-slate-700/60 dark:shadow-none">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide dark:text-white flex items-center gap-2">
                  Featured Products
                </h3>
                {!isConnected && <Lock className="w-4 h-4 text-slate-400" />}
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4 relative">
                {displayedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="aspect-square rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden hover:border-slate-300 transition-colors dark:bg-slate-700/50 dark:border-slate-600/50 dark:hover:border-slate-500"
                  >
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
                    )}
                  </div>
                ))}
              </div>
              
              {!isConnected && featuredProducts.length > 3 && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50 text-center">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Connect to unlock {featuredProducts.length - 3} more products
                  </p>
                </div>
              )}

              {isConnected && featuredProducts.length > 6 && (
                 <button className="w-full text-center py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors dark:text-slate-400 dark:hover:text-white">
                  View {featuredProducts.length - 6} more products
                </button>
              )}
              {featuredProducts.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-2">No products listed yet.</p>
              )}
            </div>
          </div>

          {/* RIGHT MAIN AREA – BUSINESS DETAILS */}
          <div className="lg:col-span-2 space-y-8">
            {/* Action Buttons */}
            {!isOwnProfile && (
              <div className="flex flex-wrap gap-4">
                {connectionStatus === 'connected' ? (
                  <button className="flex-1 min-w-[140px] px-5 py-3 rounded-full font-semibold text-sm border border-emerald-200 bg-emerald-50 text-emerald-700 transition-all flex items-center justify-center gap-2 dark:bg-emerald-900/20 dark:border-emerald-700/50 dark:text-emerald-400 cursor-default">
                    <CheckCircle className="w-4 h-4" strokeWidth={2} />
                    Connected
                  </button>
                ) : connectionStatus === 'requested' ? (
                  <button className="flex-1 min-w-[140px] px-5 py-3 rounded-full font-semibold text-sm border border-amber-200 bg-amber-50 text-amber-700 transition-all flex items-center justify-center gap-2 dark:bg-amber-900/20 dark:border-amber-700/50 dark:text-amber-400 cursor-default">
                    <Clock className="w-4 h-4" strokeWidth={2} />
                    Requested
                  </button>
                ) : (
                  <button onClick={onRequestConnect} className="flex-1 min-w-[140px] px-5 py-3 rounded-full font-semibold text-sm text-white transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 shadow-sm hover:-translate-y-0.5 hover:shadow-md dark:shadow-none">
                    <LinkIcon className="w-4 h-4" strokeWidth={2} />
                    Connect
                  </button>
                )}
                
                <button 
                  disabled={!isConnected}
                  className={`flex-1 min-w-[140px] px-5 py-3 rounded-full font-semibold text-sm border transition-all flex items-center justify-center gap-2 
                  ${isConnected ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700/80' : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed dark:bg-slate-800/50 dark:border-slate-700/30 dark:text-slate-600'}`}>
                  <Send className="w-4 h-4" strokeWidth={2} />
                  Inquiry
                </button>
                <button 
                  disabled={!isConnected}
                  className={`flex-1 min-w-[140px] px-5 py-3 rounded-full font-semibold text-sm border transition-all flex items-center justify-center gap-2 
                  ${isConnected ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700/80' : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed dark:bg-slate-800/50 dark:border-slate-700/30 dark:text-slate-600'}`}>
                  <Eye className="w-4 h-4" strokeWidth={2} />
                  Catalogue
                </button>
              </div>
            )}

            {/* Tab Navigation */}
            <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700/60">
              {(['about', 'products', 'activity'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-4 px-2 font-bold text-sm uppercase tracking-wide transition-all duration-200 relative ${
                    activeTab === tab
                      ? 'text-slate-900 dark:text-white'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                  style={
                    activeTab === tab
                      ? {
                          color: colors.dark,
                          borderBottom: `2.5px solid ${colors.dark}`,
                        }
                      : { borderBottom: '2.5px solid transparent' }
                  }
                >
                  {tab === 'about' && 'About'}
                  {tab === 'products' && 'Products'}
                  {tab === 'activity' && 'Activity'}
                </button>
              ))}
            </div>

            {/* About Section */}
            {activeTab === 'about' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                {/* Contact Information Card */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-8 dark:bg-slate-800 dark:border-slate-700/60 dark:shadow-none relative overflow-hidden">
                  {!isConnected && (
                    <div className="absolute inset-0 z-10 backdrop-blur-[6px] bg-white/60 dark:bg-slate-900/60 flex flex-col items-center justify-center">
                       <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                         <Lock className="w-6 h-6 text-slate-400" />
                       </div>
                       <span className="text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 px-5 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm transition-transform hover:scale-105">
                         Connect to view contact info
                       </span>
                    </div>
                  )}
                  
                  <h2 className="text-lg font-bold text-slate-900 mb-6 dark:text-white">Contact Information</h2>

                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 ${!isConnected ? 'blur-[4px] opacity-40 select-none' : ''}`}>
                    {profile.email && (
                      <div className="flex items-start gap-4">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 dark:bg-opacity-20"
                          style={{ background: colors.bg }}
                        >
                          <Mail className="w-5 h-5" style={{ color: colors.dark }} strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1 dark:text-slate-400">
                            Email
                          </p>
                          <a href={isConnected ? `mailto:${profile.email}` : '#'} className="text-base font-semibold text-slate-800 hover:text-slate-900 transition-colors break-all dark:text-slate-300 dark:hover:text-white border-b border-transparent hover:border-slate-300">
                            {profile.email}
                          </a>
                        </div>
                      </div>
                    )}

                    {profile.phone && (
                      <div className="flex items-start gap-4">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 dark:bg-opacity-20"
                          style={{ background: colors.bg }}
                        >
                          <Phone className="w-5 h-5" style={{ color: colors.dark }} strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1 dark:text-slate-400">
                            Phone
                          </p>
                          <a href={isConnected ? `tel:${profile.phone}` : '#'} className="text-base font-semibold text-slate-800 hover:text-slate-900 transition-colors dark:text-slate-300 dark:hover:text-white border-b border-transparent hover:border-slate-300">
                            {profile.phone}
                          </a>
                        </div>
                      </div>
                    )}

                    {profile.address && (
                      <div className="flex items-start gap-4 md:col-span-2">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 dark:bg-opacity-20"
                          style={{ background: colors.bg }}
                        >
                          <MapPin className="w-5 h-5" style={{ color: colors.dark }} strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1 dark:text-slate-400">
                            Address
                          </p>
                          <p className="text-base font-semibold text-slate-800 dark:text-slate-300">
                            {profile.address}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Business Details Card */}
                {(profile.gstin || profile.businessCategory) && (
                  <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-8 dark:bg-slate-800 dark:border-slate-700/60 dark:shadow-none relative overflow-hidden">
                    {!isConnected && (
                      <div className="absolute inset-0 z-10 backdrop-blur-[6px] bg-white/60 dark:bg-slate-900/60 flex flex-col items-center justify-center">
                         <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                           <Lock className="w-6 h-6 text-slate-400" />
                         </div>
                         <span className="text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 px-5 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm transition-transform hover:scale-105">
                           Connect to unlock business info
                         </span>
                      </div>
                    )}
                    
                    <h2 className="text-lg font-bold text-slate-900 mb-6 dark:text-white">Business Details</h2>
                    
                    <div className={`space-y-6 ${!isConnected ? 'blur-[4px] opacity-40 select-none' : ''}`}>
                      {profile.businessCategory && (
                        <div className="flex items-start gap-4">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 dark:bg-opacity-20"
                            style={{ background: colors.bg }}
                          >
                            <Package className="w-5 h-5" style={{ color: colors.dark }} strokeWidth={1.5} />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2 dark:text-slate-400">
                              Categories
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {profile.businessCategory.split(',').map((cat, idx) => (
                                <span
                                  key={idx}
                                  className="px-4 py-1.5 rounded-full text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200 dark:bg-slate-700/60 dark:border-slate-600 dark:text-slate-300"
                                >
                                  {cat.trim()}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {profile.gstin && (
                        <>
                          <hr className="border-t border-slate-200 dark:border-slate-700/60" />
                          <div className="flex items-start gap-4">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 dark:bg-opacity-20"
                              style={{ background: colors.bg }}
                            >
                              <FileText className="w-5 h-5" style={{ color: colors.dark }} strokeWidth={1.5} />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1 dark:text-slate-400">
                                GSTIN / Business ID
                              </p>
                              <p className="text-base font-semibold text-slate-800 font-mono dark:text-slate-300">
                                {profile.gstin}
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Certifications / Badges */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-8 dark:bg-slate-800 dark:border-slate-700/60 dark:shadow-none relative overflow-hidden">
                  {!isConnected && (
                    <div className="absolute inset-0 z-10 backdrop-blur-[6px] bg-emerald-50/60 dark:bg-emerald-900/20 flex flex-col items-center justify-center">
                       <span className="text-sm font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-800/40 px-5 py-2.5 rounded-full border border-emerald-200 dark:border-emerald-700/40 shadow-sm flex items-center gap-2">
                         <Shield className="w-4 h-4" /> Connect to view verified status
                       </span>
                    </div>
                  )}
                  
                  <h2 className="text-lg font-bold text-slate-900 mb-6 dark:text-white">Verification & Trust</h2>
                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${!isConnected ? 'blur-[4px] opacity-40 select-none' : ''}`}>
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 dark:bg-emerald-500/20">
                        <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Self-Verified</p>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Identity verified</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50/80 border border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 dark:bg-blue-500/20">
                        <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" strokeWidth={2} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Business Registered</p>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Compliant verified</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Products Section (Placeholder) */}
            {activeTab === 'products' && (
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-12 text-center dark:bg-slate-800 dark:border-slate-700/60 dark:shadow-none relative overflow-hidden">
                {!isConnected && (
                  <div className="absolute inset-0 z-10 backdrop-blur-[6px] bg-white/60 dark:bg-slate-900/60 flex flex-col items-center justify-center">
                     <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                       <Lock className="w-6 h-6 text-slate-400" />
                     </div>
                     <span className="text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 px-5 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm transition-transform hover:scale-105">
                       Connect to view full catalogue
                     </span>
                  </div>
                )}
                <div className={!isConnected ? 'blur-[4px] opacity-40 select-none' : ''}>
                  <Package className="w-12 h-12 text-slate-400 mx-auto mb-4 dark:text-slate-500" strokeWidth={1.5} />
                  <p className="text-base font-semibold text-slate-600 dark:text-slate-400">
                    {stats.productsListed} products listed
                  </p>
                </div>
              </div>
            )}

            {/* Activity Section */}
            {activeTab === 'activity' && (
              <div className="space-y-4 animate-in fade-in duration-300 relative">
                {!isConnected && (
                  <div className="absolute inset-0 z-10 backdrop-blur-[6px] bg-slate-50/60 dark:bg-slate-900/60 flex flex-col items-center pt-10 rounded-2xl">
                     <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center mb-3 border border-slate-200 dark:border-slate-700">
                       <Lock className="w-6 h-6 text-slate-400" />
                     </div>
                     <span className="text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 px-5 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                       Connect to view recent activity
                     </span>
                  </div>
                )}
                
                <div className={`space-y-4 ${!isConnected ? 'blur-[4px] opacity-40 select-none' : ''}`}>
                  {recentActivity.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 flex items-center gap-5 hover:border-slate-300 transition-all cursor-pointer group dark:bg-slate-800 dark:border-slate-700/60 dark:shadow-none dark:hover:bg-slate-700/60"
                    >
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 dark:bg-opacity-20"
                        style={{ background: colors.bg }}
                      >
                        {item.type === 'shipment' && <Package className="w-5 h-5" style={{ color: colors.dark }} strokeWidth={1.5} />}
                        {item.type === 'deal' && <Star className="w-5 h-5" style={{ color: colors.dark }} strokeWidth={1.5} />}
                        {item.type === 'login' && <Eye className="w-5 h-5" style={{ color: colors.dark }} strokeWidth={1.5} />}
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-bold text-slate-900 mb-0.5 group-hover:text-amber-600 transition-colors dark:text-slate-100 dark:group-hover:text-amber-400">{item.title}</p>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">{item.date}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors group-hover:translate-x-1 dark:text-slate-500 dark:group-hover:text-slate-300" strokeWidth={1.5} />
                    </div>
                  ))}
                  {recentActivity.length === 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                      No recent activity yet.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessProfilePage;
