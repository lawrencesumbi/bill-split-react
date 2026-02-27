import { SignOutButton } from '@/components/sign-out-button'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { SignedIn, SignedOut, useSession, useUser } from '@clerk/clerk-expo'
import { Link } from 'expo-router'
import { Pressable, StyleSheet } from 'react-native'

// const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

export default function Page() {
  const { user } = useUser()

  // If your user isn't appearing as signed in,
  // it's possible they have session tasks to complete.
  // Learn more: https://clerk.com/docs/guides/configure/session-tasks
  const { session } = useSession()
  console.log(session?.currentTask)

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.text}>Welcome!</ThemedText>
      {/* Show the sign-in and sign-up buttons when the user is signed out */}
      <SignedOut>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}>
          <Link href="/(auth)/sign-in" style={styles.buttonText}>
            <ThemedText>Sign in</ThemedText>
          </Link>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed
          ]}>
          <Link href="/(auth)/sign-up" style={styles.buttonText}>
            <ThemedText>Sign up</ThemedText>
          </Link>
        </Pressable>
      </SignedOut>
      {/* Show the sign-out button when the user is signed in */}
      <SignedIn>
        <ThemedText>Hello {user?.emailAddresses[0].emailAddress}</ThemedText>
        <SignOutButton />
      </SignedIn>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 16,

  },
  text: {
    textAlign: 'center',
    height: 100
  },
  button: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    width: 300,
    alignSelf: 'center'
  },
  buttonPressed: {
    opacity: 0.7
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  }
})
