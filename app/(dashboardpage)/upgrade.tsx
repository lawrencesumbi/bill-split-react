
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TextInput,
    View
} from 'react-native';

const { width } = Dimensions.get('window');

export default function UpgradeScreen() {
  const router = useRouter();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const features = [
    { id: 1, title: 'No limits', desc: 'Create as many groups and bills as you need.', icon: 'infinite' },
  ];

  const handleUpgrade = () => {
    setShowPaymentModal(true);
  };

  const processPayment = () => {
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setShowPaymentModal(false);
      alert("Welcome to Premium!");
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
          </Pressable>

          <View style={styles.premiumBadgeHeader}>
            <Ionicons name="sparkles" size={14} color="#FFB800" />
            <ThemedText style={styles.premiumBadgeText}>PREMIUM</ThemedText>
          </View>
        </View>

        {/* HERO */}
        <View style={styles.heroSection}>
          <ThemedText style={styles.heroTitle}>Unlock Everything</ThemedText>
          <ThemedText style={styles.heroSubtitle}>
            Join thousands of users who split smarter with Splitter Pro.
          </ThemedText>
        </View>

        {/* FEATURES */}
        <View style={styles.featuresContainer}>
          {features.map((item) => (
            <View key={item.id} style={styles.featureRow}>
              <View style={styles.iconBox}>
                <Ionicons name={item.icon as any} size={22} color="tomato" />
              </View>

              <View style={styles.featureText}>
                <ThemedText style={styles.featureTitle}>{item.title}</ThemedText>
                <ThemedText style={styles.featureDesc}>{item.desc}</ThemedText>
              </View>
            </View>
          ))}
        </View>

        {/* PRICING */}
        <View style={styles.pricingCard}>
          <ThemedText style={styles.pricingLabel}>ANNUAL PLAN</ThemedText>

          <View style={styles.priceRow}>
            <ThemedText style={styles.currency}>₱</ThemedText>
            <ThemedText style={styles.price}>1500</ThemedText>
            <ThemedText style={styles.period}>/year</ThemedText>
          </View>

          <ThemedText style={styles.savingsText}>
            Save 40% compared to monthly
          </ThemedText>

          <Pressable style={styles.upgradeButton} onPress={handleUpgrade}>
            <ThemedText style={styles.upgradeButtonText}>Upgrade Now</ThemedText>
          </Pressable>

          <ThemedText style={styles.secureText}>
            <Ionicons name="lock-closed" size={10} /> Secure payment via Stripe
          </ThemedText>
        </View>

        <Pressable onPress={() => router.back()}>
          <ThemedText style={styles.maybeLater}>Maybe later</ThemedText>
        </Pressable>

      </ScrollView>


      {/* PAYMENT MODAL */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContainer}
          >

            <View style={styles.modernModalCard}>

              <View style={styles.modalIndicator} />

              {/* HEADER */}
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Upgrade to Premium</ThemedText>

                <Pressable onPress={() => setShowPaymentModal(false)}>
                  <Ionicons name="close" size={24} color="#8E8E93" />
                </Pressable>
              </View>

              {/* PLAN SUMMARY */}
              <View style={styles.planCard}>

                <View style={styles.planRow}>

                  <View>
                    <ThemedText style={styles.planName}>
                      Splitter Pro
                    </ThemedText>

                    <ThemedText style={styles.planDesc}>
                      Annual Premium Access
                    </ThemedText>
                  </View>

                  <View style={styles.planPriceBox}>
                    <ThemedText style={styles.planPrice}>₱1,500</ThemedText>
                    <ThemedText style={styles.planYear}>/year</ThemedText>
                  </View>

                </View>

              </View>

              {/* PAYMENT INPUTS */}
              <View style={styles.inputSection}>

                <ThemedText style={styles.fieldLabel}>
                  Payment Method
                </ThemedText>

                <View style={styles.cardInputWrapper}>
                  <Ionicons name="card-outline" size={20} color="#8E8E93" />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Card number"
                    placeholderTextColor="#AEAEB2"
                    keyboardType="number-pad"
                  />
                </View>

                <View style={styles.rowInputs}>

                  <View style={[styles.cardInputWrapper, { flex: 1, marginRight: 10 }]}>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="MM/YY"
                      placeholderTextColor="#AEAEB2"
                    />
                  </View>

                  <View style={[styles.cardInputWrapper, { flex: 1 }]}>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="CVC"
                      placeholderTextColor="#AEAEB2"
                      keyboardType="number-pad"
                    />
                  </View>

                </View>

              </View>

              {/* CONFIRM BUTTON */}
              <Pressable
                style={[styles.confirmBtn, isProcessing && styles.disabledBtn]}
                onPress={processPayment}
                disabled={isProcessing}
              >

                {isProcessing ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={18} color="#FFF" style={{ marginRight: 6 }} />
                    <ThemedText style={styles.confirmBtnText}>
                      Confirm Upgrade
                    </ThemedText>
                  </>
                )}

              </Pressable>

              {/* SECURITY */}
              <View style={styles.securityRow}>
                <Ionicons name="shield-checkmark" size={14} color="#34C759" />
                <ThemedText style={styles.securityText}>
                  Secure payment powered by Stripe
                </ThemedText>
              </View>

              <ThemedText style={styles.footerNote}>
                Cancel anytime. No hidden fees.
              </ThemedText>

            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({

  container: { flex: 1, backgroundColor: '#FFFFFF' },

  scrollContent: {
    padding: 24,
    alignItems: 'center'
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 30
  },

  backButton: {
    padding: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 12
  },

  premiumBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },

  premiumBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFB800',
    marginLeft: 4
  },

  heroSection: {
    alignItems: 'center',
    marginBottom: 40
  },

  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1C1C1E'
  },

  heroSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8
  },

  featuresContainer: {
    width: '100%',
    marginBottom: 40
  },

  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24
  },

  iconBox: {
    width: 44,
    height: 44,
    backgroundColor: '#FFF5F3',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },

  featureText: { flex: 1 },

  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E'
  },

  featureDesc: {
    fontSize: 14,
    color: '#8E8E93'
  },

  pricingCard: {
    width: '100%',
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center'
  },

  pricingLabel: {
    color: 'tomato',
    fontSize: 12,
    fontWeight: '800'
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline'
  },

  currency: {
    color: '#FFFFFF',
    fontSize: 24
  },

  price: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '800'
  },

  period: {
    color: '#8E8E93',
    fontSize: 18
  },

  savingsText: {
    color: '#34C759',
    marginBottom: 24
  },

  upgradeButton: {
    backgroundColor: 'tomato',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center'
  },

  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700'
  },

  secureText: {
    color: '#8E8E93',
    fontSize: 11,
    marginTop: 8
  },

  maybeLater: {
    marginTop: 24,
    color: '#8E8E93',
    fontWeight: '600'
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end'
  },

  modalContainer: {
    width: '100%'
  },

  modernModalCard: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24
  },

  modalIndicator: {
    width: 40,
    height: 5,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 15
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: '800'
  },

  planCard: {
    backgroundColor: '#F8F9FB',
    borderRadius: 20,
    padding: 18,
    marginBottom: 24
  },

  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  planName: {
    fontSize: 16,
    fontWeight: '800'
  },

  planDesc: {
    fontSize: 13,
    color: '#8E8E93'
  },

  planPriceBox: {
    alignItems: 'flex-end'
  },

  planPrice: {
    fontSize: 26,
    fontWeight: '900',
    color: 'tomato'
  },

  planYear: {
    fontSize: 12,
    color: '#8E8E93'
  },

  inputSection: {
    marginBottom: 25
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10
  },

  cardInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 12
  },

  rowInputs: {
    flexDirection: 'row'
  },

  modalInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8
  },

  confirmBtn: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center'
  },

  confirmBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800'
  },

  disabledBtn: {
    opacity: 0.7
  },

  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14
  },

  securityText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 6
  },

  footerNote: {
    textAlign: 'center',
    color: '#AEAEB2',
    fontSize: 12,
    marginTop: 15
  }

});
