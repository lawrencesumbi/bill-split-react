import { ThemedText } from '@/components/themed-text';
import { supabase } from '@/utils/supabase';
import { useAuth, useUser } from '@clerk/clerk-expo'; // Added useUser for a personalized touch
import { Ionicons } from '@expo/vector-icons';
import { Redirect, Slot, usePathname, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

export default function DashboardLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [userRole, setUserRole] = useState('')
  const { signOut, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

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
  });

  if (!isLoaded) {
    return  (
      <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="tomato" />
    </View>
  );
  }
  if(!isSignedIn) {
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

  // if (!isSignedIn) return <Redirect href={'/(auth)/sign-in'} />;
  
  return (
    <View style={styles.mainContainer}>
      <View style={styles.sidebar}>
        {/* Brand Section */}
        <View style={styles.sidebarBrand}>
          <View style={styles.logoIcon}>
            <Ionicons name="flash" size={20} color="#fff" />
          </View>
          <ThemedText style={styles.brandText}>Splitter</ThemedText>
        </View>

        {/* Navigation Section */}
        <View style={styles.navGroup}>
          <ThemedText style={styles.sectionTitle}>MENU</ThemedText>
          <NavItem name="Bills" icon="receipt" path="dashboard" />
          <NavItem name="Archive" icon="archive" path="archivebill" />
          <NavItem name="Profile" icon="person" path="profile" />
        </View>

        {/* Bottom Section: User Info & Logout */}
        <View style={styles.footer}>
          <View style={styles.userCard}>
            <View style={styles.userInfo}>
              <ThemedText style={styles.userName}>
                {user?.firstName || 'User'}
              </ThemedText>
              
              {/* User Role Badge */}
              <View style={styles.roleBadge}>
                <ThemedText style={styles.roleText}>
                  {userRole?.toUpperCase() || <ActivityIndicator color="tomato" />}
                </ThemedText>
              </View>
            </View>

            <Pressable onPress={() => signOut()} style={styles.logoutBtn}>
              <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
            </Pressable>
          </View>
        </View>
      </View>

      <View style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 260, // Slightly wider for a premium feel
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#F2F2F7',
    paddingTop: 60,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 30,
  },
  sidebarBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 50,
    paddingHorizontal: 8,
  },
  logoIcon: {
    width: 36,
    height: 36,
    backgroundColor: 'tomato',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'tomato',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  brandText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1C1C1E',
    marginLeft: 12,
    letterSpacing: -0.5,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#AEAEB2',
    marginBottom: 15,
    marginLeft: 10,
    letterSpacing: 1.2,
  },
  navGroup: {
    flex: 1,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 6,
    position: 'relative',
  },
  navItemActive: {
    backgroundColor: '#F2F2F7', // Subtle gray background for active
  },
  iconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconContainerActive: {
    backgroundColor: 'tomato',
    borderRadius: 8,
  },
  navText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
  },
  navTextActive: {
    color: '#1C1C1E',
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    right: -20,
    width: 4,
    height: 20,
    backgroundColor: 'tomato',
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingTop: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  logoutBtn: {
    padding: 8,
    backgroundColor: '#FFF0EF',
    borderRadius: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA', // Matches your main content area background
  },
  userInfo: {
    flex: 1,
    gap: 4, // Adds a tiny space between name and badge
  },
  roleBadge: {
    alignSelf: 'flex-start', // Keeps badge from stretching
    backgroundColor: '#F2F2F7', // Match the sidebar border/inactive nav
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8E8E93',
    letterSpacing: 0.5,
  },
});