import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';

export default function Profile() {
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText style={styles.header}>Profile</ThemedText>

      {/* Last Name */}
      <ThemedText style={styles.label}>Last Name </ThemedText>
      <TextInput
        style={styles.input}

        value={lastName}
        onChangeText={setLastName}
      />

      {/* First Name */}
      <ThemedText style={styles.label}>First Name </ThemedText>
      <TextInput
        style={styles.input}
        value={firstName}
        onChangeText={setFirstName}
      />

      {/* Nickname */}
      <ThemedText style={styles.label}>Nickname </ThemedText>
      <TextInput
        style={styles.input}
        value={nickname}
        onChangeText={setNickname}
      />


      {/* Email */}
      <ThemedText style={styles.label}>Email </ThemedText>
      <TextInput
        style={styles.input}
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      {/* Username */}
      <ThemedText style={styles.label}>Username</ThemedText>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
      />
      

      {/* Password */}
      <ThemedText style={styles.label}>Password </ThemedText>
      <TextInput
        style={styles.input}

        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {/* Confirm Password */}
      <ThemedText style={styles.label}>Confirm Password *</ThemedText>
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      {/* Logout Button */}
      <Pressable style={styles.logoutBtn}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <ThemedText style={styles.logoutText}>Logout</ThemedText>
      </Pressable>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 25,
    backgroundColor: '#f4f4f4',
    paddingBottom: 50,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  note: {
    fontSize: 12,
    color: '#999',
    marginBottom: 15,
  },
  logoutBtn: {
    flexDirection: 'row',
    backgroundColor: 'tomato',
    padding: 15,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
});