import { ThemedText } from '@/components/themed-text';
import { supabase } from '@/utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

export default function GuestBillView() {
  const { inviteCode, billId } = useLocalSearchParams();
  const router = useRouter();

  const [bill, setBill] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);

  console.log(billId)

  useEffect(() => {
    fetchGuestBillData();
  }, [inviteCode]);

  const fetchGuestBillData = async () => {
    if (!inviteCode) return;

    setLoading(true)
    
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
        setLoading(false)
      }
    } catch (error) {
      console.error("Error fetching guest data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color="tomato" /></View>
  );

  const totalBill = expenses.reduce((sum, exp) => sum + (Number(exp.cost) || 0), 0);

  return (
    <View style={styles.container}>
      {/* TOP BREADCRUMB BAR */}
      <View style={styles.topTitleBar}>
        <ThemedText style={styles.breadcrumb}>Guest Access / {bill?.name || 'Bill'}</ThemedText>
      </View>

      {/* ACTION BAR */}
      <View style={styles.actionBar}>
        <View style={styles.headerTitleSection}>
          <Pressable style={styles.glassBackBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#1C1C1E" />
          </Pressable>
          <ThemedText style={styles.billNameLarge}>{bill?.name || "Loading..."}</ThemedText>
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
        
        {/* LEFT COLUMN: TOTAL & LIST */}
        <View style={styles.leftColumn}>
          
          {/* ORANGE HERO CARD */}
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
                  <ThemedText style={styles.expAmount}>₱{exp.cost}</ThemedText>
                </View>
              </View>
            ))}
            {expenses.length === 0 && (
                <ThemedText style={styles.emptyText}>No expenses added yet.</ThemedText>
            )}
          </ScrollView>
        </View>

        {/* RIGHT COLUMN: GUEST INFO WIDGET (Hidden on Mobile) */}
        {Platform.OS !== 'android' && (
          <View style={styles.rightColumn}>
            <View style={styles.infoBox}>
              <View style={styles.iconCircle}>
                <Ionicons name="information-circle" size={26} color="tomato" />
              </View>
              <ThemedText style={styles.infoTitle}>Live View</ThemedText>
              <ThemedText style={styles.infoText}>
                You are viewing a real-time version of this bill. Any updates made by the owner will appear here automatically.
              </ThemedText>
            </View>
            
            <View style={styles.spacer} />

            <Pressable style={styles.modernSubmitBtn} onPress={() => router.replace('/(auth)/sign-up')}>
              <ThemedText style={styles.submitBtnText}>Sign up to Create your bill</ThemedText>
            </Pressable>
          </View>
        )}
      </View>

      {/* MOBILE STICKY FOOTER */}
      {Platform.OS === 'android' && (
         <View style={styles.mobileFooter}>
            <Pressable style={styles.modernSubmitBtn} onPress={() => router.replace('/(auth)/sign-up')}>
              <ThemedText style={styles.submitBtnText}>Sign Up to Track Debts</ThemedText>
            </Pressable>
         </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FB', 
    padding: 24, 
    paddingTop: Platform.OS === 'ios' ? 60 : 40 
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topTitleBar: { marginBottom: 20 },
  breadcrumb: { fontSize: 13, color: '#8E8E93', fontWeight: '600', textTransform: 'uppercase' },
  
  actionBar: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 30 
  },
  headerTitleSection: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  glassBackBtn: { 
    width: 44, 
    height: 44, 
    backgroundColor: '#FFF', 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2
  },
  billNameLarge: { fontSize: 28, fontWeight: '800', color: '#1C1C1E' },
  
  pillGroup: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#F2F2F7' },
  pillInvite: { paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#1C1C1E' },
  pillInviteText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  pillID: { paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#F2F2F7' },
  pillText: { fontWeight: '800', fontSize: 13, color: '#1C1C1E' },

  mainContent: { 
    flex: 1, 
    flexDirection: 'row',
    gap: 32, // Large gap to separate the hero/list from the info widget
  },
  leftColumn: { 
    flex: 2, 
  },
  
  heroCard: { 
    backgroundColor: 'tomato', 
    padding: 25, 
    borderRadius: 24, 
    marginBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: 'tomato',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  heroLabel: { color: 'rgba(255,255,255,0.8)', fontWeight: '700', fontSize: 14, textTransform: 'uppercase' },
  heroAmount: { color: '#FFF', fontSize: 38, fontWeight: '900', marginTop: 5 },
  heroIconContainer: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 15, borderRadius: 20 },

  columnHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 5 },
  columnTitle: { fontSize: 18, fontWeight: '800', color: '#1C1C1E' },
  countText: { fontSize: 13, color: '#8E8E93', fontWeight: '600' },

  modernExpenseCard: { 
    backgroundColor: '#FFF', 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F2F2F7'
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  expName: { fontSize: 17, fontWeight: '700', color: '#1C1C1E' },
  expAmount: { fontSize: 18, fontWeight: '800', color: 'tomato' },
  expPaidBy: { fontSize: 13, color: '#8E8E93', marginTop: 4 },
  emptyText: { textAlign: 'center', color: '#AEAEB2', marginTop: 40, fontSize: 16 },

  rightColumn: { 
    flex: 1, 
    backgroundColor: '#FFF', 
    borderRadius: 24, 
    padding: 25, 
    maxHeight: 380, // Prevent it from stretching too far down
    borderWidth: 1, 
    borderColor: '#F2F2F7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF5F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15
  },
  infoBox: { alignItems: 'center' },
  infoTitle: { fontSize: 19, fontWeight: '800', marginBottom: 10, color: '#1C1C1E' },
  infoText: { textAlign: 'center', color: '#8E8E93', lineHeight: 22, fontSize: 14 },
  spacer: { flex: 1 },
  
  modernSubmitBtn: { backgroundColor: '#1C1C1E', padding: 18, borderRadius: 18, alignItems: 'center' },
  submitBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  
  mobileFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7'
  }
});