"use client";

import React from 'react';

interface ProgressVisualizerProps {
  isVisible: boolean;
  progress: string;
  stage: 'preparing' | 'translating' | 'generating' | 'finalizing' | 'complete' | 'error';
  className?: string;
}

export default function ProgressVisualizer({
  isVisible,
  progress,
  stage,
  className = ""
}: ProgressVisualizerProps) {
  if (!isVisible) return null;

  const getStageInfo = (currentStage: string) => {
    switch (currentStage) {
      case 'preparing':
        return {
          icon: '🎵',
          color: 'from-blue-500 to-blue-600',
          bgColor: 'bg-blue-500/20',
          borderColor: 'border-blue-500/30',
          title: 'Preparing Audio'
        };
      case 'translating':
        return {
          icon: '🌐',
          color: 'from-purple-500 to-purple-600',
          bgColor: 'bg-purple-500/20',
          borderColor: 'border-purple-500/30',
          title: 'AI Translation'
        };
      case 'generating':
        return {
          icon: '🎭',
          color: 'from-green-500 to-green-600',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/30',
          title: 'Generating Dubbed Audio'
        };
      case 'finalizing':
        return {
          icon: '✨',
          color: 'from-yellow-500 to-orange-500',
          bgColor: 'bg-yellow-500/20',
          borderColor: 'border-yellow-500/30',
          title: 'Finalizing Translation'
        };
      case 'complete':
        return {
          icon: '🎉',
          color: 'from-green-600 to-green-700',
          bgColor: 'bg-green-600/20',
          borderColor: 'border-green-600/30',
          title: 'Dubbing Complete!'
        };
      case 'error':
        return {
          icon: '❌',
          color: 'from-red-500 to-red-600',
          bgColor: 'bg-red-500/20',
          borderColor: 'border-red-500/30',
          title: 'Error Occurred'
        };
      default:
        return {
          icon: '⏳',
          color: 'from-gray-500 to-gray-600',
          bgColor: 'bg-gray-500/20',
          borderColor: 'border-gray-500/30',
          title: 'Processing...'
        };
    }
  };

  const stageInfo = getStageInfo(stage);

  return (
    <div className={`p-4 ${stageInfo.bgColor} ${stageInfo.borderColor} border rounded-xl ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="text-2xl animate-pulse">{stageInfo.icon}</div>
        <div className="flex-1">
          <h4 className="text-white font-semibold">{stageInfo.title}</h4>
          <p className="text-gray-300 text-sm">{progress}</p>
        </div>
      </div>

      {/* Animated Progress Bar */}
      <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${stageInfo.color} rounded-full transition-all duration-1000 ease-out animate-pulse`}
          style={{
            width: stage === 'complete' ? '100%' :
                   stage === 'error' ? '0%' :
                   stage === 'preparing' ? '25%' :
                   stage === 'translating' ? '50%' :
                   stage === 'generating' ? '75%' :
                   stage === 'finalizing' ? '90%' : '10%'
          }}
        />
      </div>

      {/* Stage Indicators */}
      <div className="flex justify-between mt-3 text-xs text-gray-400">
        <span className={stage === 'preparing' ? 'text-blue-400' : ''}>Prepare</span>
        <span className={stage === 'translating' ? 'text-purple-400' : ''}>Translate</span>
        <span className={stage === 'generating' ? 'text-green-400' : ''}>Generate</span>
        <span className={stage === 'finalizing' || stage === 'complete' ? 'text-yellow-400' : ''}>Finalize</span>
      </div>
    </div>
  );
}