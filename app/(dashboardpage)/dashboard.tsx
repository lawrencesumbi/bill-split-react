    import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View
} from 'react-native';

    export default function Dashboard() {
    const [showAddModal, setShowAddModal] = useState(false);
    const router = useRouter();

    const bills = [
        { id: '1', name: 'Apartment Rent', date: 'Oct 2023', status: 'Active' },
    ];

    return (
        <View style={styles.container}>

        <View style={styles.contentHeader}>
            <ThemedText style={styles.headerTitle}>
            Active Bills
            </ThemedText>

            <Pressable style={styles.addButton} onPress={() => setShowAddModal(true)}>
            <Ionicons name="add" size={20} color="#fff" />
            <ThemedText style={styles.addButtonText}>New Bill</ThemedText>
            </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
            {bills.map(bill => (
            <View key={bill.id} style={styles.billCard}>
                <View style={styles.billMainInfo}>
                <ThemedText style={styles.billName}>{bill.name}</ThemedText>
                <ThemedText style={styles.billDate}>{bill.date}</ThemedText>
                </View>

                <View style={styles.actionRow}>
                <Pressable 
    style={styles.actionIcon}
    //pwede ni nimo ma erase and comment sa onpress kay mao na sample pag gamit sa buttons for actions kani is for view bill sample 
    //onPress={() => router.push(`/viewbill/${bill.id}`)} //ari makita and details sa bill using id later sa database once e click na
    >
    <Ionicons name="eye-outline" size={18} color="#666" />
    </Pressable>
                <Pressable style={styles.actionIcon}>
                    <Ionicons name="create-outline" size={18} color="#666" />
                </Pressable>
                <Pressable style={styles.actionIcon}>
                    <Ionicons name="trash-outline" size={18} color="#ff4444" />
                </Pressable>
                <Pressable style={styles.actionIcon}>
                    <Ionicons name="archive-outline" size={18} color="tomato" />
                </Pressable>
                </View>
            </View>
            ))}

            {bills.length === 0 && (
            <View style={styles.emptyState}>
                <ThemedText style={styles.emptyText}>No details</ThemedText>
            </View>
            )}
        </ScrollView>

        <Modal visible={showAddModal} transparent animationType="fade">
    <View style={styles.modalOverlay}>
    <ScrollView
        contentContainerStyle={styles.modalScrollContainer}
        showsVerticalScrollIndicator={false}
    >
        <View style={styles.registerBox}>
        <ThemedText style={styles.modalTitle}>Create New Bill</ThemedText>

        {/* BILL NAME */}
        <ThemedText style={styles.label}>Bill Name</ThemedText>
        <TextInput
            style={styles.input}
            placeholder="e.g. Apartment Rent"
        />

        {/* GENERATED CODE */}
        <ThemedText style={styles.label}>Generated Invite Code</ThemedText>
        <View style={styles.codeRow}>
            <TextInput
            style={[styles.input, { flex: 1 }]}
            editable={false}
            value="902949" 
            /* BACKEND:
                - Generate random unique code from backend
                - Return code when bill is created
            */
            />
            <Pressable style={styles.regenBtn}>
            <Ionicons name="refresh" size={18} color="#fff" />
            </Pressable>
        </View>

        {/* SEARCH REGISTERED USERS */}
        <ThemedText style={styles.label}>Add Registered User</ThemedText>
        <TextInput
            style={styles.input}
            placeholder="Search by name or email..."
            /* BACKEND:
            - OnChange → call API to search users
            - Return matching users list
            */
        />

        {/* ADD GUEST USER BUTTON */}
        <Pressable style={styles.addGuestBtn}>
            <Ionicons name="person-add-outline" size={18} color="#fff" />
            <ThemedText style={styles.addGuestText}>Add Guest User</ThemedText>
        </Pressable>

        {/* GUEST USER FORM */}
        <View style={styles.guestBox}>
            <ThemedText style={styles.label}>Guest Information</ThemedText>

            <TextInput style={styles.input} placeholder="First Name" />
            <TextInput style={styles.input} placeholder="Last Name" />
            <TextInput style={styles.input} placeholder="Email" keyboardType="email-address" />
            <TextInput style={styles.input} placeholder="Contact Number" keyboardType="phone-pad" />

            {/* VALIDATION NOTE:
            - Must apply same validation rules as registration form
            - Except no username/password
            */}
        </View>

        {/* INVOLVED USERS LIST PREVIEW */}
        <ThemedText style={styles.label}>Involved Persons</ThemedText>
        <View style={styles.userPreview}>
            <ThemedText style={{ color: "#666" }}>
            (Selected users will appear here)
            </ThemedText>
        </View>

        {/* BUTTONS */}
        <View style={styles.modalButtons}>
            <Pressable style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
            <ThemedText style={styles.cancelBtnText}>Cancel</ThemedText>
            </Pressable>

            <Pressable
            style={styles.confirmBtn}
            onPress={() => {
                /* BACKEND:
                - Validate inputs
                - Create Bill
                - Save bill
                - Save invite code
                - Save involved users (guest + registered)
                - Close modal on success
                */
                setShowAddModal(false);
            }}
            >
            <ThemedText style={styles.confirmBtnText}>Create Bill</ThemedText>
            </Pressable>
        </View>
        </View> 
        </ScrollView>
    </View>
    </Modal>

        </View>
    );
    }

    const styles = StyleSheet.create({
    container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
    paddingTop: 50,
    },

    sidebar: {
        width: 220,
        backgroundColor: '#fff',
        borderRightWidth: 1,
        borderRightColor: '#eee',
        paddingTop: 50,
        paddingHorizontal: 15,
    },
    sidebarBrand: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 40,
        paddingHorizontal: 10,
    },
    brandText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'tomato',
        marginLeft: 10,
    },
    navItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 10,
        marginBottom: 10,
    },
    navItemActive: {
        backgroundColor: '#FFF5F3',
    },
    navText: {
        marginLeft: 12,
        fontSize: 16,
        color: '#666',
    },
    navTextActive: {
        color: 'tomato',
        fontWeight: 'bold',
    },
    sidebarFooter: {
        position: 'absolute',
        bottom: 30,
        left: 15,
        right: 15,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    logoutText: {
        marginLeft: 12,
        color: '#ff4444',
        fontWeight: 'bold',
    },

    contentArea: {
        flex: 1,
        paddingTop: 50,
    },
    contentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 25,
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    addButton: {
        flexDirection: 'row',
        backgroundColor: 'tomato',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 5,
    },
    scrollContainer: {
        paddingHorizontal: 20,
        paddingBottom: 50,
    },
    billCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginBottom: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    billMainInfo: {
        flex: 1,
    },
    billName: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#333',
    },
    billDate: {
        fontSize: 13,
        color: '#999',
        marginTop: 2,
    },
    actionRow: {
        flexDirection: 'row',
    },
    actionIcon: {
        padding: 8,
        marginLeft: 5,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: 18,
        color: '#ccc',
        fontWeight: '600',
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    registerBox: {
        width: 500,
        maxWidth: 700,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 25,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    input: {
        width: '100%',
        height: 48,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        paddingHorizontal: 15,
        backgroundColor: '#fafafa',
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    cancelBtn: {
        padding: 12,
        marginRight: 10,
    },
    cancelBtnText: {
        color: '#999',
        fontWeight: '600',
    },
    confirmBtn: {
        backgroundColor: 'tomato',
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 10,
    },
    confirmBtnText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    },

    regenBtn: {
    backgroundColor: 'tomato',
    padding: 12,
    borderRadius: 10,
    marginLeft: 10,
    },

    addGuestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 20,
    },

    addGuestText: {
    color: '#fff',
    marginLeft: 6,
    fontWeight: '600',
    },

    guestBox: {
    backgroundColor: '#fafafa',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    },

    userPreview: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
    },
    modalScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    },
    });