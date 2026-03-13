import { ThemedText } from '@/components/themed-text';
import { supabase } from "@/utils/supabase";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import validator from 'validator';

    // --- MAIN DASHBOARD COMPONENT ---
    export default function Dashboard() {
    const { user } = useUser();
const router = useRouter();
    const [bills, setBills] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [billName, setBillName] = useState("");
    const [inviteCode, setInviteCode] = useState(generateInviteCode());
    const [showAddGuestModal, setShowAddGuestModal] = useState(false);
    const [userRole, setUserRole] = useState('')

    const [guestFirst, setGuestFirst] = useState("");
    const [guestLast, setGuestLast] = useState("");
    const [guestEmail, setGuestEmail] = useState("");

    const BILL_ADD_LIMIT = 5;

    const [errors, setErrors] = useState({});

    // Confirmed people for the new bill
    const [selectedInvolvedPeople, setSelectedInvolvedPeople] = useState([]);
    
    // Controls the new wireframe "Select People" modal
    const [showSelectPeopleModal, setShowSelectPeopleModal] = useState(false);
   
    function generateInviteCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // --- LOGIC: TRANSITION FROM SELECT TO GUEST ---
    const openGuestModal = () => {
        setShowSelectPeopleModal(false); // Hide the list modal
        setShowAddGuestModal(true);      // Show the guest form
    };

    const closeGuestModal = () => {
        setShowAddGuestModal(false);     
        setShowSelectPeopleModal(true);  // Return to the list modal
    };

    const fetchUserRole = async () => {
        const { data, error } = await supabase
        .from('user_has_roles')
        .select(`*,
            roles:role_id (
                name
            )
            `)
        .eq('clerk_user_id', user?.id);

        if(!error) return setUserRole(data[0]?.roles.name);
    }

    useEffect(() => {
        fetchUserRole()
    }, []);

    console.log(userRole)
    console.log("selected involved people: ", selectedInvolvedPeople);

    const createBill = async () => {
  if (!billName) { alert("Bill name required"); return; }
  if (validator.equals(userRole, 'Standard') && getBillEntries() >= BILL_ADD_LIMIT) { 
    alert("You have reached the maximum bills to add this month."); 
    return;
  }

  const { data, error } = await supabase
    .from("bills")
    .insert([{ name: billName, invite_code: inviteCode, created_by: user?.id }])
    .select()
    .single();

  if (error) { 
    alert(error.message); 
    return; 
  }

  const billId = data.id;

  // Only add selected members (NO automatic creator addition)
  if (selectedInvolvedPeople.length > 0) {
    const memberInserts = [];

    for (const person of selectedInvolvedPeople) {
      // Check if this is a registered user
      // Fix: Check if person.id exists and is a string before using string methods
      const isRegisteredUser = 
        person.type === 'registered' || 
        (person.uniqueKey && person.uniqueKey.startsWith('r-')) ||
        (person.id && typeof person.id === 'string' && 
         (person.id.includes('-') && person.id.length > 20));

      if (isRegisteredUser) {
        // REGISTERED USER
        memberInserts.push({
          bill_id: billId,
          user_id: person.id,
          guest_id: null
        });
      } else {
        // GUEST USER
        // Check if guest already exists by email
                let guestId;
        
        if (person.uniqueKey && person.uniqueKey.startsWith('g-')) {
          // Extract the numeric ID from "g-5" format
          guestId = person.uniqueKey.replace('g-', '');
        } else {
          // Fallback to person.id
          guestId = person.id;
        }

        // For guests from the selection modal, they already exist in guest_users
        // So we just need to add them to bill_members
        memberInserts.push({
          bill_id: billId,
          user_id: null,
          guest_id: guestId  // Use the extracted guest ID
        });
        //  else {
        //   // Parse name for guest
        //   let firstName = '';
        //   let lastName = '';
          
        //   if (person.name) {
        //     const nameParts = person.name.split(' ');
        //     firstName = nameParts[0] || '';
        //     lastName = nameParts.slice(1).join(' ') || '';
        //   } else if (person.first_name) {
        //     firstName = person.first_name;
        //     lastName = person.last_name || '';
        //   }

        //   // Insert new guest
        // //   const { data: guestData, error: guestError } = await supabase
        // //     .from("guest_users")
        // //     .insert({
        // //       first_name: firstName,
        // //       last_name: lastName,
        // //       email: person.email
        // //     })
        // //     .select()
        // //     .single();

        // //   if (guestError) {
        // //     console.error("Error creating guest:", guestError);
        // //     continue;
        // //   }
          
        //   guestId = guestData.id;
        // }
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
  }

  loadBills();
  setShowAddModal(false);
  resetForm();
};

    const getBillEntries = () => {
        const now = new Date();
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()

        const entries = bills.filter(bill => {
            const d = new Date(bill.created_at);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).length;

        return entries;
    }

    console.log(BILL_ADD_LIMIT)
    // console.log(userRole)
    console.log(getBillEntries())


    const loadBills = async () => {
        const { data, error } = await supabase
        .from("bills")
        .select("*")
        .eq("created_by", user?.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });
        if (!error) setBills(data);
    };

    const archiveBill = async (billId: number) => {
        const { error } = await supabase.from('bills').update({ status: 'archived'}).eq('id', billId);

        if(error) {
          console.error(error.message);
          return;
        }

        loadBills();
    }


    const deleteBill = async (billId) => {
        const confirmDelete = confirm("Are you sure you want to delete this bill?");
        if (!confirmDelete) return;

        const { error } = await supabase
            .from("bills")
            .delete()
            .eq("id", billId);

        if (error) {
            alert(error.message);
            return;
        }

        loadBills(); // refresh list
    };

    const resetForm = () => {
        setBillName("");
        setSelectedInvolvedPeople([]);
        setInviteCode(generateInviteCode());
    };

    const handleSubmit = async () => {
        if(validateForm()) {
            handleAddGuestSubmit()
        }
    }

    const validateForm = () => {
        let errors = {}

        console.log(guestFirst)

        if(validator.isEmpty(guestFirst)) errors.guestFirst = "First name must not be empty";
        if(validator.isEmpty(guestLast)) errors.guestLast = "Last name must not be empty";
        if (!validator.isEmail(guestEmail)) errors.guestEmail = "Email must be a correct format.";
        if (validator.isEmpty(guestEmail)) errors.guestEmpty = "Email must not be empty.";

        setErrors(errors)
        return Object.keys(errors).length === 0;
    }

    const handleAddGuestSubmit = () => {
  if (!guestFirst || !guestEmail) {
    alert("First name and Email are required");
    return;
  }
  
  const newGuest = {
    id: guestEmail, // Using email as temporary ID
    name: `${guestFirst} ${guestLast}`.trim(),
    first_name: guestFirst,
    last_name: guestLast || '',
    email: guestEmail,
    type: 'guest', // Explicitly set type
    uniqueKey: `g-${Date.now()}-${Math.random()}`
  };
  
  setSelectedInvolvedPeople([...selectedInvolvedPeople, newGuest]);
  setGuestFirst(""); 
  setGuestLast(""); 
  setGuestEmail("");
  setShowAddGuestModal(false);
  setShowSelectPeopleModal(true);
};

    useEffect(() => { loadBills(); }, []);
const getDisplayName = (person) => {
  if (!person) return 'Unknown';
  
  if (person.type === 'registered') {
    return person.nickname || person.name || 'Unknown User';
  } else if (person.type === 'guest') {
    return person.name || `${person.first_name || ''} ${person.last_name || ''}`.trim() || 'Unknown Guest';
  }
  
  // Fallback for other cases
  return person.name || 'Unknown';
};

    // --- HELPER COMPONENT: SELECT PEOPLE MODAL (BASED ON WIREFRAME) ---
     const SelectPeopleModal = ({ visible, onClose, onConfirm, currentSelection, onAddGuestPress }) => {
        const [loading, setLoading] = useState(true);
        const [allPotentialUsers, setAllPotentialUsers] = useState([]); // Master list
        const [displayUsers, setDisplayUsers] = useState([]); // Filtered list
        const [searchQuery, setSearchQuery] = useState("");
        const [filter, setFilter] = useState('all'); // all, registered, guest
        
        // Tracks selections within this modal session before confirmation
        const [localSelection, setLocalSelection] = useState(currentSelection);

        useEffect(() => {
        if (visible) {
            loadUsersFromSupabase("all");
            setLocalSelection(currentSelection);
        }
        }, [visible]);

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

        if(validator.equals(userRole, 'Standard') && localSelection.length > 3 || selectedInvolvedPeople.length > 3) {
            alert('You have reached the maximum people to be involved with, MAX: 3');
            return;
        }

        onConfirm(localSelection); // Pass local choices up to parent
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

    // --- RENDER MAIN UI ---
    return (
        <View style={styles.container}>
        {/* Dashboard Header */}
        <View style={styles.contentHeader}>
            <View>
            <ThemedText style={styles.headerTitle}>Active Bills</ThemedText>
            <ThemedText style={styles.headerSubtitle}>Manage your shared expenses</ThemedText>
            </View>
            <Pressable style={styles.addButton} onPress={() => setShowAddModal(true)}>
            <Ionicons name="add" size={22} color="#fff" />
            <ThemedText style={styles.addButtonText}>New Bill</ThemedText>

            </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            {bills.map((bill) => (
            <View key={bill.id} style={styles.billCard}>
                <View style={styles.billHeader}>
                <View style={styles.iconBg}><Ionicons name="receipt" size={20} color="tomato" /></View>
                <View style={styles.billMainInfo}>
                    <ThemedText style={styles.billName}>{bill.name}</ThemedText>
                    <ThemedText style={styles.billDate}>Created {new Date(bill.created_at).toLocaleDateString()}</ThemedText>
                </View>
                <View style={styles.statusBadge}><ThemedText style={styles.statusText}>{bill.status}</ThemedText></View>
                </View>
                <View style={styles.divider} />
                <View style={styles.actionRow}>
                <Pressable 
  style={[styles.actionIcon, { backgroundColor: '#F2F2F7' }]}
  onPress={() => router.push({
    pathname: '/viewbill', // Ensure this matches your file structure
    params: { billId: bill.id, billName: bill.name }
  })}
>
  <Ionicons name="create" size={18} color="#666" />
</Pressable>
                <Pressable style={[styles.actionIcon, { backgroundColor: '#FFF0F0' }]}><Ionicons name="archive" size={18} color="#e48108" onPress={() => archiveBill(bill.id)} /></Pressable>
                <Pressable
                    style={[styles.actionIcon, { backgroundColor: '#FFF0F0' }]}
                    onPress={() => deleteBill(bill.id)}
                >
                <Ionicons name="trash" size={18} color="#FF3B30" />
                </Pressable>
                </View>
            </View>
            ))}
        </ScrollView>

        {/* --- CREATE BILL MODAL (Simplified to show selected people list) --- */}
        <Modal visible={showAddModal} transparent animationType="fade">
            <View style={styles.modalOverlay}>
            <View style={styles.modernWireframeBox}>
                <View style={styles.modalHeaderRow}>
                <ThemedText style={styles.modalTitleText}>Create new bill</ThemedText>
                <Pressable style={styles.closeBtn} onPress={() => { setShowAddModal(false); resetForm(); }}>
                    <ThemedText style={styles.closeBtnText}>Close</ThemedText>
                </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
                <ThemedText style={styles.fieldLabel}>Generated Code</ThemedText>
                <View style={styles.codeRow}>
                    <View style={styles.codeDisplayBox}>
                    <ThemedText style={styles.codeDisplayText}>{inviteCode}</ThemedText>
                    </View>
                    <Pressable style={styles.regenBtn} onPress={() => setInviteCode(generateInviteCode())}>
                    <Ionicons name="refresh" size={20} color="#fff" />
                    </Pressable>
                </View>

                <ThemedText style={styles.fieldLabel}>Bill name</ThemedText>
                <TextInput
                    style={styles.modernInput}
                    placeholder="e.g. Monthly Electricity"
                    placeholderTextColor="#A1A1A1"
                    value={billName}
                    onChangeText={setBillName}
                />

                <View style={styles.involvedHeaderRow}>
                    <ThemedText style={styles.fieldLabel}>Involved People</ThemedText>
                    <View style={styles.involvedBtnGroup}>
                    {/* MODIFIED: clicking now opens the selection modal */}
                    <Pressable style={styles.smallActionBtn} onPress={() => setShowSelectPeopleModal(true)}>
                        <Ionicons name="people-outline" size={14} color="#fff" style={{marginRight: 4}} />
                        <ThemedText style={styles.smallActionBtnText}>Select People</ThemedText>
                    </Pressable>
                    </View>
                </View>

                <View style={styles.peopleListBox}>
                    <ScrollView nestedScrollEnabled={true}>
                    {selectedInvolvedPeople.length === 0 ? (
                        <View style={styles.emptyListContent}>
                            <Ionicons name="people-outline" size={32} color="#CCC" />
                            <ThemedText style={styles.listPlaceholder}>List of involved people</ThemedText>
                        </View>
                    ) : (
                        selectedInvolvedPeople.map((p, i) => (
                        <View key={i} style={styles.personRow}>
                            <Ionicons 
                            name={p.type === 'registered' ? "at-circle" : "person-circle"} 
                            size={24} 
                            color="tomato" 
                            />
                            <ThemedText style={styles.personRowText}>{getDisplayName(p)}</ThemedText>
                        </View>
                        ))
                    )}
                    </ScrollView>
                </View>
                </ScrollView>

                <Pressable style={styles.submitBtn} onPress={createBill}>
                <ThemedText style={styles.submitBtnText}>Create Bill</ThemedText>
                </Pressable>
            </View>
            </View>
        </Modal>

        {/* ADD GUEST MODAL (BASED ON WIREFRAME) */}
            <Modal visible={showAddGuestModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modernWireframeBox}>
                        <View style={styles.modalHeaderRow}>
                            <ThemedText style={styles.modalTitleText}>Add Guest</ThemedText>
                            <Pressable style={styles.closeBtn} onPress={() => setShowAddGuestModal(false)}>
                                <ThemedText style={styles.closeBtnText}>Close</ThemedText>
                            </Pressable>
                        </View>
                        <ThemedText style={styles.fieldLabel}>First name</ThemedText>
                        <TextInput style={styles.modernInput} value={guestFirst} onChangeText={setGuestFirst} />
                        {
                            errors.guestFirst ? <Text>{errors.guestFirst}</Text> : null
                        }
                        <ThemedText style={styles.fieldLabel}>Last name</ThemedText>
                        <TextInput style={styles.modernInput} value={guestLast} onChangeText={setGuestLast} />
                        {
                            errors.guestLast? <Text>{errors.guestLast}</Text> : null
                        }
                        <ThemedText style={styles.fieldLabel}>Email address</ThemedText>
                        <TextInput style={styles.modernInput} value={guestEmail} onChangeText={setGuestEmail} keyboardType="email-address" />
                        {
                            errors.guestEmail? <Text>{errors.guestEmail}</Text> : null
                        }
                        {
                            errors.guestEmpty? <Text>{errors.guestEmpty}</Text> : null
                        }
                        <Pressable style={styles.submitBtn} onPress={handleSubmit}><ThemedText style={styles.submitBtnText}>Submit button</ThemedText></Pressable>
                    </View>
                </View>
            </Modal>

        {/* --- NEW WIREFRAME SELECT PEOPLE MODAL --- */}
        <SelectPeopleModal 
            visible={showSelectPeopleModal} 
            onClose={() => setShowSelectPeopleModal(false)}
            onConfirm={(people) => setSelectedInvolvedPeople(people)}
            currentSelection={selectedInvolvedPeople}
            onAddGuestPress={openGuestModal}
        />
        </View>
    );
    }

    const styles = StyleSheet.create({
    // ... existing styles ...
    container: { flex: 1, backgroundColor: '#F8F9FA', paddingTop: 60 },
    contentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginBottom: 25 },
    headerTitle: { fontSize: 28, fontWeight: '800', color: '#1C1C1E' },
    headerSubtitle: { fontSize: 14, color: '#8E8E93', marginTop: 2 },
    addButton: { flexDirection: 'row', backgroundColor: 'tomato', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12, alignItems: 'center', elevation: 4 },
    addButtonText: { color: '#fff', fontWeight: '700', marginLeft: 6 },
    scrollContainer: { paddingHorizontal: 20, paddingBottom: 100 },
    
    billCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 16, elevation: 3 },
    billHeader: { flexDirection: 'row', alignItems: 'center' },
    iconBg: { width: 44, height: 44, backgroundColor: '#FFF5F3', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    billMainInfo: { flex: 1 },
    billName: { fontSize: 17, fontWeight: '700', color: '#1C1C1E' },
    billDate: { fontSize: 12, color: '#AEAEB2', marginTop: 2 },
    statusBadge: { backgroundColor: '#E7FAEF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusText: { color: '#28CD41', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
    divider: { height: 1, backgroundColor: '#F2F2F7', marginVertical: 12 },
    actionRow: { flexDirection: 'row', justifyContent: 'flex-start' },
    actionIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 10 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    modernWireframeBox: { 
        width: Platform.OS === 'web' ? 420 : '90%', 
        backgroundColor: '#fff', 
        borderRadius: 30, 
        padding: 24, 
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
    },
    modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalTitleText: { fontSize: 22, fontWeight: '800', color: '#1C1C1E' },
    closeBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#F2F2F7' },
    closeBtnText: { fontSize: 14, fontWeight: '700', color: '#8E8E93' },
    
    fieldLabel: { fontSize: 13, fontWeight: '700', color: '#AEAEB2', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    codeRow: { flexDirection: 'row', marginBottom: 20 },
    codeDisplayBox: { flex: 1, height: 50, backgroundColor: '#F8F9FA', borderRadius: 15, justifyContent: 'center', paddingHorizontal: 15, borderWidth: 1, borderColor: '#F2F2F7' },
    codeDisplayText: { fontSize: 20, letterSpacing: 4, fontWeight: '800', color: 'tomato' },
    regenBtn: { width: 50, height: 50, backgroundColor: '#1C1C1E', borderRadius: 15, marginLeft: 10, justifyContent: 'center', alignItems: 'center' },
    
    modernInput: { height: 50, backgroundColor: '#F8F9FA', borderRadius: 15, paddingHorizontal: 15, fontSize: 16, marginBottom: 20, borderWidth: 1, borderColor: '#F2F2F7', color: '#1C1C1E' },
    
    involvedHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    involvedBtnGroup: { flexDirection: 'row' },
    smallActionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: 'tomato' },
    smallActionBtnText: { fontSize: 12, fontWeight: '800', color: '#fff' },
    
    peopleListBox: { height: 160, backgroundColor: '#F8F9FA', borderRadius: 20, padding: 15, marginBottom: 25, borderWidth: 1, borderColor: '#F2F2F7' },
    emptyListContent: { alignItems: 'center', marginTop: 30 },
    listPlaceholder: { color: '#AEAEB2', marginTop: 8, fontSize: 14, fontWeight: '500' },
    personRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: '#fff', padding: 10, borderRadius: 12, elevation: 1 },
    personRowText: { marginLeft: 10, fontSize: 15, fontWeight: '600', color: '#333' },

    submitBtn: { backgroundColor: 'tomato', height: 55, borderRadius: 18, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: 'tomato', shadowOpacity: 0.3, shadowRadius: 10 },
    submitBtnText: { fontSize: 18, fontWeight: '800', color: '#fff' },

    // --- NEW STYLES FOR THE SELECT PEOPLE MODAL (WIREFRAME MATCH) ---
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
    });