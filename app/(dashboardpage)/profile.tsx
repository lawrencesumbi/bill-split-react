import { ThemedText } from '@/components/themed-text';
import { supabase } from "@/utils/supabase";
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

// Memoized InputField component to prevent "letter by letter" re-rendering issue
const InputField = React.memo(({ label, value, onChangeText, icon, ...props }: any) => (
  <View style={styles.inputWrapper}>
    <ThemedText style={styles.label}>{label}</ThemedText>
    <View style={styles.inputContainer}>
      {icon && <Ionicons name={icon} size={18} color="#AEAEB2" style={styles.inputIcon} />}
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#C7C7CC"
        autoCapitalize="none"
        {...props}
      />
    </View>
  </View>
));

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  // Load profile from Supabase
  const loadUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) throw authError;

      setUserId(user.id);
      setEmail(user.email || "");

      // Fetch additional profile data from your custom 'profiles' table
      const { data, error: supaError } = await supabase
        .from("profiles")
        .select("first_name, last_name, nickname")
        .eq("id", user.id)
        .single();

      if (supaError && supaError.code !== 'PGRST116') { // PGRST116 is "no rows found"
        console.error("Supabase error:", supaError);
      }

      if (data) {
        setFirstName(data.first_name || "");
        setLastName(data.last_name || "");
        setNickname(data.nickname || "");
      }
    } catch (err) {
      console.error("Load profile error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  const handleSaveChanges = async () => {
    if (!userId) return;

    try {
      // Update the custom profiles table
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          first_name: firstName,
          last_name: lastName,
          nickname: nickname,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      Alert.alert("Success", "Profile updated successfully!");
    } catch (err: any) {
      console.error("Update error:", err);
      Alert.alert("Error", err?.message || "Something went wrong while saving.");
    }
  };

  const handlePasswordReset = async () => {
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Reset Email Sent", "Check your inbox to change your password.");
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="tomato" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.headerSection}>
        <View>
          <ThemedText style={styles.headerTitle}>Account Settings</ThemedText>
          <ThemedText style={styles.headerSubtitle}>Update your personal information and security</ThemedText>
        </View>
      </View>

      {/* Personal Info */}
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

      {/* Account Details */}
      <View style={styles.card}>
        <ThemedText style={styles.cardTitle}>Account Details</ThemedText>
        <InputField 
          label="Email Address" 
          value={email} 
          editable={false} 
          icon="mail-outline"
        />
        <Pressable onPress={handlePasswordReset} style={{ marginTop: 8 }}>
          <Text style={{ color: "tomato", fontWeight: '600' }}>Request Password Reset</Text>
        </Pressable>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Pressable style={styles.saveButton} onPress={handleSaveChanges}>
          <ThemedText style={styles.saveButtonText}>Save Changes</ThemedText>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 40, backgroundColor: '#F8F9FA', paddingBottom: 100 },
  headerSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#1C1C1E' },
  headerSubtitle: { fontSize: 14, color: '#8E8E93', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 24, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E', marginBottom: 20 },
  row: { flexDirection: 'row' },
  inputWrapper: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#3A3A3C', marginBottom: 8, marginLeft: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F7', borderRadius: 12, paddingHorizontal: 12, height: 50 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#1C1C1E' },
  footer: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  saveButton: { backgroundColor: 'tomato', paddingVertical: 16, paddingHorizontal: 40, borderRadius: 14, alignItems: 'center', width: '100%' },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});