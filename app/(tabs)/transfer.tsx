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
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';

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
              console.log("Fetched document data:", docSnap.data());
              setUserData(docSnap.data() as UserData);
            } else {
              console.log("No document found in userInfo.");
            }
          } catch (error) {
            console.error("Error fetching document: ", error);
          }
        } else {
          console.error("Invalid uid or accountNumber:", uid, accountNumber);
        }
      };
  
      fetchUserInfoDocuments();
    }, [uid, accountNumber]);

  // Check if "To" account exists in DB
  const checkToAccount = async () => {
    const userInfoRef = doc(db, 'userBankInfo', toAccount); // <-- use your actual subcollection name
    const docSnap = await getDoc(userInfoRef);
    if (docSnap.exists()) {
      const currentDeposit = parseFloat(docSnap.data().deposit || '0');
      const transferAmount = parseFloat(amount || '0');

      // Update Firestore
      const newDeposit = (currentDeposit + transferAmount).toString();
      await updateDoc(userInfoRef, { deposit: newDeposit });

      // Update local state
      setUserData((prev) => ({
        ...prev,
        deposit: newDeposit,
      }));

      Alert.alert('Success', 'Transfer can proceed!');
      return true;
    }
    return false;
  };

  const handleTransfer = async () => {
    const exists = await checkToAccount();
    if (!exists) {
      Alert.alert('Error', 'Destination account does not exist.');
      return;
    }
    const docRef = doc(db, 'users', uid as string, 'userInfo', accountNumber as string);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const currentDeposit = parseFloat(docSnap.data().deposit || '0');
      const transferAmount = parseFloat(amount || '0');

      // Update Firestore
      const newDeposit = (currentDeposit - transferAmount).toString();
      await updateDoc(docRef, { deposit: newDeposit });

      await updateDoc(doc(db, 'userBankInfo', accountNumber as string), { deposit: newDeposit });

      // Update local state
      setUserData((prev) => ({
        ...prev,
        deposit: newDeposit,
      }));
    }
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
