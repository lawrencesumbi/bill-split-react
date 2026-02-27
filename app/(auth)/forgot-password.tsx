import { useRouter } from 'expo-router';
import * as React from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [code, setCode] = React.useState('');
  const [showCodeInput, setShowCodeInput] = React.useState(false);

  // Handle sending code

  const sendCode = () => {

    if (!email) return alert('Please enter your email.');

    // Here you would call your backend to send the code
    setShowCodeInput(true);
    
    alert('Code sent to your email!');
  };

  // Handle verifying code

  const verifyCode = () => {
    if (!code) return alert('Please enter the code.');


    // Here you would call your backend to verify the code



    alert('Code verified! You can now reset your password.');

    // You can navigate to a reset password page
    router.push('/reset-password');
  };

  return (
    <View style={styles.mainContainer}>
      <ImageBackground 
        source={require('../../assets/images/bg.jpg')} 
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <View style={styles.cardBox}>
            {!showCodeInput ? (
              <>
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
                </View>

                <Pressable style={styles.button} onPress={sendCode}>
                  <Text style={styles.buttonText}>Send Code</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.title}>Enter Verification Code</Text>
                <Text style={styles.subtitle}>
                  A code has been sent to your email. Please enter it below.
                </Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Verification Code</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="123456" 
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    value={code}
                    onChangeText={setCode}
                  />
                </View>

                <Pressable style={styles.button} onPress={verifyCode}>
                  <Text style={styles.buttonText}>Verify Code</Text>
                </Pressable>

                <Pressable onPress={() => setShowCodeInput(false)}>
                  <Text style={styles.backLink}>Back to email</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
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
});