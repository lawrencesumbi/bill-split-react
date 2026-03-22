import { ThemedText } from '@/components/themed-text';
import { supabase } from '@/utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert,
  Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput,
  View
} from 'react-native';

type Guest = { id: string; firstName: string; lastName: string; email: string; };
type Expense = { id: string; name: string; cost: string; paidBy: string; involved: { guestId: string, amount: string }[]; };

export default function ViewBill() {
  const router = useRouter();
  
  // --- AUTH REPLACEMENT ---
  const [sessionUser, setSessionUser] = useState<any>(null);
  const currentUserId = sessionUser?.id;

  const { billId, billName } = useLocalSearchParams();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [splitType, setSplitType] = useState('equal');
  const [involved, setInvolved] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [showEmailExistsModal, setShowEmailExistsModal] = useState(false);
  
  const [selectedInvolvedPeople, setSelectedInvolvedPeople] = useState([]);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showPaidByDropdown, setShowPaidByDropdown] = useState(false);
  const [showSelectPeopleModal, setShowSelectPeopleModal] = useState(false);

  const [guestErrors, setGuestErrors] = useState({});
  const [isAddingGuest, setIsAddingGuest] = useState(false);
  
  const [guestFirstName, setGuestFirstName] = useState('');
  const [guestLastName, setGuestLastName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);

  const [expName, setExpName] = useState('');
  const [expCost, setExpCost] = useState('');
  const [expPaidBy, setExpPaidBy] = useState("");
  const [selectedInvolved, setSelectedInvolved] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const [billStatus, setBillStatus] = useState('');
  const [showViewExpenseModal, setShowViewExpenseModal] = useState(false);
  const [viewingExpense, setViewingExpense] = useState<any>(null);
  const [viewInvolved, setViewInvolved] = useState<any[]>([]);
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [inviteCode, setInviteCode] = useState<string>('');

  // 1. Fetch Supabase Session on Mount
  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSessionUser(session?.user ?? null);
    };
    fetchSession();
  }, []);

  // 2. Fetch Nickname once sessionUser is available
  useEffect(() => { 
    if (currentUserId) {
      getNickname(currentUserId); 
    }
  }, [currentUserId]);

  const totalExpense = expenses.reduce((sum, exp) => {
    const cost = parseFloat(exp.cost || 0);
    return sum + (isNaN(cost) ? 0 : cost);
  }, 0);

  const filteredExpenses = expenses.filter(exp =>
    exp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exp.paid_by?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getNickname = async(id: string) => {
    const { data, error } = await supabase
      .from("clerk_users") // Note: You may want to rename this table later if no longer using Clerk
      .select(`nickname`)
      .eq('clerk_user_id', id)
      .single();

    if(!error && data) setExpPaidBy(data.nickname);
  };

  const openGuestModal = () => {
    setShowSelectPeopleModal(false);
    setShowGuestModal(true);
  };

  const validateGuestForm = () => {
    let errors: any = {};
    if (!guestFirstName.trim()) errors.guestFirst = "First name must not be empty";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guestEmail)) errors.guestEmail = "Email must be in correct format.";
    if (!guestEmail.trim()) errors.guestEmail = "Email must not be empty.";
    setGuestErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddGuestToBill = async () => {
    if (!validateGuestForm()) return;
    setIsAddingGuest(true);
    try {
      const { data: existingGuest, error: checkError } = await supabase
        .from("guest_users")
        .select("id, email")
        .eq("email", guestEmail)
        .maybeSingle();

      if (existingGuest) {
        setShowGuestModal(false);
        setShowEmailExistsModal(true);
        return;
      }

      const { data: guestData, error: guestError } = await supabase
        .from("guest_users")
        .insert({ first_name: guestFirstName, last_name: guestLastName || '', email: guestEmail })
        .select().single();

      if (guestError) throw guestError;

      const { error: memberError } = await supabase
        .from("bill_members")
        .insert({ bill_id: billId, guest_id: guestData.id });

      if (memberError) throw memberError;

      setGuests(prev => [...prev, { id: guestData.id, firstName: guestFirstName, lastName: guestLastName, email: guestEmail }]);
      await loadInvolved();
      setGuestFirstName(''); setGuestLastName(''); setGuestEmail('');
      setShowGuestModal(false);
      setShowSelectPeopleModal(true);
      Alert.alert("Success", "Guest added to bill");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setIsAddingGuest(false);
    }
  };

  const handleUpdateExpense = async () => {
    if (!editingExpenseId) return;
    try {
      const totalCost = parseFloat(expCost);
      const { error: expenseError } = await supabase
        .from("expenses")
        .update({ name: expName, cost: totalCost, paid_by: expPaidBy })
        .eq("id", editingExpenseId);

      if (expenseError) throw expenseError;

      await supabase.from("expenses_involved").delete().eq("expenses_id", editingExpenseId);

      let finalInvolved = [];
      if (splitType === 'equal') {
        const equalAmount = totalCost / selectedInvolved.length;
        finalInvolved = selectedInvolved.map(id => ({
          expenses_id: editingExpenseId,
          bill_member_id: id,
          amount_spent: equalAmount
        }));
      } else {
        finalInvolved = selectedInvolved.map(id => ({
          expenses_id: editingExpenseId,
          bill_member_id: id,
          amount_spent: parseFloat(customAmounts[id] || 0)
        }));
      }

      const { error: involvedError } = await supabase.from("expenses_involved").insert(finalInvolved);
      if (involvedError) throw involvedError;

      setShowExpenseModal(false);
      setIsEditing(false);
      fetchExpenses();
    } catch (err) {
      Alert.alert("Error", "Failed to update expense");
    }
  };

  const loadInvolved = async () => {
    const { data, error } = await supabase
      .from("bill_members")
      .select(`*, clerk_users:user_id (nickname), guest_users:guest_id (first_name)`)
      .eq("bill_id", billId);
    if(!error) setInvolved(data);
  };

  useEffect(() => { 
    if (billId) {
      loadInvolved(); 
      fetchExpenses();
    }
  }, [billId]);

  const fetchExpenses = async () => {
    const { data, error } = await supabase.from('expenses').select('*').eq('bill_id', billId);
    if (!error) setExpenses(data || []);
  };

  const getDisplayName = (person: any) => {
    if (person.clerk_users) return person.clerk_users?.nickname || person.name || 'Unknown User';
    return person.name || person.guest_users?.first_name || 'Unknown Guest';
  };

  return (
    <View style={{flex: 1}}>
       {/* Main UI implementation */}
       <SelectPeopleModal 
          visible={showSelectPeopleModal} 
          onClose={() => setShowSelectPeopleModal(false)}
          onConfirm={(selection) => setSelectedInvolvedPeople(selection)}
          onAddGuestPress={openGuestModal}
          billId={billId}
          loadInvolved={loadInvolved}
          involvedPeople={involved}
          currentUser={sessionUser} // Pass session user instead of using useUser inside
       />
    </View>
  );
}

