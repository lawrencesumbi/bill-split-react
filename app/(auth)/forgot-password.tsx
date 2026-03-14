import { useSignIn } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, ImageBackground, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import validator from 'validator';

export default function ForgotPassword() {
  const { signIn, setActive } = useSignIn()
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [code, setCode] = React.useState('');
  const [successfulCreation, setSuccessfulCreation] = React.useState(false)
  const [showCodeInput, setShowCodeInput] = React.useState(false);
  const [errors, setErrors] = React.useState({})
  const [emailRequestLoading, setEmailRequestLoading] = React.useState(false)
  const [codeSubmitLoading, setCodeSubmitLoading] = React.useState(false)
  const [clerkErrors, setClerkErrors] = React.useState(Object)
  const [codeAccepted, setCodeAccepted] = React.useState(false)
  const [resetPasswordLoading, setResetPasswordLoading] = React.useState(false)

  let messages = []
  if (clerkErrors.errors) {
    messages = clerkErrors.errors
  }

  // --- LOGIC (REMAINING UNTOUCHED AS REQUESTED) ---
  const handleSubmit = () => {
    if(validateForm()) {
      onReset()
    }
  }

  const validateForm = () => {
    let errors = {}
    if(validator.isEmpty(password)) errors.password = "You must enter a new password"
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

  const validateEmail = () => {
    let errors = {}
    if (validator.isEmpty(email)) errors.email = "Email must not be empty"
    setErrors(errors)
    return Object.keys(errors).length === 0;
  }

  const validateCodeAndPass = () => {
    let errors = {}
    if(validator.isEmpty(code)) errors.code = "Code must not be empty."
    setErrors(errors)
    return Object.keys(errors).length === 0;
  }

  const onRequestReset = async () => {
    if(validateEmail()) {
      setEmailRequestLoading(true)
      console.log(email)
      try {
        await signIn!.create({
          strategy: 'reset_password_email_code',
          identifier: email
        })
        setEmailRequestLoading(false)
        setSuccessfulCreation(true)
      } catch(err: any) {
        setClerkErrors(err)
        setEmailRequestLoading(false)
        console.error(JSON.stringify(err, null, 2))
        console.log("error")
      }
    }
  };

  const onReset = async () => {
    if(validateCodeAndPass()) {
      setCodeSubmitLoading(true)
      try {
        const result = await signIn!.attemptFirstFactor({
          strategy: 'reset_password_email_code',
          code,
          password
        })
        setCodeSubmitLoading(false)
        router.replace('/')
        await setActive!({ session: result.createdSessionId })
      } catch (err: any) {
        setClerkErrors(err)
        console.error(JSON.stringify(err, null, 2))
        setCodeSubmitLoading(false)
      }
    }
  };

  // --- MODERNIZED UI ---
  return (
    <View style={styles.mainContainer}>
      <ImageBackground 
        source={require('../../assets/images/bg.jpg')} 
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.overlay}
        >
          <View style={styles.cardBox}>
            {/* Native-style Back Button */}
            <Pressable 
              style={styles.absBackButton} 
              onPress={() => successfulCreation ? setSuccessfulCreation(false) : router.back()}
            >
              <Ionicons name="chevron-back" size={28} color="#1C1C1E" />
            </Pressable>

            {!successfulCreation ? (
              <View style={styles.fullWidth}>
                <Text style={styles.title}>Reset Password</Text>
                <Text style={styles.subtitle}>Enter your email to receive a verification code.</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput 
                    style={[styles.input, errors.email && styles.inputError]} 
                    placeholder="name@example.com" 
                    placeholderTextColor="#AEAEB2"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                  {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                </View>

                <Pressable style={styles.primaryButton} onPress={onRequestReset}>
                  {emailRequestLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send Code</Text>}
                </Pressable>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={styles.fullWidth}>
                <Text style={styles.title}>Verification</Text>
                <Text style={styles.subtitle}>Check your inbox for the 6-digit code.</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Code</Text>
                  <TextInput 
                    style={[styles.input, (errors.code || messages.length > 0) && styles.inputError]} 
                    placeholder="000000" 
                    placeholderTextColor="#AEAEB2"
                    keyboardType="numeric"
                    value={code}
                    onChangeText={setCode}
                  />
                  {errors.code && <Text style={styles.errorText}>{errors.code}</Text>}
                  {messages.map((m, i) => <Text key={i} style={styles.errorText}>{m.longMessage}</Text>)}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>New Password</Text>
                  <TextInput
                    style={[styles.input, (errors.password || errors.passwordTooShort || errors.passwordTooLong || errors.passwordTooWeak) && styles.inputError]}
                    placeholder="••••••••"
                    placeholderTextColor="#AEAEB2"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                  {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                  {errors.passwordTooShort && <Text style={styles.errorText}>{errors.passwordTooShort}</Text>}
                  {errors.passwordTooWeak && <Text style={styles.errorText}>{errors.passwordTooWeak}</Text>}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <TextInput
                    style={[styles.input, errors.passwordDoesntMatch && styles.inputError]}
                    placeholder="••••••••"
                    placeholderTextColor="#AEAEB2"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  {errors.passwordDoesntMatch && <Text style={styles.errorText}>{errors.passwordDoesntMatch}</Text>}
                </View>

                <Pressable style={styles.primaryButton} onPress={handleSubmit}>
                  {codeSubmitLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify & Update</Text>}
                </Pressable>

                <Pressable onPress={() => setSuccessfulCreation(false)} style={styles.linkContainer}>
                  <Text style={styles.linkText}>Use a different email</Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  backgroundImage: { flex: 1, height: '100%', width: '100%' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBox: {
    width: '92%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 24,
    paddingTop: 64,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    position: 'relative',
  },
  absBackButton: {
    position: 'absolute',
    top: 20,
    left: 16,
    zIndex: 10,
  },
  fullWidth: { width: '100%' },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  inputGroup: { marginBottom: 20 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    height: 56,
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF2F2',
  },
  primaryButton: {
    backgroundColor: 'tomato',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: 'tomato',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  linkContainer: { marginTop: 20, alignItems: 'center' },
  linkText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
});