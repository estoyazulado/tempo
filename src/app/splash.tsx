
import { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Image,
} from "react-native";
import { router } from "expo-router";

export default function SplashScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/");
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#171719"
      />

<Image
  source={require("../../assets/images/tempo-splash.png")}
  style={styles.splashImage}
  resizeMode="contain"
/>

      <View style={styles.waveform}>
        {[12, 22, 32, 17, 27, 12, 21].map(
          (height, index) => (
            <View
              key={index}
              style={[styles.waveBar, { height }]}
            />
          )
        )}
      </View>

      <Text style={styles.footer}>
        FIND YOUR RHYTHM WITH TEMPO
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#171719",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: "#8989D1",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 18,
  },
  barShort: {
    width: 5,
    height: 20,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  barTall: {
    width: 5,
    height: 36,
    borderRadius: 3,
    backgroundColor: "#C5FF00",
  },
  barMedium: {
    width: 5,
    height: 26,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  brand: {
    color: "#FFFFFF",
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: -1.5,
  },
  tagline: {
    color: "#C5FF00",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    marginTop: 10,
  },
  waveform: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 48,
  },
  waveBar: {
    width: 4,
    borderRadius: 4,
    backgroundColor: "#8989D1",
  },
  footer: {
    position: "absolute",
    bottom: 45,
    color: "#777780",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.5,
  },

  splashImage: {
  width: 260,
  height: 260,
  alignSelf: "center",
},
});
