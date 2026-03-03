import { useSignIn } from '@clerk/clerk-expo'
import type { EmailCodeFactor } from '@clerk/types'
import { useRouter } from 'expo-router'
import * as React from 'react'
import { ActivityIndicator, ImageBackground, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

export default function Login() {
  const router = useRouter()
  const { signIn, setActive, isLoaded } = useSignIn()

  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [code, setCode] = React.useState('')
  const [showEmailCode, setShowEmailCode] = React.useState(false)
  const [clerkErrors, setClerkErrors] = React.useState(Object)
  const [loginLoading, setLoginloading] = React.useState(false)

  let messages = []

  // Handle login submission
  const onSignInPress = React.useCallback(async () => {
    if (!isLoaded) return

    setLoginloading(true)

    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      })

      setLoginloading(false)

      if (signInAttempt.status === 'complete') {
        console.log(signInAttempt.status);

        await setActive({
          session: signInAttempt.createdSessionId,
          navigate: async ({ session }) => {
            if (session?.currentTask) {
              console.log(session?.currentTask)
              return
            }
            router.replace('/')
          },
        })
      } else if (signInAttempt.status === 'needs_second_factor') {
        const emailCodeFactor = signInAttempt.supportedSecondFactors?.find(
          (factor): factor is EmailCodeFactor => factor.strategy === 'email_code'
        )

        if (emailCodeFactor) {
          await signIn.prepareSecondFactor({
            strategy: 'email_code',
            emailAddressId: emailCodeFactor.emailAddressId,
          })
          setShowEmailCode(true)
        }
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2))
      }
    } catch (err) {
      setClerkErrors(JSON.parse(JSON.stringify(err, null, 2)))
      console.error(JSON.stringify(err, null, 2))
    }
  }, [isLoaded, signIn, setActive, router, emailAddress, password])

  // Handle email code verification
  const onVerifyPress = React.useCallback(async () => {
    if (!isLoaded) return

    try {
      const signInAttempt = await signIn.attemptSecondFactor({
        strategy: 'email_code',
        code,
      })

      if (signInAttempt.status === 'complete') {
        await setActive({
          session: signInAttempt.createdSessionId,
          navigate: async ({ session }) => {
            if (session?.currentTask) {
              console.log(session?.currentTask)
              return
            }
            router.replace('/')
          },
        })
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2))
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2))
    }
  }, [isLoaded, signIn, setActive, router, code])

  // Show email verification code input if required
  if (showEmailCode) {
    return (
      <View style={styles.mainContainer}>
        <ImageBackground
          source={require('../../assets/images/bg.jpg')}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={styles.overlay}>
            <View style={styles.loginBox}>
              <Text style={styles.title}>Verify Email</Text>
              <Text style={styles.subtitle}>A verification code has been sent to your email.</Text>
              <TextInput
                style={styles.input}
                value={code}
                placeholder="Enter verification code"
                placeholderTextColor="#999"
                keyboardType="numeric"
                onChangeText={setCode}
              />
              <Pressable style={styles.button} onPress={onVerifyPress}>
                <Text style={styles.buttonText}>Verify</Text>
              </Pressable>
            </View>
          </View>
        </ImageBackground>
      </View>
    )
  }

  // Default login form
  return (
    <View style={styles.mainContainer}>
      <ImageBackground
        source={require('../../assets/images/bg.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <View style={styles.loginBox}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Log in to split your bills</Text>
            {
              messages.map((message: any, index: number) => (
                <Text key={index} style={styles.errorMessage}>{message.longMessage}</Text>
              ))
            }
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address or Username</Text>
              <TextInput
                style={styles.input}
                placeholder="test@example.com | Username"
                placeholderTextColor="#999"
                autoCapitalize="none"
                value={emailAddress}
                onChangeText={setEmailAddress}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#999"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <Pressable onPress={() => router.push('/forgot-password')}>
              <Text style={styles.footerText1}> <Text style={styles.link}>Forgot Password?</Text> </Text>
            </Pressable>

            <Pressable
              style={styles.button}
              onPress={onSignInPress}
              disabled={!emailAddress || !password}
            >
              <Text style={styles.buttonText}>{loginLoading ? <ActivityIndicator color="white" /> : "Login"}</Text>
            </Pressable>

            <Pressable onPress={() => router.push('/sign-up')}>
              <Text style={styles.footerText}>
                Don't have an account? <Text style={styles.link1}>Sign Up</Text>
              </Text>
            </Pressable>
          </View>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginBox: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 40,
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
    marginBottom: 30,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
    alignSelf: 'flex-start',
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
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerText1: {
    marginLeft: 190,
    fontSize: 14,
    color: '#666',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  link: {
    color: 'black',
  },
  link1: {
    color: 'tomato',
    fontWeight: 'bold',
  },
})