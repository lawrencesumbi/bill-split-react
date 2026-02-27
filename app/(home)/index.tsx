import { SignOutButton } from '@/components/sign-out-button'
import { ThemedText } from '@/components/themed-text'
import { SignedIn, SignedOut, useSession, useUser } from '@clerk/clerk-expo'
import { Link } from 'expo-router'
import { ImageBackground, Pressable, StyleSheet, View } from 'react-native'

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
          </SignedOut>

          {/* Signed In UI */}
          <SignedIn>
            <ThemedText style={styles.welcomeText}>
              Hello {user?.emailAddresses[0].emailAddress}
            </ThemedText>

            <View style={{ marginTop: 20 }}>
              <SignOutButton />
            </View>
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
  }
})