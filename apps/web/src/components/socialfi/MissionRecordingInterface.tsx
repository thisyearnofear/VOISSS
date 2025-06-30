import React from "react";
import { MissionContext } from "@repo/shared/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Badge } from "@repo/ui/components/badge";
import { CheckCircle, Target, Clock, HelpCircle } from "lucide-react";

interface MissionRecordingInterfaceProps {
  missionContext: MissionContext;
}

const MissionRecordingInterface: React.FC<MissionRecordingInterfaceProps> = ({
  missionContext,
}) => {
  return (
    <Card className="w-full bg-gray-900 border-gray-700 text-white">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl font-bold text-purple-400">
              {missionContext.title}
            </CardTitle>
            <p className="text-gray-400">{missionContext.description}</p>
          </div>
          <Badge
            variant={
              missionContext.difficulty === "easy"
                ? "default"
                : missionContext.difficulty === "medium"
                ? "secondary"
                : "destructive"
            }
          >
            {missionContext.difficulty.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Target className="w-6 h-6 text-green-400" />
            <div>
              <h4 className="font-semibold">Primary Goal</h4>
              <p className="text-gray-300">
                Capture an authentic conversation on "{missionContext.topic}".
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Clock className="w-6 h-6 text-yellow-400" />
            <div>
              <h4 className="font-semibold">Target Duration</h4>
              <p className="text-gray-300">
                Aim for at least {missionContext.targetDuration} seconds.
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <HelpCircle className="w-6 h-6 text-blue-400 mt-1" />
            <div>
              <h4 className="font-semibold">Example Questions</h4>
              <ul className="list-disc list-inside text-gray-300">
                {missionContext.examples.map((example, index) => (
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
                {missionContext.contextSuggestions.map((context, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-gray-300 border-gray-600"
                  >
                    {context}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MissionRecordingInterface;
