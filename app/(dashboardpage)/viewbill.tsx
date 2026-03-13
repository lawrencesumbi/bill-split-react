import { ThemedText } from '@/components/themed-text';
import { supabase } from '@/utils/supabase';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';



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
  const [searchQuery, setSearchQuery] = useState('');


  const [showEditExpenseModal, setShowEditExpenseModal] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  
  // Modal Visibility States
  const [selectedInvolvedPeople, setSelectedInvolvedPeople] = useState([])
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false); // For Custom Split
  const [showPaidByDropdown, setShowPaidByDropdown] = useState(false);
  const [showSelectPeopleModal, setShowSelectPeopleModal] = useState(false);
  
  // Form states
  const [guestFirstName, setGuestFirstName] = useState('');
  const [guestLastName, setGuestLastName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  const [expName, setExpName] = useState('');
  const [expCost, setExpCost] = useState('');
  const [expPaidBy, setExpPaidBy] = useState("");
  const [selectedInvolved, setSelectedInvolved] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const [billStatus, setBillStatus] = useState('');

  const [showViewExpenseModal, setShowViewExpenseModal] = useState(false);
  const [viewingExpense, setViewingExpense] = useState<any>(null);
  const [viewInvolved, setViewInvolved] = useState<any[]>([]);

  const currentUserId = user?.id;

  useEffect(() => { getNickname(currentUserId); }, [currentUserId]);

  const totalExpense = expenses.reduce((sum, exp) => {
  const cost = parseFloat(exp.cost || 0);
  return sum + (isNaN(cost) ? 0 : cost);
}, 0);

   const filteredExpenses = expenses.filter(exp =>
  exp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
  exp.paid_by?.toLowerCase().includes(searchQuery.toLowerCase())
);

  const getNickname = async(id:string) => {
    const { data, error } = await supabase
    .from("clerk_users")
    .select(`nickname`)
    .eq('clerk_user_id', id)
    .single()

    if(!error) setExpPaidBy(data.nickname);
  }

  const openGuestModal = () => {
    setShowSelectPeopleModal(false);
    setShowGuestModal(true)
  }

  const handleViewExpense = async (exp: any) => {
    setViewingExpense(exp);

    const { data, error } = await supabase
      .from("expenses_involved")
      .select(`
        amount_spent,
        bill_members (
          id,
          clerk_users:user_id (nickname),
          guest_users:guest_id (first_name)
        )
      `)
      .eq("expenses_id", exp.id);

    if (!error && data) {
      setViewInvolved(data);
    }

    setShowViewExpenseModal(true);
  };

  const handleEditExpense = async (exp: any) => {
  setIsEditing(true);
  setEditingExpenseId(exp.id);

  setExpName(exp.name);
  setExpCost(exp.cost.toString());
  setExpPaidBy(exp.paid_by);

  // fetch involved people
  const { data, error } = await supabase
    .from("expenses_involved")
    .select("bill_member_id, amount_spent")
    .eq("expenses_id", exp.id);

  if (!error && data) {
    // store selected ids
    const selectedIds = data.map(i => i.bill_member_id);
    setSelectedInvolved(selectedIds);
    if(selectedInvolved.length >= 2) {
      setSplitType('custom')
    }

    // store custom amounts
    const amounts = {};
    data.forEach(i => {
      amounts[i.bill_member_id] = i.amount_spent.toString();
    });

    setCustomAmounts(amounts);
  }

  setShowExpenseModal(true);
};

  const handleUpdateExpense = async () => {
  if (!editingExpenseId) return;

  try {
    const { error } = await supabase
      .from("expenses")
      .update({
        name: expName,
        cost: parseFloat(expCost),
        paid_by: expPaidBy
      })
      .eq("id", editingExpenseId);

    if (error) throw error;

    Alert.alert("Success", "Expense updated");

    setShowEditExpenseModal(false);
    setEditingExpenseId(null);

    fetchExpenses();

  } catch (err) {
    console.error(err);
    Alert.alert("Error", "Failed to update expense");
  }
};

  console.log("involved: ", involved)
  
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
            return person.clerk_users?.nickname || person.name || 'Unknown User';
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
        .select('invite_code, status')
        .eq('id', billId)
        .single();

      if (billError) throw billError;
      setInviteCode(billData?.invite_code || '');
      setBillStatus(billData?.status || '');

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

  const handleDelete = async (expenseId: string) => {
    try {
      const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId)

      alert('success');
      fetchExpenses()
    } catch(err) {
      console.error(err)
    }
  }
  
  const toggleInvolved = (id: string) => {
    setSelectedInvolved(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    if(selectedInvolved.length <= 2) {
      setSplitType('equal')
    }
  }, [selectedInvolved]);
  console.log(splitType)

  const handleCustomAmountChange = (id: string, value: string) => {
    setCustomAmounts(prev => ({ ...prev, [id]: value }));
  };

  console.log("selected involved poeple", selectedInvolvedPeople)

  // Helper to calculate remaining for Custom Modal
  const totalAllocated = Object.values(customAmounts).reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
  const remaining = parseFloat(expCost || '0') - totalAllocated;

