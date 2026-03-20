import { useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ImageBackground,
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "react-native";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

export default function LandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Staggered fade-in animations
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslate = useRef(new Animated.Value(20)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslate = useRef(new Animated.Value(20)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslate = useRef(new Animated.Value(20)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const buttonsTranslate = useRef(new Animated.Value(30)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const stagger = (delay: number, opacity: Animated.Value, translate: Animated.Value) =>
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(translate, {
          toValue: 0,
          duration: 600,
          delay,
          useNativeDriver: true,
        }),
      ]);

    Animated.parallel([
      stagger(300, logoOpacity, logoTranslate),
      stagger(600, titleOpacity, titleTranslate),
      stagger(900, subtitleOpacity, subtitleTranslate),
      stagger(1200, buttonsOpacity, buttonsTranslate),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 600,
        delay: 1500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Responsive sizing based on screen height
  const isSmallScreen = SCREEN_HEIGHT < 700;
  const isMediumScreen = SCREEN_HEIGHT >= 700 && SCREEN_HEIGHT < 850;
  const logoSize = isSmallScreen ? 64 : isMediumScreen ? 80 : 96;
  const titleSize = isSmallScreen ? 28 : isMediumScreen ? 34 : 40;
  const subtitleSize = isSmallScreen ? 15 : isMediumScreen ? 16 : 18;
  const buttonPaddingV = isSmallScreen ? 14 : isMediumScreen ? 16 : 18;
  const buttonFontSize = isSmallScreen ? 16 : 17;
  const bottomSpacing = Math.max(insets.bottom, 16);

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../../assets/building.png")}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Dark gradient overlay */}
        <LinearGradient
          colors={["rgba(15,23,42,0.45)", "rgba(15,23,42,0.75)", "rgba(15,23,42,0.95)"]}
          locations={[0, 0.5, 1]}
          style={styles.gradient}
        >
          {/* Top spacer that adapts to safe area */}
          <View style={{ height: insets.top + (isSmallScreen ? 20 : 40) }} />

          {/* Logo + branding */}
          <Animated.View
            style={[
              styles.logoContainer,
              { opacity: logoOpacity, transform: [{ translateY: logoTranslate }] },
            ]}
          >
            <Image
              source={require("../../assets/logo.png")}
              style={[styles.logo, { width: logoSize, height: logoSize }]}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Flexible spacer */}
          <View style={{ flex: 1 }} />

          {/* Text content */}
          <View style={styles.textContent}>
            <Animated.Text
              style={[
                styles.title,
                {
                  fontSize: titleSize,
                  opacity: titleOpacity,
                  transform: [{ translateY: titleTranslate }],
                },
              ]}
            >
              The easiest way{"\n"}to collect rent.
            </Animated.Text>

            <Animated.Text
              style={[
                styles.subtitle,
                {
                  fontSize: subtitleSize,
                  opacity: subtitleOpacity,
                  transform: [{ translateY: subtitleTranslate }],
                  marginTop: isSmallScreen ? 10 : 16,
                },
              ]}
            >
              Manage properties, track payments, and stay organized — all in one place.
            </Animated.Text>
          </View>

          {/* Buttons */}
          <Animated.View
            style={[
              styles.buttonContainer,
              {
                opacity: buttonsOpacity,
                transform: [{ translateY: buttonsTranslate }],
                paddingHorizontal: SCREEN_WIDTH < 380 ? 20 : 32,
                gap: isSmallScreen ? 10 : 14,
              },
            ]}
          >
            <Pressable
              onPress={() => router.push("/(auth)/login")}
              style={({ pressed }) => [
                styles.primaryButton,
                { paddingVertical: buttonPaddingV },
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={[styles.primaryButtonText, { fontSize: buttonFontSize }]}>
                Sign In
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/(auth)/signup")}
              style={({ pressed }) => [
                styles.outlineButton,
                { paddingVertical: buttonPaddingV },
                pressed && styles.outlineButtonPressed,
              ]}
            >
              <Text style={[styles.outlineButtonText, { fontSize: buttonFontSize }]}>
                Create Account
              </Text>
            </Pressable>
          </Animated.View>

          {/* Tagline */}
          <Animated.Text
            style={[
              styles.tagline,
              {
                opacity: taglineOpacity,
                marginBottom: bottomSpacing + 8,
                marginTop: isSmallScreen ? 16 : 24,
              },
            ]}
          >
            Built for Jamaican landlords
          </Animated.Text>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  gradient: {
    flex: 1,
    justifyContent: "flex-end",
  },
  logoContainer: {
    alignItems: "center",
  },
  logo: {
    borderRadius: 20,
  },
  textContent: {
    paddingHorizontal: 32,
    marginBottom: 8,
  },
  title: {
    color: "#ffffff",
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: undefined,
  },
  subtitle: {
    color: "rgba(255,255,255,0.75)",
    fontWeight: "400",
    lineHeight: 24,
  },
  buttonContainer: {
    marginTop: 24,
  },
  primaryButton: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  primaryButtonText: {
    color: "#0f172a",
    fontWeight: "700",
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  outlineButtonPressed: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  outlineButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  tagline: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    letterSpacing: 0.5,
  },
});
