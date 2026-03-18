import { ThemedText } from '@/components/themed-text';
import { supabase } from '@/utils/supabase';
import { useSignUp } from '@clerk/clerk-expo';
<<<<<<< HEAD
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
=======
import { Ionicons } from '@expo/vector-icons'; // Added for the back icon
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
>>>>>>> f9eb0463061c26231664425e7086cf53d4aeaf9f
import * as React from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import validator from 'validator';

// 1. FIXED: Moved InputField OUTSIDE the main component so it doesn't unmount on every keystroke
const InputField = ({ label, value, onChange, error, secure = false, autoCap = "none" as any, keyboard = "default" as any, style = {} }) => {
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
  const isPasswordField = secure;

  return (
    <View style={[styles.inputContainer, style]}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <View style={styles.inputWrapper}>
        <TextInput 
          style={[styles.input, error && styles.inputError, isPasswordField && { paddingRight: 50 }]} 
          value={value} 
          onChangeText={onChange} 
          placeholder="" // Removed all placeholders
          placeholderTextColor="#C7C7CC"
          secureTextEntry={isPasswordField && !isPasswordVisible}
          autoCapitalize={autoCap}
          keyboardType={keyboard}
          onKeyPress={(e: any) => {
            if (e.nativeEvent.key === ' ') {
              e.stopPropagation();
            }
          }}
        />
        {isPasswordField && (
          <Pressable 
            onPress={() => setIsPasswordVisible(!isPasswordVisible)} 
            style={styles.eyeIcon}
          >
            <Ionicons 
              name={isPasswordVisible ? "eye-off" : "eye"} 
              size={22} 
              color="#8E8E93" 
            />
          </Pressable>
        )}
      </View>
      <View style={styles.errorContainer}>
          {error && <Text style={styles.fieldError}>{error}</Text>}
      </View>
    </View>
  );
};

export default function Page() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
<<<<<<< HEAD
  
  // Form States
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
=======
  const { gFName, gLName, gEmail, gId, guest } = useLocalSearchParams();

  // States
  const [firstName, setFirstName] = React.useState(gFName ?? '');
  const [lastName, setLastName] = React.useState(gLName ?? '');
>>>>>>> f9eb0463061c26231664425e7086cf53d4aeaf9f
  const [nickname, setNickname] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [emailAddress, setEmailAddress] = React.useState(gEmail ?? '');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  
  // UI States
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [verificationLoading, setVerificationLoading] = React.useState(false);
  const [code, setCode] = React.useState('');
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [clerkErrors, setClerkErrors] = React.useState<any>(Object);
  const [users, setUsers] = React.useState<any[]>([]);
  const [signupLoading, setSignupLoading] = React.useState(false);


  React.useEffect(() => {
    const getUsers = async () => {
      try {
        const { data: clerk_users } = await supabase.from('clerk_users').select('nickname');
        if (clerk_users) setUsers(clerk_users);
      } catch (error) { console.error(error); }
    };
    getUsers();
  }, []);

  const transferGuestData = async (guestId: number, cid: string) => {
          // 1. Update bill_members to replace guest_user_id with clerk_user_id
          await supabase
            .from('bill_members')
            .update({ user_id: cid, guest_id: null })
            .eq('guest_id', guestId);
      
          // 2. Optionally, migrate other tables if guest had debts or expenses
          await supabase
            .from('expenses_involved')
            .update({ bill_member_id: cid })  // adjust if needed
            .eq('guest_id', guestId);
      
          // 3. Delete guest_user row if no longer needed
          await supabase
            .from('guest_users')
            .delete()
            .eq('id', guestId);
        };

  const validateForm = () => {
    let newErrors: Record<string, string> = {};
    if (validator.isEmpty(firstName.trim())) newErrors.firstName = "First name is required";
    if (validator.isEmpty(lastName.trim())) newErrors.lastName = "Last name is required";
    if (validator.isEmpty(nickname.trim())) {
        newErrors.nickname = "Nickname is required";
    } else if (users.some(u => u.nickname?.toLowerCase() === nickname.toLowerCase())) {
        newErrors.nickname = "Nickname is already taken";
    }
    if (validator.isEmpty(username.trim())) newErrors.username = "Username is required";
    if (validator.isEmpty(emailAddress.trim())) {
        newErrors.email = "Email is required";
    } else if (!validator.isEmail(emailAddress.trim())) {
        newErrors.email = "Invalid email format";
    }
    if (password.length < 8) newErrors.password = "Min 8 characters required";
    if (!validator.equals(confirmPassword, password)) newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSignUpPress = async () => {
    if (!isLoaded || !validateForm()) return;
    setSignupLoading(true);
    setClerkErrors({});
    try {
      await signUp.create({ firstName, lastName, username, emailAddress, password });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      setClerkErrors(err);
    } finally {
      setSignupLoading(false);
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded) return;
    setVerificationLoading(true);
    try {
      const attempt = await signUp.attemptEmailAddressVerification({ code });
      if (attempt.status === 'complete') {
        const clerkUserId = attempt.createdUserId
        await supabase.from('clerk_users').insert({ clerk_user_id: clerkUserId, nickname });
        await supabase.from('user_has_roles').insert({clerk_user_id: attempt.createdUserId});
        await transferGuestData(Number(gId), clerkUserId);
        await setActive({ session: attempt.createdSessionId });
        router.replace('/');
      }
    } catch (err: any) { 
        setClerkErrors(err);
    } finally { 
        setVerificationLoading(false); 
    }
  };

<<<<<<< HEAD
=======
  if (pendingVerification) {
    return (
      <ImageBackground source={require('../../assets/images/bg.jpg')} style={styles.background}>
        <View style={styles.overlay}>
          <View style={styles.registerBox}>
            <ThemedText style={styles.title}>Verify Email</ThemedText>
            <ThemedText style={styles.subtitle}>Check your inbox for the code</ThemedText>
            <TextInput style={styles.input} value={code} placeholder="000000" onChangeText={setCode} keyboardType="numeric" />
            <Pressable style={styles.button} onPress={onVerifyPress}>
              {verificationLoading ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.buttonText}>Verify</ThemedText>}
            </Pressable>
          </View>
        </View>
      </ImageBackground>
    );
  }

    
      

