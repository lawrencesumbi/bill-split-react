import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { useSignUp } from '@clerk/clerk-expo'
import { Link, useRouter } from 'expo-router'
import * as React from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'

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

  // Handle submission of sign-up form
  const onSignUpPress = async () => {
    if (!isLoaded) return
    if (password != confirmPassword) return

    // Start sign-up process using email and password provided
    try {
      await signUp.create({
        firstName,
        lastName,
        emailAddress,
        password,
      })

      // Send user an email with verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })

      // Set 'pendingVerification' to true to display second form
      // and capture code
      setPendingVerification(true)
    } catch (err) {
      // See https://clerk.com/docs/guides/development/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2))
    }
  }

  // React.useEffect(() => {
  //   const insertRecord = async () => {
  //     try {
  //       const { data: users, error } = await supabase.from('users').insert()
  //     }
  //   };
  // })
  const insertRecord = async () => {

  }

  // Handle submission of verification form
  const onVerifyPress = async () => {
    if (!isLoaded) return

    try {
      // Use the code the user provided to attempt verification
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      })

      // If verification was completed, set the session to active
      // and redirect the user
      if (signUpAttempt.status === 'complete') {
        await setActive({
          session: signUpAttempt.createdSessionId,
          navigate: async ({ session }) => {
            if (session?.currentTask) {
              // Handle pending session tasks
              // See https://clerk.com/docs/guides/development/custom-flows/authentication/session-tasks
              console.log(session?.currentTask)
              return
            }

            router.replace('/')
          },
        })
      } else {
        // If the status is not complete, check why. User may need to
        // complete further steps.
        console.error(JSON.stringify(signUpAttempt, null, 2))
      }
    } catch (err) {
      // See https://clerk.com/docs/guides/development/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2))
    }
  }

  if (pendingVerification) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          Verify your email
        </ThemedText>
        <ThemedText style={styles.description}>
          A verification code has been sent to your email.
        </ThemedText>
        <TextInput
          style={styles.input}
          value={code}
          placeholder="Enter your verification code"
          placeholderTextColor="#666666"
          onChangeText={(code) => setCode(code)}
          keyboardType="numeric"
        />
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={onVerifyPress}
        >
          <ThemedText style={styles.buttonText}>Verify</ThemedText>
        </Pressable>
      </ThemedView>
    )
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Sign up
      </ThemedText>
      <ThemedText style={styles.label}>First name</ThemedText>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        value={firstName}
        placeholder="Enter first name"
        placeholderTextColor="#666666"
        onChangeText={(firstName) => setFirstName(firstName)}
        keyboardType="default"
      />
      <ThemedText style={styles.label}>Last name</ThemedText>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        value={lastName}
        placeholder="Enter last name"
        placeholderTextColor="#666666"
        onChangeText={(lastName) => setLastName(lastName)}
        keyboardType="default"
      />
      <ThemedText style={styles.label}>Nickname</ThemedText>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        value={nickname}
        placeholder="Enter nickname"
        placeholderTextColor="#666666"
        onChangeText={(nickname) => setNickname(nickname)}
        keyboardType="default"
      />
      <ThemedText style={styles.label}>Username</ThemedText>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        value={username}
        placeholder="Enter usename"
        placeholderTextColor="#666666"
        onChangeText={(username) => setUsername(username)}
        keyboardType="default"
      />
      <ThemedText style={styles.label}>Email address</ThemedText>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        value={emailAddress}
        placeholder="Enter email"
        placeholderTextColor="#666666"
        onChangeText={(email) => setEmailAddress(email)}
        keyboardType="email-address"
      />
      <ThemedText style={styles.label}>Password</ThemedText>
      <TextInput
        style={styles.input}
        value={password}
        placeholder="Enter password"
        placeholderTextColor="#666666"
        secureTextEntry={true}
        onChangeText={(password) => setPassword(password)}
      />
      <ThemedText style={styles.label}>Confirm password</ThemedText>
      <TextInput
        style={styles.input}
        value={confirmPassword}
        placeholder="Enter confirm password"
        placeholderTextColor="#666666"
        secureTextEntry={true}
        onChangeText={(confirmPassword) => setConfirmPassword(confirmPassword)}
      />
      <Pressable
        style={({ pressed }) => [
          styles.button,
          (!emailAddress || !password || !firstName || !lastName || !nickname || !confirmPassword) && styles.buttonDisabled,
          pressed && styles.buttonPressed,
        ]}
        onPress={onSignUpPress}
        disabled={!emailAddress || !password}
      >
        <ThemedText style={styles.buttonText}>Continue</ThemedText>
      </Pressable>
      <View style={styles.linkContainer}>
        <ThemedText>Have an account? </ThemedText>
        <Link href="/sign-in">
          <ThemedText type="link">Sign in</ThemedText>
        </Link>
      </View>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 12,
  },
  title: {
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    marginBottom: 16,
    opacity: 0.8,
  },
  label: {
    fontWeight: '600',
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    width: 300
  },
  button: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    width: 300
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  linkContainer: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 12,
    alignItems: 'center',
  },
})
