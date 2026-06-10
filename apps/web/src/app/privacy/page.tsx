"use client";

import React from "react";
import { Shield, Mail } from "lucide-react";

const CompatibleShield = Shield as React.ComponentType<{ className?: string }>;
const CompatibleMail = Mail as React.ComponentType<{ className?: string }>;

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="voisss-container py-16 sm:py-24">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/10 rounded-2xl mb-6">
              <CompatibleShield className="w-8 h-8 text-purple-400" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Privacy Policy
            </h1>
            <p className="text-gray-400 text-lg">
              Last updated: June 10, 2026
            </p>
          </div>

          {/* Content */}
          <div className="space-y-10 text-gray-300 leading-relaxed">
            <Section title="1. Information We Collect">
              <p>
                We collect information you provide directly when using VOISSS, including voice recordings, 
                account details (wallet addresses), and communications with our support team.
              </p>
              <p className="mt-4">
                When you record or upload voice samples, we process and store these recordings to create 
                voice fingerprints and enable licensing through our marketplace. We also collect usage data 
                such as API call volumes, character counts, and payment transactions to operate and improve 
                our service.
              </p>
            </Section>

            <Section title="2. How We Use Your Information">
              <p>
                Your information is used to:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-gray-400">
                <li>Process voice recordings and generate voice fingerprints for blockchain provenance</li>
                <li>Facilitate voice licensing between contributors and AI agents</li>
                <li>Process payments and distribute royalties via smart contracts</li>
                <li>Provide customer support and improve our platform</li>
                <li>Send occasional product updates (with your consent)</li>
              </ul>
            </Section>

            <Section title="3. Blockchain & On-Chain Data">
              <p>
                VOISSS uses blockchain technology (Base network) to record voice fingerprints, 
                licensing agreements, and payment transactions. Data written to the blockchain is 
                public, immutable, and cannot be deleted. We only store cryptographic hashes and 
                metadata on-chain — raw audio files are stored on IPFS with access controls.
              </p>
              <p className="mt-4">
                Your wallet address is used as your primary identifier on the platform. Transactions 
                you authorize (licensing, royalty payments) will be visible on the public blockchain.
              </p>
            </Section>

            <Section title="4. Data Storage & Security">
              <p>
                Voice recordings are encrypted at rest and in transit. We use IPFS (via Pinata) for 
                decentralized storage with redundancy. Access to raw audio is restricted to authorized 
                licensees and platform operators.
              </p>
              <p className="mt-4">
                We implement industry-standard security measures including rate limiting, agent 
                verification, and request signing to protect against unauthorized access.
              </p>
            </Section>

            <Section title="5. Data Retention">
              <p>
                We retain your account data and voice recordings for as long as your account is active. 
                If you delete your account, we will remove or anonymize your personal data within 30 days, 
                except where retention is required for legal or compliance purposes.
              </p>
              <p className="mt-4">
                Blockchain records (licensing transactions, voice fingerprints) cannot be deleted due 
                to the immutable nature of the technology. These contain only hashed or anonymized data.
              </p>
            </Section>

            <Section title="6. Third-Party Services">
              <p>
                VOISSS integrates with the following third-party services:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-gray-400">
                <li><strong>ElevenLabs</strong> — Text-to-speech voice generation</li>
                <li><strong>Pinata</strong> — IPFS file storage for audio recordings</li>
                <li><strong>Base Network</strong> — Blockchain for payments and provenance</li>
                <li><strong>Arkiv Network</strong> — Decentralized data storage for agent memory</li>
              </ul>
              <p className="mt-4">
                Each service operates under its own privacy policy. We encourage you to review their 
                policies for more information.
              </p>
            </Section>

            <Section title="7. Your Rights">
              <p>
                Depending on your jurisdiction, you may have the right to:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2 text-gray-400">
                <li>Access the personal data we hold about you</li>
                <li>Request correction or deletion of your data</li>
                <li>Object to or restrict processing of your data</li>
                <li>Request a copy of your data in a portable format</li>
                <li>Withdraw consent at any time</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, please contact us using the information below.
              </p>
            </Section>

            <Section title="8. Contact">
              <p>
                If you have questions about this Privacy Policy or our data practices, please reach out:
              </p>
              <div className="mt-4 flex flex-col sm:flex-row gap-4">
                <a
                  href="mailto:privacy@voisss.netlify.app"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-gray-300 hover:border-purple-500/50 transition-all"
                >
                  <CompatibleMail className="w-4 h-4 text-purple-400" />
                  privacy@voisss.netlify.app
                </a>
              </div>
            </Section>

            <Section title="9. Changes to This Policy">
              <p>
                We may update this Privacy Policy from time to time. We will notify you of material 
                changes by posting the updated policy on this page and, where appropriate, through 
                in-app notifications or email.
              </p>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
      <div className="text-gray-400 leading-relaxed">{children}</div>
    </section>
  );
}
