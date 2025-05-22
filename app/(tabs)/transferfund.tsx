import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from "expo-router";

const TransferFundsScreen = () => {
  const { uid } = useLocalSearchParams();


  interface UserData {
    name?: string;
    accountNumber?: string;
    deposit?: string;
    email?: string;
    mobile?: string;
    dateOfBirth?: Date;
    createdAt?: Date;
  }

  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('transfer');
  const [recipients, setRecipients] = useState<any[]>([]);
  const [recipientName, setRecipientName] = useState('');
  const [recipientAccount, setRecipientAccount] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  

  const tabs = ['All', 'Transfer', 'Bills Payment'];

  // Filtered recipients based on search text
  const filteredRecipients = recipients.filter(
    (recipient) =>
      recipient.name.toLowerCase().includes(searchText.toLowerCase()) ||
      recipient.account.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
        />
        <Text style={styles.welcomeText}>Welcome Back!</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <View style={styles.notificationCircle}>
            <Ionicons name="notifications-outline" size={24} color="#000" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.actionsBar}>
        <View style={{ alignItems: 'center' }}>
          <Ionicons name="qr-code-outline" size={32} color="#CDFF57" />
          <Text style={styles.actionText}>Scan QR</Text>
        </View>
        <TouchableOpacity
          style={{ alignItems: 'center' }}
          onPress={() => router.push({ pathname: "/(tabs)/savings", params: { uid } })}
        >
          <Ionicons name="trending-up-outline" size={32} color="#CDFF57" />
          <Text style={styles.actionText}>Invest</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ alignItems: 'center' }}
          onPress={() => router.push({ pathname: "/(tabs)/paybills", params: { uid } })}
        >
          <Ionicons name="receipt-outline" size={32} color="#CDFF57" />
          <Text style={styles.actionText}>Pay Bills</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ alignItems: 'center' }}
          onPress={() => router.push({ pathname: "/(tabs)/loanscreen", params: { uid } })}
        >
          <Ionicons name="wallet-outline" size={32} color="#CDFF57" />
          <Text style={styles.actionText}>Loan</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.recipientsContainer}>
        <Text style={styles.recipientsTitle}>Saved recipients</Text>

        <View style={styles.tabs}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => {
                setActiveTab(tab);
                if (tab === 'Transfer') {
                  router.push({
                    pathname: '/(tabs)/transfer',
                    params: { uid },
                  });
                } else if (tab === 'Bills Payment') {
                  router.push({
                    pathname: '/(tabs)/paybills',
                    params: { uid },
                  });
                }
              }}
            >
              <Text
                style={[styles.tabText, activeTab === tab && styles.activeTabText]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="gray" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="gray"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

          <ScrollView
          style={styles.recipientsList}
          contentContainerStyle={{ paddingBottom: 120 }}
          >
          {filteredRecipients.length === 0 ? (
            <Text style={styles.emptyListText}>No saved recipients.</Text>
          ) : (
            filteredRecipients.map((recipient) => (
              <TouchableOpacity
                key={recipient.id}
                style={styles.recipientItem}
                onPress={() => {
                  router.push({
                    pathname: '/(tabs)/transfer',
                    params: {
                      uid,
                      destinationAccount: recipient.account,
                      recipientName: recipient.name,
                    },
                  });
                }}
              >
                <Text style={styles.recipientName}>{recipient.name}</Text>
                <Text style={styles.recipientAccount}>{recipient.account}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>

      {/* Floating + Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Modal for adding recipient */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 16, color: "#222" }}>Add Recipient</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Recipient Name"
              placeholderTextColor="#888"
              value={recipientName}
              onChangeText={setRecipientName}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Account Number"
              placeholderTextColor="#888"
              value={recipientAccount}
              onChangeText={setRecipientAccount}
              keyboardType="number-pad"
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
              <TouchableOpacity
                style={{ marginRight: 16 }}
                onPress={() => setModalVisible(false)}
              >
                <Text style={{ color: '#FF5252', fontWeight: 'bold', fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: '#CDFF57',
                  borderRadius: 8,
                  paddingVertical: 8,
                  paddingHorizontal: 20,
                }}
                onPress={() => {
                  if (recipientName && recipientAccount) {
                    setRecipients([
                      ...recipients,
                      {
                        id: Date.now().toString(),
                        name: recipientName,
                        account: recipientAccount,
                      },
                    ]);
                    setRecipientName('');
                    setRecipientAccount('');
                    setModalVisible(false);
                  }
                }}
              >
                <Text style={{ color: '#222', fontWeight: 'bold', fontSize: 16 }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.navButton, activeTab === "home" && styles.navButtonActive]}
          onPress={() => {
            setActiveTab("home");
            router.push({
              pathname: "/(tabs)/homepage",
              params: { uid },
            });
          }}
        >
          <Ionicons name="home" size={20} color={activeTab === "home" ? "#CDFF57" : "black"} />
          <Text style={[styles.navLabel, activeTab === "home" && styles.navLabelActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, activeTab === "transfer" && styles.navButtonActive]}
          onPress={() => {
            setActiveTab("transfer");
            router.push({
              pathname: "/(tabs)/transferfund",
              params: { uid },
            });
          }}
        >
          <Ionicons name="swap-horizontal" size={20} color={activeTab === "transfer" ? "#CDFF57" : "black"} />
          <Text style={[styles.navLabel, activeTab === "transfer" && styles.navLabelActive]}>Transfer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, activeTab === "history" && styles.navButtonActive]}
          onPress={() => {
            setActiveTab("history");
            router.push({
              pathname: "/(tabs)/history",
              params: { uid },
            });
          }}
        >
          <Ionicons name="document-text" size={20} color={activeTab === "history" ? "#CDFF57" : "black"} />
          <Text style={[styles.navLabel, activeTab === "history" && styles.navLabelActive]}>History</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, activeTab === "profile" && styles.navButtonActive]}
          onPress={() => {
            setActiveTab("profile");
            router.push({
              pathname: "/(tabs)/profile",
              params: { uid },
            });
          }}
        >
          <Ionicons name="person" size={20} color={activeTab === "profile" ? "#CDFF57" : "black"} />
          <Text style={[styles.navLabel, activeTab === "profile" && styles.navLabelActive]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  logo: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  welcomeText: {
    color: '#CDFF57',
    fontSize: 18,
    fontWeight: 'bold',
  },
  notificationButton: {
    padding: 8,
  },
  notificationCircle: {
    backgroundColor: '#CDFF57',
    borderRadius: 20,
    padding: 8,
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
  },
  recipientsContainer: {
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    flex: 1,
  },
  recipientsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#444',
  },
  activeTab: {
    backgroundColor: '#CDFF57',
  },
  tabText: {
    color: '#B0B0B0',
  },
  activeTabText: {
    color: '#000',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#444',
    borderRadius: 20,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 40,
    marginLeft: 8,
    color: '#B0B0B0',
  },
  recipientsList: {
    flex: 1,
  },
  recipientItem: {
  backgroundColor: '#E0E0E0', 
  padding: 16,                
  borderRadius: 12,           
  marginBottom: 10,          
  borderBottomWidth: 0,  
  },
  recipientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
  recipientAccount: {
    color: 'black',
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
  
  emptyListText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#B0B0B0',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 90,
    backgroundColor: '#CDFF57',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    zIndex: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 28,
    width: '85%',
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: "#222",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
});

export default TransferFundsScreen;