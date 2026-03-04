import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

type Expense = {
  id: string;
  name: string;
  amount: string;
  paid_by: string; // Clerk user_id of payer
  with: 'equally' | 'custom'; // Split type
};

export default function ViewBill() {
  const [expenses, setExpenses] = useState<Expense[]>([]); // UI-only, initially empty
  const [showAddModal, setShowAddModal] = useState(false); // Toggle modal
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [paidBy, setPaidBy] = useState(''); // Default: current user
  const [splitWith, setSplitWith] = useState<'equally' | 'custom'>('equally');

  useEffect(() => {
    // -------------------------------
    // BACKEND: Fetch expenses on mount
    // -------------------------------
    // TODO: Supabase query to fetch expenses for this bill
  }, []);

  const handleAddExpense = () => {
    // -------------------------------
    // BACKEND GUIDE:
    // 1. Validate input
    // 2. Supabase insert
    // 3. Update local UI state
    // -------------------------------
    setShowAddModal(false);

    // Reset form
    setExpenseName('');
    setExpenseAmount('');
    setPaidBy('');
    setSplitWith('equally');
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.headerTitle}>Apartment Rent</ThemedText>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {expenses.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>No details</ThemedText>
          </View>
        ) : (
          expenses.map(exp => (
            <View key={exp.id} style={styles.expenseCard}>
              <ThemedText style={styles.expenseName}>{exp.name}</ThemedText>
              <ThemedText style={styles.expenseAmount}>{exp.amount}</ThemedText>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Expense Button */}
      <Pressable style={styles.addExpenseBtn} onPress={() => setShowAddModal(true)}>
        <Ionicons name="add-outline" size={20} color="#fff" />
        <ThemedText style={styles.addExpenseText}>Add Expense</ThemedText>
      </Pressable>

      {/* Add Expense Modal */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalBox}>
              <ThemedText style={styles.modalTitle}>Add Expense</ThemedText>

              {/* Vertical Inputs */}
              <ThemedText style={styles.label}>Expense Name</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="e.g. Electricity"
                value={expenseName}
                onChangeText={setExpenseName}
              />

              <ThemedText style={styles.label}>Amount</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="e.g. ₱500"
                keyboardType="numeric"
                value={expenseAmount}
                onChangeText={setExpenseAmount}
              />

              <ThemedText style={styles.label}>Paid By</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="User who paid (default: host)"
                value={paidBy}
                onChangeText={setPaidBy}
              />

              <ThemedText style={styles.label}>Split With</ThemedText>
              <TextInput
                style={styles.input}
                placeholder='Options: "Equally" or "Custom"'
                value={splitWith}
                onChangeText={text =>
                  setSplitWith(text === 'custom' ? 'custom' : 'equally')
                }
              />

              {/* Buttons */}
              <View style={styles.modalButtons}>
                <Pressable onPress={() => setShowAddModal(false)} style={styles.cancelBtn}>
                  <ThemedText style={styles.cancelBtnText}>Cancel</ThemedText>
                </Pressable>
                <Pressable onPress={handleAddExpense} style={styles.confirmBtn}>
                  <ThemedText style={styles.confirmBtnText}>Add Expense</ThemedText>
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
  container: { flex: 1, padding: 25, backgroundColor: '#f4f4f4' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  scrollContainer: { paddingBottom: 80 },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 18, color: '#ccc', fontWeight: '600' },
  expenseCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  expenseName: { fontSize: 16, fontWeight: '500', color: '#333' },
  expenseAmount: { fontSize: 16, fontWeight: '600', color: '#666' },
  addExpenseBtn: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 30,
    right: 25,
    backgroundColor: 'tomato',
    padding: 15,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addExpenseText: { color: '#fff', marginLeft: 8, fontWeight: '600' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  modalBox: {
    width: 400,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#fafafa',
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 15, marginRight: 10 },
  cancelBtnText: { color: '#999', fontWeight: '600' },
  confirmBtn: {
    backgroundColor: 'tomato',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  confirmBtnText: { color: '#fff', fontWeight: 'bold' },
});