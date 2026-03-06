import { ThemedText } from '@/components/themed-text'
import { supabase } from '@/utils/supabase'
import { useOrganization, useSignUp } from '@clerk/clerk-expo'
import { Link, useRouter } from 'expo-router'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import validator from 'validator'


import * as React from 'react'
import {
  ImageBackground
} from 'react-native'

export default function Page() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()
  const { organization } = useOrganization()

  const [data, setData] = React.useState([])
  const [firstName, setFirstName] = React.useState('')
  const [lastName, setLastName] = React.useState('')
  const [nickname, setNickname] = React.useState('')
  const [username, setUsername] = React.useState('')
  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [pendingVerification, setPendingVerification] = React.useState(false)
  const [verificationLoading, setVerificationLoading] = React.useState(false)
  const [code, setCode] = React.useState('')
  const [errors, setErrors] = React.useState({} as any)
  const [clerkErrors, setClerkErrors] = React.useState(Object)
  const [users, setUsers] = React.useState([])
  const [signupLoading, setSignupLoading] = React.useState(false)

  console.log(organization?.getRoles({
    pageSize: 20,
    initialPage: 1
  }));

  React.useEffect(() => {
    const getUsers = async () => {
      try {
        const { data: clerk_users, error } = await supabase.from('clerk_users').select()

        if (error) {
          console.error('Error fetching users:', error.message);
          return;
        }

        if (clerk_users && clerk_users.length > 0) {
          setUsers(clerk_users);
        }
      } catch (error) {
        console.error('Error fetching users:', error.message);
      }
    };

    getUsers()
  }, [])

  let messages = []

  if (clerkErrors.errors) {
    messages = clerkErrors.errors
  }

  const handleSubmit = () => {
    if (validateForm()) {
      onSignUpPress()
    }
  }

  const validateForm = () => {
    let errors = {} as any;

    if (validator.isEmpty(firstName)) errors.firstName = "First name is required."
    if (validator.isEmpty(lastName)) errors.lastName = "Last name is required."
    if (validator.isEmpty(nickname)) errors.nickname = "Nickname is required."

    for (let user of users) {
      if (validator.equals(nickname, user.nickname)) {
        errors.nicknameExists = "Nickname already exists."
        break;
      }
    }

    if (validator.isEmpty(username)) errors.username = "Username is required."
    if (validator.isEmpty(emailAddress)) errors.emailAddress = "Email address is required."
    if (!validator.isEmail(emailAddress)) errors.emailFormat = "Email must be a correct format."
    if (validator.isEmpty(password)) errors.password = "Password is required."
    if (password.length < 8) errors.passwordTooShort = "Password must be at least 8 characters."
    if (password.length > 16) errors.passwordTooLong = "Password must not exceed 16 characters."
    if (!validator.isStrongPassword(password)) errors.passwordTooWeak = "Password must be a combination of at least one upper case and lower case characters, special characters and number."

    if (!validator.equals(confirmPassword, password)) {
      errors.passwordDoesntMatch = "Password does not match."
      setConfirmPassword("")
    }

    setErrors(errors)
    return Object.keys(errors).length === 0;
  }

  const onSignUpPress = async () => {
    if (!isLoaded) return

    setSignupLoading(true)

    try {
      await signUp.create({
        firstName,
        lastName,
        username,
        emailAddress,
        password,
      })

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setPendingVerification(true)
      setSignupLoading(false)
    } catch (err) {
      // See https://clerk.com/docs/guides/development/custom-flows/error-handling
      // for more info on error handling

      setClerkErrors(JSON.parse(JSON.stringify(err, null, 2)))
      console.error(JSON.stringify(err, null, 2))
      setSignupLoading(false)
    }
  }


  const onVerifyPress = async () => {
    if (!isLoaded) return

    setVerificationLoading(true)

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      })

      if (signUpAttempt.status === 'complete') {

        const { error } = await supabase.from('clerk_users').insert({ clerk_user_id: signUpAttempt.createdUserId, nickname: nickname })

        if (error) {
          console.log(error.message)
        }
        await setActive({
          session: signUpAttempt.createdSessionId,
          navigate: async ({ session }) => {
            if (session?.currentTask) {
              console.log(session?.currentTask)
              return
            }

            setVerificationLoading(false)

            router.replace('/')
          },
        })
      } else {
        console.error(JSON.stringify(signUpAttempt, null, 2))
        setVerificationLoading(false)
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2))
      setVerificationLoading(false)
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
                  <ThemedText style={styles.buttonText}>{verificationLoading ? <ActivityIndicator color="white" /> : "Verify"}</ThemedText>
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
              {
                messages.map((message: any, index: number) => (
                  <Text key={index} style={styles.errorMessage}>{message.longMessage}</Text>
                ))
              }
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>First Name</ThemedText>
                <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} />
                {
                  errors.firstName ? <Text style={styles.errorMessage}>{errors.firstName}</Text> : null
                }
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>Last Name</ThemedText>
                <TextInput style={styles.input} value={lastName} onChangeText={setLastName} />
                {
                  errors.lastName ? <Text style={styles.errorMessage}>{errors.lastName}</Text> : null
                }
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>Nickname</ThemedText>
                <TextInput style={styles.input} value={nickname} onChangeText={setNickname} />
                {
                  errors.nickname ? <Text style={styles.errorMessage}>{errors.nickname}</Text> : null
                }
                {
                  errors.nicknameExists ? <Text style={styles.errorMessage}>{errors.nicknameExists}</Text> : null
                }
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>Username</ThemedText>
                <TextInput style={styles.input} value={username} onChangeText={setUsername} />
                {
                  errors.username ? <Text style={styles.errorMessage}>{errors.username}</Text> : null
                }
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
                {
                  errors.emailAddress ? <Text style={styles.errorMessage}>{errors.emailAddress}</Text> : null
                }
                {
                  errors.emailFormat ? <Text style={styles.errorMessage}>{errors.emailFormat}</Text> : null
                }
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>Password</ThemedText>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
                {
                  errors.password ? <Text style={styles.errorMessage}>{errors.password}</Text> : null
                }
                {
                  errors.passwordTooShort ? <Text style={styles.errorMessage}>{errors.passwordTooShort}</Text> : null
                }
                {
                  errors.passwordTooLong ? <Text style={styles.errorMessage}>{errors.passwordTooLong}</Text> : null
                }
                {
                  errors.passwordTooWeak ? <Text style={styles.errorMessage}>{errors.passwordTooWeak}</Text> : null
                }
                {
                  errors.passwordDoesntMatch ? <Text style={styles.errorMessage}>{errors.passwordDoesntMatch}</Text> : null
                }
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>Confirm Password</ThemedText>
                <TextInput
                  style={styles.input}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />

              </View>

              <Pressable style={styles.button} onPress={handleSubmit}>
                <ThemedText style={styles.buttonText}>{signupLoading ? <ActivityIndicator color="white" /> : "Sign up"}</ThemedText>
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
  errorMessage: {
    color: 'red',
  }
})
