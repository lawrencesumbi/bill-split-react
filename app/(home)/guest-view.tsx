import { ThemedText } from '@/components/themed-text';
import { supabase } from '@/utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function GuestBillView() {
  const { inviteCode, billId, guestEmail } = useLocalSearchParams();
  const router = useRouter();

  const [bill, setBill] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [involved, setInvolved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guestInfo, setGuestInfo] = useState(null);
  const [guestFirstName, setGuestFirstName] = useState('');
  const [guestLastName, setGuestLastName] = useState('');
  const [guestId, setGuestId] = useState('')
  const [accessDenied, setAccessDenied] = useState(false);
  const [timeLeft, setTimeLeft] = useState("06:00:00");
  const [accessLogId, setAccessLogId] = useState(null);
  const [sessionStart, setSessionStart] = useState(null)
  const [totalSecondsUsed, setTotalSecondsUsed] = useState(0);

  // Modal & Password States
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  useEffect(() => {
    fetchGuestBillData();
    fetchGuestInfo();
  }, [inviteCode, guestEmail, billId]);

  useEffect(() => {
    // Update the timer every second
    const timer = setInterval(() => {
      if (sessionStart && accessLogId && !accessDenied) {
        updateTimeUsed();
        setTimeLeft(getRemainingTime(sessionStart));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionStart, accessLogId, accessDenied]);

  const fetchGuestInfo = async () => {
  try {
    // First, get the guest user info
    const { data: guest, error: guestError } = await supabase
      .from('guest_users')
      .select('*')
      .eq('email', guestEmail)
      .single();

    if (guestError) {
      console.error("Error fetching guest:", guestError);
      return;
    }
    
    setGuestInfo(guest);
    setGuestFirstName(guest.first_name);
    setGuestLastName(guest.last_name);
    setGuestId(guest.id);

    // Check for today's access log
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const { data: todayLog, error: logError } = await supabase
      .from('guest_access_logs')
      .select('*')
      .eq('guest_id', guest.id)
      .eq('bill_id', billId)
      .eq('access_date', today)
      .maybeSingle();

    if (logError) {
      console.error("Error fetching today's log:", logError);
    }

    if (todayLog) {
      // Found an existing log for today
      setAccessLogId(todayLog.id);
      setTotalSecondsUsed(todayLog.total_seconds_used || 0);
      
      // Check total seconds used
      if (todayLog.total_seconds_used >= 21600) {
        setAccessDenied(true);
        return;
      }
      
      const lastStart = todayLog.last_access_start ? new Date(todayLog.last_access_start) : null;
      
      if (lastStart) {
        // Calculate current session duration
        const now = new Date();
        const sessionSeconds = Math.floor((now - lastStart) / 1000);
        const totalWithCurrent = todayLog.total_seconds_used + sessionSeconds;
        
        if (totalWithCurrent >= 21600) {
          setAccessDenied(true);
        } else {
          setSessionStart(lastStart.toISOString());
          setAccessDenied(false);
        }
      } else {
        // Log exists but no active session - start a new one
        await startNewSession(todayLog.id);
      }
    } else {
      // No log for today - create a new one
      await createNewAccessLog(guest.id);
    }
  } catch (err) {
    console.error("Error in fetchGuestInfo:", err);
    setAccessDenied(true);
  }
};

  const createNewAccessLog = async (guestId) => {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Don't include 'id' in the insert - let the database auto-generate it
    const { data: newLog, error } = await supabase
      .from('guest_access_logs')
      .insert({
        guest_id: guestId,
        bill_id: billId,
        access_date: today,
        total_seconds_used: 0,
        last_access_start: now.toISOString(),
        // Remove 'id', 'created_at', and 'updated_at' - let database handle defaults
        // created_at: now.toISOString(),  // Remove - has default now()
        // updated_at: now.toISOString()   // Remove - has default now()
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating access log:", error);
      throw error;
    }

    setAccessLogId(newLog.id);
    setSessionStart(now.toISOString());
    setTotalSecondsUsed(0);
    setAccessDenied(false);
    
  } catch (err) {
    console.error("Error in createNewAccessLog:", err);
    setAccessDenied(true);
  }
};

const startNewSession = async (logId) => {
  try {
    const now = new Date();
    
    // Update the log with new session start time
    const { error } = await supabase
      .from('guest_access_logs')
      .update({
        last_access_start: now.toISOString(),
        // Remove updated_at - let the trigger handle it
        // updated_at: now.toISOString()
      })
      .eq('id', logId);

    if (error) {
      console.error("Error starting new session:", error);
      throw error;
    }

    setSessionStart(now.toISOString());
    setAccessDenied(false);
    
  } catch (err) {
    console.error("Error starting new session:", err);
  }
};

  const updateTimeUsed = async () => {
  if (!sessionStart || !accessLogId || accessDenied) return;

  try {
    const now = new Date();
    const start = new Date(sessionStart);
    const sessionSeconds = Math.floor((now - start) / 1000);
    
    // Only update if we've accumulated at least 1 second
    if (sessionSeconds > 0) {
      const totalUsed = totalSecondsUsed + sessionSeconds;
      
      // Check if we've exceeded the limit
      if (totalUsed >= 21600) {
        setAccessDenied(true);
      }

      // Update the total in the database
      const { error } = await supabase
        .from('guest_access_logs')
        .update({
          total_seconds_used: totalUsed,
          // Remove updated_at - let the trigger handle it
          // updated_at: now.toISOString()
        })
        .eq('id', accessLogId);

      if (error) {
        console.error("Error updating time used:", error);
      } else {
        setTotalSecondsUsed(totalUsed);
      }
    }
  } catch (err) {
    console.error("Error in updateTimeUsed:", err);
  }
};

  const getRemainingTime = (lastSessionStart) => {
    if (!lastSessionStart) return "06:00:00";

    const usedSeconds = totalSecondsUsed || 0;
    const remainingSeconds = Math.max(0, 21600 - usedSeconds); // 6 hours = 21600 seconds
    
    if (remainingSeconds <= 0) {
      return "00:00:00";
    }

    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const fetchGuestBillData = async () => {
    if (!inviteCode) return;
    setLoading(true);
    try {
      const { data: billData } = await supabase
        .from('bills')
        .select('*')
        .eq('invite_code', inviteCode)
        .single();

      if (billData) {
        setBill(billData);
        const { data: expData } = await supabase
          .from('expenses')
          .select(`*`)
          .eq('bill_id', billData.id)
          .order('created_at', { ascending: false });
        setExpenses(expData || []);

        const { data: membersData } = await supabase
          .from('bill_members')
          .select(`
            id,
            clerk_users:user_id (nickname),
            guest_users:guest_id (first_name, last_name)
          `)
          .eq('bill_id', billData.id);
        setInvolved(membersData || []);
      }
    } catch (error) {
      console.error("Error fetching guest data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (member) => {
    if (member.clerk_users?.nickname) return member.clerk_users.nickname;
    if (member.guest_users) {
      return `${member.guest_users.first_name} ${member.guest_users.last_name || ''}`.trim();
    }
    return "Unknown Member";
  };

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color="tomato" /></View>
  );

if (accessDenied) {
    return (
      <View style={styles.center}>
        <Ionicons name="lock-closed" size={64} color="tomato" />
        <ThemedText style={[styles.billNameLarge, { textAlign: 'center', marginTop: 20 }]}>
          Daily Access Expired
        </ThemedText>
        <ThemedText style={{ textAlign: 'center', color: '#8E8E93', marginVertical: 15, paddingHorizontal: 40 }}>
          Your 6-hour guest window for today has ended. Sign up now to get permanent access to this bill.
        </ThemedText>
        <TouchableOpacity 
          style={styles.modernSubmitBtn} 
          onPress={() => router.push({
            pathname: '/(auth)/sign-up',
            params: { gEmail: guestEmail } 
          })}
        >
          <ThemedText style={styles.submitBtnText}>Create Account</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }
  const totalBill = expenses.reduce((sum, exp) => sum + (Number(exp.cost) || 0), 0);

  return (
    <View style={styles.container}>
      {/* TOP BREADCRUMB BAR */}
      <View style={styles.topTitleBar}>
        <ThemedText style={styles.breadcrumb}>Guest Access / {bill?.name || 'Bill'}</ThemedText>
        
      </View>

       {/* TIMER PILL */}
      <View style={styles.timerContainer}>
        <Ionicons name="time" size={16} color="tomato" />
        <ThemedText style={styles.timerText}>
          Access Expires in: <ThemedText style={styles.timerCountdown}>{timeLeft}</ThemedText>
        </ThemedText>
      </View>

      {/* ACTION BAR */}
      <View style={styles.actionBar}>
        <View style={styles.headerTitleSection}>
          <Pressable style={styles.glassBackBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#1C1C1E" />
          </Pressable>
          <ThemedText style={styles.billNameLarge} numberOfLines={1}>{bill?.name || "Loading..."}</ThemedText>
        </View>

        <View style={styles.pillGroup}>
          <View style={styles.pillInvite}><ThemedText style={styles.pillInviteText}>Code</ThemedText></View>
          <View style={styles.pillID}>
            <ThemedText style={styles.pillText}>{inviteCode}</ThemedText>
          </View>
        </View>

       
      </View>

      {/* MAIN CONTENT AREA */}
      <View style={styles.mainContent}>
        <View style={styles.leftColumn}>
          <View style={styles.heroCard}>
            <View>
              <ThemedText style={styles.heroLabel}>Total Bill Amount</ThemedText>
              <ThemedText style={styles.heroAmount}>₱{totalBill.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</ThemedText>
            </View>
            <View style={styles.heroIconContainer}>
               <Ionicons name="receipt" size={32} color="rgba(255,255,255,0.6)" />
            </View>
          </View>

          <View style={styles.columnHeader}>
            <ThemedText style={styles.columnTitle}>Expense Breakdown</ThemedText>
            <ThemedText style={styles.countText}>{expenses.length} Items</ThemedText>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
            {expenses.map((exp) => (
              <View key={exp.id} style={styles.modernExpenseCard}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.expName}>{exp.name}</ThemedText>
                    <ThemedText style={styles.expPaidBy}>
                      Paid by <ThemedText style={{ fontWeight: '700', color: '#1C1C1E' }}>{exp.paid_by}</ThemedText>
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.expAmount}>₱{parseFloat(exp.cost).toFixed(2)}</ThemedText>
                </View>
              </View>
            ))}
            {expenses.length === 0 && (
                <ThemedText style={styles.emptyText}>No expenses added yet.</ThemedText>
            )}
          </ScrollView>
        </View>

        {Platform.OS !== 'android' && (
          <View style={styles.rightColumn}>
            <View style={styles.peopleHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name="people" size={26} color="tomato" />
              </View>
              <ThemedText style={styles.infoTitle}>Involved People</ThemedText>
              <ThemedText style={styles.countText}>{involved.length} Total</ThemedText>
            </View>

            <ScrollView style={styles.memberList} showsVerticalScrollIndicator={false}>
              {involved.map((member) => (
                <View key={member.id} style={styles.memberRow}>
                  <View style={styles.avatarPlaceholder}>
                    <ThemedText style={styles.avatarText}>
                      {getDisplayName(member).charAt(0).toUpperCase()}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.memberName} numberOfLines={1}>
                    {getDisplayName(member)}
                  </ThemedText>
                  {member.clerk_users ? (
                    <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                  ) : (
                    <View style={styles.guestBadge}><ThemedText style={styles.guestBadgeText}>Guest</ThemedText></View>
                  )}
                </View>
              ))}
            </ScrollView>
            
            <View style={styles.spacer} />

            <Pressable 
              style={styles.modernSubmitBtn} 
              onPress={() => router.push({
                pathname: '/(auth)/sign-up',
                params: { gFName: guestFirstName, gLName: guestLastName, gEmail: guestEmail, gId: guestId, guest: guestInfo }
              })}
            >
              <ThemedText style={styles.submitBtnText}>Sign Up</ThemedText>
            </Pressable>
          </View>
        )}
      </View>

      {/* MOBILE STICKY FOOTER */}
      {Platform.OS === 'android' && (
         <View style={styles.mobileFooter}>
            <Pressable style={styles.modernSubmitBtn} onPress={() => setShowSignUpModal(true)}>
              <ThemedText style={styles.submitBtnText}>Sign Up to Track Debts</ThemedText>
            </Pressable>
         </View>
      )}

      {/* MODERN SIGN UP MODAL */}
      <Modal
        visible={showSignUpModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSignUpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContainer}
          >
            <View style={styles.modernModalCard}>
              <View style={styles.modalHeader}>
                <View>
                  <ThemedText style={styles.modalTitle}>Set Password</ThemedText>
                  <ThemedText style={styles.modalSubtitle}>Secure your account to track debts</ThemedText>
                </View>
                <TouchableOpacity onPress={() => setShowSignUpModal(false)}>
                  <Ionicons name="close-circle" size={28} color="#AEAEB2" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputSection}>
                {/* PASSWORD FIELD */}
                <ThemedText style={styles.fieldLabel}>Password</ThemedText>
                <View style={styles.passwordInputWrapper}>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Create a password"
                    placeholderTextColor="#AEAEB2"
                    secureTextEntry={!isPasswordVisible}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                    <Ionicons 
                      name={isPasswordVisible ? "eye-off" : "eye"} 
                      size={20} 
                      color="#8E8E93" 
                    />
                  </TouchableOpacity>
                </View>

                {/* CONFIRM PASSWORD FIELD */}
                <ThemedText style={styles.fieldLabel}>Confirm Password</ThemedText>
                <View style={styles.passwordInputWrapper}>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Repeat your password"
                    placeholderTextColor="#AEAEB2"
                    secureTextEntry={!isPasswordVisible}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                    <Ionicons 
                      name={isPasswordVisible ? "eye-off" : "eye"} 
                      size={20} 
                      color="#8E8E93" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.modalActionBtn}
                onPress={() => {
                  // TODO: Add Supabase registration logic here
                  setShowSignUpModal(false);
                }}
              >
                <ThemedText style={styles.modalActionText}>Complete Account</ThemedText>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB', padding: 24, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topTitleBar: { marginBottom: 20 },
  breadcrumb: { fontSize: 13, color: '#8E8E93', fontWeight: '600', textTransform: 'uppercase' },
  actionBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  headerTitleSection: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  glassBackBtn: { width: 44, height: 44, backgroundColor: '#FFF', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  billNameLarge: { fontSize: 28, fontWeight: '800', color: '#1C1C1E', flex: 1 },
  pillGroup: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#F2F2F7' },
  pillInvite: { paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#1C1C1E' },
  pillInviteText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  pillID: { paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#F2F2F7' },
  pillText: { fontWeight: '800', fontSize: 13, color: 'tomato' },
  mainContent: { flex: 1, flexDirection: 'row', gap: 32 },
  leftColumn: { flex: 2 },
  heroCard: { backgroundColor: 'tomato', padding: 25, borderRadius: 24, marginBottom: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: 'tomato', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
  heroLabel: { color: 'rgba(255,255,255,0.8)', fontWeight: '700', fontSize: 14, textTransform: 'uppercase' },
  heroAmount: { color: '#FFF', fontSize: 38, fontWeight: '900', marginTop: 5 },
  heroIconContainer: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 15, borderRadius: 20 },
  columnHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 5 },
  columnTitle: { fontSize: 18, fontWeight: '800', color: '#1C1C1E' },
  countText: { fontSize: 13, color: '#8E8E93', fontWeight: '600' },
  modernExpenseCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#F2F2F7' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  expName: { fontSize: 17, fontWeight: '700', color: '#1C1C1E' },
  expAmount: { fontSize: 18, fontWeight: '800', color: 'tomato' },
  expPaidBy: { fontSize: 13, color: '#8E8E93', marginTop: 4 },
  emptyText: { textAlign: 'center', color: '#AEAEB2', marginTop: 40, fontSize: 16 },
  
  rightColumn: { flex: 1, backgroundColor: '#FFF', borderRadius: 24, padding: 25, maxHeight: 500, borderWidth: 1, borderColor: '#F2F2F7', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
  peopleHeader: { alignItems: 'center', marginBottom: 20 },
  iconCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#FFF5F3', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  infoTitle: { fontSize: 19, fontWeight: '800', color: '#1C1C1E' },
  memberList: { flex: 1 },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F8F9FB' },
  avatarPlaceholder: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F2F2F7', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 14, fontWeight: '700', color: 'tomato' },
  memberName: { flex: 1, fontSize: 15, fontWeight: '600', color: '#48484A' },
  guestBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  guestBadgeText: { fontSize: 10, color: '#2E7D32', fontWeight: '800', textTransform: 'uppercase' },
  
  spacer: { height: 20 },
  modernSubmitBtn: { backgroundColor: '#1C1C1E', padding: 18, borderRadius: 18, alignItems: 'center' },
  submitBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  mobileFooter: { position: 'absolute', bottom: 0, 
    
    left: 0, right: 0, padding: 24, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F2F2F7' },

  // MODAL STYLES
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { width: '100%', maxWidth: 400 },
  modernModalCard: { backgroundColor: '#FFF', borderRadius: 30, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25 },
  modalTitle: { fontSize: 24, fontWeight: '800', color: '#1C1C1E' },
  modalSubtitle: { fontSize: 14, color: '#8E8E93', marginTop: 4 },
  inputSection: { marginBottom: 25 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#1C1C1E', marginBottom: 8, textTransform: 'uppercase', marginLeft: 4 },
  passwordInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F7', borderRadius: 16, paddingHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E5EA' },
  modalInput: { flex: 1, height: 55, fontSize: 16, color: '#1C1C1E' },
  modalActionBtn: { backgroundColor: 'tomato', padding: 18, borderRadius: 18, alignItems: 'center', shadowColor: 'tomato', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  modalActionText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  timerContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#FFF',
  paddingHorizontal: 12,
  paddingVertical: 8,
  borderRadius: 20,
  borderWidth: 1,
  borderColor: '#F2F2F7',
  alignSelf: 'flex-start',
  marginBottom: 15,
  // Shadow for a "floating" look
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 5,
  elevation: 2,
},
timerText: {
  fontSize: 13,
  color: '#8E8E93',
  marginLeft: 6,
  fontWeight: '600',
},
timerCountdown: {
  color: 'tomato',
  fontWeight: '800',
  fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', // Monospace keeps numbers from jumping
},
});