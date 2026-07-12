"use client";

import React, { useState } from "react";
import { Mic, Search, CreditCard, ChevronRight } from "lucide-react";

const steps = [
  {
    title: "Creators record & list",
    description: "Record your voice in the browser, set your price, and list it on the marketplace. One recording, ongoing income.",
    icon: Mic,
    color: "purple" as const,
    details: [
      "In-browser recording studio — no extra software",
      "Set licensing terms and per-character pricing",
      "Proof-of-consent built into every submission",
      "Your voice fingerprint proves authenticity on-chain",
    ],
    cta: "Open Recording Studio",
    ctaHref: "/studio",
  },
  {
    title: "Agents find & license voices",
    description: "Browse by tone, accent, and style. License instantly with pay-per-character pricing — no subscriptions.",
    icon: Search,
    color: "blue" as const,
    details: [
      "Search by tone, accent, age, and style",
      "Try any voice free in the demo — no wallet",
      "License via API with micropayments on Base",
      "Integration-ready for agents and automations",
    ],
    cta: "Try the free demo",
    ctaHref: "/demo",
  },
  {
    title: "Creators get paid automatically",
    description: "Every time an AI agent speaks with a licensed voice, royalties flow to the contributor — 70% to creators.",
    icon: CreditCard,
    color: "green" as const,
    details: [
      "Real-time earnings on your dashboard",
      "Transparent revenue splits via smart contracts",
      "Withdraw on Base when you're ready",
      "Passive income from every agent license",
    ],
    cta: "Browse the marketplace",
    ctaHref: "/marketplace",
  },
];

type StepColor = "purple" | "blue" | "green";

const colorStyles: Record<StepColor, {
  borderActive: string;
  shadowActive: string;
  iconBg: string;
  iconText: string;
  chevronText: string;
  detailBg: string;
  detailIcon: string;
  dotBg: string;
  linkText: string;
}> = {
  purple: {
    borderActive: "border-purple-500/50",
    shadowActive: "shadow-purple-500/10",
    iconBg: "bg-purple-500",
    iconText: "text-purple-400",
    chevronText: "text-purple-400",
    detailBg: "bg-purple-500/10",
    detailIcon: "text-purple-400",
    dotBg: "bg-purple-500",
    linkText: "text-purple-400",
  },
  blue: {
    borderActive: "border-blue-500/50",
    shadowActive: "shadow-blue-500/10",
    iconBg: "bg-blue-500",
    iconText: "text-blue-400",
    chevronText: "text-blue-400",
    detailBg: "bg-blue-500/10",
    detailIcon: "text-blue-400",
    dotBg: "bg-blue-500",
    linkText: "text-blue-400",
  },
  green: {
    borderActive: "border-green-500/50",
    shadowActive: "shadow-green-500/10",
    iconBg: "bg-green-500",
    iconText: "text-green-400",
    chevronText: "text-green-400",
    detailBg: "bg-green-500/10",
    detailIcon: "text-green-400",
    dotBg: "bg-green-500",
    linkText: "text-green-400",
  },
};

const CompatibleChevronRight = ChevronRight as React.ComponentType<{ className?: string }>;

export default function InteractiveHowItWorks() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section className="py-24 max-w-6xl mx-auto px-4">
      <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-4">
        How VOISSS Works
      </h2>
      <p className="text-center text-gray-500 text-sm mb-16 max-w-xl mx-auto">
        Real human voices, licensed per character. Blockchain settlement on Base powers provenance and payouts behind the scenes.
      </p>

      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = activeStep === index;
            const cs = colorStyles[step.color];

            return (
              <button
                key={index}
                onClick={() => setActiveStep(index)}
                className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 flex items-start gap-4 ${
                  isActive
                    ? `bg-[#1A1A1A] ${cs.borderActive} shadow-lg ${cs.shadowActive}`
                    : "bg-transparent border-[#2A2A2A] hover:border-gray-700"
                }`}
              >
                <div className={`mt-1 p-2 rounded-lg ${
                  isActive ? `${cs.iconBg} text-white` : "bg-gray-800 text-gray-400"
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
                  <div className={`${cs.chevronText} mt-1`}>
                    <CompatibleChevronRight className="w-5 h-5 animate-pulse" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="bg-[#111111] border border-[#2A2A2A] rounded-3xl p-8 sm:p-12 min-h-[400px] flex flex-col justify-center animate-in fade-in slide-in-from-right-8 duration-500" key={activeStep}>
          <div className={`w-20 h-20 rounded-2xl ${colorStyles[steps[activeStep].color].detailBg} flex items-center justify-center mb-8`}>
            {React.createElement(steps[activeStep].icon, {
              className: `w-10 h-10 ${colorStyles[steps[activeStep].color].detailIcon}`,
            })}
          </div>

          <h3 className="text-2xl font-bold text-white mb-6">
            {steps[activeStep].title}
          </h3>

          <ul className="space-y-4">
            {steps[activeStep].details.map((detail, idx) => (
              <li key={idx} className="flex items-start gap-3 text-gray-300">
                <div className={`mt-1.5 w-1.5 h-1.5 rounded-full ${colorStyles[steps[activeStep].color].dotBg} flex-shrink-0`}></div>
                <span>{detail}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10 pt-8 border-t border-[#2A2A2A]">
            <a
              href={steps[activeStep].ctaHref}
              className={`inline-flex items-center gap-2 ${colorStyles[steps[activeStep].color].linkText} font-bold hover:underline`}
            >
              {steps[activeStep].cta}
              <CompatibleChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
