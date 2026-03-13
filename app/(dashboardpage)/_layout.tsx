import { ThemedText } from '@/components/themed-text';
import { supabase } from '@/utils/supabase';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, Slot, usePathname, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function DashboardLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [userRole, setUserRole] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false); // NEW: Modal state
  const { signOut, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  const fetchUserRole = async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('user_has_roles')
      .select(`*, roles:role_id ( name )`)
      .eq('clerk_user_id', user?.id);

    if (!error && data && data.length > 0) {
      setUserRole(data[0]?.roles.name);
    }
  };

  useEffect(() => {
    fetchUserRole();
  }, [user?.id]);

  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="tomato" />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href='/(auth)/sign-in' />;
  }

  const NavItem = ({ name, icon, path }: { name: string; icon: any; path: string }) => {
    const isActive = pathname.includes(path);
    return (
      <Pressable
        style={[styles.navItem, isActive && styles.navItemActive]}
        onPress={() => router.push(`/(dashboardpage)/${path}` as any)}
      >
        <View style={[styles.iconContainer, isActive && styles.iconContainerActive]}>
          <Ionicons name={icon} size={22} color={isActive ? '#fff' : '#8E8E93'} />
        </View>
        <ThemedText style={[styles.navText, isActive && styles.navTextActive]}>
          {name}
        </ThemedText>
        {isActive && <View style={styles.activeIndicator} />}
      </Pressable>
    );
  };

  const isStandard = userRole?.toLowerCase() === 'standard';
  const isPremium = userRole?.toLowerCase() === 'premium';

  return (
    <View style={styles.mainContainer}>
      <View style={styles.sidebar}>
        <View>
          <View style={styles.sidebarBrand}>
            <View style={styles.logoIcon}>
              <Ionicons name="flash" size={20} color="#fff" />
            </View>
            <ThemedText style={styles.brandText}>Splitter</ThemedText>
          </View>

          <View style={styles.navGroup}>
            <ThemedText style={styles.sectionTitle}>MENU</ThemedText>
            <NavItem name="Bills" icon="receipt" path="dashboard" />
            <NavItem name="Archive" icon="archive" path="archivebill" />
            <NavItem name="Profile" icon="person" path="profile" />
          </View>
        </View>

        <View>
          {isStandard && (
            <Pressable 
              style={styles.upgradeCard} 
              onPress={() => router.push('/(dashboardpage)/upgrade' as any)}
            >
              <View style={styles.upgradeIconCircle}>
                <Ionicons name="sparkles" size={16} color="tomato" />
              </View>
              <ThemedText style={styles.upgradeTitle}>Upgrade Account</ThemedText>
              <ThemedText style={styles.upgradeSubtitle}>Get unlimited features</ThemedText>
            </Pressable>
          )}

          <View style={styles.footer}>
            <View style={styles.userCard}>
              <View style={styles.userInfo}>
                <ThemedText style={styles.userName} numberOfLines={1}>
                  {user?.firstName || 'User'}
                </ThemedText>
                <View style={[styles.roleBadge, isPremium && styles.roleBadgePremium]}>
                  <ThemedText style={[styles.roleText, isPremium && styles.roleTextPremium]}>
                    {userRole?.toUpperCase() || "LOADING"}
                  </ThemedText>
                </View>
              </View>

              {/* Trigger Modal instead of immediate signout */}
              <Pressable onPress={() => setShowLogoutModal(true)} style={styles.logoutBtn}>
                <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      <View style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
        <Slot />
      </View>

      {/* --- LOGOUT CONFIRMATION MODAL --- */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
                <Ionicons name="log-out" size={30} color="#FF3B30" />
            </View>
            <ThemedText style={styles.modalTitle}>Confirm Logout</ThemedText>
            <ThemedText style={styles.modalSubtitle}>Are you sure you want to log out of your account?</ThemedText>
            
            <View style={styles.modalActionRow}>
                <TouchableOpacity 
                    style={styles.cancelBtn} 
                    onPress={() => setShowLogoutModal(false)}
                >
                    <ThemedText style={styles.cancelBtnText}>Cancel</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={styles.confirmBtn} 
                    onPress={() => {
                        setShowLogoutModal(false);
                        signOut();
                    }}
                >
                    <ThemedText style={styles.confirmBtnText}>Logout</ThemedText>
                </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, flexDirection: 'row' },
  sidebar: {
    width: 260,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#F2F2F7',
    paddingTop: 60,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 30,
  },
  sidebarBrand: { flexDirection: 'row', alignItems: 'center', marginBottom: 50, paddingHorizontal: 8 },
  logoIcon: {
    width: 36, height: 36, backgroundColor: 'tomato', borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: 'tomato', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  brandText: { fontSize: 22, fontWeight: '800', color: '#1C1C1E', marginLeft: 12, letterSpacing: -0.5 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#AEAEB2', marginBottom: 15, marginLeft: 10, letterSpacing: 1.2 },
  navGroup: { flex: 1 },
  navItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 14, marginBottom: 6, position: 'relative' },
  navItemActive: { backgroundColor: '#F2F2F7' },
  iconContainer: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  iconContainerActive: { backgroundColor: 'tomato', borderRadius: 8 },
  navText: { fontSize: 16, fontWeight: '500', color: '#8E8E93' },
  navTextActive: { color: '#1C1C1E', fontWeight: '700' },
  activeIndicator: { position: 'absolute', right: -20, width: 4, height: 20, backgroundColor: 'tomato', borderTopLeftRadius: 4, borderBottomLeftRadius: 4 },
  
  upgradeCard: {
    backgroundColor: '#FFF5F3',
    padding: 16,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFE5E0',
  },
  upgradeIconCircle: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF',
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  upgradeTitle: { fontSize: 14, fontWeight: '700', color: '#1C1C1E' },
  upgradeSubtitle: { fontSize: 11, color: '#8E8E93', marginTop: 2 },

  footer: { borderTopWidth: 1, borderTopColor: '#F2F2F7', paddingTop: 20 },
  userCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10 },
  userInfo: { flex: 1, gap: 4 },
  userName: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  roleBadge: { alignSelf: 'flex-start', backgroundColor: '#F2F2F7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  roleText: { fontSize: 10, fontWeight: '800', color: '#8E8E93', letterSpacing: 0.5 },
  
  roleBadgePremium: { backgroundColor: '#FFF9E6', borderWidth: 1, borderColor: '#FFEBB2' },
  roleTextPremium: { color: '#FFB800' },

  logoutBtn: { padding: 8, backgroundColor: '#FFF0EF', borderRadius: 10 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FA' },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 320,
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF0EF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  // ... rest of your styles

  modalActionRow: {
    flexDirection: 'row',
    width: '100%',       // Ensure the row takes full width of the container
    gap: 12,
    marginTop: 8,       // Adds breathing room between the subtitle and the buttons
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16, // Increased padding for a better tap target
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 16,       // Slightly larger text
    fontWeight: '700',
    color: '#8E8E93',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 16, // Increased padding
    borderRadius: 16,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    // Added a subtle shadow to the primary action button
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});