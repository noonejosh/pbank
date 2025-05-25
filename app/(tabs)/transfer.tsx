import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { db } from '@/FirebaseConfig';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc } from 'firebase/firestore';

interface UserData {
    id?: string;
    name?: string;
    deposit?: string;
    email?: string;
    mobile?: string;
    dateOfBirth?: Date;
    createdAt?: Date;
  }
  
const TransferScreen = () => {
  const { uid, accountNumber } = useLocalSearchParams();
  const [fromAccount] = useState(accountNumber || '');
  const [toAccount, setToAccount] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [amount, setAmount] = useState('');
  const [editingAmount, setEditingAmount] = useState(false);
  const [userData, setUserData] = useState<UserData>({});

  useEffect(() => {
    const fetchUserInfoDocuments = async () => {
      if (typeof uid === "string" && typeof accountNumber === "string") {
        const userInfoDocRef = doc(db, "users", uid, "userInfo", accountNumber);

        try {
          const docSnap = await getDoc(userInfoDocRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data() as UserData);
          }
        } catch (error) {
          console.error("Error fetching document: ", error);
        }
      }
    };

    fetchUserInfoDocuments();
  }, [uid, accountNumber]);

  // Only check if recipient exists and set name
  const checkToAccount = async () => {
    if (!toAccount) return false;
    const userInfoRef = doc(db, 'userBankInfo', toAccount);
    const docSnap = await getDoc(userInfoRef);
    if (docSnap.exists()) {
      const recipientData = docSnap.data() as UserData;
      setRecipientName(recipientData.name || 'Unknown Recipient');
      return true;
    }
    setRecipientName('');
    return false;
  };

  const handleTransfer = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }
    if (!toAccount) {
      Alert.alert('Error', 'Please enter a destination account.');
      return;
    }
    if (toAccount === fromAccount) {
      Alert.alert('Error', 'Cannot transfer to the same account.');
      return;
    }

    const exists = await checkToAccount();
    if (!exists) {
      Alert.alert('Error', 'Destination account does not exist.');
      return;
    }

    // Get sender info
    const senderRef = doc(db, 'users', uid as string, 'userInfo', accountNumber as string);
    const senderSnap = await getDoc(senderRef);
    if (!senderSnap.exists()) {
      Alert.alert('Error', 'Sender account does not exist.');
      return;
    }
    const senderDeposit = parseFloat(senderSnap.data().deposit || '0');
    const transferAmount = parseFloat(amount || '0');
    if (senderDeposit < transferAmount) {
      Alert.alert('Error', 'Insufficient balance.');
      return;
    }

    // Get recipient info
    const recipientRef = doc(db, 'userBankInfo', toAccount);
    const recipientSnap = await getDoc(recipientRef);
    if (!recipientSnap.exists()) {
      Alert.alert('Error', 'Recipient account does not exist.');
      return;
    }
    const recipientDeposit = parseFloat(recipientSnap.data().deposit || '0');

    // Update balances
    const newSenderDeposit = (senderDeposit - transferAmount).toString();
    const newRecipientDeposit = (recipientDeposit + transferAmount).toString();

    await updateDoc(senderRef, { deposit: newSenderDeposit });
    await updateDoc(doc(db, 'userBankInfo', accountNumber as string), { deposit: newSenderDeposit });
    await updateDoc(recipientRef, { deposit: newRecipientDeposit });

    // Add to history
    const historyCollectionRef = collection(db, 'users', uid as string, 'userInfo', 'history', 'transfer');
    const randomRef = `REF-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    await addDoc(historyCollectionRef, {
      randomRef: randomRef,
      type: 'Transfer',
      details: 'Transfer to ' + toAccount,
      recipientName: recipientName || 'Unknown',
      fromAccount: fromAccount,
      toAccount: toAccount,
      amount: transferAmount.toFixed(2),
      date: new Date().toISOString().split('T')[0],
      time: new Date().toISOString().split('T')[1],
    });

    // Update local state
    setUserData((prev) => ({
      ...prev,
      deposit: newSenderDeposit,
    }));

    setAmount('');
    setToAccount('');
    setRecipientName('');
    Alert.alert('Success', 'Transfer completed!');
  };

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

      {/* Amount Input */}
      <TouchableOpacity onPress={() => setEditingAmount(true)} activeOpacity={1}>
        {editingAmount ? (
          <TextInput
            style={[styles.amountText, { backgroundColor: '#222', borderRadius: 8 }]}
            value={amount}
            onChangeText={setAmount}
            onBlur={() => setEditingAmount(false)}
            keyboardType="numeric"
            autoFocus
            placeholder="0.00"
            placeholderTextColor="#888"
            textAlign="center"
          />
        ) : (
          <Text style={styles.amountText}>
            PHP {amount ? Number(amount).toLocaleString() : '0.00'}
          </Text>
        )}
      </TouchableOpacity>

      {/* Available Balance */}
      <Text style={styles.availableBalanceLabel}>{userData.deposit ? Number(userData.deposit).toLocaleString() : '0.00'}</Text>
      <Text style={styles.availableBalanceText}>Available balance</Text>

      {/* Input Fields */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>From</Text>
        <TextInput
          style={styles.input}
          placeholder={fromAccount || 'Loading...'}
          placeholderTextColor="#444"
          value={fromAccount}
          editable={false}
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
          onBlur={checkToAccount}
        />
      </View>

      {/* Transfer Button */}
      <TouchableOpacity style={styles.transferButton} onPress={handleTransfer}>
        <Text style={styles.transferButtonText}>Transfer</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};


export default TransferScreen;

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
