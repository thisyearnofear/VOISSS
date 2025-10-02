"use client";

import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
  category: 'getting-started' | 'recording' | 'blockchain' | 'troubleshooting';
}

const faqData: FAQItem[] = [
  {
    question: "What is VOISSS?",
    answer: "VOISSS is a decentralized voice recording platform built on Starknet that allows you to record, transform your voice with AI, and store recordings securely on the blockchain using IPFS.",
    category: "getting-started"
  },
  {
    question: "Do I need a wallet to use VOISSS?",
    answer: "No! You can use VOISSS for free without a wallet. However, connecting a Starknet wallet (ArgentX or Braavos) unlocks premium features like unlimited AI transformations, blockchain storage, and SocialFi missions.",
    category: "getting-started"
  },
  {
    question: "How do I start recording?",
    answer: "Simply click the 'Start Recording' button on the homepage, allow microphone access when prompted, and begin speaking. You can pause/resume and stop when finished.",
    category: "recording"
  },
  {
    question: "What voice transformation options are available?",
    answer: "We offer multiple AI voice models powered by ElevenLabs, including different personalities, accents, and styles. Free users get 1 transformation per session, while premium users get unlimited access.",
    category: "recording"
  },
  {
    question: "Can I dub my recordings into other languages?",
    answer: "Yes! VOISSS supports dubbing into 29+ languages with automatic source language detection and native accent preservation.",
    category: "recording"
  },
  {
    question: "What is Starknet and why do you use it?",
    answer: "Starknet is a Layer 2 scaling solution for Ethereum that provides fast, low-cost transactions. We use it to store recording metadata and enable decentralized features while keeping costs minimal.",
    category: "blockchain"
  },
  {
    question: "What is IPFS and how are my recordings stored?",
    answer: "IPFS (InterPlanetary File System) is a decentralized storage network. Your recordings are stored permanently on IPFS, ensuring they're always accessible and censorship-resistant.",
    category: "blockchain"
  },
  {
    question: "What are SocialFi missions?",
    answer: "SocialFi missions are community-driven recording challenges where you can earn STRK tokens by creating content around specific topics. Connect your wallet to participate and earn rewards.",
    category: "blockchain"
  },
  {
    question: "My microphone isn't working. What should I do?",
    answer: "1. Check browser permissions and allow microphone access. 2. Ensure your microphone is connected and working. 3. Try refreshing the page. 4. Check if other applications are using your microphone.",
    category: "troubleshooting"
  },
  {
    question: "The AI voice transformation failed. Why?",
    answer: "This can happen due to: 1. Network connectivity issues. 2. Audio file too long (try shorter recordings). 3. Poor audio quality. 4. Server overload (try again later).",
    category: "troubleshooting"
  },
  {
    question: "I can't connect my wallet. What's wrong?",
    answer: "Ensure you have ArgentX or Braavos wallet installed and set to Starknet Mainnet or Sepolia testnet. Refresh the page and try connecting again. Make sure your wallet is unlocked.",
    category: "troubleshooting"
  },
  {
    question: "How do I download my recordings?",
    answer: "After recording, click the download button next to your recording. Free users can download original recordings, while premium users can download AI-transformed versions too.",
    category: "recording"
  }
];

const categories = [
  { id: 'all', name: 'All Questions', icon: '❓' },
  { id: 'getting-started', name: 'Getting Started', icon: '🚀' },
  { id: 'recording', name: 'Recording & AI', icon: '🎙️' },
  { id: 'blockchain', name: 'Blockchain & Web3', icon: '⛓️' },
  { id: 'troubleshooting', name: 'Troubleshooting', icon: '🔧' },
];

export default function HelpPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const filteredFAQ = faqData.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="voisss-container py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Help & Support
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto">
            Find answers to common questions and get help with using VOISSS
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <a
            href="mailto:support@voisss.com"
            className="voisss-card text-center hover:border-blue-500/50 transition-colors"
          >
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
            </div>
            <h3 className="font-semibold text-white mb-2">Email Support</h3>
            <p className="text-gray-400 text-sm">Get help via email</p>
          </a>

          <a
            href="https://discord.gg/voisss"
            target="_blank"
            rel="noopener noreferrer"
            className="voisss-card text-center hover:border-purple-500/50 transition-colors"
          >
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </div>
            <h3 className="font-semibold text-white mb-2">Discord Community</h3>
            <p className="text-gray-400 text-sm">Join our community</p>
          </a>

          <a
            href="https://twitter.com/voisss_app"
            target="_blank"
            rel="noopener noreferrer"
            className="voisss-card text-center hover:border-blue-400/50 transition-colors"
          >
            <div className="w-12 h-12 bg-blue-400/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </div>
            <h3 className="font-semibold text-white mb-2">Twitter Support</h3>
            <p className="text-gray-400 text-sm">Follow for updates</p>
          </a>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 bg-[#2A2A2A] border border-[#3A3A3A] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#7C5DFA] transition-colors"
            />
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-[#7C5DFA] text-white'
                  : 'bg-[#2A2A2A] text-gray-300 hover:bg-[#3A3A3A]'
              }`}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-4xl mx-auto">
          <div className="space-y-4">
            {filteredFAQ.map((item, index) => (
              <div key={index} className="voisss-card">
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full text-left flex items-center justify-between p-0"
                >
                  <h3 className="font-semibold text-white pr-4">{item.question}</h3>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      openItems.has(index) ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openItems.has(index) && (
                  <div className="mt-4 pt-4 border-t border-[#3A3A3A]">
                    <p className="text-gray-300 leading-relaxed">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredFAQ.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
              <p className="text-gray-400">Try adjusting your search or browse different categories</p>
            </div>
          )}
        </div>

        {/* Contact Form */}
        <div className="max-w-2xl mx-auto mt-16">
          <div className="voisss-card">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              Still need help?
            </h2>
            <form className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#3A3A3A] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#7C5DFA] transition-colors"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  required
                  className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#3A3A3A] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#7C5DFA] transition-colors"
                  placeholder="How can we help?"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={5}
                  required
                  className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#3A3A3A] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-[#7C5DFA] transition-colors resize-none"
                  placeholder="Describe your issue or question..."
                />
              </div>
              <button
                type="submit"
                className="w-full px-6 py-3 bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] text-white font-semibold rounded-xl hover:from-[#6B4CE6] hover:to-[#8B7AFF] transition-all duration-200"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}