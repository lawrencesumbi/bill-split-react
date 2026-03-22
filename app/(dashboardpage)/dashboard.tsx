import { ThemedText } from '@/components/themed-text';
import { supabase } from "@/utils/supabase";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import validator from 'validator';
// Find your react-native import and add Platform
import {
    Platform // <--- ADD THIS
} from 'react-native';

export default function Dashboard() {
    const router = useRouter();
    
    // --- AUTH & USER STATE ---
    const [session, setSession] = useState(null);
    const [userRole, setUserRole] = useState('Standard');
    
    // --- BILL STATE ---
    const [bills, setBills] = useState([]);
    const [billName, setBillName] = useState("");
    const [inviteCode, setInviteCode] = useState(generateInviteCode());
    const [selectedInvolvedPeople, setSelectedInvolvedPeople] = useState([]);
    
    // --- MODAL CONTROLS ---
    const [showAddModal, setShowAddModal] = useState(false);
    const [showSelectPeopleModal, setShowSelectPeopleModal] = useState(false);
    const [showAddGuestModal, setShowAddGuestModal] = useState(false);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [showPeopleLimitModal, setShowPeopleLimitModal] = useState(false);
    const [showEmailExistsModal, setShowEmailExistsModal] = useState(false);

    // --- GUEST FORM STATE ---
    const [guestFirst, setGuestFirst] = useState("");
    const [guestLast, setGuestLast] = useState("");
    const [guestEmail, setGuestEmail] = useState("");
    const [errors, setErrors] = useState({});

    const BILL_ADD_LIMIT = 5;

    // --- INITIALIZATION ---
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (session?.user) {
            fetchUserRole();
            loadBills();
        }
    }, [session]);

    function generateInviteCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    const fetchUserRole = async () => {
        if (!session?.user?.id) return;
        const { data, error } = await supabase
            .from('user_has_roles')
            .select(`roles:role_id ( name )`)
            .eq('user_id', session.user.id);

        if (!error && data?.length > 0) setUserRole(data[0]?.roles.name);
    }

    const loadBills = async () => {
        if (!session?.user?.id) return;
        const { data, error } = await supabase
            .from("bills")
            .select("*")
            .eq("created_by", session.user.id)
            .eq("status", "active")
            .order("created_at", { ascending: false });
        if (!error) setBills(data);
    };

    const createBill = async () => {
        if (!billName) { alert("Bill name required"); return; }
        
        if (userRole === 'Standard' && getBillEntries() >= BILL_ADD_LIMIT) { 
            setShowLimitModal(true);
            return;
        }

        if (userRole === 'Standard' && selectedInvolvedPeople.length > 3) {
            setShowPeopleLimitModal(true);
            return;
        }

        const { data, error } = await supabase
            .from("bills")
            .insert([{ 
                name: billName, 
                invite_code: inviteCode, 
                created_by: session?.user?.id 
            }])
            .select().single();

        if (error) { alert(error.message); return; }

        if (selectedInvolvedPeople.length > 0) {
            const memberInserts = selectedInvolvedPeople.map(person => ({
                bill_id: data.id,
                user_id: person.type === 'registered' ? person.id : null,
                guest_id: person.type === 'guest' ? person.id : null
            }));

            await supabase.from("bill_members").insert(memberInserts);
        }

        loadBills();
        setShowAddModal(false);
        resetForm();
    };

    const getBillEntries = () => {
        const now = new Date();
        return bills.filter(bill => {
            const d = new Date(bill.created_at);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length;
    }

    const resetForm = () => {
        setBillName("");
        setSelectedInvolvedPeople([]);
        setInviteCode(generateInviteCode());
    };

    const handleAddGuestSubmit = async () => {
        if (!guestFirst || !guestEmail || !validator.isEmail(guestEmail)) {
            setErrors({ email: "Valid First name and Email required" });
            return;
        }

        const { data: existingGuest } = await supabase
            .from("guest_users")
            .select("id").eq("email", guestEmail).maybeSingle();

        if (existingGuest) {
            setShowAddGuestModal(false);
            setShowEmailExistsModal(true);
            return;
        }

        const { data: guestData, error: guestError } = await supabase
            .from("guest_users")
            .insert({ first_name: guestFirst, last_name: guestLast || '', email: guestEmail })
            .select().single();

        if (guestError) return;

        const newGuest = {
            id: guestData.id,
            name: `${guestFirst} ${guestLast}`.trim(),
            type: 'guest',
            uniqueKey: `g-${guestData.id}`
        };

        setSelectedInvolvedPeople([...selectedInvolvedPeople, newGuest]);
        setGuestFirst(""); setGuestLast(""); setGuestEmail("");
        setShowAddGuestModal(false);
        setShowSelectPeopleModal(true);
    };

    // --- MODAL COMPONENTS ---

    const SelectPeopleModal = ({ visible, onClose, onConfirm, currentSelection }) => {
        const [loading, setLoading] = useState(true);
        const [displayUsers, setDisplayUsers] = useState([]);
        const [localSelection, setLocalSelection] = useState(currentSelection);

        useEffect(() => {
            if (visible) {
                setLocalSelection(currentSelection);
                loadUsers();
            }
        }, [visible]);

        const loadUsers = async () => {
            setLoading(true);
            const { data: reg } = await supabase.from("profiles").select("id, nickname");
            const { data: gst } = await supabase.from("guest_users").select("id, first_name, last_name, email");

            const formattedReg = (reg || []).map(u => ({ id: u.id, name: u.nickname || "User", type: "registered", uniqueKey: `r-${u.id}` }));
            const formattedGst = (gst || []).map(g => ({ id: g.id, name: `${g.first_name} ${g.last_name}`, type: "guest", uniqueKey: `g-${g.id}`, email: g.email }));
            
            setDisplayUsers([...formattedReg, ...formattedGst].filter(u => u.id !== session?.user?.id));
            setLoading(false);
        };

        const toggleSelection = (user) => {
            const exists = localSelection.some(u => u.uniqueKey === user.uniqueKey);
            setLocalSelection(exists ? localSelection.filter(u => u.uniqueKey !== user.uniqueKey) : [...localSelection, user]);
        };

        return (
            <Modal visible={visible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.wireframeSelectPeopleBox}>
                        <View style={styles.modalHeaderRow}>
                            <ThemedText style={styles.modalTitleText}>Select People</ThemedText>
                            <Pressable onPress={() => { setShowSelectPeopleModal(false); setShowAddGuestModal(true); }}>
                                <ThemedText style={{color: 'tomato'}}>+ Add Guest</ThemedText>
                            </Pressable>
                        </View>
                        <ScrollView style={{marginVertical: 15}}>
                            {loading ? <ActivityIndicator color="tomato" /> : displayUsers.map(u => (
                                <Pressable key={u.uniqueKey} style={styles.wireframeUserRow} onPress={() => toggleSelection(u)}>
                                    <View>
                                        <ThemedText>{u.name}</ThemedText>
                                        {u.type === 'guest' && <Text style={{fontSize: 10, color: '#999'}}>{u.email}</Text>}
                                    </View>
                                    <Ionicons name={localSelection.some(s => s.uniqueKey === u.uniqueKey) ? "checkbox" : "square-outline"} size={22} color="tomato" />
                                </Pressable>
                            ))}
                        </ScrollView>
                        <View style={styles.wireframeFooterRow}>
                            <Pressable style={styles.wireframeCancelBtn} onPress={onClose}><Text>Cancel</Text></Pressable>
                            <Pressable style={styles.wireframeConfirmBtn} onPress={() => { onConfirm(localSelection); onClose(); }}>
                                <Text style={{color: '#fff'}}>Confirm ({localSelection.length})</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.contentHeader}>
                <View>
                    <ThemedText style={styles.headerTitle}>Active Bills</ThemedText>
                    <ThemedText style={styles.headerSubtitle}>Manage your shared expenses</ThemedText>
                </View>
                <Pressable style={styles.addButton} onPress={() => setShowAddModal(true)}>
                    <Ionicons name="add" size={20} color="#fff" />
                    <ThemedText style={styles.addButtonText}>New Bill</ThemedText>
                </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {bills.length === 0 ? (
                    <View style={styles.emptyState}><ThemedText>No active bills found.</ThemedText></View>
                ) : (
                    bills.map(bill => (
                        <View key={bill.id} style={styles.billCard}>
                            <View>
                                <ThemedText style={styles.billName}>{bill.name}</ThemedText>
                                <ThemedText style={styles.billDate}>{new Date(bill.created_at).toLocaleDateString()}</ThemedText>
                            </View>
                            <View style={styles.actionRow}>
                                <Pressable onPress={() => router.push({ pathname: '/viewbill', params: { billId: bill.id } })}>
                                    <Ionicons name="eye" size={20} color="#666" />
                                </Pressable>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>

            {/* CREATE BILL MODAL */}
            <Modal visible={showAddModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modernWireframeBox}>
                        <ThemedText style={styles.modalTitleText}>Create New Bill</ThemedText>
                        <TextInput style={styles.modernInput} placeholder="Bill Name" value={billName} onChangeText={setBillName} />
                        <View style={styles.codeDisplayBox}><ThemedText>{inviteCode}</ThemedText></View>
                        <Pressable style={styles.smallActionBtn} onPress={() => setShowSelectPeopleModal(true)}>
                            <ThemedText style={styles.smallActionBtnText}>Select People ({selectedInvolvedPeople.length})</ThemedText>
                        </Pressable>
                        <Pressable style={styles.submitBtn} onPress={createBill}><ThemedText style={styles.submitBtnText}>Create Bill</ThemedText></Pressable>
                        <Pressable style={{marginTop: 15, alignItems: 'center'}} onPress={() => setShowAddModal(false)}><Text>Cancel</Text></Pressable>
                    </View>
                </View>
            </Modal>

            {/* ADD GUEST MODAL */}
            <Modal visible={showAddGuestModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modernWireframeBox}>
                        <ThemedText style={styles.modalTitleText}>Add New Guest</ThemedText>
                        <TextInput style={styles.modernInput} placeholder="First Name" value={guestFirst} onChangeText={setGuestFirst} />
                        <TextInput style={styles.modernInput} placeholder="Last Name" value={guestLast} onChangeText={setGuestLast} />
                        <TextInput style={styles.modernInput} placeholder="Email" value={guestEmail} onChangeText={setGuestEmail} keyboardType="email-address" />
                        <Pressable style={styles.submitBtn} onPress={handleAddGuestSubmit}><ThemedText style={styles.submitBtnText}>Add Guest</ThemedText></Pressable>
                        <Pressable style={{marginTop: 15, alignItems: 'center'}} onPress={() => { setShowAddGuestModal(false); setShowSelectPeopleModal(true); }}><Text>Back</Text></Pressable>
                    </View>
                </View>
            </Modal>

            {/* LIMIT & ERROR MODALS */}
            <Modal visible={showLimitModal || showPeopleLimitModal || showEmailExistsModal} transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.limitModalBox}>
                        <Ionicons name="warning" size={40} color="tomato" />
                        <ThemedText style={styles.limitTitle}>Notice</ThemedText>
                        <ThemedText style={{textAlign: 'center', marginVertical: 10}}>
                            {showLimitModal ? "Monthly bill limit reached." : showPeopleLimitModal ? "Standard users limit: 3 people." : "Email already exists."}
                        </ThemedText>
                        <Pressable style={styles.limitBtn} onPress={() => { setShowLimitModal(false); setShowPeopleLimitModal(false); setShowEmailExistsModal(false); }}>
                            <Text style={{color: '#fff'}}>OK</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            <SelectPeopleModal visible={showSelectPeopleModal} onClose={() => setShowSelectPeopleModal(false)} onConfirm={setSelectedInvolvedPeople} currentSelection={selectedInvolvedPeople} />
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
    });