import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '@/FirebaseConfig';


const TransactionHistoryScreen = () => {
  const { uid } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('history');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  interface Transaction {
    type: string;
    details?: string;
    accountNumber?: string;
    billAmount?: string;
    amount: string;
    convenienceFee?: string;
    totalAmount?: string;
    transactionId: string;
    date: string;
    time: string;
  }
  
  console.log("TransactionHistoryScreen uid:", uid); // Log the uid for debugging
  useEffect(() => {
    const fetchTransactionHistory = async () => {
      if (typeof uid === "string") {
        try {
          // References to subcollections
          const depositRef = collection(db, "users", uid, "userInfo", "history", "deposit");
          const withdrawRef = collection(db, "users", uid, "userInfo", "history", "withdraw");
          const transferRef = collection(db, "users", uid, "userInfo", "history", "transfer");
          const paybillsRef = collection(db, "users", uid, "userInfo", "history", "paybills");

          // Fetch documents from each subcollection
          const [depositSnapshot, withdrawSnapshot, transferSnapshot, paybillsSnapshot] = await Promise.all([
            getDocs(depositRef),
            getDocs(withdrawRef),
            getDocs(transferRef),
            getDocs(paybillsRef),
          ]);

          // Map documents from each subcollection
          const depositDocs = depositSnapshot.docs.map((doc) => ({
            id: doc.id,
            type: "Deposit",
            details: doc.data().details || "",
            amount: doc.data().amount || "0",
            transactionId: doc.id,
            date: doc.data().date || new Date().toISOString().split("T")[0],
            time: doc.data().time || new Date().toISOString().split("T")[1],
          }));

          const withdrawDocs = withdrawSnapshot.docs.map((doc) => ({
            id: doc.id,
            type: "Withdraw",
            details: doc.data().details || "",
            amount: doc.data().amount || "0",
            transactionId: doc.id,
            date: doc.data().date || new Date().toISOString().split("T")[0],
            time: doc.data().time || new Date().toISOString().split("T")[1],
          }));

          const transferDocs = transferSnapshot.docs.map((doc) => ({
            id: doc.id,
            type: "Transfer",
            accountNumber: doc.data().accountNumber || "",
            details: doc.data().details || "",
            amount: doc.data().amount || "0",
            transactionId: doc.id,
            date: doc.data().date || new Date().toISOString().split("T")[0],
            time: doc.data().time || new Date().toISOString().split("T")[1],
          }));

          const paybillsDocs = paybillsSnapshot.docs.map((doc) => ({
            id: doc.id,
            type: "Pay Bills",
            accountNumber: doc.data().accountNumber || "",
            billAmount: parseFloat(doc.data().billAmount as string).toFixed(2),
            convenienceFee: parseFloat(doc.data().convenienceFee as string).toFixed(2),
            totalAmount: parseFloat(doc.data().totalAmount as string).toFixed(2),
            date: doc.data().date || new Date().toISOString().split("T")[0],
            time: doc.data().time || new Date().toISOString().split("T")[1],
          }));

          // Combine all transactions
          const allTransactions = [...depositDocs, ...withdrawDocs, ...transferDocs, ...paybillsDocs];
          console.log("All Transactions:", allTransactions);

          // Optionally sort transactions by date or time
          allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          // Set the combined transactions to state
          setTransactions(allTransactions);
        } catch (error) {
          console.error("Error fetching transaction history:", error);
        }
      } else {
        console.error("Invalid uid:", uid);
      }
    };

    fetchTransactionHistory();
  }, [uid]); // Run the effect when `uid` changes

  const renderItem = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        <Ionicons name="receipt-outline" size={24} color="#CDFF57" />
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionType}>{item.type}</Text>
        {item.details && (
          <Text style={styles.transactionDetailsText}>{item.details}</Text>
        )}
        <Text style={styles.transactionId}>
          Transaction ID: {item.transactionId}
        </Text>
      </View>
      <View style={styles.transactionAmount}>
        <Text style={styles.amount}>{item.amount}</Text>
        <Text style={styles.status}>{item.convenienceFee ? `Fee: ${item.convenienceFee}` : 'No Fee'}</Text>
        <Text style={styles.dateTime}>
          {item.date} {item.time}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Transaction History</Text>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#CDFF57" />
        <TextInput
          style={styles.searchText}
          placeholder="Search Transactions"
          placeholderTextColor="#B0B0B0"
        />
      </View>

      <FlatList
        data={transactions}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        ListEmptyComponent={() => (
          <View style={styles.emptyTransactions}>
            <Text style={styles.emptyText}>No transactions yet.</Text>
          </View>
        )}
      />

      {/* Bottom Navigation */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.navButton, activeTab === 'home' && styles.navButtonActive]}
          onPress={() => {
            setActiveTab('home');
            router.push({ pathname: '/(tabs)/homepage', params: { uid } });
          }}
        >
          <Ionicons
            name="home"
            size={20}
            color={activeTab === 'home' ? '#CDFF57' : 'black'}
          />
          <Text
            style={[styles.navLabel, activeTab === 'home' && styles.navLabelActive]}
          >
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, activeTab === 'transfer' && styles.navButtonActive]}
          onPress={() => {
            setActiveTab('transfer');
            router.push({ pathname: '/(tabs)/transferfund', params: { uid } });
          }}
        >
          <Ionicons
            name="swap-horizontal"
            size={20}
            color={activeTab === 'transfer' ? '#CDFF57' : 'black'}
          />
          <Text
            style={[styles.navLabel, activeTab === 'transfer' && styles.navLabelActive]}
          >
            Transfer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, activeTab === 'history' && styles.navButtonActive]}
          onPress={() => {
            setActiveTab('history');
            router.push({ pathname: '/(tabs)/history', params: { uid } });
          }}
        >
          <Ionicons
            name="document-text"
            size={20}
            color={activeTab === 'history' ? '#CDFF57' : 'black'}
          />
          <Text
            style={[styles.navLabel, activeTab === 'history' && styles.navLabelActive]}
          >
            History
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, activeTab === 'profile' && styles.navButtonActive]}
          onPress={() => {
            setActiveTab('profile');
            router.push({ pathname: '/(tabs)/profile', params: { uid } });
          }}
        >
          <Ionicons
            name="person"
            size={20}
            color={activeTab === 'profile' ? '#CDFF57' : 'black'}
          />
          <Text
            style={[styles.navLabel, activeTab === 'profile' && styles.navLabelActive]}
          >
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 5,
  },
  headerTitle: {
    color: '#CDFF57',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    position: 'relative',
    top: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F1F1F',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    marginHorizontal: 8,
  },
  searchText: {
    color: '#CDFF57',
    marginLeft: 10,
    flex: 1,
  },
  transactionItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    marginHorizontal: 8,
  },
  transactionIcon: {
    marginRight: 16,
  },
  transactionDetails: {
    flex: 2,
  },
  transactionType: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 16,
  },
  transactionDetailsText: {
    color: 'black',
    fontSize: 12,
  },
  transactionId: {
    color: '#B0B0B0',
    fontSize: 12,
  },
  transactionAmount: {
    flex: 1,
    alignItems: 'flex-end',
  },
  amount: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 16,
  },
  status: {
    color: 'green',
    fontSize: 12,
    padding: 5,
    backgroundColor: '#CDFF57',
    borderRadius: 20,
    fontWeight: 'bold',
  },
  dateTime: {
    color: '#B0B0B0',
    fontSize: 12,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#C6FF33",
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 3,
    borderColor: "#000",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },

  navButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    borderRadius: 10,
  },

  navButtonActive: {
    backgroundColor: "#000",
  },

  navLabel: {
    fontSize: 11,
    marginTop: 3,
    color: "#000",
    fontWeight: "600",
    textAlign: 'center',
  },

  navLabelActive: {
    color: "#CDFF57",
  },

  navIconActive: {
    color: "#CDFF57",
  },

  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 20,
    paddingHorizontal: 10,
  },

  actionText: {
    color: "#CDFF57",
    fontSize: 12,
    marginTop: 5,
    textAlign: "center",
  },
  
  emptyTransactions: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  emptyText: {
    color: '#B0B0B0',
    fontSize: 16,
  },
});

export default TransactionHistoryScreen;