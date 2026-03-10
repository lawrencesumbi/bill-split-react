import { useSignIn } from '@clerk/clerk-expo';
import type { EmailCodeFactor } from '@clerk/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, ImageBackground, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function Login() {
  const router = useRouter()
  const { signIn, setActive, isLoaded } = useSignIn()
  const [email, setEmail] = React.useState('') // Identifier
  const [password, setPassword] = React.useState('')
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false)
  const [code, setCode] = React.useState('')
  const [showEmailCode, setShowEmailCode] = React.useState(false)
  const [clerkErrors, setClerkErrors] = React.useState<any>({})
  const [loginLoading, setLoginloading] = React.useState(false)
  const [verifyLoading, setVerifyLoading] = React.useState(false)

  let messages = clerkErrors.errors || []

  const onSignInPress = React.useCallback(async () => {
    if (!isLoaded) return
    setLoginloading(true)
    try {
      const signInAttempt = await signIn.create({ identifier: email, password })
      setLoginloading(false)
      if (signInAttempt.status === 'complete') {
        await setActive({
          session: signInAttempt.createdSessionId,
          navigate: async () => router.replace('/(dashboardpage)/dashboard'),
        })
      } else if (signInAttempt.status === 'needs_second_factor') {
        const emailCodeFactor = signInAttempt.supportedSecondFactors?.find(
          (factor): factor is EmailCodeFactor => factor.strategy === 'email_code'
        )
        if (emailCodeFactor) {
          await signIn.prepareSecondFactor({ strategy: 'email_code', emailAddressId: emailCodeFactor.emailAddressId })
          setShowEmailCode(true)
        }
      }
    } catch (err) {
      setLoginloading(false)
      setClerkErrors(JSON.parse(JSON.stringify(err, null, 2)))
    }
  }, [isLoaded, signIn, setActive, router, email, password])

  const onVerifyPress = React.useCallback(async () => {
    if (!isLoaded) return
    setVerifyLoading(true)
    try {
      const signInAttempt = await signIn.attemptSecondFactor({ strategy: 'email_code', code })
      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId, navigate: async () => router.replace('/(dashboardpage)/dashboard') })
      } else { setVerifyLoading(false) }
    } catch (err) { setVerifyLoading(false) }
  }, [isLoaded, signIn, setActive, router, code])

  return (
    <View style={styles.mainContainer}>
      <ImageBackground
        source={require('../../assets/images/bg.jpg')}
        style={styles.backgroundImage}
        blurRadius={Platform.OS === 'ios' ? 10 : 5}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.overlay}
        >
          <View style={styles.glassBox}>
            <Pressable 
              style={styles.backButton} 
              onPress={() => router.replace('/')}
            >
              <Ionicons name="chevron-back" size={24} color="#1C1C1E" />
            </Pressable>

            <View style={styles.iconCircle}>
               <Ionicons name="lock-open" size={30} color="tomato" />
            </View>
            
            <Text style={styles.title}>{showEmailCode ? "Verify Code" : "Welcome Back"}</Text>
            <Text style={styles.subtitle}>
              {showEmailCode ? "Check your inbox for a code" : "Log in to manage your bills"}
            </Text>

            {messages.map((message: any, index: number) => (
              <Text key={index} style={styles.errorMessage}>{message.longMessage}</Text>
            ))}

            {!showEmailCode ? (
              <>
                <View style={styles.inputWrapper}>
                  {/* ICON CHANGED TO PERSON-OUTLINE */}
                  <Ionicons name="mail-outline" size={20} color="#999" style={styles.inlineIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email Address" // UPDATED PLACEHOLDER
                    placeholderTextColor="#999"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inlineIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#999"
                    secureTextEntry={!isPasswordVisible}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <Pressable onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                    <Ionicons 
                      name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color="#999" 
                    />
                  </Pressable>
                </View>

                <Pressable onPress={() => router.push('/forgot-password')} style={styles.forgotBtn}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </Pressable>

                <Pressable
                  style={[styles.button, (!email || !password) && styles.buttonDisabled]}
                  onPress={onSignInPress}
                  disabled={!email || !password || loginLoading}
                >
                  {loginLoading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Login</Text>}
                </Pressable>
              </>
            ) : (
              <View style={{ width: '100%' }}>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.input, { textAlign: 'center', letterSpacing: 5 }]}
                    value={code}
                    placeholder="0 0 0 0 0 0"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    onChangeText={setCode}
                  />
                </View>
                <Pressable style={styles.button} onPress={onVerifyPress}>
                   {verifyLoading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Verify</Text>}
                </Pressable>
              </View>
            )}

            <Pressable onPress={() => router.push('/sign-up')} style={styles.signUpContainer}>
              <Text style={styles.footerText}>
                Don't have an account? <Text style={styles.signUpLink}>Sign Up</Text>
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </ImageBackground>
    </View>
  )
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#000' },
  backgroundImage: { flex: 1, height: '100%', width: '100%' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  glassBox: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF5F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#1C1C1E', marginBottom: 5 },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 30, textAlign: 'center' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 55,
    backgroundColor: '#F2F2F7',
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  inlineIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#000' },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotText: { color: 'tomato', fontWeight: '600', fontSize: 14 },
  button: {
    backgroundColor: 'tomato',
    width: '100%',
    height: 55,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'tomato',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  buttonDisabled: { backgroundColor: '#FFA08E' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  errorMessage: { color: '#FF3B30', fontSize: 13, marginBottom: 15, textAlign: 'center' },
  signUpContainer: { marginTop: 25 },
  footerText: { fontSize: 14, color: '#666' },
  signUpLink: { color: 'tomato', fontWeight: '800' },
})