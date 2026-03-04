import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';


export default function Archive() {
const router = useRouter();
  const archivedBills = [
    { id: '2', name: 'Dinner Party', date: 'Sept 2023' },
  ];

  return (
    <View style={styles.container}>
      
      <View style={styles.header}>
        <ThemedText style={styles.title}>Archived Bills</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {archivedBills.map(bill => (
          <View key={bill.id} style={styles.billCard}>
            <View>
              <ThemedText style={styles.billName}>{bill.name}</ThemedText>
              <ThemedText style={styles.billDate}>{bill.date}</ThemedText>
            </View>

            <View style={styles.actionRow}>
              <Pressable style={styles.actionIcon}>
                <Ionicons name="eye-outline" size={18} color="#666" />
              </Pressable>

              <Pressable style={styles.actionIcon}>
                <Ionicons name="arrow-undo-outline" size={18} color="tomato" />
              </Pressable>
            </View>
          </View>
        ))}

        {archivedBills.length === 0 && (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>No archived bills</ThemedText>
          </View>
        )}
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
    paddingTop: 50,
    paddingHorizontal: 25,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContainer: {
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
});