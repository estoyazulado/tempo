
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COLORS = {
  background: "#292929",
  header: "#242424",
  purple: "#8989D1",
  pink: "#D51D91",
  white: "#FFFFFF",
  muted: "#AAAAAA",
  lime: "#BED51D",
};

type SpotifyProfile = {
  display_name: string | null;
  id: string;
};

type InfoPage = "FAQ" | "Privacy Policy" | null;

export default function Profile() {
  const insets = useSafeAreaInsets();

  const [profile, setProfile] =
    useState<SpotifyProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [infoPage, setInfoPage] = useState<InfoPage>(null);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const token = await SecureStore.getItemAsync(
          "spotify_access_token"
        );

        if (!token) {
          router.replace("/");
          return;
        }

        const response = await fetch(
          "https://api.spotify.com/v1/me",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error(
              "Your Spotify session has expired. Please log in again."
            );
          }

          throw new Error("Unable to load your profile.");
        }

        const data: SpotifyProfile = await response.json();

        if (active) {
          setProfile(data);
        }
      } catch (error) {
        if (active) {
          Alert.alert(
            "Profile",
            error instanceof Error
              ? error.message
              : "Unable to load your profile."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  const logout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out of Tempo?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            await SecureStore.deleteItemAsync(
              "spotify_access_token"
            );
            await SecureStore.deleteItemAsync(
              "spotify_refresh_token"
            );

            router.replace("/");
          },
        },
      ]
    );
  };

  const displayName =
    profile?.display_name?.trim() ||
    profile?.id ||
    "Spotify User";

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top },
      ]}
    >
      {/* BLACK HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      {/* PROFILE BACKGROUND */}
      <View style={styles.profileBackground}>
        {/* DECORATIVE DOTS */}
        <View style={styles.dotPattern} pointerEvents="none">
          {Array.from({ length: 56 }, (_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  opacity: 0.12 + (index % 4) * 0.07,
                },
              ]}
            />
          ))}
        </View>

        {/* USER INFORMATION */}
        <View style={styles.userSection}>
          <View style={styles.avatar}>
            <View style={styles.avatarHead} />
            <View style={styles.avatarBody} />
          </View>

          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text
              style={styles.userName}
              numberOfLines={2}
            >
              {displayName}
            </Text>
          )}
        </View>

        {/* MENU */}
        <View style={styles.menu}>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => setInfoPage("FAQ")}
            activeOpacity={0.7}
          >
            <Text style={styles.menuText}>FAQ</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => setInfoPage("Privacy Policy")}
            activeOpacity={0.7}
          >
            <Text style={styles.menuText}>
              Privacy Policy
            </Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* LOG OUT */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* BOTTOM NAVIGATION */}
      <View
        style={[
          styles.bottomNav,
          { paddingBottom: Math.max(insets.bottom, 10) },
        ]}
      >
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.replace("/home")}
          accessibilityLabel="Dashboard"
        >
<View style={styles.dashboardGlyph}>
  <View style={styles.dashboardGlyphCell} />
  <View style={styles.dashboardGlyphCell} />
  <View style={styles.dashboardGlyphCell} />
  <View style={styles.dashboardGlyphCell} />
</View>
          <Text style={styles.navLabel}>Dashboard</Text>
        </TouchableOpacity>

        <View
          style={styles.navItem}
          accessibilityLabel="Profile"
          accessibilityState={{ selected: true }}
        >
<View style={styles.profileGlyph}>
  <View style={styles.profileGlyphHead} />
  <View style={styles.profileGlyphShoulders} />
