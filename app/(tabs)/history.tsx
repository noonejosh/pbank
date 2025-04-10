import React, { useState } from 'react';
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

interface Transaction {
  type: string;
  details?: string;
  amount: string;
  status: string;
  transactionId: string;
  date: string;
  time: string;
}

const TransactionHistoryScreen = () => {
  const { uid } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('history'); 

  const transactions: Transaction[] = [
    {
      type: 'Cash - in',
      details: 'From ABC Bank ATM',
      amount: '$ 100.00',
      status: 'Confirmed',
      transactionId: '564925374920',
      date: '17 Sep 2023',
      time: '10:34 AM',
    },
    {
      type: 'Cashback from purchase',
      details: 'Purchase from Amazon.com',
      amount: '$ 1.75',
      status: 'Confirmed',
      transactionId: '685746354219',
      date: '16 Sep 2023',
      time: '16:08 PM',
    },
  ];

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
        <Text style={styles.status}>{item.status}</Text>
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