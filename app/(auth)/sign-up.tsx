import { ThemedText } from '@/components/themed-text';
import { supabase } from '@/utils/supabase';
import { useSignUp } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons'; // Added for the back icon
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, ImageBackground, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import validator from 'validator';

export default function Page() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const { gFName, gLName, gEmail, gId, guest } = useLocalSearchParams();

  // States
  const [firstName, setFirstName] = React.useState(gFName ?? '');
  const [lastName, setLastName] = React.useState(gLName ?? '');
  const [nickname, setNickname] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [emailAddress, setEmailAddress] = React.useState(gEmail ?? '');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [verificationLoading, setVerificationLoading] = React.useState(false);
  const [code, setCode] = React.useState('');
  const [errors, setErrors] = React.useState({} as any);
  const [clerkErrors, setClerkErrors] = React.useState(Object);
  const [users, setUsers] = React.useState([]);
  const [signupLoading, setSignupLoading] = React.useState(false);


  React.useEffect(() => {
    const getUsers = async () => {
      try {
        const { data: clerk_users } = await supabase.from('clerk_users').select();
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
    let errors = {} as any;
    if (validator.isEmpty(firstName)) errors.firstName = "First name required";
    if (validator.isEmpty(lastName)) errors.lastName = "Last name required";
    if (validator.isEmpty(nickname)) errors.nickname = "Nickname required";
    if (users.some(u => u.nickname === nickname)) errors.nicknameExists = "Nickname taken";
    if (validator.isEmpty(username)) errors.username = "Username required";
    if (!validator.isEmail(emailAddress)) errors.emailFormat = "Invalid email format";
    if (password.length < 8) errors.passwordTooShort = "Min 8 characters";
    if (!validator.equals(confirmPassword, password)) errors.passwordDoesntMatch = "Passwords do not match";

    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSignUpPress = async () => {
    if (!isLoaded || !validateForm()) return;
    setSignupLoading(true);
    try {
      await signUp.create({ firstName, lastName, username, emailAddress, password });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err) {
      setClerkErrors(JSON.parse(JSON.stringify(err, null, 2)));
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
    } catch (err) { console.error(err); } finally { setVerificationLoading(false); }
  };

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

    
      

  return (
    <ImageBackground source={require('../../assets/images/bg.jpg')} style={styles.background}>
      <View style={styles.overlay}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.registerBox}>
            {/* BACK BUTTON */}
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="#8E8E93" />
            </Pressable>

            <ThemedText style={styles.title}>Sign Up</ThemedText>
            <ThemedText style={styles.subtitle}>Create your account to start</ThemedText>

            {clerkErrors.errors?.map((err: any, i: number) => (
              <Text key={i} style={styles.clerkError}>{err.longMessage}</Text>
            ))}

            <View style={styles.row}>
              <View style={styles.flex1}>
                <ThemedText style={styles.label}>First Name</ThemedText>
                <TextInput style={[styles.input, errors.firstName && styles.inputError]} value={firstName} onChangeText={setFirstName} placeholder="John" />
              </View>
              <View style={styles.flex1}>
                <ThemedText style={styles.label}>Last Name</ThemedText>
                <TextInput style={[styles.input, errors.lastName && styles.inputError]} value={lastName} onChangeText={setLastName} placeholder="Doe" />
              </View>
            </View>

            <ThemedText style={styles.label}>Nickname</ThemedText>
            <TextInput style={[styles.input, (errors.nickname || errors.nicknameExists) && styles.inputError]} value={nickname} onChangeText={setNickname} placeholder="Johnny" />

            <ThemedText style={styles.label}>Username</ThemedText>
            <TextInput style={[styles.input, errors.username && styles.inputError]} value={username} onChangeText={setUsername} placeholder="johndoe123" autoCapitalize="none" />

            <ThemedText style={styles.label}>Email Address</ThemedText>
            <TextInput style={[styles.input, errors.emailFormat && styles.inputError]} value={emailAddress} onChangeText={setEmailAddress} autoCapitalize="none" keyboardType="email-address" placeholder="email@example.com" />

            <ThemedText style={styles.label}>Password</ThemedText>
            <TextInput style={[styles.input, errors.passwordTooShort && styles.inputError]} value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />

            <ThemedText style={styles.label}>Confirm Password</ThemedText>
            <TextInput style={[styles.input, errors.passwordDoesntMatch && styles.inputError]} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholder="••••••••" />

            <Pressable style={styles.button} onPress={onSignUpPress}>
              {signupLoading ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.buttonText}>Create Account</ThemedText>}
            </Pressable>

            <Link href="/(auth)/sign-in" asChild>
              <Pressable>
                <ThemedText style={styles.footerText}>
                  Already have an account? <ThemedText style={styles.link}>Sign In</ThemedText>
                </ThemedText>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, height: '100%', width: '100%'  },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: 40, alignItems: 'center' },
  registerBox: {
    width: '90%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 25,
    paddingTop: 45, // Increased padding to make room for back button
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
    padding: 5,
  },
  title: { fontSize: 32, fontWeight: '900', color: '#1C1C1E', textAlign: 'center', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#8E8E93', textAlign: 'center', marginBottom: 25, fontWeight: '500' },
  row: { flexDirection: 'row', gap: 10, width: '100%' },
  flex1: { flex: 1 },
  label: { fontSize: 13, fontWeight: '700', color: '#AEAEB2', marginBottom: 8, marginLeft: 4 },
  input: {
    height: 52,
    backgroundColor: '#F2F2F7',
    borderRadius: 15,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: { borderColor: '#FF3B30', backgroundColor: '#FFF2F2' },
  button: {
    backgroundColor: 'tomato',
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: 'tomato',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    elevation: 4,
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  footerText: { textAlign: 'center', color: '#8E8E93', fontSize: 15, fontWeight: '500' },
  link: { color: 'tomato', fontWeight: '800' },
  clerkError: { color: '#FF3B30', textAlign: 'center', marginBottom: 10, fontSize: 13, fontWeight: '600' },
});