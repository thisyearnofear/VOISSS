import { Sparkles, Check, AlertCircle } from "lucide-react";

interface AlchemyModeStatusProps {
    isConnected: boolean;
    hasSubAccount: boolean;
    activeMode: string;
    isCreatingSubAccount: boolean;
    createSubAccount: () => Promise<void>;
    setToastType: (type: "success" | "error") => void;
    setToastMessage: (message: string | null) => void;
}

export default function AlchemyModeStatus({
    isConnected,
    hasSubAccount,
    activeMode,
    isCreatingSubAccount,
    createSubAccount,
    setToastType,
    setToastMessage,
}: AlchemyModeStatusProps) {
    if (!isConnected) {
        return (
            <div className="p-4 bg-gray-900/40 border border-gray-800 rounded-xl">
                <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-gray-500" />
                    <div>
                        <div className="text-sm font-bold text-gray-300">Not Connected</div>
                        <div className="text-xs text-gray-500">Connect your Base Account to enable Studio features</div>
                    </div>
                </div>
            </div>
        );
    }

    if (!hasSubAccount) {
        return (
            <div className="p-4 bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-xl">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                        <Sparkles className="w-5 h-5 text-purple-400 mt-0.5" />
                        <div>
                            <div className="text-sm font-bold text-white mb-1">Enable Gasless Studio</div>
                            <div className="text-xs text-gray-300 leading-relaxed mb-3">
                                Create a Sub Account for seamless, gasless saves. One-time setup, forever frictionless.
                            </div>
                            <button
                                onClick={async () => {
                                    try {
                                        await createSubAccount();
                                        setToastType("success");
                                        setToastMessage("Sub Account created! You can now save gaslessly.");
                                    } catch (error: any) {
                                        setToastType("error");
                                        setToastMessage(error.message || "Failed to create Sub Account");
                                    }
                                }}
                                disabled={isCreatingSubAccount}
                                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold rounded-lg hover:from-purple-500 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCreatingSubAccount ? "Creating..." : "Enable Gasless Saves"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 bg-green-900/10 border border-green-500/30 rounded-xl">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-400" />
                    <div>
                        <div className="text-sm font-bold text-white">Gasless Studio Active</div>
                        <div className="text-xs text-gray-400">
                            Mode: <span className="text-green-400 font-bold">{activeMode === 'ghost' ? 'Ghost' : activeMode === 'pro' ? 'Pro' : activeMode === 'vip' ? 'VIP' : 'Standard'}</span>
                        </div>
                    </div>
                </div>
                <a
                    href="/features"
                    className="text-xs text-purple-400 hover:text-purple-300 font-bold transition-colors"
                >
                    Manage Modes →
                </a>
            </div>
        </div>
    );
}
