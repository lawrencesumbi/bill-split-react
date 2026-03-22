import { ThemedText } from '@/components/themed-text';
import { supabase } from '@/utils/supabase';

import { Ionicons } from '@expo/vector-icons';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
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
          placeholder="" 
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
  const router = useRouter();
  const { gFName, gLName, gEmail, gId } = useLocalSearchParams();

  // States
  const [firstName, setFirstName] = React.useState(gFName ?? '');
  const [lastName, setLastName] = React.useState(gLName ?? '');
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
  const [users, setUsers] = React.useState<any[]>([]);
  const [signupLoading, setSignupLoading] = React.useState(false);

  React.useEffect(() => {
    const getUsers = async () => {
      try {
        const { data: existing_users } = await supabase.from('users').select('nickname');
        if (existing_users) setUsers(existing_users);
      } catch (error) { console.error(error); }
    };
    getUsers();
  }, []);

  const transferGuestData = async (guestId: number, userId: string) => {
    // 1. Update bill_members to replace guest_id with the new user UUID
    await supabase
      .from('bill_members')
      .update({ user_id: userId, guest_id: null })
      .eq('guest_id', guestId);

    // 2. Update expenses involved
    await supabase
      .from('expenses_involved')
      .update({ bill_member_id: userId })
      .eq('guest_id', guestId);

    // 3. Cleanup guest row
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
    if (!validateForm()) return;
    setSignupLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: emailAddress,
        password: password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            username: username,
            nickname: nickname,
          },
          emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined, 
        }
      });

      if (error) throw error;
      setPendingVerification(true);
      alert("Check your email! A 6-digit code has been sent.");
      
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSignupLoading(false);
    }
  };

  const onVerifyPress = async () => {
  if (code.length < 6) {
    alert("Please enter the 6-digit code");
    return;
  }
  
  setVerificationLoading(true);
  try {
    const { data: { session }, error } = await supabase.auth.verifyOtp({
      email: emailAddress,
      token: code,
      type: 'signup',
    });

    if (error) throw error;

    if (session) {
      const userId = session.user.id;

      // 1. Create the User Profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: userId,
          first_name: firstName,
          last_name: lastName,
          username: username,
          nickname: nickname,
          email: emailAddress,
        });

      if (profileError) throw profileError;

      // 2. Get the ID for the 'Standard' role
      const { data: roleData } = await supabase
        .from('roles')
        . Moran('name', 'Standard')
        .single();

      // 3. Assign the Role
      if (roleData) {
        await supabase
          .from('user_has_roles')
          .insert({ 
            user_id: userId, 
            role_id: roleData.id  // Linking to the roles table
          });
      }

      if (gId) {
        await transferGuestData(Number(gId), userId);
      }
      
      router.replace('/(dashboardpage)/dashboard');
    }
  } catch (err: any) {
    alert(err.message || "Invalid code.");
  } finally {
    setVerificationLoading(false);
  }
};

  const resendCode = async () => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: emailAddress,
    });
    if (error) alert(error.message);
    else alert("New code sent to your email!");
  };

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

                <Pressable onPress={resendCode}>
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