// --- SUB-COMPONENT: SELECT PEOPLE MODAL ---
const SelectPeopleModal = ({ visible, onClose, onConfirm, onAddGuestPress, billId, loadInvolved, involved, currentUser }) => {
  const [loading, setLoading] = useState(true);
  const [allPotentialUsers, setAllPotentialUsers] = useState([]);
  const [displayUsers, setDisplayUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState('all');
  const [localSelection, setLocalSelection] = useState<any[]>([]);

  useEffect(() => {
    if (visible) {
      loadUsersFromSupabase("all");
      setLocalSelection([]);
      setSearchQuery("");
      setFilter("all");
    }
  }, [visible]);

  const loadUsersFromSupabase = async (currentFilter = "all") => {
    setLoading(true);
    try {
      let users: any[] = [];
      if (currentFilter === "all" || currentFilter === "registered") {
        const { data } = await supabase.from("clerk_users").select("clerk_user_id, nickname");
        users = [...users, ...(data || []).map(u => ({
          id: u.clerk_user_id,
          name: u.nickname || "Unknown User",
          type: "registered",
          uniqueKey: `r-${u.clerk_user_id}`
        }))];
      }
      if (currentFilter === "all" || currentFilter === "guest") {
        const { data } = await supabase.from("guest_users").select("id, first_name, last_name, email");
        users = [...users, ...(data || []).map(g => ({
          id: g.id,
          name: `${g.first_name} ${g.last_name}`,
          type: "guest",
          email: g.email,
          uniqueKey: `g-${g.id}`
        }))];
      }
      setAllPotentialUsers(users);
      applyFilters(users, searchQuery, currentFilter);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (users: any[], query: string, currentFilter: string) => {
    let filtered = users;
    if (currentFilter !== 'all') filtered = filtered.filter(u => u.type === currentFilter);
    if (query) {
      filtered = filtered.filter(u => u.name.toLowerCase().includes(query.toLowerCase()));
    }
    // Filter out people already in the bill
    if (involved) {
        involved.forEach((i: any) => {
            filtered = filtered.filter(u => u.id !== i.user_id && u.id !== i.guest_id);
        });
    }
    setDisplayUsers(filtered);
  };
      
        // Handle Search input change
        const handleSearch = (query) => {
        setSearchQuery(query);
        applyFilters(allPotentialUsers, query, filter);
        };

        // Cycle through filters (All -> Registered -> Guests -> All)
        const toggleFilter = () => {
        let nextFilter = "all";

        if (filter === "all") nextFilter = "registered";
        else if (filter === "registered") nextFilter = "guest";
        else nextFilter = "all";

        setFilter(nextFilter);

        loadUsersFromSupabase(nextFilter);
        };

        const toggleSelection = (user) => {
        const isSelected = localSelection.some(u => u.uniqueKey === user.uniqueKey);
        if (isSelected) {
            setLocalSelection(localSelection.filter(u => u.uniqueKey !== user.uniqueKey));
        } else {
            setLocalSelection([...localSelection, user]);
        }
        };

      const handleConfirm = async () => {
  // First, insert the selected people
  await insertSelectedPeople(localSelection);
  
  // Then pass the selection to parent (if needed)
  onConfirm(localSelection);
  
  // Reset local selection state
  setLocalSelection([]);
  
  // Clear search query
  setSearchQuery("");
  
  // Reset filter to default
  setFilter("all");
  
  // Close the modal
  onClose();
};

        const FilterBadge = () => {
        let label = 'All';
        let icon = 'people';
        if (filter === 'registered') { label = 'Reg'; icon = 'at-circle'; }
        if (filter === 'guest') { label = 'Guest'; icon = 'happy'; }
        return (
            <Pressable style={styles.wireframeFilterBtn} onPress={toggleFilter}>
            <Ionicons name={icon} size={16} color="#333" />
            <ThemedText style={styles.filterBtnText}>{label}</ThemedText>
            </Pressable>
        );
        };

      const insertSelectedPeople = async (peopleToInsert) => {
        if (peopleToInsert.length === 0) return;
        if(involved.length + peopleToInsert.length >= 4) {
          setShowErrorModal(true)
           return;
          }

      const memberInserts = [];

      for (const person of peopleToInsert) {
        // Check if this is a registered user
        const isRegisteredUser = 
          person.type === 'registered' || 
          (person.uniqueKey && person.uniqueKey.startsWith('r-'));

        if (isRegisteredUser) {
          // REGISTERED USER
          memberInserts.push({
            bill_id: billId,
            user_id: person.id,
            guest_id: null
          });
        } else {
          // GUEST USER - extract ID from uniqueKey
          let guestId;
          
          if (person.uniqueKey && person.uniqueKey.startsWith('g-')) {
            guestId = person.uniqueKey.replace('g-', '');
          } else {
            guestId = person.id;
          }

          memberInserts.push({
            bill_id: billId,
            user_id: null,
            guest_id: guestId
          });
        }
      }

      // Insert all selected members
      if (memberInserts.length > 0) {
        const { error: membersError } = await supabase
          .from("bill_members")
          .insert(memberInserts);

        if (membersError) {
          console.error("Error inserting members:", membersError);
          alert("Error adding members to bill");
          return false; // Return false to indicate failure
        }
      }

      // Refresh the involved people list
      if (typeof loadInvolved === 'function') {
        await loadInvolved();
      }
  
  return true; // Return true to indicate success
};

        return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
            <View style={styles.wireframeSelectPeopleBox}>
                {/* Top Row: Controls (Based on Wireframe) */}
                <View style={styles.wireframeControlsRow}>
                <View style={styles.wireframeSearchWrapper}>
                    <Ionicons name="search" size={18} color="#AEAEB2" />
                    <TextInput
                    style={styles.wireframeSearchInput}
                    placeholder="Search registered or guest users..."
                    placeholderTextColor="#C7C7CC"
                    value={searchQuery}
                    onChangeText={handleSearch}
                    />
                </View>
                
                <FilterBadge />

                <Pressable
                style={styles.wireframeIconBtn}
                onPress={() => loadUsersFromSupabase(filter)}
                >
                <Ionicons name="refresh" size={18} color="#333" />
                </Pressable>
                
                <Pressable style={styles.wireframeAddGuestBtn} onPress={onAddGuestPress}>
                    <ThemedText style={styles.addGuestBtnText}>Add guest</ThemedText>
                </Pressable>
                </View>

                {/* Center: Scrollable List Area */}
                <View style={styles.wireframeListArea}>
                {loading ? (
                    <View style={styles.listCenterContent}><ActivityIndicator color="tomato" /></View>
                ) : displayUsers.length === 0 ? (
                    <View style={styles.listCenterContent}>
                    <Ionicons name="search-outline" size={48} color="#CCC" />
                    <ThemedText style={styles.placeholderText}>No users found</ThemedText>
                    </View>
                ) : (
                    <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={true} contentContainerStyle={{paddingBottom: 10}}>
                    {displayUsers.filter(d => d.id !== user.id).map((userItem) => {
                        const isSelected = localSelection.some(u => u.uniqueKey === userItem.uniqueKey);
                        return (
                        <Pressable 
                            key={userItem.uniqueKey} 
                            style={[styles.wireframeUserRow, isSelected && styles.userRowSelected]} 
                            onPress={() => toggleSelection(userItem)}
                        >
                            <Ionicons 
                            name={userItem.type === 'registered' ? "at-circle" : "person-circle"} 
                            size={28} 
                            color={isSelected ? "tomato" : "#AEAEB2"} 
                            />
                            <View key={userItem.uniqueKey || userItem.id} style={styles.userInfo}>
                            <ThemedText style={[styles.userNameText, isSelected && styles.textSelected]}>
                              {console.log("User Item: ", userItem)}
                                {getDisplayName(userItem)}
                            </ThemedText>
                            {userItem.type === 'guest' && <ThemedText style={styles.userSubtext}>{userItem.email}</ThemedText>}
                            </View>
                            <Ionicons 
                            name={isSelected ? "checkbox" : "square-outline"} 
                            size={24} 
                            color={isSelected ? "tomato" : "#C7C7CC"} 
                            />
                        </Pressable>
                        );
                    })}
                    </ScrollView>
                )}
                </View>

                {/* Bottom: Action Buttons */}
                <View style={styles.wireframeFooterRow}>
                <Pressable style={styles.wireframeCancelBtn} onPress={onClose}>
                    <ThemedText style={styles.cancelBtnText}>Cancel</ThemedText>
                </Pressable>
                <Pressable style={styles.wireframeConfirmBtn} onPress={handleConfirm}>
                    <ThemedText style={styles.confirmBtnText}>
                    Add People ({localSelection.length})
                    </ThemedText>
                </Pressable>
                </View>
            </View>
            </View>
        </Modal>
        );
    

  
  
};


const styles = StyleSheet.create({
  // ... (Keep all your existing styles) ...
  // Add these to your existing styles
  iconActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  iconPadding: {
    paddingLeft: 12, // Spaces the icons apart from each other
  },
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
  inputWrapper: { marginBottom: 15, zIndex: 1},
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#AEAEB2', marginBottom: 5 },
  modernInput: { backgroundColor: '#F2F2F7', padding: 12, borderRadius: 12 },
  dropdownTrigger: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownMenu: {
  position: 'absolute',
  top: 70, // pushes it BELOW the input
  left: 0,
  right: 0,
  backgroundColor: '#FFF',
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#E5E5EA',
  zIndex: 999,
  elevation: 10, // Android fix
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 10,
  maxHeight: 150,
},
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
  },
  emailModalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
    marginTop: 10,
  },
  
  emailModalCancelBtn: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  
  emailModalSearchBtn: {
    flex: 1,
    backgroundColor: 'tomato',
  },
  
  emailModalCancelText: {
    color: '#8E8E93',
  },

   wireframeFilterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        height: 40,
        borderWidth: 1, borderColor: '#E5E5EA',
        borderRadius: 10,
        marginRight: 8
    },
    filterBtnText: { fontSize: 13, color: '#333', fontWeight: '600', marginLeft: 4 },
    wireframeIconBtn: {
        width: 40, height: 40, justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 10, marginRight: 8
    },
    wireframeAddGuestBtn: {
        paddingHorizontal: 12, height: 40, justifyContent: 'center', alignItems: 'center',
        backgroundColor: '#333', borderRadius: 10
    },
    addGuestBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    
    wireframeListArea: {
        height: 350,
        borderWidth: 1, borderColor: '#E5E5EA',
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden'
    },
    listCenterContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    placeholderText: { fontSize: 14, color: '#AEAEB2', marginTop: 10 },
    
    wireframeUserRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1, borderBottomColor: '#F2F2F7'
    },
    userRowSelected: { backgroundColor: '#FFF5F3' },
    userInfo: { flex: 1, paddingHorizontal: 12 },
    userNameText: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
    textSelected: { color: 'tomato' },
    userSubtext: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
    
    wireframeFooterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12
    },
    wireframeCancelBtn: {
        flex: 1, height: 48, justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 12
    },
    cancelBtnText: { fontSize: 16, color: '#8E8E93', fontWeight: '600' },
    wireframeConfirmBtn: {
        flex: 2, height: 48, justifyContent: 'center', alignItems: 'center',
        backgroundColor: 'tomato', borderRadius: 12
    },
    confirmBtnText: { fontSize: 16, color: '#fff', fontWeight: '700' },
     wireframeSelectPeopleBox: {
        width: '95%',
        maxWidth: 600,
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 16, // tighter padding like wireframe
        shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 15,
    },
    wireframeControlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        borderBottomWidth: 1, borderBottomColor: '#F2F2F7', paddingBottom: 12
    },
    wireframeSearchWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        height: 40,
        backgroundColor: '#F2F2F7',
        borderRadius: 10,
        paddingHorizontal: 10,
        marginRight: 10
    },
    wireframeSearchInput: {
        flex: 1,
        fontSize: 14,
        color: '#1C1C1E',
        marginLeft: 8
    },
    totalExpenseCard: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: 'tomato',
  padding: 18,
  borderRadius: 18,
  marginBottom: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.06,
  shadowRadius: 10,
  elevation: 3,
},

