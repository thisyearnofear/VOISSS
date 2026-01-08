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
               <h4 className="font-semibold">What to Capture</h4>
               <p className="text-gray-300">
                 {mission.description}
               </p>
             </div>
           </div>
           <div className="flex items-center space-x-3">
             <Clock className="w-6 h-6 text-yellow-400" />
             <div>
               <h4 className="font-semibold">Target Duration</h4>
               <p className="text-gray-300">
                 Aim for approximately {mission.targetDuration} seconds.
               </p>
             </div>
           </div>
           {mission.qualityCriteria && (
             <div className="flex items-start space-x-3">
               <CheckCircle className="w-6 h-6 text-teal-400 mt-1" />
               <div>
                 <h4 className="font-semibold">Quality Requirements</h4>
                 <ul className="list-disc list-inside text-gray-300">
                   {mission.qualityCriteria.audioMinScore && (
                     <li>Audio quality: minimum {mission.qualityCriteria.audioMinScore}</li>
                   )}
                   {mission.qualityCriteria.transcriptionRequired && (
                     <li>Transcription required</li>
                   )}
                 </ul>
               </div>
             </div>
           )}
           {mission.locationBased && (
             <div className="flex items-start space-x-3">
               <HelpCircle className="w-6 h-6 text-blue-400 mt-1" />
               <div>
                 <h4 className="font-semibold">Location-Based</h4>
                 <p className="text-gray-300">
                   Record in the location described above (taxi, street, coffee shop, etc.)
                 </p>
               </div>
             </div>
           )}
         </div>
      </div>
    </div>
  );
};

export default MissionRecordingInterface;
