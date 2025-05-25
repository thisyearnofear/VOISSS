import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Animated, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface AnimatedGradientBackgroundProps {
  /**
   * Initial size of the radial gradient, defining the starting width.
   * @default 110
   */
  startingSize?: number;

  /**
   * Enables or disables the breathing animation effect.
   * @default false
   */
  breathing?: boolean;

  /**
   * Array of colors to use in the gradient.
   * @default ["#0A0A0A", "#2979FF", "#FF80AB", "#FF6D00", "#FFD600", "#00E676", "#3D5AFE"]
   */
  gradientColors?: string[];

  /**
   * Speed of the breathing animation.
   * Lower values result in slower animation.
   * @default 0.02
   */
  animationSpeed?: number;

  /**
   * Maximum range for the breathing animation in percentage points.
   * Determines how much the gradient "breathes" by expanding and contracting.
   * @default 5
   */
  breathingRange?: number;

  /**
   * Additional style for the gradient container.
   * @default {}
   */
  containerStyle?: object;
}

/**
 * AnimatedGradientBackground
 *
 * This component renders a customizable animated gradient background with a subtle breathing effect.
 * It uses React Native's Animated API for the animation and LinearGradient for the background.
 *
 * @param {AnimatedGradientBackgroundProps} props - Props for configuring the gradient animation.
 * @returns JSX.Element
 */
const AnimatedGradientBackground: React.FC<AnimatedGradientBackgroundProps> = ({
  startingSize = 1.1,
  breathing = true,
  gradientColors = ["#121214", "#7C5DFA", "#4E7BFF", "#7C5DFA", "#121214"],
  animationSpeed = 0.005,
  breathingRange = 0.1,
  containerStyle = {},
}) => {
  const scaleAnim = useRef(new Animated.Value(startingSize)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    // Initial scale animation
    Animated.timing(scaleAnim, {
      toValue: startingSize,
      duration: 1000,
      useNativeDriver: true,
    }).start(() => {
      if (breathing) {
        // Start breathing animation
        animateBreathing();
      }
    });

    // Breathing animation function
    function animateBreathing() {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: startingSize + breathingRange,
          duration: 4000 / animationSpeed,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: startingSize - breathingRange,
          duration: 4000 / animationSpeed,
          useNativeDriver: true,
        }),
      ]).start(() => {
        animateBreathing();
      });
    }

    return () => {
      // Cleanup animation
      scaleAnim.stopAnimation();
      opacityAnim.stopAnimation();
    };
  }, [startingSize, breathing, animationSpeed, breathingRange]);

  // Ensure we have at least two colors for the gradient
  const safeColors =
    gradientColors.length >= 2 ? gradientColors : ["#121214", "#7C5DFA"];

  return (
    <Animated.View
      style={[
        styles.container,
        containerStyle,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={safeColors as unknown as readonly [string, string, ...string[]]}
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
    </Animated.View>
  );
};

const { width, height } = Dimensions.get("window");
const maxDimension = Math.max(width, height) * 1.5;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width: maxDimension,
    height: maxDimension,
    top: -maxDimension / 4,
    left: -maxDimension / 2 + width / 2,
  },
  gradient: {
    width: "100%",
    height: "100%",
    borderRadius: maxDimension / 2,
  },
});

export default AnimatedGradientBackground;
