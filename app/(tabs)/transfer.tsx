import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

const TransferScreen = () => {
  const { destinationAccount, recipientName } = useLocalSearchParams();
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');

  // Prefill the "To" field if destinationAccount is present
  useEffect(() => {
    if (destinationAccount) {
      setToAccount(destinationAccount as string);
    }
  }, [destinationAccount]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          {/* Back Arrow */}
          <Ionicons name="arrow-back" size={24} color="#C6FF00" />
        </TouchableOpacity>
        <Text style={styles.title}>Transfer</Text>
        {/* Spacer to balance back arrow */}
        <View style={{ width: 24 }} />
      </View>

      {/* Amount Placeholder */}
      <Text style={styles.amountText}>PHP 0.00</Text>

      {/* Available Balance */}
      <Text style={styles.availableBalanceLabel}>PHP 100,000,000</Text>
      <Text style={styles.availableBalanceText}>Available balance</Text>

      {/* Input Fields */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>From</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter source account"
          placeholderTextColor="#444"
          value={fromAccount}
          onChangeText={setFromAccount}
        />

        <Text style={styles.inputLabel}>To</Text>
        {recipientName ? (
          <Text style={{ color: '#C6FF00', marginBottom: 4, marginLeft: 2 }}>
            {recipientName}
          </Text>
        ) : null}
        <TextInput
          style={styles.input}
          placeholder="Enter destination account"
          placeholderTextColor="#444"
          value={toAccount}
          onChangeText={setToAccount}
        />
      </View>

      {/* Transfer Button */}
      <TouchableOpacity style={styles.transferButton}>
        <Text style={styles.transferButtonText}>Transfer</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};


export default TransferScreen;

// ...styles remain unchanged...

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  amountText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  availableBalanceLabel: {
    textAlign: 'center',
    color: '#C6FF00',
    fontSize: 14,
    fontWeight: '600',
  },
  availableBalanceText: {
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 12,
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 40,
  },
  inputLabel: {
    color: '#FFFFFF',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#C6FF00',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
  },
  transferButton: {
    backgroundColor: '#C6FF00',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 'auto',
  },
  transferButtonText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
