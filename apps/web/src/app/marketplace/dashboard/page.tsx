"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";

export default function ContributorDashboard() {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600 mb-6">
            Connect your wallet to access your contributor dashboard
          </p>
          <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Contributor Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Manage your voice listings and track earnings
          </p>
        </div>
      </div>
      
      {/* Earnings Overview */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Total Earnings</div>
            <div className="text-3xl font-bold text-gray-900">
              ${earnings.total.toFixed(2)}
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">This Month</div>
            <div className="text-3xl font-bold text-gray-900">
              ${earnings.thisMonth.toFixed(2)}
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-sm text-gray-600 mb-1">Pending</div>
            <div className="text-3xl font-bold text-gray-900">
              ${earnings.pending.toFixed(2)}
            </div>
          </div>
        </div>
        
        {/* Listings */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Your Voice Listings
              </h2>
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                + List New Voice
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {listings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">
                  You haven't listed any voices yet
                </p>
                <p className="text-gray-500 text-sm mb-6">
                  Start earning by listing your voice recordings for AI agents to license
                </p>
                <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                  List Your First Voice
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {listings.map((listing) => (
                  <div 
                    key={listing.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    {/* Listing details */}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Performance
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600">Total Views</div>
              <div className="text-2xl font-bold text-gray-900">0</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Sales</div>
              <div className="text-2xl font-bold text-gray-900">0</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Active Licenses</div>
              <div className="text-2xl font-bold text-gray-900">0</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Usage</div>
              <div className="text-2xl font-bold text-gray-900">0</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
