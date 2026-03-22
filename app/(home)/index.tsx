import { ThemedText } from '@/components/themed-text';
import { supabase } from '@/utils/supabase';
import { Link, useRouter } from 'expo-router';
import * as React from 'react';
import {
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View
} from 'react-native';
import validator from 'validator';

export default function Page() {
  const router = useRouter();
  
  // --- AUTH STATE ---
  const [session, setSession] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  // --- MODAL STATES ---
  const [modalVisible, setModalVisible] = React.useState(false);
  const [modalStep, setModalStep] = React.useState(1); // 1: Code, 2: Email, 3: Register Guest
  const [bill, setBill] = React.useState<any>(null);
  const [archivedModalVisible, setArchivedModalVisible] = React.useState(false);
  
  // --- FORM STATES ---
  const [inviteCode, setInviteCode] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');

  // Check Supabase session on mount
  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleInviteSubmit = async() => {
    try { 
      const { data, error } = await supabase
        .from("bills")
        .select("*")
        .eq('invite_code', inviteCode);

      if (error || !data || data.length === 0) {
        Alert.alert("Not Found", "Invalid invitation code.");
        return;
      }

      const fetchedBill = data[0];
      
      if (validator.equals(fetchedBill?.status, 'archived')) {
        setModalVisible(false);
        setArchivedModalVisible(true);
        return;
      }

      setBill(fetchedBill);
      setModalStep(2);
      
    } catch (err) {
      console.log(err);
    }
  };

  const handleEmailSubmit = async () => {
    if (!validator.isEmail(email)) {
      Alert.alert('Error', 'Incorrect email format.');
      return;
    }

    try {
      const { data: fetchedBillMembers, error } = await supabase
        .from('bill_members')
        .select(`*, guest_users:guest_id (email)`)
        .eq('bill_id', bill.id);

      if (error) throw error;

      const guestExists = fetchedBillMembers?.some(
        (bm: any) => bm.guest_users?.email === email
      );

      if (guestExists) {
        setModalVisible(false);
        router.push({
          pathname: '/guest-view',
          params: { billId: bill.id, inviteCode: bill.invite_code, guestEmail: email }
        });
      } else {
        setModalStep(3);
      }
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Failed to verify email.');
    }
  };

  const handleRegisterGuest = async () => {
    if (!firstName || !lastName || !validator.isEmail(email)) {
      Alert.alert('Error', 'Please enter valid details.');
      return;
    }

    try {
      const { data: newGuest, error: insertError } = await supabase
        .from('guest_users')
        .insert([{ first_name: firstName, last_name: lastName, email }])
        .select()
        .single();

      if (insertError) throw insertError;

      if (bill?.id) {
        const { error: bmError } = await supabase.from('bill_members').insert([{
          bill_id: bill.id,
          guest_id: newGuest.id
        }]);
        if (bmError) throw bmError;
      }

      setModalVisible(false);
      router.push({
        pathname: '/guest-view',
        params: { inviteCode: inviteCode, guestEmail: email }
      });

      setTimeout(() => resetModal(), 500);

    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  const resetModal = () => {
    setModalVisible(false);
    setTimeout(() => {
      setModalStep(1);
      setInviteCode('');
      setEmail('');
      setFirstName('');
      setLastName('');
      setBill(null);
    }, 300);
  };

  if (loading) return null; // Or a loading spinner

  return (
    <ImageBackground
      source={require('../../assets/images/bg.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <View style={styles.contentContainer}>
          <View style={styles.textSection}>
            <ThemedText style={styles.title}>Bill Splitter</ThemedText>
            <ThemedText style={styles.tagline}>
              Spend more time eating,{"\n"}less time calculating.
            </ThemedText>
          </View>

          {/* Logic replacing SignedIn/SignedOut */}
          {!session ? (
            <>
              <View style={styles.buttonGroup}>
                <Link href="/(auth)/sign-in" asChild>
                  <Pressable style={styles.secondaryButton}>
                    <ThemedText style={styles.secondaryButtonText}>Sign In</ThemedText>
                  </Pressable>
                </Link>
                <Link href="/(auth)/sign-up" asChild>
                  <Pressable style={styles.primaryButton}>
                    <ThemedText style={styles.primaryButtonText}>Sign Up</ThemedText>
                  </Pressable>
                </Link>
              </View>
              <Pressable style={styles.inviteLinkContainer} onPress={() => setModalVisible(true)}>
                <ThemedText style={styles.inviteLinkText}>Have an invitation code?</ThemedText>
              </Pressable>
            </>
          ) : (
            <View style={styles.signedInContainer}>
              <ThemedText style={styles.welcomeBack}>
                Welcome back!
              </ThemedText>
              <Link href="/(dashboardpage)/dashboard" asChild>
                <Pressable style={styles.primaryButtonLarge}>
                  <ThemedText style={styles.primaryButtonText}>Go to Dashboard</ThemedText>
                </Pressable>
              </Link>
            </View>
          )}
        </View>
      </View>
  
      {/* ARCHIVED MODAL */}
      <Modal animationType="slide" transparent={true} visible={archivedModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <ThemedText style={styles.modalTitle}>Archived Bill</ThemedText>
            <ThemedText style={styles.modalSubtitle}>You can't access an archived bill.</ThemedText>
            <Pressable style={styles.primaryButtonLarge} onPress={() => setArchivedModalVisible(false)}>
              <ThemedText style={styles.primaryButtonText}>Close</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal> 

      {/* INVITE MODAL */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={resetModal}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <ScrollView style={{ width: '100%' }} contentContainerStyle={{ alignItems: 'center' }} showsVerticalScrollIndicator={false}>
              {modalStep === 1 && (
                <>
                  <ThemedText style={styles.modalTitle}>Enter Invitation Code</ThemedText>
                  <ThemedText style={styles.modalSubtitle}>Join your friends and start splitting bills instantly.</ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g - 909090"
                    placeholderTextColor="#999"
                    value={inviteCode}
                    onChangeText={setInviteCode}
                    autoCapitalize="characters"
                  />
                  <Pressable style={styles.primaryButtonLarge} onPress={handleInviteSubmit}>
                    <ThemedText style={styles.primaryButtonText}>Next</ThemedText>
                  </Pressable>
                </>
              )}

              {modalStep === 2 && (
                <>
                  <ThemedText style={styles.codeIndicator}>Code: {bill?.invite_code}</ThemedText>
                  <ThemedText style={styles.billNameText}>{bill?.name}</ThemedText>
                  <View style={styles.formGroup}>
                    <ThemedText style={styles.inputLabel}>Enter email address:</ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="your@email.com"
                      placeholderTextColor="#999"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                  <Pressable style={styles.primaryButtonLarge} onPress={handleEmailSubmit}>
                    <ThemedText style={styles.primaryButtonText}>Submit</ThemedText>
                  </Pressable>
                  <Pressable style={styles.guestLink} onPress={() => setModalStep(3)}>
                    <ThemedText style={styles.guestLinkText}>Don't have a guest account?</ThemedText>
                  </Pressable>
                </>
              )}

              {modalStep === 3 && (
                <>
                  <ThemedText style={styles.modalTitle}>Create Guest Account</ThemedText>
                  <View style={styles.formGroup}>
                    <ThemedText style={styles.inputLabel}>First Name</ThemedText>
                    <TextInput style={styles.input} placeholder="John" value={firstName} onChangeText={setFirstName} />
                  </View>
                  <View style={styles.formGroup}>
                    <ThemedText style={styles.inputLabel}>Last Name</ThemedText>
                    <TextInput style={styles.input} placeholder="Doe" value={lastName} onChangeText={setLastName} />
                  </View>
                  <View style={styles.formGroup}>
                    <ThemedText style={styles.inputLabel}>Email Address</ThemedText>
                    <TextInput style={styles.input} placeholder="john@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" />
                  </View>
                  <Pressable style={styles.primaryButtonLarge} onPress={handleRegisterGuest}>
                    <ThemedText style={styles.primaryButtonText}>Create & Join</ThemedText>
                  </Pressable>
                </>
              )}

              <Pressable style={styles.closeButton} onPress={resetModal}>
                <ThemedText style={styles.closeButtonText}>Cancel</ThemedText>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, height: '100%', width: '100%' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  contentContainer: { paddingHorizontal: 25, width: '100%', maxWidth: 500 },
  textSection: { marginBottom: 40, alignItems: 'center' },
  title: { fontSize: 52, color: '#fff', fontWeight: '900', textAlign: 'center' },
  tagline: { fontSize: 18, color: 'rgba(255,255,255,0.8)', marginTop: 15, textAlign: 'center' },
  buttonGroup: { flexDirection: 'row', width: '100%', gap: 12, justifyContent: 'center' },
  primaryButton: { flex: 1, backgroundColor: 'tomato', height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  primaryButtonLarge: { width: '100%', backgroundColor: 'tomato', height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  secondaryButton: { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  secondaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  signedInContainer: { width: '100%', alignItems: 'center' },
  welcomeBack: { color: '#fff', fontSize: 20, textAlign: 'center', marginBottom: 20, fontWeight: '700' },
  inviteLinkContainer: { marginTop: 25, alignItems: 'center' },
  inviteLinkText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, textDecorationLine: 'underline' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 400, maxHeight: '85%', backgroundColor: '#FFFFFF', borderRadius: 30, padding: 25, alignItems: 'center' },
  modalHandle: { width: 40, height: 5, backgroundColor: '#E0E0E0', borderRadius: 10, marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: '800', color: '#1C1C1E', marginBottom: 10, textAlign: 'center' },
  modalSubtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 25 },
  formGroup: { width: '100%', marginBottom: 5 },
  inputLabel: { fontSize: 14, color: '#1C1C1E', fontWeight: '700', marginBottom: 8, marginLeft: 5 },
  input: { width: '100%', height: 60, backgroundColor: '#F2F2F7', borderRadius: 15, paddingHorizontal: 20, color: '#000', fontSize: 16, fontWeight: '600', marginBottom: 15, borderWidth: 1, borderColor: '#E5E5EA' },
  codeIndicator: { fontSize: 13, color: '#8E8E93', marginBottom: 5, fontWeight: '500' },
  billNameText: { fontSize: 20, fontWeight: '800', color: '#1C1C1E', marginBottom: 25 },
  guestLink: { marginTop: 20 },
  guestLinkText: { color: 'tomato', fontSize: 14, fontWeight: '700' },
  closeButton: { marginTop: 20, marginBottom: 10 },
  closeButtonText: { color: '#8E8E93', fontSize: 14, fontWeight: '600' },
});