>>>>>>> f9eb0463061c26231664425e7086cf53d4aeaf9f
  return (
    <ImageBackground source={require('../../assets/images/bg.jpg')} style={styles.background}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          <View style={styles.registerBox}>
            <Pressable style={styles.backButton} onPress={() => pendingVerification ? setPendingVerification(false) : router.back()}>
              <Ionicons name="chevron-back" size={28} color="#1C1C1E" />
            </Pressable>

            <View style={styles.headerSection}>
              <ThemedText style={styles.title}>{pendingVerification ? "Verify Email" : "Sign Up"}</ThemedText>
              <ThemedText style={styles.subtitle}>
                {pendingVerification ? "Enter the code sent to your inbox" : "Create your account to start"}
              </ThemedText>
            </View>

            {clerkErrors.errors?.map((err: any, i: number) => (
              <Text key={i} style={styles.clerkError}>{err.longMessage}</Text>
            ))}

            {!pendingVerification ? (
              <>
                <View style={styles.row}>
                  <InputField label="First Name" value={firstName} onChange={setFirstName} error={errors.firstName} style={styles.flex1} autoCap="sentences" />
                  <InputField label="Last Name" value={lastName} onChange={setLastName} error={errors.lastName} style={styles.flex1} autoCap="sentences" />
                </View>

                <InputField label="Nickname" value={nickname} onChange={setNickname} error={errors.nickname} />
                <InputField label="Username" value={username} onChange={setUsername} error={errors.username} autoCap="none" />
                <InputField label="Email Address" value={emailAddress} onChange={setEmailAddress} error={errors.email} autoCap="none" keyboard="email-address" />
                <InputField label="Password" value={password} onChange={setPassword} error={errors.password} secure />
                <InputField label="Confirm Password" value={confirmPassword} onChange={setConfirmPassword} error={errors.confirmPassword} secure />

                <Pressable style={styles.button} onPress={onSignUpPress}>
                  {signupLoading ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.buttonText}>Create Account</ThemedText>}
                </Pressable>

                <Link href="/(auth)/sign-in" asChild>
                  <Pressable style={styles.footerPressable}>
                    <ThemedText style={styles.footerText}>
                      Already have an account? <ThemedText style={styles.link}>Sign In</ThemedText>
                    </ThemedText>
                  </Pressable>
                </Link>
              </>
            ) : (
              <>
                <InputField label="Verification Code" value={code} onChange={setCode} error={errors.code} keyboard="numeric" />
                
                <Pressable style={styles.button} onPress={onVerifyPress}>
                  {verificationLoading ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.buttonText}>Verify Account</ThemedText>}
                </Pressable>

                <Pressable onPress={() => signUp.prepareEmailAddressVerification({ strategy: 'email_code' })}>
                  <ThemedText style={styles.footerText}>
                    Didn't get a code? <ThemedText style={styles.link}>Resend</ThemedText>
                  </ThemedText>
                </Pressable>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  registerBox: {
    width: '92%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 24,
    paddingTop: 60,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  headerSection: { marginBottom: 10 },
  backButton: { position: 'absolute', top: 20, left: 16, zIndex: 10, padding: 8 },
  title: { fontSize: 32, fontWeight: '900', color: '#1C1C1E', textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#8E8E93', textAlign: 'center', marginTop: 4, fontWeight: '500' },
  inputContainer: { width: '100%', marginBottom: 4 }, 
  inputWrapper: { position: 'relative', width: '100%', justifyContent: 'center' },
  row: { flexDirection: 'row', gap: 12, width: '100%' },
  flex1: { flex: 1 },
  label: { fontSize: 13, fontWeight: '700', color: '#1C1C1E', marginBottom: 6, marginLeft: 4 },
  input: {
    height: 54,
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  eyeIcon: { position: 'absolute', right: 16, padding: 8 },
  inputError: { borderColor: '#FF3B30', backgroundColor: '#FFF2F2' },
  errorContainer: { minHeight: 18, marginTop: 2, marginBottom: 4 },
  fieldError: { color: '#FF3B30', fontSize: 11, fontWeight: '600', marginLeft: 4 },
  clerkError: { color: '#FF3B30', textAlign: 'center', marginBottom: 15, fontSize: 13, fontWeight: '700', paddingHorizontal: 10 },
  button: {
    backgroundColor: 'tomato',
    height: 58,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: 'tomato',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  footerPressable: { paddingVertical: 10 },
  footerText: { textAlign: 'center', color: '#8E8E93', fontSize: 14, fontWeight: '600' },
  link: { color: 'tomato', fontWeight: '800' },
});