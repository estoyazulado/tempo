
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TimeRange = "short_term" | "medium_term" | "long_term";
type MusicTab = "songs" | "albums";

type Artist = {
  name: string;
};

type Album = {
  id: string;
  name: string;
  images: { url: string }[];
  artists: Artist[];
};

type Track = {
  id: string;
  name: string;
  artists: Artist[];
  album: Album;
};

type SpotifyResponse<T> = {
  items: T[];
};

const PERIODS: { label: string; value: TimeRange }[] = [
  { label: "4 weeks", value: "short_term" },
  { label: "6 months", value: "medium_term" },
  { label: "1 year", value: "long_term" },
];

const COLORS = {
  background: "#252525",
  purple: "#8989D1",
  white: "#FFFFFF",
  muted: "#AAAAAA",
  green: "#C5FF00",
  border: "#484848",
};

async function fetchSpotify<T>(
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
      throw new Error("Your Spotify session has expired. Please log in again.");
    }

    if (response.status === 403) {
      throw new Error("Spotify denied access to this data.");
    }

    if (response.status === 429) {
      throw new Error("Spotify rate limit reached. Please try again.");
    }

    throw new Error(`Spotify API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export default function TopMusic() {
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState<MusicTab>("songs");
  const [period, setPeriod] =
    useState<TimeRange>("short_term");

  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadMusic() {
      setLoading(true);
      setError("");

      try {
        const token = await SecureStore.getItemAsync(
          "spotify_access_token"
        );

        if (!token) {
          throw new Error(
            "No Spotify login found. Please log in again."
          );
        }

        const result = await fetchSpotify<
          SpotifyResponse<Track>
        >(
          `/me/top/tracks?limit=50&time_range=${period}`,
          token
        );

        if (active) {
          setTracks(result.items ?? []);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load your music."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadMusic();

    return () => {
      active = false;
    };
  }, [period]);

  // Build album rankings from the user's top tracks.
  // Each album appears once; count how many top tracks
  // belong to it, then sort by that count.
  const topAlbums = useMemo(() => {
    const albumMap = new Map<
      string,
      { album: Album; count: number; firstIndex: number }
    >();

    tracks.forEach((track, index) => {
      const album = track.album;

      if (!album?.id) return;

      const existing = albumMap.get(album.id);

      if (existing) {
        existing.count += 1;
      } else {
        albumMap.set(album.id, {
          album,
          count: 1,
          firstIndex: index,
        });
      }
    });

    return Array.from(albumMap.values())
      .sort(
        (a, b) =>
          b.count - a.count ||
          a.firstIndex - b.firstIndex
      )
      .slice(0, 10);
  }, [tracks]);

  const displayedTracks = tracks.slice(0, 10);

  const logout = async () => {
    await SecureStore.deleteItemAsync("spotify_access_token");
    await SecureStore.deleteItemAsync("spotify_refresh_token");
    router.replace("/");
  };

  const renderArtwork = (url?: string) => {
    if (url) {
      return (
        <Image
          source={{ uri: url }}
          style={styles.artwork}
        />
      );
    }

    return (
      <View style={[styles.artwork, styles.placeholder]}>
        <Text style={styles.placeholderText}>♫</Text>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: Math.max(insets.top, 12) },
      ]}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityLabel="Go back"
        >
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>

        <View style={styles.headerText}>
          <Text style={styles.heading}>Your Top Music</Text>
          <Text style={styles.subtitle}>
            Explore your listening taste
          </Text>
        </View>
      </View>

      {/* SONGS / ALBUMS TABS */}
      <View style={styles.tabs}>
        {(["songs", "albums"] as MusicTab[]).map(
          (item) => {
            const selected = tab === item;

            return (
              <TouchableOpacity
                key={item}
                style={[
                  styles.tab,
                  selected && styles.activeTab,
                ]}
                onPress={() => setTab(item)}
              >
                <Text
                  style={[
                    styles.tabText,
                    selected && styles.activeTabText,
                  ]}
                >
                  {item === "songs" ? "Songs" : "Albums"}
                </Text>
              </TouchableOpacity>
            );
          }
        )}
      </View>

      {/* TIME FILTERS */}
      <View style={styles.periods}>
        {PERIODS.map((item) => {
          const selected = period === item.value;

          return (
            <TouchableOpacity
              key={item.value}
              style={styles.periodButton}
              onPress={() => setPeriod(item.value)}
            >
              <Text
                style={[
                  styles.periodText,
                  selected && styles.activePeriodText,
                ]}
              >
                {item.label}
              </Text>

              {selected && (
                <View style={styles.periodUnderline} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.divider} />

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.listHeading}>
          {tab === "songs" ? "Top 10 songs" : "Top 10 albums"}
        </Text>

        <Text style={styles.listSubtitle}>
          {period === "short_term"
            ? "Your recent listening"
            : period === "medium_term"
            ? "Your music over the last 6 months"
            : "Your longer-term listening taste"}
        </Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={COLORS.green}
            style={{ marginTop: 40 }}
          />
        ) : error ? (
          <View style={styles.message}>
            <Text style={styles.errorText}>{error}</Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={logout}
            >
              <Text style={styles.retryText}>
                Return to Login
              </Text>
            </TouchableOpacity>
          </View>
        ) : tab === "songs" ? (
          displayedTracks.length > 0 ? (
            displayedTracks.map((track, index) => (
              <View key={track.id} style={styles.musicRow}>
                <Text style={styles.rank}>{index + 1}</Text>

                {renderArtwork(
                  track.album?.images?.[0]?.url
                )}

                <View style={styles.musicInfo}>
                  <Text
                    style={styles.musicTitle}
                    numberOfLines={2}
                  >
                    {track.name}
                  </Text>

                  <Text
                    style={styles.musicSubtitle}
                    numberOfLines={1}
                  >
                    {track.artists
                      .map((artist) => artist.name)
                      .join(", ")}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>
              No top songs were returned for this period.
            </Text>
          )
        ) : topAlbums.length > 0 ? (
          topAlbums.map(({ album, count }, index) => (
            <View key={album.id} style={styles.musicRow}>
              <Text style={styles.rank}>{index + 1}</Text>

              {renderArtwork(album.images?.[0]?.url)}

              <View style={styles.musicInfo}>
                <Text
                  style={styles.musicTitle}
                  numberOfLines={2}
                >
                  {album.name}
                </Text>

                <Text
                  style={styles.musicSubtitle}
                  numberOfLines={1}
                >
                  {album.artists
                    ?.map((artist) => artist.name)
                    .join(", ")}
                </Text>

                <Text style={styles.albumCount}>
                  {count}{" "}
                  {count === 1 ? "track" : "tracks"} in your
                  top songs
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.empty}>
            No albums were found in your top tracks.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingBottom: 22,
    gap: 12,
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#383838",
    justifyContent: "center",
    alignItems: "center",
  },

  backArrow: {
    color: COLORS.white,
    fontSize: 32,
    lineHeight: 34,
  },

  headerText: {
    flex: 1,
  },

  heading: {
    color: COLORS.white,
    fontSize: 23,
    fontWeight: "800",
  },

  subtitle: {
    color: COLORS.green,
    fontSize: 12,
    marginTop: 4,
  },

  tabs: {
    flexDirection: "row",
    marginHorizontal: 18,
    backgroundColor: "#353535",
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },

  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 9,
  },

  activeTab: {
    backgroundColor: COLORS.purple,
  },

  tabText: {
    color: "#C4C4C4",
    fontSize: 14,
    fontWeight: "600",
  },

  activeTabText: {
    color: COLORS.white,
    fontWeight: "800",
  },

  periods: {
    flexDirection: "row",
    marginHorizontal: 18,
    marginTop: 20,
  },

  periodButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 9,
  },

  periodText: {
    color: COLORS.muted,
    fontSize: 12,
  },

  activePeriodText: {
    color: COLORS.white,
    fontWeight: "800",
  },

  periodUnderline: {
    width: "75%",
    height: 2,
    backgroundColor: COLORS.white,
    marginTop: 9,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 18,
  },

  list: {
    flex: 1,
  },

  listContent: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 35,
  },

  listHeading: {
    color: COLORS.white,
    fontSize: 19,
    fontWeight: "800",
  },

  listSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 5,
    marginBottom: 22,
  },

  musicRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 17,
  },

  rank: {
    width: 20,
    color: COLORS.green,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },

  artwork: {
    width: 58,
    height: 58,
    borderRadius: 7,
    backgroundColor: COLORS.purple,
  },

  placeholder: {
    alignItems: "center",
    justifyContent: "center",
  },

  placeholderText: {
    color: COLORS.white,
    fontSize: 27,
  },

  musicInfo: {
    flex: 1,
  },

  musicTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },

  musicSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 5,
  },

  albumCount: {
    color: COLORS.purple,
    fontSize: 11,
    marginTop: 5,
  },

  empty: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 15,
    lineHeight: 20,
  },

  message: {
    marginTop: 20,
  },

  errorText: {
    color: "#FF8585",
    fontSize: 13,
    lineHeight: 20,
  },

  retryButton: {
    marginTop: 18,
    backgroundColor: COLORS.green,
    borderRadius: 10,
    alignItems: "center",
    padding: 13,
  },

  retryText: {
    color: COLORS.background,
    fontWeight: "800",
  },
});
