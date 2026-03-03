import { ThemedText } from '@/components/themed-text'
import { useClerk } from '@clerk/clerk-expo'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native'

export const SignOutButton = () => {
  // Use `useClerk()` to access the `signOut()` function
  const { signOut } = useClerk()
  const router = useRouter()

  const [logoutLoading, setLogoutLoading] = useState(false)

  const handleSignOut = async () => {

    setLogoutLoading(true)

    try {
      await signOut()
      setLogoutLoading(false)
      // Redirect to your desired page
      router.replace('/')
    } catch (err) {
      // See https://clerk.com/docs/guides/development/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2))
    }
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      onPress={handleSignOut}
    >
      <ThemedText style={styles.buttonText}>{logoutLoading ? <ActivityIndicator color="white" /> : "Logout"}</ThemedText>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
})
