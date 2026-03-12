import { ThemedText } from '@/components/themed-text';
import { supabase } from "@/utils/supabase";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

export default function Archive() {
  const router = useRouter();

  const { user } = useUser();
  const [archivedBills, setArchivedBills] = useState([]);

  const loadArchivedBills = async () => {
    const { data, error } = await supabase
      .from("bills")
      .select("*")
      .eq("created_by", user?.id)
      .eq("status", "archived")
      .order("created_at", { ascending: false });

    if (!error) {
      setArchivedBills(data);
    } else {
      console.error(error.message);
    }
  };

  useEffect(() => {
    loadArchivedBills();
  }, []);

  const restoreBill = async (billId) => {
    const { error } = await supabase
      .from("bills")
      .update({ status: "active" })
      .eq("id", billId);

    if (error) {
      alert(error.message);
      return;
    }

    loadArchivedBills();
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.contentHeader}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#1C1C1E" />
        </Pressable>
        <View style={styles.titleContainer}>
          <ThemedText style={styles.headerTitle}>Archived Bills</ThemedText>
          <ThemedText style={styles.headerSubtitle}>Previous settled expenses</ThemedText>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
      >
        {archivedBills.map(bill => (
          <View key={bill.id} style={styles.billCard}>
            <View style={styles.billHeader}>
              <View style={styles.iconBg}>
                <Ionicons name="archive" size={20} color="#8E8E93" />
              </View>
              
              <View style={styles.billMainInfo}>
                <ThemedText style={styles.billName}>{bill.name}</ThemedText>
                <View style={styles.dateRow}>
                  <Ionicons name="calendar-outline" size={12} color="#AEAEB2" />
                  <ThemedText style={styles.billDate}>
                    {new Date(bill.created_at).toLocaleDateString()}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.settledBadge}>
                <ThemedText style={styles.settledText}>Settled</ThemedText>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.actionRow}>
              <ThemedText style={styles.footerInfo}>Moved to archive on completion</ThemedText>
              <View style={styles.buttonGroup}>
                <Pressable
                  style={[styles.actionIcon, { backgroundColor: '#F2F2F7' }]}
                  onPress={() =>
                    router.push({
                      pathname: "/viewbill",
                      params: { billId: bill.id, billName: bill.name },
                    })
                  }
                >
                  <Ionicons name="eye" size={18} color="#666" />
                </Pressable>
                <Pressable
                  style={[styles.actionIcon, { backgroundColor: '#FFF5F3' }]}
                  onPress={() => restoreBill(bill.id)}
                >
                  <Ionicons name="arrow-undo" size={18} color="tomato" />
                </Pressable>
              </View>
            </View>
          </View>
        ))}

        {archivedBills.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="briefcase-outline" size={60} color="#DDD" />
            </View>
            <ThemedText style={styles.emptyText}>Archive is empty</ThemedText>
            <ThemedText style={styles.emptySubtext}>Archived bills will appear here</ThemedText>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FA', 
    paddingTop: 60 
  },
  contentHeader: { 
    flexDirection: 'row', 
    alignItems: 'center',
    paddingHorizontal: 25, 
    marginBottom: 25 
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 3 }
    })
  },
  titleContainer: {
    flex: 1,
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: '#1C1C1E' 
  },
  headerSubtitle: { 
    fontSize: 14, 
    color: '#8E8E93', 
    marginTop: 2 
  },
  scrollContainer: { 
    paddingHorizontal: 20, 
    paddingBottom: 40 
  },
  billCard: { 
    backgroundColor: '#fff', 
    borderRadius: 22, 
    padding: 18, 
    marginBottom: 16, 
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
      android: { elevation: 3 }
    })
  },
  billHeader: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  iconBg: { 
    width: 46, 
    height: 46, 
    backgroundColor: '#F2F2F7', 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12 
  },
  billMainInfo: { 
    flex: 1 
  },
  billName: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#1C1C1E' 
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  billDate: { 
    fontSize: 13, 
    color: '#AEAEB2' 
  },
  settledBadge: { 
    backgroundColor: '#F2F2F7', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 8 
  },
  settledText: { 
    color: '#8E8E93', 
    fontSize: 11, 
    fontWeight: '800', 
    textTransform: 'uppercase' 
  },
  divider: { 
    height: 1, 
    backgroundColor: '#F8F9FA', 
    marginVertical: 15 
  },
  actionRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  footerInfo: {
    fontSize: 11,
    color: '#C7C7CC',
    fontStyle: 'italic'
  },
  buttonGroup: {
    flexDirection: 'row',
  },
  actionIcon: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginLeft: 10 
  },
  emptyState: { 
    alignItems: 'center', 
    marginTop: 80 
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    backgroundColor: '#F2F2F7',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },
  emptyText: { 
    fontSize: 20, 
    color: '#1C1C1E', 
    fontWeight: '700' 
  },
  emptySubtext: { 
    fontSize: 15, 
    color: '#AEAEB2', 
    marginTop: 8 
  },
});