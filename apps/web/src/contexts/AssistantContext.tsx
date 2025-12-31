"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface AssistantContextType {
    isExpanded: boolean;
    setIsExpanded: (expanded: boolean) => void;
    toggleAssistant: () => void;
    initialMessage: string | null;
    setInitialMessage: (message: string | null) => void;
    openWithQuestion: (question: string) => void;
}

const AssistantContext = createContext<AssistantContextType | undefined>(undefined);

export function AssistantProvider({ children }: { children: ReactNode }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [initialMessage, setInitialMessage] = useState<string | null>(null);

    const toggleAssistant = useCallback(() => {
        setIsExpanded(prev => !prev);
    }, []);

    const openWithQuestion = useCallback((question: string) => {
        setInitialMessage(question);
        setIsExpanded(true);
    }, []);

    return (
        <AssistantContext.Provider value={{
            isExpanded,
            setIsExpanded,
            toggleAssistant,
            initialMessage,
            setInitialMessage,
            openWithQuestion
        }}>
            {children}
        </AssistantContext.Provider>
    );
}

export function useAssistant() {
    const context = useContext(AssistantContext);
    if (context === undefined) {
        throw new Error('useAssistant must be used within an AssistantProvider');
    }
    return context;
}
