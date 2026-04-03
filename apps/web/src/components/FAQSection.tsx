"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "How does voice licensing work?",
    answer: "When you license a voice, a smart contract is executed on the Base network. This provides you with a cryptographically verifiable right to use that voice for your AI agent according to the specific terms set by the contributor (e.g., duration, commercial use)."
  },
  {
    question: "Is the voice recording secure?",
    answer: "Yes. All recordings are encrypted and processed to create a unique voice fingerprint. We use blockchain to ensure provenance, meaning the origin and ownership of every voice is transparent and immutable."
  },
  {
    question: "What are x402 payments?",
    answer: "x402 is a specialized payment protocol for AI agents. It allows for ultra-low latency, micro-transactions, and automated billing, making it perfect for AI-to-AI commerce like voice licensing."
  },
  {
    question: "How much can I earn as a contributor?",
    answer: "Contributors receive 70% of every licensing fee paid for their voice. Your earnings depend on the popularity of your voice and the rates you set. All payments are distributed instantly via smart contracts."
  }
];

const CompatibleChevronDown = ChevronDown as React.ComponentType<{ className?: string }>;

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 max-w-3xl mx-auto px-4">
      <h2 className="text-3xl font-bold text-white text-center mb-12">
        Frequently Asked Questions
      </h2>
      
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div 
            key={index}
            className="border border-[#2A2A2A] rounded-2xl overflow-hidden bg-[#0F0F0F] transition-all hover:border-gray-700"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full flex items-center justify-between p-6 text-left"
            >
              <span className="text-lg font-semibold text-white">{faq.question}</span>
              <CompatibleChevronDown 
                className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                  openIndex === index ? "rotate-180" : ""
                }`} 
              />
            </button>
            
            <div 
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                openIndex === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="p-6 pt-0 text-gray-400 leading-relaxed border-t border-[#2A2A2A]/50">
                {faq.answer}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
