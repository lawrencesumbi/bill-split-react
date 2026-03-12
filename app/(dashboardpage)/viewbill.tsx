import { ThemedText } from '@/components/themed-text';
import { supabase } from '@/utils/supabase';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';



type Guest = { id: string; firstName: string; lastName: string; email: string; };
type Expense = { id: string; name: string; cost: string; paidBy: string; involved: { guestId: string, amount: string }[]; };

export default function ViewBill() {
  const router = useRouter();
  const { user } = useUser();
  const { billId, billName } = useLocalSearchParams();
  
  const [guests, setGuests] = useState<Guest[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [splitType, setSplitType] = useState('equal')
  const [involved, setInvolved] = useState([]);
  
  // Modal Visibility States
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false); // For Custom Split
  const [showPaidByDropdown, setShowPaidByDropdown] = useState(false);
  
  // Form states
  const [guestFirstName, setGuestFirstName] = useState('');
  const [guestLastName, setGuestLastName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  const [expName, setExpName] = useState('');
  const [expCost, setExpCost] = useState('');
  const [expPaidBy, setExpPaidBy] = useState("");
  const [selectedInvolved, setSelectedInvolved] = useState<string[]>([]);

  const currentUserId = user?.id;

  useEffect(() => { getNickname(currentUserId); }, [currentUserId]);

  const getNickname = async(id:string) => {
    const { data, error } = await supabase
    .from("clerk_users")
    .select(`nickname`)
    .eq('clerk_user_id', id)
    .single()

    if(!error) setExpPaidBy(data.nickname);
  }

  
  // Custom Split states: stores { guestId: amountString }
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});

  const [inviteCode, setInviteCode] = useState<string>('');

  const handleAddGuest = () => {
    if (!guestFirstName || !guestEmail) return;
    const newGuest: Guest = { id: Math.random().toString(), firstName: guestFirstName, lastName: guestLastName, email: guestEmail };
    setGuests([...guests, newGuest]);
    setGuestFirstName(''); setGuestLastName(''); setGuestEmail('');
    setShowGuestModal(false);
  };

       const getDisplayName = (person) => {
        if (person.clerk_users !== null) {
            return person.clerk_users.nickname || person.name || 'Unknown User';
        } else {
            return person.name || person.guest_users.first_name || 'Unknown Guest';
        }
        };

  const loadInvolved = async () => {
    const { data, error } = await supabase
    .from("bill_members")
    .select(`*,
      clerk_users:user_id (
        nickname
      ),
      guest_users:guest_id (
        first_name
      )
      `)
    .eq("bill_id", billId);

    if(!error) setInvolved(data);
  }


  
  React.useEffect(() => { loadInvolved(); }, []);

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('bill_id', billId)

      if (error) {
        console.error('Error fetching expenses:', error);
        return;
      }

      setExpenses(data || []);
    } catch (err) {
      console.error('Unexpected error fetching expenses:', err);
    }
  };

  useEffect(() => {
  const fetchBillData = async () => {
    if (!billId) return;

    try {
      // 1️⃣ Fetch invite code from bills table
      const { data: billData, error: billError } = await supabase
        .from('bills')
        .select('invite_code')
        .eq('id', billId)
        .single();

      if (billError) throw billError;
      setInviteCode(billData?.invite_code || '');

      // 2️⃣ Fetch expenses for this bill
      const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .select('*') // or select('id, name, cost, paid_by, involved')
        .eq('bill_id', billId);

      if (expenseError) throw expenseError;

      // Optional: map to camelCase if your JSX expects it
      const mappedExpenses = expenseData.map((e: any) => ({
        ...e,
        amount: e.cost,
        paidBy: e.paid_by
      }));

      setExpenses(mappedExpenses);

    } catch (error) {
      console.error('Error fetching bill data:', error);
    }
  };

  fetchBillData();
}, [billId]);

  const handleAddExpense = async () => {
    const totalCost = parseFloat(expCost);
    if (!expName || isNaN(totalCost)) return;

    const finalInvolved = selectedInvolved.map(id => ({
      guestId: id,
      amount: customAmounts[id] || (totalCost / selectedInvolved.length).toString()
    }));

    try {
      // Insert expense
      const { data, error } = await supabase
        .from('expenses')
        .insert([{
          bill_id: billId,
          name: expName,
          cost: totalCost,
          paid_by: expPaidBy,
        }])
        .select()
        .single();

      if (error) throw error;

      // Insert involved people
      if (data) {
        const involvedRows = finalInvolved.map(i => ({
          expenses_id: data.id,
          bill_member_id: i.guestId,
          amount_spent: parseFloat(i.amount)
        }));

        const { error: involvedError } = await supabase
          .from('expenses_involved')
          .insert(involvedRows);

        if (involvedError) throw involvedError;

        // Update local state
        const newExp: Expense = {
          id: data.id,
          name: data.name,
          cost: data.cost.toString(),
          paidBy: data.paid_by,
          involved: finalInvolved,
        };
        setExpenses(prev => [newExp, ...prev]);

        // Reset form
        setExpName(''); setExpCost(''); setSelectedInvolved([]); setCustomAmounts({});
        setShowExpenseModal(false);
        fetchExpenses()
      }

    } catch (err) {
      console.error("Error adding expense:", err);
      Alert.alert("Failed to add expense", "Please try again.");
    }
  };
  
  const toggleInvolved = (id: string) => {
    setSelectedInvolved(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCustomAmountChange = (id: string, value: string) => {
    setCustomAmounts(prev => ({ ...prev, [id]: value }));
  };

  console.log(selectedInvolved)

  // Helper to calculate remaining for Custom Modal
  const totalAllocated = Object.values(customAmounts).reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
  const remaining = parseFloat(expCost || '0') - totalAllocated;

  return (
    <View style={styles.container}>
      {/* ... (Previous Header, Search, and Lists remain exactly the same) ... */}
      <View style={styles.topTitleBar}>
        <ThemedText style={styles.breadcrumb}>Dashboard / {billName || 'Bill'}</ThemedText>
      </View>

      <View style={styles.actionBar}>
        <View style={styles.searchSection}>
          <Pressable style={styles.glassBackBtn} onPress={() => router.back()}><Ionicons name="arrow-back" size={20} color="#1C1C1E" /></Pressable>
          <View style={styles.searchContainer}><Ionicons name="search" size={18} color="#AEAEB2" /><TextInput style={styles.searchInput} placeholder="Search expenses..." /></View>
        </View>
        <Pressable style={styles.modernAddBtn} onPress={() => setShowExpenseModal(true)}>
          <Ionicons name="add" size={20} color="#FFF" /><ThemedText style={styles.addBtnText}>Add Expense</ThemedText>
        </Pressable>
      </View>

      <View style={styles.billInfoRow}>
        <ThemedText style={styles.billNameLarge}>{billName || "Vacation Trip"}</ThemedText>
        <View style={styles.pillGroup}>
          <View style={styles.pillInvite}><ThemedText style={styles.pillInviteText}>Code</ThemedText></View>
          <View style={styles.pillID}>
            <ThemedText style={styles.pillText}>{inviteCode || 'Loading...'}</ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.leftColumn}>
            <View style={styles.columnHeader}>
                <ThemedText style={styles.columnTitle}>Expenses</ThemedText>
                <ThemedText style={styles.countText}>{expenses.length} Total</ThemedText>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
                {expenses.map(exp => (
                    <View key={exp.id} style={styles.modernExpenseCard}>
                        <View style={styles.cardHeader}>
                            <ThemedText style={styles.expName}>{exp.name}</ThemedText>
                            <ThemedText style={styles.expAmount}>₱{exp.cost}</ThemedText>
                        </View>
                        <ThemedText style={styles.expPaidBy}>Paid by <ThemedText style={{fontWeight:'700'}}>{exp.paid_by}</ThemedText></ThemedText>
                    </View>
                ))}
            </ScrollView>
        </View>

        <View style={styles.rightColumn}>
          <View style={styles.peopleHeader}>
            <ThemedText style={styles.columnTitle}>Involved people</ThemedText>
            <Pressable style={styles.addPersonBtn} onPress={() => setShowGuestModal(true)}><Ionicons name="person-add" size={16} color="tomato" /></Pressable>
          </View>
          <ScrollView>
            {involved.filter(i => i.user_id !== user?.id).map(involve => (
              <View key={involve.id} style={styles.modernPersonRow}>
                {/* <View style={styles.modernAvatar}><ThemedText style={styles.avatarText}>{involve.clerk_users.nickname}</ThemedText></View> */}
                <ThemedText style={styles.personName}>{getDisplayName(involve)}</ThemedText>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* ADD EXPENSE MODAL */}
      <Modal visible={showExpenseModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modernModalBox}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Add expense</ThemedText>
              <Pressable style={styles.closeBtn} onPress={() => setShowExpenseModal(false)}><ThemedText style={{fontWeight: '700'}}>Close</ThemedText></Pressable>
            </View>

            <View style={styles.inputWrapper}>
              <ThemedText style={styles.inputLabel}>Name</ThemedText>
              <TextInput style={styles.modernInput} value={expName} onChangeText={setExpName} />
            </View>
            <View style={styles.inputWrapper}>
              <ThemedText style={styles.inputLabel}>Cost:</ThemedText>
              <TextInput style={styles.modernInput} value={expCost} onChangeText={setExpCost} keyboardType="numeric" />
            </View>

            {/* PAID BY DROPDOWN */}
            <View style={styles.inputWrapper}>
              <ThemedText style={styles.inputLabel}>Paid by:</ThemedText>
              <Pressable style={[styles.modernInput, styles.dropdownTrigger]} onPress={() => setShowPaidByDropdown(!showPaidByDropdown)}>
                <ThemedText>{expPaidBy}</ThemedText>
                <Ionicons name="chevron-down" size={18} color="#AEAEB2" />
              </Pressable>
              {showPaidByDropdown && (
                <View style={styles.dropdownMenu}>
                  {involved.map(g => (
                    <Pressable key={g.id} style={styles.dropdownItem} onPress={() => {setExpPaidBy(getDisplayName(g)); setShowPaidByDropdown(false);}}>
                      <ThemedText>{getDisplayName(g)}</ThemedText>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <ThemedText style={styles.inputLabel}>With:</ThemedText>
            <ScrollView style={styles.involvedListContainer}>
              {involved.map(g => (
                <Pressable key={g.id} onPress={() => toggleInvolved(g.id)} style={styles.involvedRow}>
                  <Ionicons name={selectedInvolved.includes(g.id) ? "checkbox" : "square-outline"} size={20} color="tomato" />
                  <ThemedText style={{marginLeft: 10}}>{getDisplayName(g)}</ThemedText>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.toggleContainer}>
              <Pressable 
                style={[styles.toggleBtn, splitType === 'equal' && styles.toggleBtnActive]} 
                onPress={() => setSplitType('equal')}
              >
                <ThemedText style={[styles.toggleBtnText, splitType === 'equal' && styles.toggleBtnTextActive]}>
                  Equally Divided
                </ThemedText>
              </Pressable>

              <Pressable 
                style={[styles.toggleBtn, splitType === 'custom' && styles.toggleBtnActive]} 
                onPress={() => {
                  setSplitType('custom');
                  setShowCustomModal(true);
                }}
              >
                <ThemedText style={[styles.toggleBtnText, splitType === 'custom' && styles.toggleBtnTextActive]}>
                  Custom
                </ThemedText>
              </Pressable>
            </View>
            
            <Pressable style={styles.modernSubmitBtn} onPress={handleAddExpense}>
              <ThemedText style={styles.submitBtnText}>Submit button</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* CUSTOM SPLIT MODAL (Based on your new Wireframe) */}
      <Modal visible={showCustomModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modernModalBox}>
            <View style={styles.modalHeader}>
              <View>
                <ThemedText style={{fontSize: 14, color: '#8E8E93'}}>Total: ₱{expCost || '0'}</ThemedText>
                <ThemedText style={{fontSize: 12, color: remaining === 0 ? 'green' : 'tomato'}}>Total remaining: ₱{remaining.toFixed(2)}</ThemedText>
              </View>
              <Pressable style={styles.closeBtn} onPress={() => setShowCustomModal(false)}>
                <ThemedText style={{fontWeight: '700'}}>Back</ThemedText>
              </Pressable>
            </View>

            <ScrollView style={{maxHeight: 300}}>
              {selectedInvolved.map((id) => {
                const involve = involved.find(g => g.id === id);
                return (
                  <View key={id} style={styles.customSplitRow}>
                    <ThemedText style={{flex: 1}}>{getDisplayName(involve)}:</ThemedText>
                    <View style={styles.amountSpentContainer}>
                      <TextInput 
                        style={styles.amountSpentInput} 
                        placeholder="amount spent field" 
                        keyboardType="numeric"
                        value={customAmounts[id] || ''}
                        onChangeText={(val) => handleCustomAmountChange(id, val)}
                      />
                      <ThemedText style={{color: '#AEAEB2'}}>%</ThemedText>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <Pressable 
                style={[styles.modernSubmitBtn, {marginTop: 20, opacity: remaining === 0 ? 1 : 0.5}]} 
                onPress={() => remaining === 0 ? setShowCustomModal(false) : Alert.alert("Balance required", "Amounts must match total cost.")}
            >
              <ThemedText style={styles.submitBtnText}>Submit</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ... ADD GUEST MODAL remains same ... */}
      <Modal visible={showGuestModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modernModalBox}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Add Person</ThemedText>
              <Pressable style={styles.closeBtn} onPress={() => setShowGuestModal(false)}>
                <ThemedText style={{fontWeight: '700'}}>Cancel</ThemedText>
              </Pressable>
            </View>

            <View style={styles.inputWrapper}>
              <ThemedText style={styles.inputLabel}>First Name</ThemedText>
              <TextInput style={styles.modernInput} value={guestFirstName} onChangeText={setGuestFirstName} placeholder="" />
            </View>

            <View style={styles.inputWrapper}>
              <ThemedText style={styles.inputLabel}>Last Name (Optional)</ThemedText>
              <TextInput style={styles.modernInput} value={guestLastName} onChangeText={setGuestLastName} placeholder="" />
            </View>

            <View style={styles.inputWrapper}>
              <ThemedText style={styles.inputLabel}>Email Address</ThemedText>
              <TextInput style={styles.modernInput} value={guestEmail} onChangeText={setGuestEmail} keyboardType="email-address" placeholder="" autoCapitalize="none" />
            </View>

            <Pressable style={[styles.modernSubmitBtn, {marginTop: 10}]} onPress={handleAddGuest}>
              <ThemedText style={styles.submitBtnText}>Add to Bill</ThemedText>
            </Pressable>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // ... (Keep all your existing styles) ...
  container: { flex: 1, backgroundColor: '#F8F9FB', padding: 24, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  topTitleBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  breadcrumb: { fontSize: 13, color: '#8E8E93' },
  actionBar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  searchSection: { flexDirection: 'row', flex: 1, marginRight: 15 },
  glassBackBtn: { width: 44, height: 44, backgroundColor: '#FFF', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 15 },
  searchInput: { flex: 1, marginLeft: 10 },
  modernAddBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'tomato', paddingHorizontal: 20, borderRadius: 12, height: 44 },
  addBtnText: { color: '#FFF', fontWeight: '700', marginLeft: 5 },
  billInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 25 },
  billNameLarge: { fontSize: 32, fontWeight: '800' },
  pillGroup: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden' },
  pillID: { paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#F2F2F7' },
  pillText: { fontWeight: '800', fontSize: 13 },
  pillInvite: { paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#1C1C1E' },
  pillInviteText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  mainContent: { flex: 1, flexDirection: 'row' },
  leftColumn: { flex: 2.2, marginRight: 24 },
  columnHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  columnTitle: { fontSize: 18, fontWeight: '800' },
  countText: { fontSize: 13, color: '#8E8E93' },
  modernExpenseCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  expName: { fontSize: 17, fontWeight: '700' },
  expAmount: { fontSize: 17, fontWeight: '800', color: 'tomato' },
  expPaidBy: { fontSize: 13, color: '#8E8E93' },
  rightColumn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 24, padding: 20 },
  peopleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  addPersonBtn: { width: 32, height: 32, backgroundColor: '#FFF', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  modernPersonRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  modernAvatar: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#FFD60A', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontWeight: '800' },
  personName: { fontSize: 15, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modernModalBox: { width: '40%', backgroundColor: '#FFF', borderRadius: 30, padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '800' },
  closeBtn: { padding: 8, backgroundColor: '#F2F2F7', borderRadius: 8 },
  inputWrapper: { marginBottom: 15, zIndex: 10 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#AEAEB2', marginBottom: 5 },
  modernInput: { backgroundColor: '#F2F2F7', padding: 12, borderRadius: 12 },
  dropdownTrigger: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownMenu: { backgroundColor: '#FFF', borderRadius: 12, position: 'absolute', top: 60, width: '100%', zIndex: 100, borderWidth: 1, borderColor: '#F2F2F7' },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  involvedListContainer: { maxHeight: 100, marginBottom: 15, backgroundColor: '#F9F9F9', borderRadius: 10, padding: 5 },
  involvedRow: { flexDirection: 'row', alignItems: 'center', padding: 5 },
  actionBtn: { padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#000' },
  actionBtnText: { fontWeight: '600' },
  modernSubmitBtn: { backgroundColor: 'tomato', padding: 18, borderRadius: 18, alignItems: 'center' },
  submitBtnText: { color: '#FFF', fontWeight: '800' },

  // New Custom Modal Styles
  customSplitRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  amountSpentContainer: { flex: 2, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F7', borderRadius: 10, paddingHorizontal: 10 },
  amountSpentInput: { flex: 1, padding: 10, fontSize: 14 },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7', // Light grey background
    borderRadius: 10,
    padding: 4,
    marginVertical: 15,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: '#FFFFFF',
    // Add a slight shadow for the "lifted" look
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  toggleBtnTextActive: {
    color: 'tomato', // Matches your checkbox color
  }
});