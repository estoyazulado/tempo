
import React, { forwardRef } from "react";
import {
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Artist = {
  name: string;
  images?: { url: string }[];
};

type Track = {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
};

type RecapAlbum = {
  name: string;
  image: string | null;
};

type RecapCardProps = {
  period: string;
  artists: Artist[];
  tracks: Track[];
  topAlbum: RecapAlbum | null;
};

const COLORS = {
  background: "#202020",
  purple: "#8989D1",
  lime: "#BED51D",
  pink: "#D51D91",
  white: "#FFFFFF",
  muted: "#D4D4D4",
};

const RecapCard = forwardRef<View, RecapCardProps>(
  function RecapCard(
    { period, artists, tracks, topAlbum },
    ref
  ) {
    const topArtist = artists[0];
    const topSong = tracks[0];

    const artwork = (
      uri: string | undefined,
      size: number,
      round = false
    ) => {
      const imageStyle = {
        width: size,
        height: size,
        borderRadius: round ? size / 2 : 8,
      };

      if (uri) {
        return (
          <Image
            source={{ uri }}
            style={imageStyle}
            resizeMode="cover"
          />
        );
      }

      return (
        <View style={[styles.placeholder, imageStyle]}>
          <Text style={styles.placeholderIcon}>♫</Text>
        </View>
      );
    };

    return (
      <View
        ref={ref}
        collapsable={false}
        style={styles.poster}
      >
        {/* BRAND HEADER */}
        <View style={styles.brandHeader}>
          <Text style={styles.brand}>TEMPO</Text>
          <View style={styles.brandAccent} />
        </View>

        <Text style={styles.eyebrow}>YOUR PERSONAL MUSIC RECAP</Text>
        <Text style={styles.heading}>YOUR MUSIC.</Text>
        <Text style={styles.headingAccent}>YOUR VIBE.</Text>

        <View style={styles.periodBadge}>
          <Text style={styles.periodText}>
            LISTENING PERIOD · {period.toUpperCase()}
          </Text>
        </View>

        {/* TOP ARTIST AND ALBUM */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.cardLabel}>01 / TOP ARTIST</Text>

            {artwork(
              topArtist?.images?.[0]?.url,
              88,
              true
            )}

            <Text style={styles.itemName} numberOfLines={2}>
              {topArtist?.name ?? "No artist data"}
            </Text>

            <Text style={styles.itemCaption}>
              YOUR MOST-LISTENED ARTIST
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.cardLabel}>02 / TOP ALBUM</Text>

            {artwork(topAlbum?.image ?? undefined, 88)}

            <Text style={styles.itemName} numberOfLines={2}>
              {topAlbum?.name ?? "No album data"}
            </Text>

            <Text style={styles.itemCaption}>
              FROM YOUR TOP TRACKS
            </Text>
          </View>
        </View>

        {/* TOP SONG */}
        <View style={styles.songCard}>
          <Text style={styles.cardLabel}>03 / TOP SONG</Text>

          <View style={styles.songRow}>
            {artwork(
              topSong?.album?.images?.[0]?.url,
              78
            )}

            <View style={styles.songInfo}>
              <Text style={styles.songTitle} numberOfLines={3}>
                {topSong?.name ?? "No song data"}
              </Text>

              <Text style={styles.songArtist} numberOfLines={2}>
                {topSong?.artists
                  .map((artist) => artist.name)
                  .join(", ") ?? ""}
              </Text>
            </View>

            <Text style={styles.note}>♫</Text>
          </View>
        </View>

        {/* SIMILAR MUSIC */}
        <View style={styles.similarSection}>
          <Text style={styles.similarHeading}>
            ON REPEAT
          </Text>
          <Text style={styles.similarSubtitle}>
            MORE OF YOUR MUSIC TASTE
          </Text>

          <View style={styles.similarRow}>
            {tracks.slice(0, 3).map((track, index) => (
              <View key={track.id} style={styles.similarItem}>
                {artwork(
                  track.album?.images?.[0]?.url,
                  94
                )}

                <Text style={styles.similarIndex}>
                  TRACK 0{index + 1}
                </Text>

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
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <View style={styles.footerLine} />

          <Text style={styles.footerTitle}>
            MUSIC IS A PART OF YOU.
          </Text>

          <Text style={styles.footerText}>
            MY MUSIC, MY STORY.
          </Text>

          <Text style={styles.footerBrand}>
            TEMPO  /  MUSIC TRACKER
          </Text>
        </View>
      </View>
    );
  }
);

export default RecapCard;

const styles = StyleSheet.create({
  poster: {
    width: 320,
    alignSelf: "center",
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 4,
  },

  brandHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    marginBottom: 19,
  },

  brand: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 4,
  },

  brandAccent: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.pink,
  },

  eyebrow: {
    color: COLORS.lime,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.4,
  },

  heading: {
    color: COLORS.white,
    fontSize: 31,
    fontWeight: "900",
    letterSpacing: -1,
    lineHeight: 34,
  },

  headingAccent: {
    color: COLORS.pink,
    fontSize: 31,
    fontWeight: "900",
    letterSpacing: -1,
    lineHeight: 34,
  },

  periodBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#343434",
    paddingHorizontal: 9,
    paddingVertical: 7,
    marginTop: 12,
    marginBottom: 15,
  },

  periodText: {
    color: COLORS.white,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  summaryRow: {
    flexDirection: "row",
    gap: 9,
    marginBottom: 10,
  },

  summaryCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: COLORS.purple,
    borderRadius: 12,
    padding: 10,
  },

  cardLabel: {
    color: COLORS.white,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.4,
    marginBottom: 11,
  },

  placeholder: {
    backgroundColor: "#B7DFF1",
    justifyContent: "center",
    alignItems: "center",
  },

  placeholderIcon: {
    color: COLORS.white,
    fontSize: 31,
    fontWeight: "800",
  },

  itemName: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "900",
    marginTop: 10,
  },

  itemCaption: {
    color: COLORS.white,
    fontSize: 7,
    marginTop: 5,
    opacity: 0.85,
  },

  songCard: {
    backgroundColor: COLORS.purple,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },

  songRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  songInfo: {
    flex: 1,
    minWidth: 0,
  },

  songTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "900",
  },

  songArtist: {
    color: COLORS.white,
    fontSize: 10,
    marginTop: 5,
  },

  note: {
    color: COLORS.white,
    fontSize: 23,
    fontWeight: "900",
  },


  similarSection: {
    marginBottom: 15,
  },

  similarHeading: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  similarSubtitle: {
    color: COLORS.pink,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 3,
    marginBottom: 11,
  },

  similarRow: {
    flexDirection: "row",
    gap: 8,
  },

  similarItem: {
    flex: 1,
    minWidth: 0,
  },

  similarIndex: {
    color: COLORS.lime,
    fontSize: 7,
    fontWeight: "800",
    marginTop: 7,
  },

  similarTitle: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "800",
    marginTop: 3,
  },

  similarArtist: {
    color: COLORS.muted,
    fontSize: 8,
    marginTop: 3,
  },

  footer: {
    alignItems: "center",
    marginTop: 2,
  },

  footerLine: {
    width: "100%",
    height: 2,
    backgroundColor: COLORS.pink,
    marginBottom: 13,
  },

  footerTitle: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.7,
    textAlign: "center",
  },

  footerText: {
    color: COLORS.lime,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.3,
    marginTop: 5,
  },

  footerBrand: {
    color: COLORS.muted,
    fontSize: 7,
    letterSpacing: 1.2,
    marginTop: 12,
  },
});
