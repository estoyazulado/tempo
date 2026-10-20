
import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  Alert,
  Modal,
} from "react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import RecapCard from "./recapcard";

type TimeRange = "short_term" | "medium_term" | "long_term";

type SpotifyProfile = {
  id: string;
  display_name: string | null;
  images?: { url: string }[];
};

type SpotifyArtist = {
  id: string;
  name: string;
  images: { url: string }[];
};

type SpotifyTrack = {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    id: string;
    name: string;
    images: { url: string }[];
  };
};

type SpotifyList<T> = {
  items: T[];
};

async function spotifyFetch<T>(
  endpoint: string,
  token: string
): Promise<T> {
  const response = await fetch(
    `https://api.spotify.com/v1${endpoint}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        "Your Spotify session expired. Please log in again."
      );
    }

    if (response.status === 403) {
      throw new Error(
        "Spotify denied access. Check your app permissions."
      );
    }

    if (response.status === 429) {
      throw new Error(
        "Spotify rate limit reached. Please try again later."
      );
    }

    throw new Error(`Spotify API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

const COLORS = {
  background: "#252525",
  card: "#8989D1",
  lime: "#BED51D",
  green: "#C5FF00",
  pink: "#D51D91",
  white: "#FFFFFF",
  muted: "#999999",
  border: "#626262",
};

const PERIODS: {
  label: string;
  value: TimeRange;
}[] = [
  { label: "4 weeks", value: "short_term" },
  { label: "6 months", value: "medium_term" },
  { label: "1 year", value: "long_term" },
];

export default function Home() {
  const insets = useSafeAreaInsets();

  const [profile, setProfile] =
    useState<SpotifyProfile | null>(null);

  const [artists, setArtists] =
    useState<SpotifyArtist[]>([]);

  const [tracks, setTracks] =
    useState<SpotifyTrack[]>([]);

  const [timeRange, setTimeRange] =
    useState<TimeRange>("short_term");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const recapCardRef = useRef<View>(null);

  useEffect(() => {
    let active = true;

    async function loadStats() {
      setLoading(true);
      setError("");

      try {
        const token = await SecureStore.getItemAsync(
          "spotify_access_token"
        );

        if (!token) {
          throw new Error(
            "No Spotify access token found. Please log in again."
          );
        }

        const [userData, artistData, trackData] =
          await Promise.all([
            spotifyFetch<SpotifyProfile>("/me", token),

            spotifyFetch<SpotifyList<SpotifyArtist>>(
              `/me/top/artists?limit=50&time_range=${timeRange}`,
              token
            ),

            spotifyFetch<SpotifyList<SpotifyTrack>>(
              `/me/top/tracks?limit=20&time_range=${timeRange}`,
              token
            ),
          ]);

        if (!active) return;

        setProfile(userData);
        setArtists(artistData.items ?? []);
        setTracks(trackData.items ?? []);
      } catch (err) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadStats();

    return () => {
      active = false;
    };
  }, [timeRange]);

  const logout = async () => {
    await SecureStore.deleteItemAsync(
      "spotify_access_token"
    );
    await SecureStore.deleteItemAsync(
      "spotify_refresh_token"
    );

    router.replace("/");
  };

  const shareMusic = () => {
    setShareModalVisible(true);
  };

  const shareRecapAsImage = async () => {
    try {
      if (!recapCardRef.current) {
        Alert.alert("Please wait", "Your recap image is not ready yet.");
        return;
      }

      const sharingAvailable = await Sharing.isAvailableAsync();
      if (!sharingAvailable) {
        Alert.alert(
          "Sharing unavailable",
          "Image sharing is not supported on this device."
        );
        return;
      }

      const uri = await captureRef(recapCardRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });

      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: "Share your Tempo recap",
        UTI: "public.png",
      });
    } catch (err) {
      Alert.alert(
        "Unable to share recap",
        err instanceof Error ? err.message : "Please try again."
      );
    }
  };

  // Estimate the most represented album in the retrieved
  // top tracks. This is not Spotify's official top-album metric.
  const albumCounts = new Map<
    string,
    {
      name: string;
      image: string | null;
      count: number;
    }
  >();

  tracks.forEach((track) => {
    const album = track.album;

    if (!album?.id) return;

    const existing = albumCounts.get(album.id);

    if (existing) {
      existing.count += 1;
    } else {
      albumCounts.set(album.id, {
        name: album.name,
        image: album.images?.[0]?.url ?? null,
        count: 1,
      });
    }
  });

  const topAlbum =
    Array.from(albumCounts.values()).sort(
      (a, b) => b.count - a.count
    )[0] ?? null;

  const firstName =
    profile?.display_name?.trim() || "Music Lover";

  const shortName = firstName.split(/\s+/)[0];

  const renderArtwork = (
    uri: string | undefined,
    size: number,
    rounded = false
  ) => {
    if (!uri) {
      return (
        <View
          style={[
            styles.artworkPlaceholder,
            {
              width: size,
              height: size,
              borderRadius: rounded ? size / 2 : 5,
            },
          ]}
        >
          <Text style={styles.placeholderIcon}>♫</Text>
        </View>
      );
    }

    return (
      <Image
        source={{ uri }}
        style={{
          width: size,
          height: size,
          borderRadius: rounded ? size / 2 : 5,
        }}
      />
    );
  };

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: Math.max(insets.top, 12) },
      ]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>
              Hi {shortName},
            </Text>

            <Text style={styles.subtitle}>
              Ready to explore your music?
            </Text>
          </View>

          
