"use client";

import React, { useState } from 'react';
import { SUPPORTED_DUBBING_LANGUAGES, getLanguageByCode, getPopularLanguages } from '@voisss/shared';
import type { LanguageInfo } from '@voisss/shared/src/constants/languages';

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  languages: LanguageInfo[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  viewMode?: 'dropdown' | 'cards';
}

export default function LanguageSelector({
  selectedLanguage,
  onLanguageChange,
  languages,
  placeholder = "Select language...",
  disabled = false,
  className = "",
  viewMode = 'cards'
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Utility functions for language operations
  const getLanguageByCodeLocal = (code: string) => {
    return getLanguageByCode(code);
  };

  const getPopularLanguagesLocal = () => {
    return getPopularLanguages();
  };

  const selectedLanguageInfo = getLanguageByCodeLocal(selectedLanguage);
  const popularLanguages = getPopularLanguagesLocal();

  const filteredLanguages = languages.filter(lang =>
    lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lang.nativeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLanguageSelect = (languageCode: string) => {
    onLanguageChange(languageCode);
    setIsOpen(false);
    setSearchTerm("");
  };

  if (viewMode === 'dropdown') {
    return (
      <select
        className={`voisss-input ${className}`}
        value={selectedLanguage}
        onChange={(e) => onLanguageChange(e.target.value)}
        disabled={disabled}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {languages.map((language) => (
          <option key={language.code} value={language.code}>
            {language.nativeName && language.nativeName !== language.name
              ? `${language.flag} ${language.name} (${language.nativeName})`
              : `${language.flag} ${language.name}`}
          </option>
        ))}
      </select>
    );
  }

  // Enhanced cards view
  return (
    <div className={`relative ${className}`}>
      {/* Selected Language Display */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full p-3 bg-[#1A1A1A] border border-[#3A3A3A] rounded-lg text-left
          hover:border-[#7C5DFA] transition-colors flex items-center justify-between
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isOpen ? 'border-[#7C5DFA]' : ''}
        `}
      >
        <div className="flex items-center gap-3">
          {selectedLanguageInfo ? (
            <>
              <span className="text-2xl">{selectedLanguageInfo.flag}</span>
              <div>
                <div className="text-white font-medium">
                  {selectedLanguageInfo.nativeName && selectedLanguageInfo.nativeName !== selectedLanguageInfo.name
                    ? `${selectedLanguageInfo.name} (${selectedLanguageInfo.nativeName})`
                    : selectedLanguageInfo.name}
                </div>
                {selectedLanguageInfo.sampleText && (
                  <div className="text-xs text-gray-400 mt-1">
                    {selectedLanguageInfo.sampleText}
                  </div>
                )}
              </div>
            </>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-[#1A1A1A] border border-[#3A3A3A] rounded-lg shadow-xl max-h-96 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-[#2A2A2A]">
            <input
              type="text"
              placeholder="Search languages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:border-[#7C5DFA]"
            />
          </div>

          {/* Popular Languages Section */}
          {searchTerm === "" && popularLanguages.length > 0 && (
            <div className="p-3 border-b border-[#2A2A2A]">
              <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Popular Languages
              </div>
              <div className="grid grid-cols-2 gap-1">
                {popularLanguages.slice(0, 6).map((language: LanguageInfo) => (
                  <button
                    key={language.code}
                    onClick={() => handleLanguageSelect(language.code)}
                    className={`
                      p-2 rounded-lg text-left transition-colors flex items-center gap-2 text-sm
                      ${selectedLanguage === language.code
                        ? 'bg-[#7C5DFA] text-white'
                        : 'hover:bg-[#2A2A2A] text-gray-300'}
                    `}
                  >
                    <span className="text-lg">{language.flag}</span>
                    <div>
                      <div className="font-medium">{language.name}</div>
                      {language.nativeName && (
                        <div className="text-xs opacity-75">{language.nativeName}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* All Languages Grid */}
          <div className="max-h-64 overflow-y-auto p-2">
            <div className="grid grid-cols-1 gap-1">
              {filteredLanguages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageSelect(language.code)}
                  className={`
                    w-full p-3 rounded-lg text-left transition-colors flex items-center gap-3
                    ${selectedLanguage === language.code
                      ? 'bg-[#7C5DFA] text-white'
                      : 'hover:bg-[#2A2A2A] text-gray-300'}
                  `}
                >
                  <span className="text-xl flex-shrink-0">{language.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {language.nativeName && language.nativeName !== language.name
                        ? `${language.name} (${language.nativeName})`
                        : language.name}
                    </div>
                    {language.sampleText && (
                      <div className="text-xs opacity-75 mt-1 truncate">
                        {language.sampleText}
                      </div>
                    )}
                  </div>
                  {language.isPopular && (
                    <svg className="w-4 h-4 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>

            {filteredLanguages.length === 0 && (
              <div className="p-4 text-center text-gray-400 text-sm">
                No languages found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}