import React from "react";
import { Button } from "./Button";
import { cn } from "../utils/cn";

export interface WalletConnectorProps {
  isConnected?: boolean;
  isConnecting?: boolean;
  accountAddress?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  className?: string;
}

export const WalletConnector: React.FC<WalletConnectorProps> = ({
  isConnected = false,
  isConnecting = false,
  accountAddress,
  onConnect,
  onDisconnect,
  className,
}) => {
  const formatAddress = (address: string): string => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isConnected && accountAddress) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-white text-sm font-mono">
            {formatAddress(accountAddress)}
          </span>
        </div>
        {onDisconnect && (
          <Button
            variant="outline"
            size="sm"
            onClick={onDisconnect}
          >
            Disconnect
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", className)}>
      <Button
        onClick={onConnect}
        isLoading={isConnecting}
        disabled={isConnecting}
      >
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>
    </div>
  );
};
