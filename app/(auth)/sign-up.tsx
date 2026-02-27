import { ThemedText } from '@/components/themed-text'
import { useSignUp } from '@clerk/clerk-expo'
import { Link, useRouter } from 'expo-router'
import * as React from 'react'
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View
} from 'react-native'

export default function Page() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()

  const [firstName, setFirstName] = React.useState('')
  const [lastName, setLastName] = React.useState('')
  const [nickname, setNickname] = React.useState('')
  const [username, setUsername] = React.useState('')
  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [pendingVerification, setPendingVerification] = React.useState(false)
  const [code, setCode] = React.useState('')

  const onSignUpPress = async () => {
    if (!isLoaded) return
    if (password != confirmPassword) return

    try {
      await signUp.create({
        firstName,
        lastName,
        emailAddress,
        password,
      })

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setPendingVerification(true)
    } catch (err) {
      console.error(JSON.stringify(err, null, 2))
    }
  }


  const onVerifyPress = async () => {
    if (!isLoaded) return

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      })

      if (signUpAttempt.status === 'complete') {
        await setActive({
          session: signUpAttempt.createdSessionId,
          navigate: async ({ session }) => {
            if (session?.currentTask) {
              console.log(session?.currentTask)
              return
            }
            router.replace('/')
          },
        })
      } else {
        console.error(JSON.stringify(signUpAttempt, null, 2))
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2))
    }
  }


  if (pendingVerification) {
    return (
      <View style={styles.mainContainer}>
        <ImageBackground
          source={require('../../assets/images/bg.jpg')}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={styles.overlay}>
            <View style={styles.scrollContent}>
              <View style={styles.registerBox}>
                <ThemedText type="title" style={styles.title}>
                  Verify Email
                </ThemedText>
                <ThemedText style={styles.subtitle}>
                  Enter the code sent to your email
                </ThemedText>

                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={code}
                    placeholder="Verification Code"
                    placeholderTextColor="#999"
                    onChangeText={setCode}
                    keyboardType="numeric"
                  />
                </View>

                <Pressable style={styles.button} onPress={onVerifyPress}>
                  <ThemedText style={styles.buttonText}>Verify</ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </ImageBackground>
      </View>
    )
  }


  // SIGN UP UI (UNCHANGED)
  // =============================
  return (
    <View style={styles.mainContainer}>
      <ImageBackground
        source={require('../../assets/images/bg.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.registerBox}>
              <ThemedText type="title" style={styles.title}>
                Create Account
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                Join Bill Splitter and start saving time
              </ThemedText>

              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>First Name</ThemedText>
                <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} />
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>Last Name</ThemedText>
                <TextInput style={styles.input} value={lastName} onChangeText={setLastName} />
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>Nickname</ThemedText>
                <TextInput style={styles.input} value={nickname} onChangeText={setNickname} />
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>Username</ThemedText>
                <TextInput style={styles.input} value={username} onChangeText={setUsername} />
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>Email Address</ThemedText>
                <TextInput
                  style={styles.input}
                  value={emailAddress}
                  onChangeText={setEmailAddress}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>Password</ThemedText>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>Confirm Password</ThemedText>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>

              <Pressable style={styles.button} onPress={onSignUpPress}>
                <ThemedText style={styles.buttonText}>Sign Up</ThemedText>
              </Pressable>

              <Link href="/sign-in" asChild>
                <Pressable>
                  <ThemedText style={styles.footerText}>
                    Already have an account?{' '}
                    <ThemedText style={styles.link}>Sign In</ThemedText>
                  </ThemedText>
                </Pressable>
              </Link>
            </View>
          </ScrollView>
        </View>
      </ImageBackground>
    </View>
  )
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  registerBox: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 25,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    color: '#000'
  },
  button: {
    backgroundColor: 'tomato', 
    width: '100%',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  link: {
    color: 'tomato',
    fontWeight: 'bold',
  },
})