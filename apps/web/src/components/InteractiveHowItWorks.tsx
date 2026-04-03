"use client";

import React, { useState } from "react";
import { Mic, Search, CreditCard, ChevronRight } from "lucide-react";

const steps = [
  {
    title: "Contributors Record & List",
    description: "Voice artists and contributors use our Recording Studio to capture high-quality voice samples. These are processed and indexed with unique voice fingerprints.",
    icon: Mic,
    color: "purple",
    details: [
      "Secure recording studio directly in the browser",
      "Automatic voice fingerprinting for blockchain provenance",
      "Set your own licensing terms and royalty rates",
      "Proof-of-consent built into the submission process"
    ]
  },
  {
    title: "AI Agents Browse & License",
    description: "Developers and AI agents browse the marketplace to find the perfect voice. They can license it instantly using x402 payments on the Base network.",
    icon: Search,
    color: "blue",
    details: [
      "Advanced search by tone, accent, age, and style",
      "One-click licensing via smart contracts",
      "Gasless transactions for a seamless experience",
      "Integration-ready API for automated licensing"
    ]
  },
  {
    title: "Automatic Royalty Payments",
    description: "Every time a voice is used, royalties are automatically distributed via smart contracts. 70% of revenue goes directly to the contributor.",
    icon: CreditCard,
    color: "green",
    details: [
      "Real-time payment tracking on the dashboard",
      "Transparent revenue sharing via blockchain",
      "Instant withdrawals on the Base network",
      "Passive income stream for every AI agent license"
    ]
  }
];

const CompatibleChevronRight = ChevronRight as React.ComponentType<{ className?: string }>;

export default function InteractiveHowItWorks() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section className="py-24 max-w-6xl mx-auto px-4">
      <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-16">
        How VOISSS Works
      </h2>

      <div className="grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Side: Step Selection */}
        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = activeStep === index;
            
            return (
              <button
                key={index}
                onClick={() => setActiveStep(index)}
                className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 flex items-start gap-4 ${
                  isActive 
                    ? `bg-[#1A1A1A] border-${step.color}-500/50 shadow-lg shadow-${step.color}-500/10` 
                    : "bg-transparent border-[#2A2A2A] hover:border-gray-700"
                }`}
              >
                <div className={`mt-1 p-2 rounded-lg ${
                  isActive ? `bg-${step.color}-500 text-white` : "bg-gray-800 text-gray-400"
                }`}>
                  <Icon size={24} />
                </div>
                <div className="flex-1">
                  <h3 className={`text-xl font-bold mb-2 ${isActive ? "text-white" : "text-gray-400"}`}>
                    {step.title}
                  </h3>
                  <p className={`text-sm leading-relaxed ${isActive ? "text-gray-300" : "text-gray-500"}`}>
                    {step.description}
                  </p>
                </div>
                {isActive && (
                  <div className={`text-${step.color}-400 mt-1`}>
                    <CompatibleChevronRight className="w-5 h-5 animate-pulse" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Side: Progressive Disclosure (Details) */}
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-3xl p-8 sm:p-12 min-h-[400px] flex flex-col justify-center animate-in fade-in slide-in-from-right-8 duration-500" key={activeStep}>
          <div className={`w-20 h-20 rounded-2xl bg-${steps[activeStep].color}-500/10 flex items-center justify-center mb-8`}>
            {React.createElement(steps[activeStep].icon, { 
              className: `w-10 h-10 text-${steps[activeStep].color}-400` 
            })}
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-6">
            Detailed Process: {steps[activeStep].title}
          </h3>
          
          <ul className="space-y-4">
            {steps[activeStep].details.map((detail, idx) => (
              <li key={idx} className="flex items-start gap-3 text-gray-300">
                <div className={`mt-1.5 w-1.5 h-1.5 rounded-full bg-${steps[activeStep].color}-500 flex-shrink-0`}></div>
                <span>{detail}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10 pt-8 border-t border-[#2A2A2A]">
            <a 
              href={activeStep === 0 ? "/studio" : "/marketplace"} 
              className={`inline-flex items-center gap-2 text-${steps[activeStep].color}-400 font-bold hover:underline`}
            >
              {activeStep === 0 ? "Open Recording Studio" : "Browse the Marketplace"}
              <CompatibleChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
