import { SignOutButton } from '@/components/sign-out-button';
import { ThemedText } from '@/components/themed-text';
import { supabase } from "@/utils/supabase";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

export default function Profile() {
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { user } = useUser();

  const InputField = ({ label, value, onChangeText, icon, ...props }: any) => (
    <View style={styles.inputWrapper}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <View style={styles.inputContainer}>
        <Ionicons name={icon} size={18} color="#AEAEB2" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor="#C7C7CC"
          {...props}
        />
      </View>
    </View>
  );

  const loadUserProfile = async () => {
    if (!user) return;

    // 1️⃣ Fetch Supabase nickname
    const { data: supaData, error: supaError } = await supabase
      .from("clerk_users")
      .select("*")
      .eq("clerk_user_id", user.id)
      .single();

    if (supaError) console.log("Supabase error:", supaError);

    // 2️⃣ Set state using both Clerk + Supabase
    setFirstName(user.firstName || "");
    setLastName(user.lastName || "");
    setUsername(user.username || "");
    setEmail(user.emailAddresses?.[0]?.emailAddress || "");
    setNickname(supaData?.nickname || "");
  };
  
  useEffect(() => {
    loadUserProfile();
  }, [user]);

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View>
          <ThemedText style={styles.headerTitle}>Account Settings</ThemedText>
          <ThemedText style={styles.headerSubtitle}>Update your personal information and security</ThemedText>
        </View>
      </View>

      {/* Personal Information Card */}
      <View style={styles.card}>
        <ThemedText style={styles.cardTitle}>Personal Information</ThemedText>
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <InputField label="First Name" value={firstName} onChangeText={setFirstName} icon="person-outline" />
          </View>
          <View style={{ flex: 1 }}>
            <InputField label="Last Name" value={lastName} onChangeText={setLastName} icon="person-outline" />
          </View>
        </View>
        <InputField label="Nickname" value={nickname} onChangeText={setNickname} icon="happy-outline" />
      </View>

      {/* Account Details Card */}
      <View style={styles.card}>
        <ThemedText style={styles.cardTitle}>Account Details</ThemedText>
        <InputField label="Email Address" value={email} onChangeText={setEmail} icon="mail-outline" keyboardType="email-address" />
        <InputField label="Username" value={username} onChangeText={setUsername} icon="at-outline" />
      </View>

      {/* Security Card */}
      <View style={styles.card}>
        <ThemedText style={styles.cardTitle}>Security</ThemedText>
        <InputField label="New Password" value={password} onChangeText={setPassword} icon="lock-closed-outline" secureTextEntry />
        <InputField label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} icon="checkmark-circle-outline" secureTextEntry />
      </View>

      <View style={styles.footer}>
        <Pressable style={styles.saveButton}>
            <ThemedText style={styles.saveButtonText}>Save Changes</ThemedText>
        </Pressable>
        <SignOutButton />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 40,
    backgroundColor: '#F8F9FA',
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    position: 'relative',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8E8E93',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'tomato',
    padding: 6,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#F8F9FA',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
  },
  inputWrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3A3A3C',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1C1C1E',
  },
  footer: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  saveButton: {
    backgroundColor: '#1C1C1E',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  }
});