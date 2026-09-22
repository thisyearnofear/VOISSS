"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAccount, usePublicClient } from "wagmi";
import { Pause, Play } from "lucide-react";
import { useVoiceMarketplace } from "@/hooks/useVoiceMarketplace";
import { DismissibleRuntimeTracks } from "@/components/payment/RuntimePaymentChips";
import { DashboardBalanceStrip } from "@/components/payment/DashboardBalanceChips";
import {
  useListeningPlayback,
  useListeningRoom,
} from "@/contexts/ListeningRoomContext";
import { Badge, Chip, Disclosure, Notice } from "@/components/ui";

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

function listingTitle(listing: DashboardListing): string {
  return (
    listing.metadata?.title || `${listing.voiceProfile?.tone || "Voice"} Listing`
  );
}

/** Sample audition through the shared Listening Room player. */
function ListingPlayButton({ listing }: { listing: DashboardListing }) {
  const { player } = useListeningRoom();
  const playback = useListeningPlayback();
  if (!listing.sampleUrl) return null;
  const title = listingTitle(listing);
  const track = {
    id: `sample:${listing.id}`,
    url: listing.sampleUrl,
    title,
    subtitle: `${listing.voiceProfile?.language || "en-US"} · ${listing.licenseType}`,
    kind: "sample" as const,
  };
  const isCurrent = playback.track?.id === track.id;
  const playing = isCurrent && playback.status === "playing";
  const loading = isCurrent && playback.status === "loading";
  return (
    <button
      type="button"
      className="lr-play"
      onClick={() => void player.toggle(track)}
      aria-label={
        loading
          ? `Cancel loading ${title}`
          : playing
            ? `Pause ${title}`
            : `Play ${title}`
      }
    >
      {playing || loading ? (
        <Pause className="w-4 h-4" aria-hidden />
      ) : (
        <Play className="w-4 h-4" aria-hidden />
      )}
    </button>
  );
}


