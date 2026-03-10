import { ThemedText } from '@/components/themed-text';
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-expo';
import { Link } from 'expo-router';
import * as React from 'react';
import { Dimensions, ImageBackground, Pressable, StyleSheet, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function Page() {
  const { user } = useUser();

  return (
    <ImageBackground
      source={require('../../assets/images/bg.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <View style={styles.contentContainer}>
          
          <View style={styles.textSection}>
            <ThemedText style={styles.title}>
              Bill Splitter
            </ThemedText>
            <ThemedText style={styles.tagline}>
              Spend more time eating,{"\n"}less time calculating.
            </ThemedText>
          </View>

          {/* Signed Out UI */}
          <SignedOut>
            <View style={styles.buttonGroup}>
              <Link href="/(auth)/sign-in" asChild>
                <Pressable style={styles.secondaryButton}>
                  <ThemedText style={styles.secondaryButtonText}>Sign In</ThemedText>
                </Pressable>
              </Link>

              <Link href="/(auth)/sign-up" asChild>
                <Pressable style={styles.primaryButton}>
                  <ThemedText style={styles.primaryButtonText}>Sign Up</ThemedText>
                </Pressable>
              </Link>
            </View>
          </SignedOut>

          {/* Signed In UI */}
          <SignedIn>
            <View style={styles.signedInContainer}>
              <ThemedText style={styles.welcomeBack}>
                Welcome back, {user?.firstName || 'User'}!
              </ThemedText>
              <Link href="/(dashboardpage)/dashboard" asChild>
                <Pressable style={styles.primaryButtonLarge}>
                  <ThemedText style={styles.primaryButtonText}>Go to Dashboard</ThemedText>
                </Pressable>
              </Link>
            </View>
          </SignedIn>

        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    height: '100%',
    width: '100%',  
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)', 
    justifyContent: 'center', // Changed from flex-end to center
    alignItems: 'center',
  },
  contentContainer: {
    paddingHorizontal: 25,
    width: '100%',
    maxWidth: 500,
  },
  textSection: {
    marginBottom: 40,
    alignItems: 'center', 
  },
  title: {
    fontSize: 52,
    color: '#fff',
    fontWeight: '900',
    lineHeight: 52,
    letterSpacing: -1.5,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 15,
    fontWeight: '500',
    lineHeight: 24,
    textAlign: 'center',
  },
  buttonGroup: {
    flexDirection: 'row', 
    width: '100%',
    gap: 12,
    justifyContent: 'center',
  },
  signedInContainer: {
    width: '100%',
    alignItems: 'center',
  },
  primaryButton: {
    flex: 1, 
    backgroundColor: 'tomato',
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  primaryButtonLarge: {
    width: '100%', 
    backgroundColor: 'tomato',
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    flex: 1, 
    backgroundColor: 'rgba(255,255,255,0.15)',
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  welcomeBack: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: '600',
  },
});