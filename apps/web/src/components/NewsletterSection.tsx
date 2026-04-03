"use client";

import React, { useState } from "react";
import { Send, CheckCircle, Mail } from "lucide-react";

const CompatibleSend = Send as React.ComponentType<{ className?: string }>;
const CompatibleCheckCircle = CheckCircle as React.ComponentType<{ className?: string }>;
const CompatibleMail = Mail as React.ComponentType<{ className?: string }>;

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      // Mock API call - in production this would hit /api/newsletter or similar
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // For now, let's just log it or simulate success
      console.log("Newsletter subscription for:", email);
      
      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-purple-500/5 to-transparent"></div>
      
      <div className="relative z-10 max-w-4xl mx-auto px-4">
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-3xl p-8 sm:p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/10 rounded-2xl mb-6">
            <CompatibleMail className="w-8 h-8 text-purple-400" />
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Stay in the loop
          </h2>
          <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
            Get the latest updates on new voices, API features, and early access to our creator rewards program.
          </p>

          {status === "success" ? (
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
              <div className="flex items-center gap-3 text-green-400 font-semibold text-xl mb-4">
                <CompatibleCheckCircle className="w-6 h-6" />
                You're on the list!
              </div>
              <p className="text-gray-400">
                Check your inbox soon for a welcome message from the VOISSS team.
              </p>
              <button 
                onClick={() => setStatus("idle")}
                className="mt-6 text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
              >
                Subscribe another email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="relative max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 bg-black/50 border border-[#2A2A2A] rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                  disabled={status === "loading"}
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {status === "loading" ? "Joining..." : "Join Waitlist"}
                  <CompatibleSend className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              {status === "error" && (
                <p className="mt-4 text-red-400 text-sm">{errorMessage}</p>
              )}
              <p className="mt-4 text-gray-500 text-xs">
                By subscribing, you agree to our <a href="/privacy" className="underline hover:text-gray-400">Privacy Policy</a>. No spam, ever.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