<TouchableOpacity
  style={styles.avatar}
  onPress={() => router.push("/profile")}
  accessibilityLabel="Open profile"
>
  <Text style={styles.avatarText}>
    {shortName.charAt(0).toUpperCase()}
  </Text>
</TouchableOpacity>

        </View>

        {/* TIME FILTER */}
        <View style={styles.periods}>
          {PERIODS.map((period) => {
            const selected =
              timeRange === period.value;

            return (
              <TouchableOpacity
                key={period.value}
                onPress={() =>
                  setTimeRange(period.value)
                }
                style={styles.periodButton}
              >
                <Text
                  style={[
                    styles.periodText,
                    selected && styles.periodTextActive,
                  ]}
                >
                  {period.label}
                </Text>

                {selected && (
                  <View style={styles.periodUnderline} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.separator} />

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator
              size="large"
              color={COLORS.green}
            />
            <Text style={styles.loadingText}>
              Discovering your music...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.messageCard}>
            <Text style={styles.errorTitle}>
              Unable to load your music
            </Text>

            <Text style={styles.errorText}>
              {error}
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={logout}
            >
              <Text style={styles.primaryButtonText}>
                Return to Login
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* TOP ARTIST AND TOP ALBUM */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.cardTitle}>
                  Top artist
                </Text>

                <View style={styles.artistArtwork}>
                  {renderArtwork(
                    artists[0]?.images?.[0]?.url,
                    68,
                    true
                  )}
                </View>

                <Text
                  style={styles.summaryName}
                  numberOfLines={2}
                >
                  {artists[0]?.name ?? "No artist data"}
                </Text>
              </View>

              <View style={styles.summaryCard}>
                <Text style={styles.cardTitle}>
                  Top album
                </Text>

                <View style={styles.albumArtwork}>
                  {renderArtwork(
                    topAlbum?.image ?? undefined,
                    68
                  )}
                </View>

                <Text
                  style={styles.summaryName}
                  numberOfLines={2}
                >
                  {topAlbum?.name ?? "No album data"}
                </Text>
              </View>
            </View>

            {/* TOP SONG */}
            <Text style={styles.sectionTitle}>
              Top song
            </Text>

            <View style={styles.songCard}>
              {renderArtwork(
                tracks[0]?.album?.images?.[0]?.url,
                68
              )}

              <View style={styles.songInfo}>
                <Text
                  style={styles.songName}
                  numberOfLines={2}
                >
                  {tracks[0]?.name ?? "No song data"}
                </Text>

                <Text
                  style={styles.songArtist}
                  numberOfLines={1}
                >
                  {tracks[0]?.artists
                    .map((artist) => artist.name)
                    .join(", ") ?? ""}
                </Text>

                <Text style={styles.songCaption}>
                  Your most-listened-to track
                </Text>
              </View>

              <Text style={styles.musicNote}>♫</Text>
            </View>

            

<TouchableOpacity
  style={styles.viewMoreButton}
  onPress={() => router.push("/topmusic")}
  activeOpacity={0.7}
>
  <Text style={styles.viewMoreText}>View more</Text>
  <Text style={styles.viewMoreArrow}>›</Text>
</TouchableOpacity>

            {/* SIMILAR MUSIC */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitleNoMargin}>
                Similar music to your taste
              </Text>
            </View>

            <View style={styles.similarRow}>
              {tracks.slice(0, 3).map((track) => (
                <View
                  key={track.id}
                  style={styles.similarItem}
                >
                  <View style={styles.similarArtwork}>
                    {renderArtwork(
                      track.album?.images?.[0]?.url,
                      76
                    )}
                  </View>

                  <Text
                    style={styles.similarTitle}
                    numberOfLines={2}
                  >
                    {track.name}
                  </Text>

                  <Text
                    style={styles.similarArtist}
                    numberOfLines={1}
                  >
                    {track.artists
                      .map((artist) => artist.name)
                      .join(", ")}
                  </Text>
                </View>
              ))}
            </View>


{/* SHARE */}
<View style={styles.shareSection}>
  <Text style={styles.shareHeading}>
    Share with friends!
  </Text>

  <TouchableOpacity
    style={styles.shareButton}
    onPress={shareMusic}
    activeOpacity={0.8}
  >
    <View style={styles.shareIcon}>
      <View style={styles.shareLineTop} />
      <View style={styles.shareLineBottom} />
      <View style={styles.shareNodeTop} />
      <View style={styles.shareNodeLeft} />
      <View style={styles.shareNodeBottom} />
    </View>

    <Text style={styles.shareText}>
      Share with friends
    </Text>
  </TouchableOpacity>
</View>

          </>
        )}
      </ScrollView>

      {/* RECAP PREVIEW AND IMAGE SHARING */}
      <Modal
        visible={shareModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setShareModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Preview your recap</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShareModalVisible(false)}
                accessibilityLabel="Close recap preview"
              >
                <Text style={styles.closeText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.previewScroll}
              contentContainerStyle={styles.previewContent}
              showsVerticalScrollIndicator={false}
            >
              <RecapCard
                ref={recapCardRef}
                period={PERIODS.find((period) => period.value === timeRange)?.label ?? "4 weeks"}
                artists={artists}
                tracks={tracks}
                topAlbum={topAlbum}
              />
            </ScrollView>

            <TouchableOpacity
              style={styles.shareImageButton}
              onPress={shareRecapAsImage}
              activeOpacity={0.8}
            >
              <Text style={styles.shareImageButtonText}>Share my recap</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShareModalVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


{/* BOTTOM NAVIGATION */}
<View
  style={[
    styles.bottomNav,
    { paddingBottom: Math.max(insets.bottom, 10) },
  ]}
>
  {/* DASHBOARD */}
  <TouchableOpacity
    style={styles.navItem}
    onPress={() => router.replace("/home")}
    accessibilityLabel="Dashboard"
    accessibilityRole="button"
  >
    <View style={styles.dashboardGlyph}>
      <View style={styles.dashboardGlyphCell} />
      <View style={styles.dashboardGlyphCell} />
      <View style={styles.dashboardGlyphCell} />
      <View style={styles.dashboardGlyphCell} />
    </View>
    <Text style={styles.navLabelActive}>Dashboard</Text>
  </TouchableOpacity>

  {/* PROFILE */}
  <TouchableOpacity
    style={styles.navItem}
    onPress={() => router.push("/profile")}
    accessibilityLabel="Profile"
    accessibilityRole="button"
  >
    <View style={styles.profileGlyph}>
      <View style={styles.profileGlyphHead} />
      <View style={styles.profileGlyphShoulders} />
    </View>
    <Text style={styles.navLabel}>Profile</Text>
  </TouchableOpacity>
</View>

    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollView: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 19,
    paddingTop: 12,
    paddingBottom: 28,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },

  headerText: {
    flex: 1,
  },

  greeting: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: "800",
  },

  subtitle: {
    color: COLORS.green,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#454545",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },

  avatarText: {
    color: COLORS.white,
    fontWeight: "800",
    fontSize: 17,
  },

  periods: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  periodButton: {
    alignItems: "center",
    flex: 1,
    paddingVertical: 5,
  },

  periodText: {
    color: "#858585",
    fontSize: 12,
    fontWeight: "600",
  },

  periodTextActive: {
    color: COLORS.white,
    fontWeight: "800",
  },

  periodUnderline: {
    backgroundColor: COLORS.white,
    height: 2,
    width: "75%",
    marginTop: 9,
    borderRadius: 2,
  },

  separator: {
    height: 1,
    backgroundColor: "#777777",
    marginBottom: 16,
  },

  loading: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 12,
  },

  loadingText: {
    color: COLORS.white,
    fontSize: 13,
  },

  summaryRow: {
    flexDirection: "row",
    gap: 10,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 13,
    padding: 11,
    minHeight: 151,
  },

  cardTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 10,
  },

  artistArtwork: {
    alignItems: "flex-start",
    marginBottom: 9,
  },

  albumArtwork: {
    alignItems: "flex-start",
    marginBottom: 9,
  },

  artworkPlaceholder: {
    backgroundColor: "#A6DDF4",
    alignItems: "center",
    justifyContent: "center",
  },

  placeholderIcon: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
  },

  summaryName: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "800",
  },

  sectionTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 24,
    marginBottom: 10,
  },

  songCard: {
    backgroundColor: COLORS.card,
    borderRadius: 13,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  songInfo: {
    flex: 1,
  },

  songName: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "800",
  },

  songArtist: {
    color: COLORS.white,
    fontSize: 11,
    marginTop: 4,
  },

  songCaption: {
    color: "#ECECFF",
    fontSize: 9,
    marginTop: 6,
  },

  musicNote: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: "800",
  },

  statCard: {
    backgroundColor: COLORS.lime,
    borderRadius: 14,
    padding: 15,
    minHeight: 100,
    justifyContent: "center",
  },

  statHeading: {
    color: "#262626",
    fontSize: 13,
    fontWeight: "800",
  },

  statNumber: {
    color: "#262626",
    fontSize: 29,
    fontWeight: "900",
    marginTop: 2,
  },

  statCaption: {
    color: "#454545",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 23,
    marginBottom: 12,
  },

  sectionTitleNoMargin: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "800",
  },

  similarRow: {
    flexDirection: "row",
    gap: 10,
  },

  similarItem: {
    flex: 1,
    minWidth: 0,
  },

  similarArtwork: {
    marginBottom: 7,
  },

  similarTitle: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "800",
  },

  similarArtist: {
    color: "#BDBDBD",
    fontSize: 9,
    marginTop: 3,
  },

  shareButton: {
    backgroundColor: COLORS.white,
    borderRadius: 13,
    minHeight: 47,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    marginTop: 23,
  },

  shareText: {
    color: "#171717",
    fontSize: 13,
    fontWeight: "800",
  },

  logoutButton: {
    backgroundColor: COLORS.pink,
    borderRadius: 9,
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 14,
  },

  logoutText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
  },

  bottomNav: {
    backgroundColor: "#1D1D1D",
    borderTopWidth: 1,
    borderTopColor: "#3C3C3C",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 10,
  },

  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
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
backgroundColor: "#8989D1", 
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
  backgroundColor: "#8A8A8A",
  marginBottom: 2,
},

