import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    // ClerkProvider is removed, so the app won't look for the missing keys
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(home)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
    </Stack>
  );
}