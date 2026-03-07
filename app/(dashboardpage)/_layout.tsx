import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, Slot, usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

export default function DashboardLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { isSignedIn } = useAuth()

  if(!isSignedIn) {
    return <Redirect href={'/sign-in'}/>
  }

  return (
    <View style={styles.mainContainer}>
      
      {/* Sidebar */}
      <View style={styles.sidebar}>
        <View style={styles.sidebarBrand}>
          <Ionicons name="calculator" size={28} color="tomato" />
          <ThemedText style={styles.brandText}>Splitter</ThemedText>
        </View>

        {/* Bills */}
        <Pressable 
          style={[styles.navItem, pathname === '/(dashboardpage)/dashboard' && styles.navItemActive]}
          onPress={() => router.push('/(dashboardpage)/dashboard')}
        >
          <Ionicons name="receipt" size={20} color={pathname.includes('dashboard') ? 'tomato' : '#666'} />
          <ThemedText style={[styles.navText, pathname.includes('dashboard') && styles.navTextActive]}>
            Bills
          </ThemedText>
        </Pressable>

        {/* Archive */}
        <Pressable 
          style={[styles.navItem, pathname.includes('archivebill') && styles.navItemActive]}
          onPress={() => router.push('/(dashboardpage)/archivebill')}
        >
          <Ionicons name="archive" size={20} color={pathname.includes('archivebill') ? 'tomato' : '#666'} />
          <ThemedText style={[styles.navText, pathname.includes('archivebill') && styles.navTextActive]}>
            Archive
          </ThemedText>
        </Pressable>

        {/* Profile */}
        <Pressable 
          style={[styles.navItem, pathname.includes('profile') && styles.navItemActive]}
          onPress={() => router.push('/(dashboardpage)/profile')}
        >
          <Ionicons name="person" size={20} color={pathname.includes('profile') ? 'tomato' : '#666'} />
          <ThemedText style={[styles.navText, pathname.includes('profile') && styles.navTextActive]}>
            Profile
          </ThemedText>
        </Pressable>

      </View>

      {/* Main content */}
      <View style={{ flex: 1 }}>
        <Slot />
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f4f4f4',
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
});