import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { router } from "expo-router";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as SecureStore from "expo-secure-store";

WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID =
  process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID ?? "";

const redirectUri = AuthSession.makeRedirectUri({
  scheme: "tempo",
  native: "tempo://callback",
});

const discovery = {
  authorizationEndpoint: "https://accounts.spotify.com/authorize",
  tokenEndpoint: "https://accounts.spotify.com/api/token",
};

export default function Login() {
  const [loading, setLoading] = useState(false);
  const handledCode = useRef<string | null>(null);

  const [request, response, promptAsync] =
    AuthSession.useAuthRequest(
      {
        clientId: CLIENT_ID || "missing-client-id",
        scopes: [
          "user-read-private",
          "user-read-email",
          "user-top-read",
        ],
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
        usePKCE: true,
      },
      discovery
    );

  useEffect(() => {
    if (!response) return;

    if (response.type === "error") {
      setLoading(false);
      Alert.alert(
        "Spotify Login Failed",
        response.error?.message ?? "Authorization failed."
      );
      return;
    }

    if (response.type === "cancel" || response.type === "dismiss") {
      setLoading(false);
      return;
    }

    if (response.type !== "success") return;

    const code = response.params.code;
    if (!code || handledCode.current === code) return;
    handledCode.current = code;

    async function finishLogin() {
      try {
        if (!request?.codeVerifier) {
          throw new Error("PKCE code verifier is missing.");
        }

        setLoading(true);

        const token = await AuthSession.exchangeCodeAsync(
          {
            clientId: CLIENT_ID,
            code,
            redirectUri,
            extraParams: {
              code_verifier: request.codeVerifier,
            },
          },
          discovery
        );

        await SecureStore.setItemAsync(
          "spotify_access_token",
          token.accessToken
        );

        if (token.refreshToken) {
          await SecureStore.setItemAsync(
            "spotify_refresh_token",
            token.refreshToken
          );
        }

        router.replace("/home");
      } catch (error) {
        console.error("Spotify login error:", error);
        Alert.alert(
          "Login Failed",
          error instanceof Error
            ? error.message
            : "Could not connect to Spotify."
        );
      } finally {
        setLoading(false);
      }
    }

    finishLogin();
  }, [response, request]);

  const loginWithSpotify = async () => {
    if (!CLIENT_ID) {
      Alert.alert(
        "Missing Client ID",
        "Add EXPO_PUBLIC_SPOTIFY_CLIENT_ID to your .env file."
      );
      return;
    }

    if (!request || loading) return;

    setLoading(true);
    try {
      await promptAsync();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not open Spotify login.");
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#171719" />

      <View style={styles.container}>
        {/* Decorative background accents */}
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />

        <View style={styles.content}>
          {/* Brand */}
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <View style={styles.equalizerBarShort} />
              <View style={styles.equalizerBarTall} />
              <View style={styles.equalizerBarMedium} />
            </View>
            <Text style={styles.brandName}>tempo</Text>
          </View>

          {/* Hero */}
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>YOUR SOUND, YOUR STORY</Text>
            <Text style={styles.title}>
              Music says{"\n"}
              <Text style={styles.titleAccent}>more about you.</Text>
            </Text>
            <Text style={styles.subtitle}>
              Explore the artists, songs and albums that shape your taste.
            </Text>
          </View>

          {/* Preview graphic */}
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <View>
                <Text style={styles.previewOverline}>YOUR LISTENING</Text>
                <Text style={styles.previewTitle}>Your world of music</Text>
              </View>
              <View style={styles.liveDot} />
            </View>

            <View style={styles.musicVisual}>
              <View style={[styles.albumTile, styles.albumTileOne]}>
                <Text style={styles.tileNote}>♫</Text>
              </View>
              <View style={[styles.albumTile, styles.albumTileTwo]}>
                <Text style={styles.tileNote}>♪</Text>
              </View>
              <View style={[styles.albumTile, styles.albumTileThree]}>
                <Text style={styles.tileNote}>♫</Text>
              </View>
              <View style={[styles.albumTile, styles.albumTileFour]}>
                <Text style={styles.tileNote}>♬</Text>
              </View>
            </View>

            <View style={styles.previewFooter}>
              <View style={styles.waveform}>
                {[12, 21, 15, 29, 18, 34, 23, 13, 26, 17, 31, 14, 22, 11].map(
                  (height, index) => (
                    <View
                      key={index}
                      style={[styles.waveBar, { height }]}
                    />
                  )
                )}
              </View>
              <Text style={styles.previewCaption}>MADE FOR YOUR TASTE</Text>
            </View>
          </View>

          {/* Login action */}
          <View style={styles.actionArea}>
            <TouchableOpacity
              style={[
                styles.button,
                (!request || loading) && styles.buttonDisabled,
              ]}
              onPress={loginWithSpotify}
              disabled={!request || loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#171719" />
              ) : (
                <>
                  <View style={styles.spotifyMark}>
                    <View style={styles.spotifyArcOne} />
                    <View style={styles.spotifyArcTwo} />
                    <View style={styles.spotifyArcThree} />
                  </View>
                  <Text style={styles.buttonText}>Continue with Spotify</Text>
                  <Text style={styles.buttonArrow}>↗</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.privacyNote}>
              Connect your Spotify account to see your personal music stats.
            </Text>
          </View>
        </View>

        <View style={styles.bottomNote}>
          <View style={styles.bottomLine} />
          <Text style={styles.bottomText}>FIND YOUR RHYTHM WITH TEMPO</Text>
          <View style={styles.bottomLine} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#171719",
  },
  container: {
    flex: 1,
    backgroundColor: "#171719",
    overflow: "hidden",
    paddingHorizontal: 24,
  },
  glowTop: {
    position: "absolute",
    top: 65,
    right: -95,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: "#8989D1",
    opacity: 0.12,
  },
  glowBottom: {
    position: "absolute",
    bottom: 70,
    left: -120,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "#D51D91",
    opacity: 0.09,
  },
  content: {
    flex: 1,
    justifyContent: "space-evenly",
    paddingTop: 8,
    paddingBottom: 8,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 10,
  },
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#8989D1",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  equalizerBarShort: {
    width: 3,
    height: 9,
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
  },
  equalizerBarTall: {
    width: 3,
    height: 17,
    borderRadius: 2,
    backgroundColor: "#C5FF00",
  },
  equalizerBarMedium: {
    width: 3,
    height: 12,
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
  },
  brandName: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  hero: {
    alignItems: "center",
    marginTop: 10,
  },
  eyebrow: {
    color: "#C5FF00",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 13,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 37,
    lineHeight: 41,
    fontWeight: "900",
    letterSpacing: -1.3,
    textAlign: "center",
  },
  titleAccent: {
    color: "#8989D1",
  },
  subtitle: {
    color: "#B7B7BD",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 14,
    maxWidth: 300,
  },
  previewCard: {
    backgroundColor: "#242428",
    borderColor: "#3B3B42",
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  previewOverline: {
    color: "#A9A9B1",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.7,
  },
  previewTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 5,
  },
  liveDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#C5FF00",
  },
  musicVisual: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  albumTile: {
    flex: 1,
    aspectRatio: 0.9,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  albumTileOne: {
    backgroundColor: "#8989D1",
  },
  albumTileTwo: {
    backgroundColor: "#D51D91",
  },
  albumTileThree: {
    backgroundColor: "#BED51D",
  },
  albumTileFour: {
    backgroundColor: "#526F85",
  },
  tileNote: {
    color: "#FFFFFF",
    fontSize: 31,
    fontWeight: "900",
  },
  previewFooter: {
    marginTop: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  waveform: {
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  waveBar: {
    width: 3,
    borderRadius: 3,
    backgroundColor: "#8989D1",
  },
  previewCaption: {
    color: "#A9A9B1",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
  },
  actionArea: {
    marginTop: 4,
  },
  button: {
    minHeight: 56,
    backgroundColor: "#C5FF00",
    borderRadius: 15,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  spotifyMark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#171719",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  spotifyArcOne: {
    position: "absolute",
    width: 15,
    height: 6,
    borderTopWidth: 1.8,
    borderColor: "#C5FF00",
    borderRadius: 10,
    top: 6,
  },
  spotifyArcTwo: {
    position: "absolute",
    width: 12,
    height: 5,
    borderTopWidth: 1.6,
    borderColor: "#C5FF00",
    borderRadius: 10,
    top: 10,
  },
  spotifyArcThree: {
    position: "absolute",
    width: 8,
    height: 4,
    borderTopWidth: 1.4,
    borderColor: "#C5FF00",
    borderRadius: 10,
    top: 14,
  },
  buttonText: {
    color: "#171719",
    fontSize: 14,
    fontWeight: "900",
    flex: 1,
    textAlign: "center",
  },
  buttonArrow: {
    color: "#171719",
    fontSize: 20,
    fontWeight: "800",
  },
  privacyNote: {
    color: "#8F8F98",
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 12,
    paddingHorizontal: 8,
  },
  bottomNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingBottom: 14,
  },
  bottomLine: {
    width: 25,
    height: 1,
    backgroundColor: "#55555B",
  },
  bottomText: {
    color: "#777780",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.3,
  },
});
