import React from "react";
import { Mission } from "@voisss/shared/types/socialfi";
import { CheckCircle as CheckCircleIcon, Target as TargetIcon, Clock as ClockIcon, HelpCircle as HelpCircleIcon } from "lucide-react";

// Type-safe icon wrappers
const Target = TargetIcon as React.ComponentType<{className?: string}>;
const Clock = ClockIcon as React.ComponentType<{className?: string}>;
const HelpCircle = HelpCircleIcon as React.ComponentType<{className?: string}>;
const CheckCircle = CheckCircleIcon as React.ComponentType<{className?: string}>;

interface MissionRecordingInterfaceProps {
  mission: Mission;
}

const MissionRecordingInterface: React.FC<MissionRecordingInterfaceProps> = ({
  mission,
}) => {
  return (
    <div className="w-full bg-gray-900 border border-gray-700 rounded-lg text-white">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-purple-400">
              {mission.title}
            </h2>
            <p className="text-gray-400">{mission.description}</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              mission.difficulty === "easy"
                ? "bg-green-600 text-green-100"
                : mission.difficulty === "medium"
                ? "bg-yellow-600 text-yellow-100"
                : "bg-red-600 text-red-100"
            }`}
          >
            {mission.difficulty.toUpperCase()}
          </span>
        </div>
      </div>
      <div className="px-6 pb-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Target className="w-6 h-6 text-green-400" />
            <div>
              <h4 className="font-semibold">Primary Goal</h4>
              <p className="text-gray-300">
                Capture an authentic conversation on "{mission.topic}".
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Clock className="w-6 h-6 text-yellow-400" />
            <div>
              <h4 className="font-semibold">Target Duration</h4>
              <p className="text-gray-300">
                Aim for at least {mission.targetDuration} seconds.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <HelpCircle className="w-6 h-6 text-blue-400 mt-1" />
            <div>
              <h4 className="font-semibold">Example Questions</h4>
              <ul className="list-disc list-inside text-gray-300">
                {mission.examples.map((example: string, index: number) => (
                  <li key={index}>{example}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-6 h-6 text-teal-400 mt-1" />
            <div>
              <h4 className="font-semibold">Context Suggestions</h4>
              <div className="flex flex-wrap gap-2 mt-2">
                {mission.contextSuggestions.map((context: string, index: number) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-sm border border-gray-600 rounded text-gray-300"
                  >
                    {context}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionRecordingInterface;
