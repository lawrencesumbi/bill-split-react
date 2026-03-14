import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function AuthRoutesLayout() {
  const { isSignedIn, isLoaded } = useAuth()

   if (!isLoaded) {
      return  (
        <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="tomato" />
      </View>
    );
    }
    
    if(isSignedIn) {
      return <Redirect href='/(dashboardpage)/dashboard' />;
    }

  // if (isSignedIn) {
  //   return <Redirect href={'/'} />
  // }

  return <Stack  screenOptions={{headerShown:false}}/>

}

const styles = StyleSheet.create({
   loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA', // Matches your main content area background
  },
})
