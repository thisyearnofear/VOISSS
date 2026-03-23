"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, usePublicClient } from "wagmi";
import { useVoiceMarketplace } from "@/hooks/useVoiceMarketplace";

type DashboardListing = {
  id: string;
  contractVoiceId: string;
  contributorAddress: string;
  price: string;
  licenseType: "exclusive" | "non-exclusive";
  voiceProfile?: {
    tone?: string;
    language?: string;
  };
  metadata?: {
    title?: string;
  };
  stats?: {
    views?: number;
    purchases?: number;
    usageCount?: number;
  };
  trust?: {
    badge: string;
    status: "verified" | "review" | "provenance";
    details: string;
  };
  sampleUrl?: string;
  status?: string;
  pendingAction?: "delisting";
};

function DashboardContent() {
  const router = useRouter();
  const publicClient = usePublicClient();
  const { address, isConnected } = useAccount();
  const { delistVoice, updateListingPrice } = useVoiceMarketplace();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [listings, setListings] = useState<DashboardListing[]>([]);
  const [draftPrices, setDraftPrices] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isConnected && address) {
      void fetchDashboardData(address);
    } else {
      setListings([]);
    }
  }, [isConnected, address]);

  const fetchDashboardData = async (contributor: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/marketplace/voices?contributor=${contributor}`,
        { cache: "no-store" }
      );
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch listings");
      }

      const nextListings = (data.data.voices || []) as DashboardListing[];
      setListings(nextListings);
      setDraftPrices((current) => {
        const updated = { ...current };
        for (const listing of nextListings) {
          updated[listing.contractVoiceId] = (
            parseInt(listing.price || "0", 10) / 1_000_000
          ).toFixed(2);
        }
        return updated;
      });
    } catch (fetchError) {
      console.error("Failed to fetch contributor dashboard data:", fetchError);
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to fetch contributor dashboard data."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelist = async (voiceId: string) => {
    if (!address) {
      return;
    }

    const previousListings = listings;

    setError(null);
    setStatusMessage("Submitting delist transaction...");
    setLastTxHash(null);
    setListings((current) =>
      current.map((listing) =>
        listing.contractVoiceId === voiceId
          ? { ...listing, pendingAction: "delisting", status: "pending-delist" }
          : listing
      )
    );

    try {
      const txHash = await delistVoice(BigInt(voiceId));
      setLastTxHash(txHash);
      setStatusMessage("Delist submitted. Waiting for Base confirmation...");

      if (!publicClient) {
        throw new Error("Public client unavailable for receipt tracking.");
      }

      await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });

      setListings((current) =>
        current.filter((listing) => listing.contractVoiceId !== voiceId)
      );
      setStatusMessage("Listing removed from the marketplace.");
      await fetchDashboardData(address);
    } catch (delistError) {
      console.error("Failed to delist voice:", delistError);
      setListings(previousListings);
      setStatusMessage(null);
      setError(
        delistError instanceof Error
          ? delistError.message
          : "Failed to delist voice."
      );
    }
  };

  const handleReprice = async (voiceId: string) => {
    if (!address || !publicClient) {
      return;
    }

    const draftPrice = draftPrices[voiceId];
    const parsed = Number(draftPrice);
    if (!draftPrice || Number.isNaN(parsed) || parsed <= 0) {
      setError("Enter a valid price greater than 0.");
      return;
    }

    const previousListings = listings;
    const nextPriceWei = Math.round(parsed * 1_000_000).toString();

    setError(null);
    setStatusMessage("Submitting price update...");
    setLastTxHash(null);
    setListings((current) =>
      current.map((listing) =>
        listing.contractVoiceId === voiceId
          ? { ...listing, price: nextPriceWei }
          : listing
      )
    );

    try {
      const txHash = await updateListingPrice(BigInt(voiceId), draftPrice);
      setLastTxHash(txHash);
      setStatusMessage("Price update submitted. Waiting for Base confirmation...");

      await publicClient.waitForTransactionReceipt({ hash: txHash });

      setStatusMessage("Listing price updated.");
      await fetchDashboardData(address);
    } catch (repriceError) {
      console.error("Failed to update listing price:", repriceError);
      setListings(previousListings);
      setStatusMessage(null);
      setError(
        repriceError instanceof Error
          ? repriceError.message
          : "Failed to update listing price."
      );
    }
  };

  const metrics = useMemo(() => {
    const totalRevenue = listings.reduce(
      (sum, listing) =>
        sum +
        ((parseInt(listing.price || "0", 10) / 1_000_000) *
          (listing.stats?.purchases || 0)),
      0
    );
    const totalSales = listings.reduce(
      (sum, listing) => sum + (listing.stats?.purchases || 0),
      0
    );
    const totalViews = listings.reduce(
      (sum, listing) => sum + (listing.stats?.views || 0),
      0
    );
    const totalUsage = listings.reduce(
      (sum, listing) => sum + (listing.stats?.usageCount || 0),
      0
    );

    return {
      totalRevenue,
      totalSales,
      totalViews,
      totalUsage,
      pending: totalRevenue * 0.3,
    };
  }, [listings]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center p-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl max-w-md w-full">
          <h2 className="text-2xl font-bold text-white mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-zinc-400 mb-8">
            Connect the wallet you used to publish voices on Base to manage your
            active listings.
          </p>
          <button
            onClick={() => router.push("/marketplace")}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-500 transition-colors"
          >
            Open Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="border-b border-zinc-800 bg-zinc-900/30 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Contributor Dashboard
          </h1>
          <p className="text-lg text-zinc-400">
            Manage live Base listings, trust badges, and licensing performance
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {statusMessage && (
          <div className="mb-6 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
            <div>{statusMessage}</div>
            {lastTxHash && (
              <div className="mt-1 text-xs text-blue-300/80 break-all">
                Tx: {lastTxHash}
              </div>
            )}
          </div>
        )}

        <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <div className="text-sm font-semibold text-emerald-200">
            Contract upgrade active: repricing and relisting are now supported.
          </div>
          <div className="mt-1 text-sm text-emerald-100/80">
            Active listings can now be repriced onchain, and delisted voice IDs
            can be listed again by the same contributor after redeploying the updated contract.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <div className="text-sm font-medium text-zinc-500 mb-2 uppercase tracking-wider">
              Total Earnings
            </div>
            <div className="text-4xl font-bold text-white">
              ${metrics.totalRevenue.toFixed(2)}
            </div>
            <div className="mt-4 text-xs text-zinc-500">
              Derived from listed price x completed licenses
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <div className="text-sm font-medium text-zinc-500 mb-2 uppercase tracking-wider">
              Active Listings
            </div>
            <div className="text-4xl font-bold text-white">{listings.length}</div>
            <div className="mt-4 text-xs text-zinc-500">
              Live voices currently discoverable in marketplace
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <div className="text-sm font-medium text-zinc-500 mb-2 uppercase tracking-wider">
              Pending Balance
            </div>
            <div className="text-4xl font-bold text-white">
              ${metrics.pending.toFixed(2)}
            </div>
            <div className="mt-4 text-xs text-zinc-500">
              Placeholder until payout accounting is added
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden mb-12">
          <div className="p-8 border-b border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Your Voice Listings
              </h2>
              <p className="text-zinc-500 mt-1">
                Listings published from the Studio and resolved from live chain
                state
              </p>
            </div>
            <button
              onClick={() => router.push("/studio")}
              className="bg-white text-black px-6 py-2.5 rounded-full font-bold hover:bg-zinc-200 transition-colors inline-flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              List New Voice
            </button>
          </div>

          <div className="p-8">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4">
                {[...Array(3)].map((_, index) => (
                  <div
                    key={index}
                    className="h-32 rounded-xl border border-zinc-800 bg-zinc-950/40 animate-pulse"
                  />
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-zinc-600"
                  >
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  No active listings
                </h3>
                <p className="text-zinc-500 max-w-sm mx-auto mb-8">
                  Publish a recording from the Studio with marketplace listing
                  enabled, and it will appear here automatically once the
                  transactions land on Base.
                </p>
                <button
                  onClick={() => router.push("/studio")}
                  className="text-blue-500 font-bold hover:underline"
                >
                  Open Studio →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {listings.map((listing) => {
                  const isDelisting = listing.pendingAction === "delisting";

                  return (
                    <div
                      key={listing.id}
                      className={`bg-zinc-800/30 border rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-colors ${
                        isDelisting
                          ? "border-blue-500/30 bg-blue-500/5"
                          : "border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center text-blue-400 font-bold">
                          {(listing.metadata?.title ||
                            listing.voiceProfile?.tone ||
                            "V")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h4 className="font-bold text-white">
                              {listing.metadata?.title ||
                                `${listing.voiceProfile?.tone || "Voice"} Listing`}
                            </h4>
                            {listing.trust && (
                              <span
                                className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wider ${
                                  listing.trust.status === "verified"
                                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"
                                    : listing.trust.status === "review"
                                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/20"
                                    : "bg-cyan-500/15 text-cyan-300 border border-cyan-500/20"
                                }`}
                              >
                                {listing.trust.badge}
                              </span>
                            )}
                            {isDelisting && (
                              <span className="rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-500/20">
                                Pending Delist
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-zinc-500">
                            {listing.voiceProfile?.language || "en-US"} •{" "}
                            {listing.licenseType} • Voice ID #
                            {listing.contractVoiceId}
                          </p>
                          <p className="mt-2 text-sm text-zinc-400 max-w-2xl">
                            {listing.trust?.details ||
                              "Live listing sourced from the marketplace contract."}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-lg font-bold text-white">
                              $
                              {(
                                parseInt(listing.price || "0", 10) / 1_000_000
                              ).toFixed(2)}
                            </div>
                            <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                              Price
                            </div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-white">
                              {listing.stats?.purchases || 0}
                            </div>
                            <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                              Sales
                            </div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-white">
                              {listing.stats?.usageCount || 0}
                            </div>
                            <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                              Uses
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 min-w-[170px]">
                          <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-2">
                            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">
                              Reprice
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={draftPrices[listing.contractVoiceId] || ""}
                                onChange={(event) =>
                                  setDraftPrices((current) => ({
                                    ...current,
                                    [listing.contractVoiceId]: event.target.value,
                                  }))
                                }
                                className="w-full rounded-md border border-zinc-700 bg-black px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                              />
                              <button
                                onClick={() =>
                                  handleReprice(listing.contractVoiceId || "0")
                                }
                                disabled={isDelisting}
                                className="rounded-md border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-sm font-semibold text-blue-300 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                              >
                                Update
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              handleDelist(listing.contractVoiceId || "0")
                            }
                            disabled={isDelisting}
                            className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                          >
                            {isDelisting ? "Delisting..." : "Delist"}
                          </button>
                          {listing.sampleUrl && (
                            <a
                              href={listing.sampleUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-300 hover:border-zinc-600 transition-colors text-center"
                            >
                              Open Sample
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-blue-500"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
            License Performance
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-1">
              <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Total Views
              </div>
              <div className="text-3xl font-bold text-white">
                {metrics.totalViews}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Total Sales
              </div>
              <div className="text-3xl font-bold text-white">
                {metrics.totalSales}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Active Licenses
              </div>
              <div className="text-3xl font-bold text-white">
                {metrics.totalSales}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Total Usage
              </div>
              <div className="text-3xl font-bold text-white">
                {metrics.totalUsage}
              </div>
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