totalLabel: {
  fontSize: 13,
  color: '#fff',
  fontWeight: '600',
},

totalAmount: {
  fontSize: 26,
  fontWeight: '800',
  color: '#fff',
  marginTop: 4,

},

totalIcon: {
  width: 46,
  height: 46,
  borderRadius: 12,
  backgroundColor: '#FFF5F3',
  justifyContent: 'center',
  alignItems: 'center',
},
inputError: {
  borderWidth: 1,
  borderColor: 'tomato'
},
errorText: {
  color: 'tomato',
  fontSize: 12,
  marginTop: 4,
  marginLeft: 4
},
disabledBtn: {
  opacity: 0.5
},
personCard: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#FFF',
  padding: 12,
  borderRadius: 14,
  marginBottom: 10,
  borderWidth: 1,
  borderColor: '#F2F2F7'
},
 limitModalBox: {
  width: 320,
  backgroundColor: '#fff',
  borderRadius: 22,
  padding: 25,
  alignItems: 'center'
},

limitTitle: {
  fontSize: 20,
  fontWeight: '800',
  marginTop: 10,
  color: '#1C1C1E'
},

limitMessage: {
  fontSize: 14,
  color: '#8E8E93',
  textAlign: 'center',
  marginTop: 8,
  marginBottom: 20
},

