import { useSignIn } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, ImageBackground, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
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

  // Handle sending code

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
      try {
        await signIn!.create({
          strategy: 'reset_password_email_code',
          identifier: email
        })

        setEmailRequestLoading(false)
        setSuccessfulCreation(true)
      } catch(err: any) {
        setClerkErrors(err)
        console.error(JSON.stringify(err, null, 2))
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
        console.log(result)
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
    return (
      <View style={styles.mainContainer}>
        <ImageBackground 
          source={require('../../assets/images/bg.jpg')} 
          style={styles.backgroundImage}
          resizeMode="cover"
        >

          {!successfulCreation && (
            <View style={styles.overlay}>
              <View style={styles.cardBox}>
                <Text style={styles.title}>Forgot Password?</Text>
                  <Text style={styles.subtitle}>
                    Enter your email and we'll send you a code to reset your password.
                  </Text>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Email Address</Text>
                    <TextInput 
                      style={styles.input} 
                      placeholder="testemail@example.com" 
                      placeholderTextColor="#999"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                    />
                    {
                      errors.email ? <Text style={styles.errorMessage}>{errors.email}</Text> : null
                    }
                  </View>

                  <Pressable style={styles.button} onPress={onRequestReset}>
                    <Text style={styles.buttonText}>{emailRequestLoading ? <ActivityIndicator color="white"/> : "Submit"}</Text>
                  </Pressable>
              </View>
            </View>
          )}

          {successfulCreation && (
            <View style={styles.overlay}>
              <View style={styles.cardBox}>
                <Text style={styles.title}>Enter Verification Code</Text>
                  <Text style={styles.subtitle}>
                    A code has been sent to your email. Please enter it below, and also enter your new password.
                  </Text>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Verification Code</Text>
                    <TextInput 
                      style={styles.input} 
                      placeholder="Enter code" 
                      placeholderTextColor="#999"
                      keyboardType="numeric"
                      value={code}
                      onChangeText={setCode}
                    />
                    {
                      errors.code ? <Text style={styles.errorMessage}>{errors.code}</Text> : null
                    }
                    {
                      messages.map((message: any, index: number) => (
                        <Text key={index} style={styles.errorMessage}>{message.longMessage}</Text>
                      ))
                    }
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>New Password</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor="#999"
                      secureTextEntry
                      value={password}
                      onChangeText={setPassword}
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
                    <Text style={styles.label}>Confirm Password</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor="#999"
                      secureTextEntry
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                  </View>

                  <Pressable style={styles.button} onPress={handleSubmit}>
                    <Text style={styles.buttonText}>{codeSubmitLoading ? <ActivityIndicator color="white"/> : "Verify Code"}</Text>
                  </Pressable>

                  <Pressable onPress={() => setShowCodeInput(false)}>
                    <Text style={styles.backLink}>Back to email</Text>
                  </Pressable>
              </View>
            </View>
          )}
        </ImageBackground>
      </View>
    );

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
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBox: {
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
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 25,
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
  },
  button: {
    backgroundColor: 'tomato',
    width: '100%',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backLink: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
    errorMessage: {
    color: 'red',
  }
});