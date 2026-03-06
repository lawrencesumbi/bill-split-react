import { ThemedText } from '@/components/themed-text'
import { SignedIn, SignedOut, useSession, useUser } from '@clerk/clerk-expo'
import { Link } from 'expo-router'
import * as React from 'react'
import { ImageBackground, Pressable, StyleSheet, View } from 'react-native'


// const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

export default function Page() {
  const { user } = useUser()
  const { session } = useSession()

  console.log(session?.currentTask)

  return (
    <ImageBackground
      source={require('../../assets/images/bg.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>

          <ThemedText type="title" style={styles.title}>
            Welcome to Bill Splitter
          </ThemedText>

          <ThemedText style={styles.tagline}>
            Spend more time eating, less time calculating
          </ThemedText>

          {/* Signed Out UI */}
          <SignedOut>
            <View style={styles.view}>
            <Pressable style={styles.button}>
              <Link href="/(auth)/sign-in" style={styles.buttonText}>
                <ThemedText style={styles.buttonText}>Sign In</ThemedText>
              </Link>
            </Pressable>

            <Pressable style={styles.button}>
              <Link href="/(auth)/sign-up" style={styles.buttonText}>
                <ThemedText style={styles.buttonText}>Sign Up</ThemedText>
              </Link>
            </Pressable>
            </View>
            {/* <View style={{ marginTop: 20 }}>
              <SignOutButton />
            </View> */}
          </SignedOut>

          {/* Signed In UI */}
          <SignedIn>
            <Pressable style={styles.button}>
              <Link href="/(dashboardpage)/dashboard" style={styles.buttonText}>
                <ThemedText style={styles.buttonText}>Dashboard</ThemedText>
              </Link>
            </Pressable>
          </SignedIn>

        </View>
      </View>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 48,
    color: '#fff',
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
  },
  tagline: {
    fontSize: 20,
    color: '#ddd',
    textAlign: 'center',
    marginBottom: 40,
    maxWidth: 600,
  },
  button: {
    backgroundColor: 'tomato',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 50,
    marginTop: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  welcomeText: {
    fontSize: 18,
    color: '#fff',
    marginTop: 20,
  },
  view: {
    flex: 1,
    flexDirection: 'row',
    gap: 10
  }
})