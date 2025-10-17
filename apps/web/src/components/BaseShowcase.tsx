"use client";

import React from "react";
import { useBaseAccount } from "../hooks/useBaseAccount";
import SpendPermissionPanel from "./SpendPermissionPanel";

export default function BaseShowcase() {
  const { isConnected, universalAddress, subAccount, status, connect } = useBaseAccount();

  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
          Powered by Base Chain
        </h2>
        <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
          Experience gasless voice recording with Base Sub Accounts. No wallet popups, 
          no gas fees, just seamless blockchain integration.
        </p>

        {/* Connection Status Card */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8 mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className={`w-3 h-3 rounded-full mr-3 ${
              isConnected ? 'bg-green-500' : 'bg-gray-500'
            }`}></div>
            <span className="text-lg font-medium text-white">
              {isConnected ? 'Connected to Base' : 'Ready to Connect'}
            </span>
          </div>

          {isConnected ? (
            <div className="space-y-3 text-sm text-gray-300">
              <div>
                <span className="text-gray-400">Universal Account:</span>
                <br />
                <code className="text-blue-400">{universalAddress}</code>
              </div>
              {subAccount && (
                <div>
                  <span className="text-gray-400">Sub Account:</span>
                  <br />
                  <code className="text-green-400">{subAccount.address}</code>
                </div>
              )}
              <div className="text-green-400 font-medium">
                ✅ Gasless transactions enabled
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">
                Connect your Base Account to enable gasless voice recording
              </p>
              <button
                onClick={connect}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Connect Base Account
              </button>
            </div>
          )}

          <div className="mt-4 text-xs text-gray-500">
            Status: {status}
          </div>
        </div>

        {/* Spend Permission Settings */}
        {isConnected && (
          <SpendPermissionPanel />
        )}

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Gasless Transactions</h3>
            <p className="text-gray-400 text-sm">
              No wallet popups after initial setup. Sub Accounts handle everything seamlessly.
            </p>
          </div>

          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Full IPFS Support</h3>
            <p className="text-gray-400 text-sm">
              Complete IPFS hashes stored on-chain. No truncation, no data loss.
            </p>
          </div>

          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Instant Recording</h3>
            <p className="text-gray-400 text-sm">
              Record and save instantly. No waiting for blockchain confirmations.
            </p>
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 text-left">
          <h3 className="text-lg font-semibold text-white mb-4">Technical Architecture</h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="text-white font-medium mb-2">Base Chain Integration</h4>
              <ul className="text-gray-400 space-y-1">
                <li>• Sub Accounts with Auto Spend Permissions</li>
                <li>• Gasless transaction execution</li>
                <li>• Native string support for IPFS hashes</li>
                <li>• Gas-optimized smart contracts</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-2">Storage & AI</h4>
              <ul className="text-gray-400 space-y-1">
                <li>• IPFS decentralized storage</li>
                <li>• ElevenLabs voice transformation</li>
                <li>• Multi-language dubbing support</li>
                <li>• Cross-platform synchronization</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-12">
          <a
            href="/studio"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
          >
            Try Gasless Recording
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}