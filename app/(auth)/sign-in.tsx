import { supabase } from '@/utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

export default function Login() {
  const router = useRouter()
  
  // --- States ---
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false)
  const [code, setCode] = React.useState('')
  const [showEmailCode, setShowEmailCode] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [verifyLoading, setVerifyLoading] = React.useState(false)

  // --- Actions ---

  const onSignInPress = async () => {
    if (!email || !password) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;

      // If successful, the AuthLayout will automatically detect the session
      // but we call replace here to be safe.
      if (data.session) {
        router.replace('/(dashboardpage)/dashboard');
      } 
    } catch (err: any) {
      Alert.alert("Login Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const onVerifyPress = async () => {
    setVerifyLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'signup', // or 'login' depending on your Supabase 2FA settings
      });

      if (error) throw error;

      if (data.session) {
        router.replace('/(dashboardpage)/dashboard');
      }
    } catch (err: any) {
      Alert.alert("Verification Error", err.message);
    } finally {
      setVerifyLoading(false);
    }
  }

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

            {!showEmailCode ? (
              <>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color="#999" style={styles.inlineIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email Address"
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

                <Pressable onPress={() => router.push('/(auth)/forgot-password')} style={styles.forgotBtn}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </Pressable>

                <Pressable
                  style={[styles.button, (!email || !password) && styles.buttonDisabled]}
                  onPress={onSignInPress}
                  disabled={!email || !password || loading}
                >
                  {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Login</Text>}
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

            <Pressable onPress={() => router.push('/(auth)/sign-up')} style={styles.signUpContainer}>
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
  signUpContainer: { marginTop: 25 },
  footerText: { fontSize: 14, color: '#666' },
  signUpLink: { color: 'tomato', fontWeight: '800' },
})