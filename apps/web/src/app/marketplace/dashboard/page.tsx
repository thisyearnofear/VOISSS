"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";

function DashboardContent() {
  const { address, isConnected } = useAccount();
  const [listings, setListings] = useState<any[]>([]);
  const [earnings, setEarnings] = useState({
    total: 0,
    thisMonth: 0,
    pending: 0
  });

  useEffect(() => {
    if (isConnected && address) {
      fetchDashboardData();
    }
  }, [isConnected, address]);
  
  const fetchDashboardData = async () => {
    // TODO: Fetch contributor's listings and earnings
    // For MVP, show placeholder
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center p-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl max-w-md w-full">
          <h2 className="text-2xl font-bold text-white mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-zinc-400 mb-8">
            Connect your wallet to access your contributor dashboard and manage your voice licenses.
          </p>
          <button className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-500 transition-colors">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/30 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Contributor Dashboard
          </h1>
          <p className="text-lg text-zinc-400">
            Manage your voice listings and track your licensing revenue
          </p>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Earnings Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <div className="text-sm font-medium text-zinc-500 mb-2 uppercase tracking-wider">Total Earnings</div>
            <div className="text-4xl font-bold text-white">
              ${earnings.total.toFixed(2)}
            </div>
            <div className="mt-4 text-xs text-green-500 font-medium">↑ 0% from last month</div>
          </div>
          
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <div className="text-sm font-medium text-zinc-500 mb-2 uppercase tracking-wider">This Month</div>
            <div className="text-4xl font-bold text-white">
              ${earnings.thisMonth.toFixed(2)}
            </div>
            <div className="mt-4 text-xs text-zinc-500">Projected: $0.00</div>
          </div>
          
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <div className="text-sm font-medium text-zinc-500 mb-2 uppercase tracking-wider">Pending Balance</div>
            <div className="text-4xl font-bold text-white">
              ${earnings.pending.toFixed(2)}
            </div>
            <div className="mt-4 text-xs text-zinc-500">Next payout: Automatic</div>
          </div>
        </div>
        
        {/* Listings Section */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden mb-12">
          <div className="p-8 border-b border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Your Voice Listings
              </h2>
              <p className="text-zinc-500 mt-1">Voices currently available for licensing</p>
            </div>
            <button className="bg-white text-black px-6 py-2.5 rounded-full font-bold hover:bg-zinc-200 transition-colors inline-flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              List New Voice
            </button>
          </div>
          
          <div className="p-8">
            {listings.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No active listings</h3>
                <p className="text-zinc-500 max-w-sm mx-auto mb-8">
                  You haven't listed any voices yet. Start earning by listing your voice recordings for AI agents to license.
                </p>
                <button className="text-blue-500 font-bold hover:underline">
                  View Licensing Tutorial →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {listings.map((listing) => (
                  <div 
                    key={listing.id}
                    className="bg-zinc-800/30 border border-zinc-800 rounded-xl p-6 flex items-center justify-between hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center text-blue-500 font-bold">
                        {listing.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{listing.name}</h4>
                        <p className="text-sm text-zinc-500">{listing.type} • {listing.status}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold">${listing.price}/min</div>
                      <div className="text-xs text-zinc-500">{listing.sales} licenses sold</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Performance & Analytics */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            License Performance
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-1">
              <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Views</div>
              <div className="text-3xl font-bold text-white">0</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Sales</div>
              <div className="text-3xl font-bold text-white">0</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Active Licenses</div>
              <div className="text-3xl font-bold text-white">0</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Usage (min)</div>
              <div className="text-3xl font-bold text-white">0</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContributorDashboard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <DashboardContent />;
}
