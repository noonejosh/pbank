import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/FirebaseConfig';


const TransactionHistoryScreen = () => {
  const { uid } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('history');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

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
    interestPay?: string;
    loanAmount?: string;
  }

  console.log("TransactionHistoryScreen uid:", uid);
  useEffect(() => {
    const fetchTransactionHistory = async () => {
      if (typeof uid === "string") {
        try {
          const depositRef = collection(db, "users", uid, "userInfo", "history", "deposit");
          const withdrawRef = collection(db, "users", uid, "userInfo", "history", "withdraw");
          const transferRef = collection(db, "users", uid, "userInfo", "history", "transfer");
          const paybillsRef = collection(db, "users", uid, "userInfo", "history", "paybills");
          const loanRef = collection(db, "users", uid, "userInfo", "history", "loanPayment");
          const investmentRef = collection(db, "users", uid, "userInfo", "history", "investments");

          const [depositSnapshot, withdrawSnapshot, transferSnapshot, paybillsSnapshot, loanSnapshot, investmentSnapshot] = await Promise.all([
            getDocs(depositRef),
            getDocs(withdrawRef),
            getDocs(transferRef),
            getDocs(paybillsRef),
            getDocs(loanRef),
            getDocs(investmentRef),
          ]);

          const depositDocs = depositSnapshot.docs.map((doc) => ({
            transactionId: doc.id,
            type: "Deposit",
            details: doc.data().details || "",
            totalAmount: doc.data().totalAmount,
            date: doc.data().date || new Date().toISOString().split("T")[0],
            time: doc.data().time || new Date().toISOString().split("T")[1],
          }));

          const withdrawDocs = withdrawSnapshot.docs.map((doc) => ({
            transactionsId: doc.id,
            type: "Withdraw",
            details: doc.data().details || "",
            totalAmount: doc.data().totalAmount,
            transactionId: doc.id,
            date: doc.data().date || new Date().toISOString().split("T")[0],
            time: doc.data().time || new Date().toISOString().split("T")[1],
          }));

          const transferDocs = transferSnapshot.docs.map((doc) => ({
            transactionsId: doc.id,
            type: doc.data().type,
            accountNumber: doc.data().accountNumber || "",
            details: doc.data().details || "",
            amount: doc.data().amount,
            transactionId: doc.id,
            date: doc.data().date || new Date().toISOString().split("T")[0],
            time: doc.data().time || new Date().toISOString().split("T")[1],
          }));

          const paybillsDocs = paybillsSnapshot.docs.map((doc) => ({
            transactionId: doc.id,
            type: "Pay Bills",
            accountNumber: doc.data().accountNumber || "",
            amount: parseFloat(doc.data().amount as string).toFixed(2),
            convenienceFee: parseFloat(doc.data().convenienceFee as string).toFixed(2),
            totalAmount: parseFloat(doc.data().totalAmount as string).toFixed(2),
            date: doc.data().date || new Date().toISOString().split("T")[0],
            time: doc.data().time || new Date().toISOString().split("T")[1],
          }));

          const loanDocs = loanSnapshot.docs.map((doc) => ({
            transactionId: doc.id,
            type: "Loan Payment",
            details: doc.data().details || "",
            amount: parseFloat(doc.data().amount as string).toFixed(2),
            interestPay: parseFloat(doc.data().interestPay as string).toFixed(2),
            totalAmount: parseFloat(doc.data().totalAmount as string).toFixed(2),
            date: doc.data().date || new Date().toISOString().split("T")[0],
            time: doc.data().time || new Date().toISOString().split("T")[1],
          }));
          const investmentDocs = investmentSnapshot.docs.map((doc) => ({
            transactionId: doc.id,
            type: doc.data().type || "Investment",
            details: doc.data().details || "",
            amount: parseFloat(doc.data().amount as string).toFixed(2),
            interestPay: parseFloat(doc.data().interestPay as string).toFixed(2),
            date: doc.data().date || new Date().toISOString().split("T")[0],
            time: doc.data().time || new Date().toISOString().split("T")[1],
          }));

          const allTransactions = [...depositDocs, ...withdrawDocs, ...transferDocs, ...paybillsDocs, ...loanDocs, ...investmentDocs];

          allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          setTransactions(allTransactions);
        } catch (error) {
          console.error("Error fetching transaction history:", error);
        }
      } else {
        console.error("Invalid uid:", uid);
      }
    };

    fetchTransactionHistory();
  }, [uid]);

  const filteredTransactions = transactions.filter(transaction =>
    transaction.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (transaction.details && transaction.details.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (transaction.accountNumber && transaction.accountNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderItem = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        <Ionicons
          name={
            item.type === "Deposit" ? "arrow-down-circle" :
            item.type === "Withdraw" ? "arrow-up-circle" :
            item.type === "Transfer" ? "swap-horizontal" :
            item.type === "Pay Bills" ? "wallet" :
            item.type === "Loan Payment" ? "cash" :
            "receipt"
          }
          size={24} // Slightly reduced icon size
          color="#CDFF57"
        />
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionType}>{item.type}</Text>
        {item.details && (
          <Text style={styles.transactionDetailsText}>{item.details}</Text>
        )}
        {item.accountNumber && item.type === "Transfer" && (
          <Text style={styles.transactionAccount}>Acc: {item.accountNumber}</Text>
        )}
        <Text style={styles.transactionId}>
          ID: {item.transactionId.substring(0, 8)}...
        </Text>
      </View>
      <View style={styles.transactionAmountContainer}>
        <Text style={styles.amount}>
          {item.totalAmount && item.totalAmount !== "NaN"
            ? `₱${item.totalAmount}`
            : item.amount && item.amount !== "NaN"
              ? `₱${item.amount}`
              : 'N/A'}
        </Text>
        <Text style={styles.fee}>
          {item.convenienceFee && item.convenienceFee !== "NaN"
            ? `Fee: ₱${item.convenienceFee}`
            : item.interestPay && item.interestPay !== "NaN"
              ? `Interest: ₱${item.interestPay}`
              : 'No Fee'}
        </Text>
        <Text style={styles.dateTime}>
          {item.date} {item.time ? item.time.substring(0, 5) : ''}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.headerTitle}>Transaction History</Text>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#CDFF57" />
          <TextInput
            style={styles.searchText}
            placeholder="Search transactions..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <FlatList
          data={filteredTransactions}
          renderItem={renderItem}
          keyExtractor={(item) => item.transactionId}
          contentContainerStyle={styles.flatListContent}
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
              size={24}
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
              router.push({ pathname: '/(tabs)/transfer', params: { uid } });
            }}
          >
            <Ionicons
              name="swap-horizontal"
              size={24}
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
              size={24}
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
              size={24}
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
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  headerTitle: {
    color: '#CDFF57',
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    paddingTop: 10,
    letterSpacing: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginHorizontal: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchText: {
    color: '#CDFF57',
    marginLeft: 10,
    flex: 1,
    fontSize: 16,
  },
  flatListContent: {
    paddingBottom: 100,
  },
  transactionItem: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 15, // Slightly reduced padding
    marginBottom: 12,
    marginHorizontal: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
    borderLeftWidth: 5,
    borderLeftColor: '#CDFF57',
  },
  transactionIcon: {
    marginRight: 10, // Reduced margin
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3A3A3A',
    borderRadius: 20,
    padding: 6, // Slightly reduced padding
  },
  transactionDetails: {
    flex: 2.5,
    justifyContent: 'center',
  },
  transactionType: {
    color: '#CDFF57',
    fontWeight: 'bold',
    fontSize: 15, // Reduced font size
    marginBottom: 1, // Reduced margin
  },
  transactionDetailsText: {
    color: '#D0D0D0',
    fontSize: 11, // Reduced font size
    lineHeight: 16, // Reduced line height
  },
  transactionAccount: {
    color: '#A0A0A0',
    fontSize: 10, // Reduced font size
    marginTop: 1, // Reduced margin
  },
  transactionId: {
    color: '#808080',
    fontSize: 10, // Reduced font size
    marginTop: 3, // Reduced margin
  },
  transactionAmountContainer: {
    flex: 1.5,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amount: {
    color: '#CDFF57',
    fontWeight: 'bold',
    fontSize: 16, // Reduced font size to make it fit
    marginBottom: 1, // Reduced margin
  },
  fee: {
    color: '#E0E0E0',
    fontSize: 10, // Reduced font size
    backgroundColor: '#4A4A4A',
    borderRadius: 4, // Slightly reduced border radius
    paddingHorizontal: 5, // Slightly reduced padding
    paddingVertical: 2, // Slightly reduced padding
    overflow: 'hidden',
    marginTop: 2, // Reduced margin
  },
  dateTime: {
    color: '#A0A0A0',
    fontSize: 9, // Reduced font size
    marginTop: 4, // Reduced margin
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

  emptyTransactions: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    color: '#808080',
    fontSize: 18,
    fontStyle: 'italic',
  },
});

export default TransactionHistoryScreen;