function DashboardContent() {
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
      <main id="listening-main">
        <div className="lr-wrap" style={{ paddingBottom: "var(--lr-space-2xl)" }}>
          <header className="lr-discover-head">
            <h1 className="lr-h1" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
              Contributor dashboard
            </h1>
            <p className="lr-lede">
              Manage live Base listings, trust badges, and licensing
              performance.
            </p>
          </header>
          <Notice>
            <p style={{ margin: "0 0 0.75rem" }}>
              Connect the wallet you used to publish voices on Base to manage
              your active listings. Sign-in lives in the top nav.
            </p>
            <Link href="/marketplace" className="lr-btn lr-btn-ghost">
              Open marketplace
            </Link>
          </Notice>
        </div>
      </main>
    );
  }


  return (
    <main id="listening-main">
      <div className="lr-wrap" style={{ paddingBottom: "var(--lr-space-2xl)" }}>
        <nav className="lr-breadcrumb" aria-label="Breadcrumb">
          <Link href="/sell">Sell your voice</Link>
          <span aria-hidden>/</span>
          <span aria-current="page">Dashboard</span>
        </nav>

        <header
          className="lr-discover-head"
          style={{ paddingTop: "var(--lr-space-md)" }}
        >
          <h1
            className="lr-h1"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
          >
            Contributor dashboard
          </h1>
          <p className="lr-lede">
            Manage live Base listings, trust badges, and licensing performance.
          </p>
        </header>

        {error && (
          <Notice tone="error" style={{ marginBottom: "1rem" }}>
            {error}
          </Notice>
        )}

        {statusMessage && (
          <Notice style={{ marginBottom: "1rem" }}>
            <p style={{ margin: 0 }}>{statusMessage}</p>
            {lastTxHash && (
              <p
                style={{
                  margin: "0.25rem 0 0",
                  fontSize: "0.75rem",
                  overflowWrap: "anywhere",
                }}
              >
                Tx: {lastTxHash}
              </p>
            )}
          </Notice>
        )}

        <Notice style={{ marginBottom: "1.5rem" }}>
          <p style={{ margin: 0, fontWeight: 600, color: "var(--lr-ink)" }}>
            Contract upgrade active: repricing and relisting are now supported.
          </p>
          <p style={{ margin: "0.25rem 0 0" }}>
            Active listings can now be repriced onchain, and delisted voice IDs
            can be listed again by the same contributor after redeploying the
            updated contract.
          </p>
        </Notice>

        {/* Tier 0 — how the contributor is doing. */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))",
            gap: "var(--lr-space-md)",
          }}
        >
          <div className="lr-card">
            <div className="lr-label" style={{ marginBottom: "0.25rem" }}>
              Total earnings
            </div>
            <div
              style={{
                fontFamily: "var(--lr-font-display)",
                fontSize: "2rem",
                fontWeight: 800,
              }}
            >
              ${metrics.totalRevenue.toFixed(2)}
            </div>
            <p className="lr-quiet" style={{ margin: "0.25rem 0 0" }}>
              Listed price × completed licenses
            </p>
          </div>
          <div className="lr-card">
            <div className="lr-label" style={{ marginBottom: "0.25rem" }}>
              Active listings
            </div>
            <div
              style={{
                fontFamily: "var(--lr-font-display)",
                fontSize: "2rem",
                fontWeight: 800,
              }}
            >
              {listings.length}
            </div>
            <p className="lr-quiet" style={{ margin: "0.25rem 0 0" }}>
              Live voices discoverable in the marketplace
            </p>
          </div>
          <div className="lr-card">
            <div className="lr-label" style={{ marginBottom: "0.25rem" }}>
              Pending balance
            </div>
            <div
              style={{
                fontFamily: "var(--lr-font-display)",
                fontSize: "2rem",
                fontWeight: 800,
              }}
            >
              ${metrics.pending.toFixed(2)}
            </div>
            <p className="lr-quiet" style={{ margin: "0.25rem 0 0" }}>
              Placeholder until payout accounting is added
            </p>
          </div>
        </div>

        {/* Tier 1 — balances and payment rails stay available but quiet. */}
        <Disclosure
          title="Balances & payment rails"
          variant="section"
          id="payments"
          style={{ marginTop: "var(--lr-space-xl)" }}
        >
          <div
            className="lr-legacy-inset"
            style={{ display: "grid", gap: "1rem" }}
          >
            <DashboardBalanceStrip
              agentRegistryAddress={
                (process.env.NEXT_PUBLIC_AGENT_REGISTRY_CONTRACT as string) ||
                "0xBE857DB4B4bD71a8bf8f50f950eecD7dDe68b85c"
              }
            />
            <DismissibleRuntimeTracks
              agentAddress={address ?? undefined}
              bankrCompact
              dynamicCompact
              storageKey="voisss_runtime_dashboard"
            />
          </div>
        </Disclosure>

        {/* Tier 0 — the listings themselves. */}
        <section style={{ marginTop: "var(--lr-space-xl)" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.75rem",
              marginBottom: "1rem",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--lr-font-display)",
                fontSize: "1.5rem",
                fontWeight: 700,
                margin: 0,
              }}
            >
              Your voice listings
            </h2>
            <Link href="/sell" className="lr-btn lr-btn-primary">
              List new voice
            </Link>
          </div>

          {isLoading ? (
            <Notice>Loading your listings…</Notice>
          ) : listings.length === 0 ? (
            <Notice>
              <p style={{ margin: "0 0 0.75rem" }}>
                No active listings. Publish a recording from the Studio with
                marketplace listing enabled, and it will appear here once the
                transactions land on Base.
              </p>
              <Link href="/sell" className="lr-btn lr-btn-ghost">
                Open studio
              </Link>
            </Notice>
          ) : (
            <div style={{ display: "grid", gap: "var(--lr-space-md)" }}>
              {listings.map((listing) => {
                const isDelisting = listing.pendingAction === "delisting";
                return (
                  <article className="lr-card" key={listing.id}>
                    <div
                      style={{
                        display: "flex",
                        gap: "0.75rem",
                        alignItems: "flex-start",
                      }}
                    >
                      <ListingPlayButton listing={listing} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <strong>{listingTitle(listing)}</strong>
                          {listing.trust && (
                            <Badge>{listing.trust.badge}</Badge>
                          )}
                          {isDelisting && <Badge>Pending delist</Badge>}
                        </div>
                        <p
                          className="lr-quiet"
                          style={{ margin: "0.25rem 0 0" }}
                        >
                          {listing.voiceProfile?.language || "en-US"} ·{" "}
                          {listing.licenseType} · Voice ID #
                          {listing.contractVoiceId}
                        </p>
                        <Disclosure title="Details" variant="inline">
                          <p className="lr-quiet" style={{ marginTop: "0.5rem" }}>
                            {listing.trust?.details ||
                              "Live listing sourced from the marketplace contract."}
                          </p>
                        </Disclosure>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "flex-end",
                        gap: "1rem var(--lr-space-lg)",
                        marginTop: "0.75rem",
                      }}
                    >
                      <div style={{ display: "flex", gap: "var(--lr-space-lg)" }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>
                            $
                            {(
                              parseInt(listing.price || "0", 10) / 1_000_000
                            ).toFixed(2)}
                          </div>
                          <div
                            className="lr-quiet"
                            style={{ margin: 0, fontSize: "0.75rem" }}
                          >
                            Price
                          </div>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700 }}>
                            {listing.stats?.purchases || 0}
                          </div>
                          <div
                            className="lr-quiet"
                            style={{ margin: 0, fontSize: "0.75rem" }}
                          >
                            Sales
                          </div>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700 }}>
                            {listing.stats?.usageCount || 0}
                          </div>
                          <div
                            className="lr-quiet"
                            style={{ margin: 0, fontSize: "0.75rem" }}
                          >
                            Uses
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <label
                          htmlFor={`reprice-${listing.contractVoiceId}`}
                          className="lr-label"
                          style={{ margin: 0 }}
                        >
                          Reprice
                        </label>
                        <input
                          id={`reprice-${listing.contractVoiceId}`}
                          type="number"
                          min="0.01"
                          step="0.01"
                          className="lr-input"
                          style={{ width: "7rem" }}
                          value={draftPrices[listing.contractVoiceId] || ""}
                          onChange={(event) =>
                            setDraftPrices((current) => ({
                              ...current,
                              [listing.contractVoiceId]: event.target.value,
                            }))
                          }
                        />
                        <Chip
                          onClick={() =>
                            handleReprice(listing.contractVoiceId || "0")
                          }
                          disabled={isDelisting}
                        >
                          Update
                        </Chip>
                        <Chip
                          onClick={() =>
                            handleDelist(listing.contractVoiceId || "0")
                          }
                          disabled={isDelisting}
                          style={{ color: "var(--lr-error)" }}
                        >
                          {isDelisting ? "Delisting…" : "Delist"}
                        </Chip>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Tier 1 — aggregate performance. */}
        <Disclosure
          title="License performance"
          variant="section"
          id="performance"
          style={{ marginTop: "var(--lr-space-xl)" }}
        >
          <dl className="lr-specs">
            <div>
              <dt>Total views</dt>
              <dd>{metrics.totalViews}</dd>
            </div>
            <div>
              <dt>Total sales</dt>
              <dd>{metrics.totalSales}</dd>
            </div>
            <div>
              <dt>Active licenses</dt>
              <dd>{metrics.totalSales}</dd>
            </div>
            <div>
              <dt>Total usage</dt>
              <dd>{metrics.totalUsage}</dd>
            </div>
          </dl>
        </Disclosure>
      </div>
    </main>
  );
}

export default function ContributorDashboard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main id="listening-main">
        <div className="lr-wrap" style={{ paddingTop: "4rem" }}>
          Loading dashboard…
        </div>
      </main>
    );
  }

  return <DashboardContent />;
}