// --- HELPER COMPONENT: SELECT PEOPLE MODAL (BASED ON WIREFRAME) ---
    const SelectPeopleModal = ({ visible, onClose, onConfirm, currentSelection, onAddGuestPress, billId, loadInvolved }) => {
        const [loading, setLoading] = useState(true);
        const [allPotentialUsers, setAllPotentialUsers] = useState([]); // Master list
        const [displayUsers, setDisplayUsers] = useState([]); // Filtered list
        const [searchQuery, setSearchQuery] = useState("");
        const [filter, setFilter] = useState('all'); // all, registered, guest
        
        // Tracks selections within this modal session before confirmation
        const [localSelection, setLocalSelection] = useState(currentSelection);

        useEffect(() => {
        if (visible) {
            console.log("visible true")
            loadUsersFromSupabase("all");
            setLocalSelection(currentSelection);
        }
        }, [visible]);

        console.log("local selection:", localSelection, visible)

        const loadUsersFromSupabase = async (currentFilter = "all") => {
        setLoading(true);

        try {
            let users = [];

            // REGISTERED USERS
            if (currentFilter === "all" || currentFilter === "registered") {
            const { data: registeredData } = await supabase
                .from("clerk_users")
                .select("clerk_user_id, nickname");

            const formattedRegistered = (registeredData || []).map(u => ({
                id: u.clerk_user_id,
                name: u.nickname || "Unknown User",
                type: "registered",
                uniqueKey: `r-${u.clerk_user_id}`
            }));

            users = [...users, ...formattedRegistered];
            }

            // GUEST USERS
            if (currentFilter === "all" || currentFilter === "guest") {
            const { data: guestsData } = await supabase
                .from("guest_users")
                .select("id, first_name, last_name, email");

            const formattedGuests = (guestsData || []).map(g => ({
                id: g.id,
                name: `${g.first_name} ${g.last_name}`,
                type: "guest",
                uniqueKey: `g-${g.id}`
            }));

            users = [...users, ...formattedGuests];
            }

            setAllPotentialUsers(users);
            applyFilters(users, searchQuery, currentFilter);

        } catch (error) {
            console.error("Error loading users:", error);
        } finally {
            setLoading(false);
        }
        };

    const applyFilters = (users, query, currentFilter) => {
        let filtered = users;
        // Filter by type
        if (currentFilter !== 'all') {
            filtered = filtered.filter(u => u.type === currentFilter);
        }
        // Filter by search query
        if (query) {
            filtered = filtered.filter(u => 
            u.name.toLowerCase().includes(query.toLowerCase()) ||
            (u.email && u.email.toLowerCase().includes(query.toLowerCase()))
            );
        }

        console.log("filtered: ", filtered)

        if(involved) {
          // Filter clerk users
            involved.map(i => {
              filtered = filtered.filter(u =>
                u.id != i.user_id
              )
              console.log("involved: ", i)
          });

          // Filter guests
          involved.map(i => {
            filtered = filtered.filter(u =>
              u.id != i.guest_id
            )
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

        const handleConfirm = () => {
        onConfirm(localSelection); // Pass local choices up to parent
        insertSelectedPeople(localSelection);
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
      return;
    }
  }

  // Refresh the involved people list
  if (typeof loadInvolved === 'function') {
    loadInvolved();
  }
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

  
  
  return (
    <View style={styles.container}>
      {/* ... (Previous Header, Search, and Lists remain exactly the same) ... */}
      <View style={styles.topTitleBar}>
        <ThemedText style={styles.breadcrumb}>Dashboard / {billName || 'Bill'}</ThemedText>
      </View>

      <View style={styles.actionBar}>
        <View style={styles.searchSection}>
          <Pressable style={styles.glassBackBtn} onPress={() => router.back()}><Ionicons name="arrow-back" size={20} color="#1C1C1E" /></Pressable>
                    <View style={styles.searchContainer}><Ionicons name="search" size={18} color="#AEAEB2" /><TextInput
            style={styles.searchInput}
            placeholder="Search expenses..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          /></View>
        </View>
        <Pressable
          style={[
            styles.modernAddBtn,
            billStatus === "archived" && { opacity: 0.5 }
          ]}
          onPress={() => {
               setIsEditing(false);

              setExpName('');
              setExpCost('');
              setSelectedInvolved([]);
              setCustomAmounts({});

              setShowExpenseModal(true);
            }}
          disabled={billStatus === "archived"}
        >
          <Ionicons name="add" size={20} color="#FFF" /><ThemedText style={styles.addBtnText}>Add Expense</ThemedText>
        </Pressable>
      </View>

      {billStatus === "archived" && (
        <ThemedText style={{color: "tomato", marginBottom: 10}}>
          This bill is archived. You cannot add new expenses.
        </ThemedText>
      )}

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

        <View style={styles.totalExpenseCard}>
          <View>
            <ThemedText style={styles.totalLabel}>Total Expense</ThemedText>
            <ThemedText style={styles.totalAmount}>₱{totalExpense.toFixed(2)}</ThemedText>
          </View>

          <View style={styles.totalIcon}>
            <Ionicons name="wallet" size={22} color="tomato" />
          </View>
        </View>
            <ScrollView showsVerticalScrollIndicator={false}>
             {filteredExpenses.map(exp => (
  <View key={exp.id} style={styles.modernExpenseCard}>
    <View style={styles.cardHeader}>
      <View style={{ flex: 1 }}>
        <ThemedText style={styles.expName}>{exp.name}</ThemedText>
        <ThemedText style={styles.expPaidBy}>
          Paid by <ThemedText style={{ fontWeight: '700' }}>{exp.paid_by}</ThemedText>
        </ThemedText>
      </View>
      
      <View style={{ alignItems: 'flex-end' }}>
        <ThemedText style={styles.expAmount}>₱{exp.cost}</ThemedText>
        {/* SIDE BY SIDE ICONS CONTAINER */}
        <View style={styles.iconActionsRow}>
          <Pressable style={styles.iconPadding} onPress={() => {handleEditExpense(exp)}}>
            <Ionicons name="pencil" size={18} color="#007AFF" />
          </Pressable>
          <Pressable style={styles.iconPadding} onPress={() => {handleDelete(exp.id)}}>
            <Ionicons name="trash" size={18} color="tomato" />
          </Pressable>
          <Pressable
            style={styles.iconPadding}
            onPress={() => handleViewExpense(exp)}
          >
            <Ionicons name="eye" size={18} color="grey" />
          </Pressable>
        </View>
      </View>
    </View>
  </View>
))}
            </ScrollView>
        </View>

        <View style={styles.rightColumn}>
          <View style={styles.peopleHeader}>
            <ThemedText style={styles.columnTitle}>Involved people</ThemedText>
            <Pressable
              style={[
                styles.addPersonBtn,
                billStatus === "archived" && { opacity: 0.4 }
              ]}
              onPress={() => setShowSelectPeopleModal(true)}
              disabled={billStatus === "archived"}
            >
              <Ionicons name="person-add" size={16} color="tomato" />
            </Pressable>
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
              <ThemedText style={styles.modalTitle}>{isEditing ? "Edit Expense" : "Add Expense"}</ThemedText>
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

              {involved.length != 0 && (
              <>
                <ThemedText style={styles.inputLabel}>With:</ThemedText>
                <ScrollView style={styles.involvedListContainer}>
                  {involved.map(g => (
                    <Pressable key={g.id} onPress={() => toggleInvolved(g.id)} style={styles.involvedRow}>
                      <Ionicons name={selectedInvolved.includes(g.id) ? "checkbox" : "square-outline"} size={20} color="tomato" />
                      <ThemedText style={{marginLeft: 10}}>{getDisplayName(g)}</ThemedText>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
              )}

            <View style={styles.toggleContainer}>
              <Pressable 
                style={[styles.toggleBtn, splitType === 'equal' && styles.toggleBtnActive]} 
                onPress={() => setSplitType('equal')}
              >
                <ThemedText style={[styles.toggleBtnText, splitType === 'equal' && styles.toggleBtnTextActive]}>
                  Equally Divided
                </ThemedText>
              </Pressable>

              {selectedInvolved.length > 2 && (
              <>
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
              </>
              )}
            </View>
            
            <Pressable style={styles.modernSubmitBtn} onPress={isEditing ? handleUpdateExpense : handleAddExpense}>
              <ThemedText style={styles.submitBtnText}>Submit button</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* EDIT EXPENSE MODAL */}
<Modal visible={showEditExpenseModal} transparent animationType="fade">
  <View style={styles.modalOverlay}>
    <View style={styles.modernModalBox}>

      <View style={styles.modalHeader}>
        <ThemedText style={styles.modalTitle}>Edit Expense</ThemedText>
        <Pressable style={styles.closeBtn} onPress={() => setShowEditExpenseModal(false)}>
          <ThemedText style={{fontWeight: '700'}}>Close</ThemedText>
        </Pressable>
      </View>

      <View style={styles.inputWrapper}>
        <ThemedText style={styles.inputLabel}>Name</ThemedText>
        <TextInput
          style={styles.modernInput}
          value={expName}
          onChangeText={setExpName}
        />
      </View>

      <View style={styles.inputWrapper}>
        <ThemedText style={styles.inputLabel}>Cost</ThemedText>
        <TextInput
          style={styles.modernInput}
          value={expCost}
          onChangeText={setExpCost}
          keyboardType="numeric"
        />
      </View>

      {/* Paid by dropdown */}
      <View style={styles.inputWrapper}>
        <ThemedText style={styles.inputLabel}>Paid by</ThemedText>

        <Pressable
          style={[styles.modernInput, styles.dropdownTrigger]}
          onPress={() => setShowPaidByDropdown(!showPaidByDropdown)}
        >
          <ThemedText>{expPaidBy}</ThemedText>
          <Ionicons name="chevron-down" size={18} color="#AEAEB2" />
        </Pressable>

        {showPaidByDropdown && (
          <View style={styles.dropdownMenu}>
            {involved.map(g => (
              <Pressable
                key={g.id}
                style={styles.dropdownItem}
                onPress={() => {
                  setExpPaidBy(getDisplayName(g));
                  setShowPaidByDropdown(false);
                }}
              >
                <ThemedText>{getDisplayName(g)}</ThemedText>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <Pressable style={styles.modernSubmitBtn} onPress={handleUpdateExpense}>
        <ThemedText style={styles.submitBtnText}>Save Changes</ThemedText>
      </Pressable>

    </View>
  </View>
</Modal>

{/* VIEW EXPENSE MODAL */}
<Modal visible={showViewExpenseModal} transparent animationType="fade">
  <View style={styles.modalOverlay}>
    <View style={styles.modernModalBox}>

      <View style={styles.modalHeader}>
        <ThemedText style={styles.modalTitle}>Expense Details</ThemedText>
        <Pressable
          style={styles.closeBtn}
          onPress={() => setShowViewExpenseModal(false)}
        >
          <ThemedText style={{fontWeight:'700'}}>Close</ThemedText>
        </Pressable>
      </View>

      {viewingExpense && (
        <>
          <View style={{marginBottom:15}}>
            <ThemedText style={styles.inputLabel}>Expense Name</ThemedText>
            <ThemedText style={{fontSize:16,fontWeight:'600'}}>
              {viewingExpense.name}
            </ThemedText>
          </View>

          <View style={{marginBottom:15}}>
            <ThemedText style={styles.inputLabel}>Cost</ThemedText>
            <ThemedText style={{fontSize:16,fontWeight:'600'}}>
              ₱{viewingExpense.cost}
            </ThemedText>
          </View>

          <View style={{marginBottom:15}}>
            <ThemedText style={styles.inputLabel}>Paid By</ThemedText>
            <ThemedText style={{fontSize:16,fontWeight:'600'}}>
              {viewingExpense.paid_by}
            </ThemedText>
          </View>

          <ThemedText style={[styles.inputLabel,{marginTop:10}]}>
            People Involved
          </ThemedText>

          <ScrollView style={{maxHeight:200}}>
            {viewInvolved.map((p, index) => {
              const member = p.bill_members;

              const name =
                member?.clerk_users?.nickname ||
                member?.guest_users?.first_name ||
                "Unknown";

              return (
                <View
                  key={index}
                  style={{
                    flexDirection:'row',
                    justifyContent:'space-between',
                    paddingVertical:8
                  }}
                >
                  <ThemedText>{name}</ThemedText>
                  <ThemedText>₱{p.amount_spent}</ThemedText>
                </View>
              );
            })}
          </ScrollView>
        </>
      )}

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
                      <ThemedText style={{color: '#AEAEB2'}}>₱</ThemedText>
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
              <SelectPeopleModal 
            visible={showSelectPeopleModal} 
            onClose={() => setShowSelectPeopleModal(false)}
            onConfirm={(people) => setSelectedInvolvedPeople(people)}
            currentSelection={selectedInvolvedPeople}
            onAddGuestPress={openGuestModal}
            billId={billId}
            loadInvolved={loadInvolved}
        />
    </View>
  );
}

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
  backgroundColor: '#FFF',
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
  color: '#8E8E93',
  fontWeight: '600',
},

totalAmount: {
  fontSize: 26,
  fontWeight: '800',
  color: 'tomato',
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
});