profileGlyphShoulders: {
  width: 19,
  height: 10,
  borderTopLeftRadius: 10,
  borderTopRightRadius: 10,
  backgroundColor: "#8A8A8A",
},

navLabelActive: {
 color: "#8989D1" ,
  fontSize: 9,
  fontWeight: "800",
},

navLabel: {
  color: "#8A8A8A",
  fontSize: 9,
},


  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 390,
    maxHeight: "94%",
    backgroundColor: "#252525",
    borderRadius: 20,
    padding: 12,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingBottom: 12,
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#414141",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    color: "#FFFFFF",
    fontSize: 24,
  },
  previewScroll: {
    flexShrink: 1,
  },
  previewContent: {
    alignItems: "center",
    paddingVertical: 4,
  },
  shareImageButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    marginTop: 12,
  },
  shareImageButtonText: {
    color: "#252525",
    fontSize: 14,
    fontWeight: "800",
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 10,
  },
  cancelText: {
    color: "#BBBBBB",
    fontSize: 12,
  },

  messageCard: {
    paddingVertical: 25,
  },

  errorTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 10,
  },

  errorText: {
    color: "#FF8585",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
  },

  primaryButton: {
    backgroundColor: COLORS.green,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },

  primaryButtonText: {
    color: COLORS.background,
    fontWeight: "800",
  },

  
