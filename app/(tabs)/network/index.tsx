import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import NetworkTree from '../../../components/NetworkTree';

const sampleNodes = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
  { id: '3', name: 'Carol' },
  { id: '4', name: 'Dave' },
  { id: '5', name: 'Eve' },
  { id: '6', name: 'Frank' },
  { id: '7', name: 'Grace' },
];

const sampleLinks = [
  { source: '1', target: '2' },
  { source: '1', target: '3' },
  { source: '2', target: '4' },
  { source: '2', target: '5' },
  { source: '3', target: '6' },
  { source: '5', target: '6' },
  { source: '4', target: '7' },
];

export default function NetworkScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <NetworkTree nodes={sampleNodes} links={sampleLinks} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
});