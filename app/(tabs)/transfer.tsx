import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { db } from '@/FirebaseConfig';
import { collection, doc, getDoc, updateDoc, addDoc } from 'firebase/firestore';

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
  const { uid, accountNumber } = useLocalSearchParams<{ uid: string; accountNumber: string }>();
  const [fromAccount] = useState(accountNumber || '');
  const [toAccount, setToAccount] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [amount, setAmount] = useState('');
  const [editingAmount, setEditingAmount] = useState(false);
  const [userData, setUserData] = useState<UserData>({});

  const quickAmounts = ['100', '500', '1000', '2500', '5000'];

  useEffect(() => {
    const fetchUserInfoDocuments = async () => {
      if (uid && accountNumber) {
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

    const recipientRef = doc(db, 'userBankInfo', toAccount);
    const recipientSnap = await getDoc(recipientRef);
    if (!recipientSnap.exists()) {
      Alert.alert('Error', 'Recipient account does not exist.');
      return;
    }
    const recipientDeposit = parseFloat(recipientSnap.data().deposit || '0');

    const newSenderDeposit = (senderDeposit - transferAmount).toFixed(2);
    const newRecipientDeposit = (recipientDeposit + transferAmount).toFixed(2);

    await updateDoc(senderRef, { deposit: newSenderDeposit });
    await updateDoc(doc(db, 'userBankInfo', accountNumber as string), { deposit: newSenderDeposit });
    await updateDoc(recipientRef, { deposit: newRecipientDeposit });

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
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    });

    setUserData((prev) => ({
      ...prev,
      deposit: newSenderDeposit,
    }));

    setAmount('');
    setToAccount('');
    setRecipientName('');
    Alert.alert('Success', 'Transfer completed!');
  };

  const handleQuickAmountTap = (value: string) => {
    setAmount(value);
    setEditingAmount(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#A7FF83" />
          </TouchableOpacity>
          <Text style={styles.title}>Transfer Funds</Text>
          {/* Ensure there's no plain text here outside of a <Text> component */}
          <View style={{ width: 24 }} />
        </View>

        {/* Amount Input */}
        <View style={styles.amountInputContainer}>
          <Text style={styles.currencySymbol}>PHP</Text>
          <TouchableOpacity onPress={() => setEditingAmount(true)} activeOpacity={1}>
            {editingAmount ? (
              <TextInput
                style={styles.amountTextInput}
                value={amount}
                onChangeText={setAmount}
                onBlur={() => setEditingAmount(false)}
                keyboardType="numeric"
                autoFocus
                placeholder="0.00"
                placeholderTextColor="#777"
                textAlign="center"
              />
            ) : (
              <Text style={styles.amountDisplay}>
                {amount ? Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Amount Buttons */}
        <View style={styles.quickAmountsContainer}>
          {quickAmounts.map((val, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickAmountButton}
              onPress={() => handleQuickAmountTap(val)}
            >
              <Text style={styles.quickAmountText}>PHP {Number(val).toLocaleString()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Available Balance */}
        <Text style={styles.availableBalanceLabel}>
          Available Balance: <Text style={styles.availableBalanceValue}>PHP {userData.deposit ? Number(userData.deposit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</Text>
        </Text>

        {/* Input Fields */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>From Account</Text>
          <TextInput
            style={styles.input}
            placeholder="Loading..."
            placeholderTextColor="#888"
            value={fromAccount}
            editable={false}
          />

          <Text style={styles.inputLabel}>To Account</Text>
          {recipientName ? (
            <Text style={styles.recipientNameText}>
              Recipient: {recipientName}
            </Text>
          ) : null}
          <TextInput
            style={styles.input}
            placeholder="Enter destination account number"
            placeholderTextColor="#888"
            value={toAccount}
            onChangeText={setToAccount}
            onBlur={checkToAccount}
            keyboardType="numeric"
          />
        </View>
      </ScrollView>

      {/* Transfer Button (positioned at the bottom) */}
      <TouchableOpacity style={styles.transferButton} onPress={handleTransfer}>
        <Text style={styles.transferButtonText}>Confirm Transfer</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default TransferScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 50 : 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  backButton: {
    padding: 5,
  },
  title: {
    color: '#E0E0E0',
    fontSize: 24,
    fontWeight: 'bold',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  currencySymbol: {
    color: '#A7FF83',
    fontSize: 30,
    fontWeight: 'bold',
    marginRight: 8,
  },
  amountTextInput: {
    color: '#E0E0E0',
    fontSize: 36,
    fontWeight: 'bold',
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#333333',
    borderRadius: 10,
    minWidth: 150,
  },
  amountDisplay: {
    color: '#E0E0E0',
    fontSize: 36,
    fontWeight: 'bold',
  },
  quickAmountsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 30,
    gap: 10,
  },
  quickAmountButton: {
    backgroundColor: '#333333',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444444',
  },
  quickAmountText: {
    color: '#A7FF83',
    fontSize: 14,
    fontWeight: '600',
  },
  availableBalanceLabel: {
    textAlign: 'center',
    color: '#B0B0B0',
    fontSize: 15,
    marginBottom: 40,
  },
  availableBalanceValue: {
    color: '#A7FF83',
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 30,
  },
  inputLabel: {
    color: '#E0E0E0',
    marginBottom: 8,
    marginTop: 15,
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#333333',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    color: '#E0E0E0',
    borderWidth: 1,
    borderColor: '#444444',
  },
  recipientNameText: {
    color: '#A7FF83',
    marginBottom: 8,
    marginLeft: 5,
    fontSize: 14,
    fontStyle: 'italic',
  },
  transferButton: {
    backgroundColor: '#A7FF83',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    shadowColor: '#A7FF83',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  transferButtonText: {
    color: '#1E1E1E',
    fontWeight: 'bold',
    fontSize: 18,
  },
});