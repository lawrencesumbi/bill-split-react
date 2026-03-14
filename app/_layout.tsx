import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { Stack } from "expo-router";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <Stack screenOptions={{ headerShown: false}}>
        <Stack.Screen name="(home)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack>
    </ClerkProvider>
  );
}
