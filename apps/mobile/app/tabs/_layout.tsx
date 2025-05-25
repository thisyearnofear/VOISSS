import React from "react";
import { Tabs } from "expo-router";
import { FileAudio, Settings, Import } from "lucide-react-native";
import colors from "../../constants/colors";
import { useStarknetStatus } from "../../hooks/useStarknet";
import { View, Text, StyleSheet } from "react-native";

export default function TabsLayout() {
  const { isConnected, isConnecting } = useStarknetStatus();

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.dark.background,
        },
        headerTintColor: colors.dark.text,
        tabBarStyle: {
          backgroundColor: colors.dark.background,
          borderTopColor: colors.dark.border,
        },
        tabBarActiveTintColor: colors.dark.primary,
        tabBarInactiveTintColor: colors.dark.textSecondary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Recordings",
          tabBarIcon: ({ color }) => <FileAudio size={24} color={color} />,
          headerRight: () => (
            <View style={styles.connectionStatus}>
              <View
                style={[
                  styles.statusDot,
                  isConnected
                    ? styles.connected
                    : isConnecting
                    ? styles.connecting
                    : styles.disconnected,
                ]}
              />
              <Text style={styles.statusText}>
                {isConnected
                  ? "Connected to Starknet"
                  : isConnecting
                  ? "Connecting..."
                  : "Not Connected"}
              </Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="import"
        options={{
          title: "Import",
          tabBarIcon: ({ color }) => <Import size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  connectionStatus: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connected: {
    backgroundColor: colors.dark.success,
  },
  connecting: {
    backgroundColor: colors.dark.warning,
  },
  disconnected: {
    backgroundColor: colors.dark.error,
  },
  statusText: {
    fontSize: 12,
    color: colors.dark.textSecondary,
  },
});