</View>
          <Text style={styles.activeNavLabel}>Profile</Text>
        </View>
      </View>

      {/* FAQ / PRIVACY POLICY POPUP */}
      <Modal
        visible={infoPage !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoPage(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {infoPage}
            </Text>

            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
            >
              {infoPage === "FAQ" ? (
                <>
                  <Text style={styles.infoHeading}>
                    What is Tempo?
                  </Text>
                  <Text style={styles.infoText}>
                    Tempo helps you explore your Spotify
                    listening preferences, including your
                    top artists, songs and albums.
                  </Text>

                  <Text style={styles.infoHeading}>
                    How do I change my listening period?
                  </Text>
                  <Text style={styles.infoText}>
                    Open Dashboard and select 4 weeks,
                    6 months or 1 year.
                  </Text>

                  <Text style={styles.infoHeading}>
                    How do I share my recap?
                  </Text>
                  <Text style={styles.infoText}>
                    Select Share with friends on Dashboard
                    to preview and share your music recap.
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.infoHeading}>
                    Your Spotify data
                  </Text>
                  <Text style={styles.infoText}>
                    Tempo uses Spotify account information
                    and listening data to display your music
                    statistics.
                  </Text>

                  <Text style={styles.infoHeading}>
                    Sharing your recap
                  </Text>
                  <Text style={styles.infoText}>
                    When you share a recap, the music
                    information included in that recap is
                    shared with your chosen recipient.
                  </Text>

                  <Text style={styles.infoHeading}>
                    Account access
                  </Text>
                  <Text style={styles.infoText}>
                    You can log out of Tempo from this page.
                    This removes the locally stored Spotify
                    tokens from the app.
                  </Text>
                </>
              )}
            </ScrollView>

            <Pressable
              style={styles.modalButton}
              onPress={() => setInfoPage(null)}
            >
              <Text style={styles.modalButtonText}>
                Close
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    height: 55,
    backgroundColor: COLORS.header,
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "800",
  },

  profileBackground: {
    flex: 1,
    paddingTop: 34,
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#303030",
  },

  dotPattern: {
    position: "absolute",
    left: -10,
    right: -10,
    bottom: 0,
    height: 190,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    alignContent: "space-around",
    paddingHorizontal: 5,
  },

  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.lime,
    margin: 5,
  },

  userSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 28,
    gap: 14,
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#343434",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  avatarHead: {
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    marginTop: 7,
  },

  avatarBody: {
    width: 33,
    height: 19,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: COLORS.white,
    marginTop: 3,
  },

  userName: {
    color: COLORS.white,
    fontSize: 23,
    fontWeight: "800",
    flexShrink: 1,
  },

  menu: {
    marginTop: 24,
    paddingHorizontal: 28,
  },

  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 35,
  },

  menuText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "500",
  },

  menuArrow: {
    color: COLORS.white,
    fontSize: 22,
  },

  logoutButton: {
    position: "absolute",
    left: 40,
    right: 40,
    bottom: 32,
    backgroundColor: COLORS.pink,
    borderRadius: 10,
    minHeight: 43,
    justifyContent: "center",
    alignItems: "center",
  },

  logoutText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "800",
  },

  bottomNav: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#242424",
    paddingTop: 9,
  },

  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },

  dashboardIcon: {
    color: "#8A8A8A",
    fontSize: 23,
    fontWeight: "800",
  },

  profileIcon: {
    color: "#8989D1",
    fontSize: 21,
  },

  navLabel: {
    color: "#777777",
    fontSize: 9,
  },

activeNavLabel: {
  color: "#8989D1",
  fontSize: 9,
  fontWeight: "800",
},

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    padding: 22,
  },

  modalCard: {
    backgroundColor: "#303030",
    borderRadius: 18,
    padding: 20,
    maxHeight: "75%",
  },

  modalTitle: {
    color: COLORS.white,
    fontSize: 21,
    fontWeight: "800",
    marginBottom: 18,
  },

  modalScroll: {
    flexShrink: 1,
  },

  infoHeading: {
    color: COLORS.lime,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 8,
    marginBottom: 6,
  },

  infoText: {
    color: "#DDDDDD",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },

  modalButton: {
    backgroundColor: COLORS.pink,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 15,
  },

  modalButtonText: {
    color: COLORS.white,
    fontWeight: "800",
  },

  
dashboardGlyph: {
  width: 22,
  height: 22,
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
  alignContent: "space-between",
},

dashboardGlyphCell: {
  width: 9,
  height: 9,
  borderRadius: 2,
  backgroundColor: "#8A8A8A",
},

profileGlyph: {
  width: 24,
  height: 24,
  alignItems: "center",
  justifyContent: "flex-end",
},

profileGlyphHead: {
  width: 9,
  height: 9,
  borderRadius: 5,
  backgroundColor: "#8989D1",
  marginBottom: 2,
},

profileGlyphShoulders: {
  width: 19,
  height: 10,
  borderTopLeftRadius: 10,
  borderTopRightRadius: 10,
  backgroundColor: "#8989D1",
},

});
