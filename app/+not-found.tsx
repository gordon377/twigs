import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
        <Stack.Screen name="not-found" options={{ title: 'Page Not Found!'}} />
        <View style={styles.container}>
            <Text style={styles.text}>404 Not Found</Text>
            <Text style={styles.text}>Swipe to Go Back</Text>
        </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    fontSize: 20,
    color: '#fff',
    textDecorationLine: 'underline',
  },
  text: {
    color: '#fff',
    fontSize: 20,
 },
});