limitBtn: {
  backgroundColor: 'tomato',
  paddingVertical: 10,
  paddingHorizontal: 30,
  borderRadius: 12
},

limitBtnText: {
  color: '#fff',
  fontWeight: '700',
  fontSize: 16
},
avatarCircle: {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: '#FFF5F3',
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 10
},

personType: {
  fontSize: 12,
  color: '#8E8E93',
  marginTop: 2
},

emptyPeople: {
  alignItems: 'center',
  marginTop: 40
},

emptyText: {
  color: '#8E8E93',
  marginTop: 8,
  fontSize: 14
},
rightColumn: { 
    flex: 1, 
    backgroundColor: '#FFF', 
    borderRadius: 24, 
    padding: 24, 
    maxHeight: 550, 
    borderWidth: 1, 
    borderColor: '#F2F2F7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2 
  },
  peopleHeader: { 
    alignItems: 'center', 
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FB'
  },
  iconCircle: { 
    width: 52, 
    height: 52, 
    borderRadius: 26, 
    backgroundColor: '#FFF5F3', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  infoTitle: { fontSize: 19, fontWeight: '800', color: '#1C1C1E' },
  countText: { fontSize: 13, color: '#8E8E93', fontWeight: '600' },
  
  memberRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F8F9FB' 
  },
  memberInfo: { flex: 1 },
  memberRole: { fontSize: 11, color: '#AEAEB2', marginTop: 2 },
  
  avatarPlaceholder: { 
    width: 40, 
    height: 40, 
    borderRadius: 14, 
    backgroundColor: '#F2F2F7', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12 
  },
  avatarRegistered: { backgroundColor: '#FFF5F3' },
  avatarText: { fontSize: 15, fontWeight: '700', color: '#8E8E93' },
  avatarTextRegistered: { color: 'tomato' },
  
  memberName: { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
  guestBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  guestBadgeText: { fontSize: 10, color: '#2E7D32', fontWeight: '800', textTransform: 'uppercase' },
  
  modernSubmitBtn: { 
    flexDirection: 'row',
    backgroundColor: '#1C1C1E', 
    padding: 16, 
    borderRadius: 18, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  submitBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
});