viewMoreButton: {
  flexDirection: "row",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: 5,
  marginTop: 8,
  paddingVertical: 4,
},

viewMoreText: {
  color: "#AAAAAA",
  fontSize: 11,
  textDecorationLine: "underline",
},

viewMoreArrow: {
  color: "#AAAAAA",
  fontSize: 17,
},


shareSection: {
  marginTop: 23,
  marginBottom: 12,
},

shareHeading: {
  color: "#FFFFFF",
  fontSize: 18,
  fontWeight: "800",
  marginBottom: 12,
},

shareIcon: {
  width: 24,
  height: 24,
  marginRight: 8,
  position: "relative",
},

shareLineTop: {
  position: "absolute",
  left: 7,
  top: 6,
  width: 12,
  height: 2,
  backgroundColor: "#252525",
  transform: [{ rotate: "-30deg" }],
},

shareLineBottom: {
  position: "absolute",
  left: 7,
  top: 16,
  width: 12,
  height: 2,
  backgroundColor: "#252525",
  transform: [{ rotate: "30deg" }],
},

shareNodeTop: {
  position: "absolute",
  right: 1,
  top: 1,
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: "#252525",
},

shareNodeLeft: {
  position: "absolute",
  left: 1,
  top: 8,
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: "#252525",
},

shareNodeBottom: {
  position: "absolute",
  right: 1,
  bottom: 1,
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: "#252525",
},


});
