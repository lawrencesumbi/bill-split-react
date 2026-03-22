import { supabase } from '@/utils/supabase';
import { Redirect, Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function AuthRoutesLayout() {
  const [session, setSession] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if a user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setIsLoaded(true);
    };

    checkUser();
  }, []);

  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="tomato" />
      </View>
    );
  }

  // session being non-null means the user is signed in
  if (session) {
    return <Redirect href="/(dashboardpage)/dashboard" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
});