
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />

      <Stack
        initialRouteName="splash"
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: "#171717",
          },
        }}
      >
        <Stack.Screen name="splash" />
        <Stack.Screen name="index" />
        <Stack.Screen name="home" />
        <Stack.Screen name="callback" />
        <Stack.Screen name="topmusic" />
        <Stack.Screen name="profile" />
      </Stack>
    </>
  );
}
