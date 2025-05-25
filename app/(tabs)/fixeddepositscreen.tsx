import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, Alert, ActivityIndicator, TextInput, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { collection, addDoc, getDocs, doc, updateDoc, query, where } from "firebase/firestore";
import { db } from "../../FirebaseConfig";

interface UserData {
  id?: string;
  name?: string;
  deposit?: string;
  email?: string;
  mobile?: string;
  dateOfBirth?: Date;
  createdAt?: Date;
}

interface FixedDeposit {
  id: string;
  amount: number;
  tenureMonths: number;
  interestRate: number;
  maturityDate: string;
  startDate: string;
  maturityAmount: number;
  status: 'active' | 'matured' | 'early_withdrawn';
}

const FixedDepositScreen = () => {
  const { uid } = useLocalSearchParams();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [fixedDeposits, setFixedDeposits] = useState<FixedDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // For opening new FD
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [fdAmount, setFdAmount] = useState('');
  const [fdTenure, setFdTenure] = useState('');
  const fdInterestRate = 0.05; // 5% fixed annual interest

  const formatCurrency = (amount: number | string | undefined) => {
    if (amount === undefined || amount === null) return "₱ 0.00";
    const numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '')) : amount;
    if (isNaN(numAmount)) return "₱ 0.00";
    return `₱ ${new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numAmount)}`;
  };

  const fetchUserDataAndFixedDeposits = async () => {
    if (typeof uid !== "string") {
      setError("Invalid user ID.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch user info
      const userInfoCollectionRef = collection(db, "users", uid, "userInfo");
      const userInfoQuerySnapshot = await getDocs(userInfoCollectionRef);
      if (!userInfoQuerySnapshot.empty) {
        // Ensure that the document ID is captured
        setUserData({ id: userInfoQuerySnapshot.docs[0].id, ...userInfoQuerySnapshot.docs[0].data() as UserData });
      } else {
        // If no userInfo document, this might be an issue.
        // For now, setting a default, but consider how new users are handled.
        setUserData({ name: 'User', deposit: '0', id: 'default' }); // Add a default ID or handle this case
      }

      // Fetch fixed deposits
      const fdCollectionRef = collection(db, "users", uid, "fixedDeposits");
      const fdQuerySnapshot = await getDocs(fdCollectionRef);
      const fetchedFds: FixedDeposit[] = fdQuerySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<FixedDeposit, 'id'>
      }));
      setFixedDeposits(fetchedFds);
    } catch (err) {
      console.error("Error fetching data: ", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDataAndFixedDeposits();
  }, [uid]);

  const handleOpenNewFD = async () => {
    const amount = parseFloat(fdAmount);
    const tenure = parseInt(fdTenure, 10);
    const currentDeposit = parseFloat(userData?.deposit || '0');

    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid positive amount for the fixed deposit.");
      return;
    }
    if (isNaN(tenure) || tenure <= 0) {
      Alert.alert("Invalid Tenure", "Please enter a valid positive number of months for the tenure.");
      return;
    }
    if (currentDeposit < amount) {
      Alert.alert("Insufficient Funds", "You do not have enough balance in your deposit to open this fixed deposit.");
      return;
    }

    if (typeof uid !== "string") {
        Alert.alert("Error", "User ID is missing. Cannot open fixed deposit.");
        return;
    }
    // Crucial check: Ensure userData and userData.id exist
    if (!userData || !userData.id) {
        Alert.alert("Error", "User data or user info ID is missing. Please ensure your profile is complete.");
        return;
    }

    setLoading(true);
    try {
      const startDate = new Date();
      // Corrected logic for maturityDate to correctly handle month overflow (e.g., adding 1 month to Jan 31 should be Feb 28/29)
      const maturityDate = new Date(startDate);
      maturityDate.setMonth(startDate.getMonth() + tenure);
      // Ensure the day of the month doesn't exceed the last day of the target month
      if (maturityDate.getDate() !== startDate.getDate()) {
          maturityDate.setDate(0); // Set to last day of previous month, then add 1 to get to current month
          maturityDate.setDate(startDate.getDate());
      }


      const maturityAmount = amount * (1 + (fdInterestRate * tenure / 12)); // Simple interest for demonstration

      // Deduct from user's main deposit
      const userDocRef = doc(db, "users", uid, "userInfo", userData.id); // userData.id is now guaranteed to be a string
      await updateDoc(userDocRef, {
        deposit: (currentDeposit - amount).toString(),
      });

      // Add new fixed deposit record
      await addDoc(collection(db, "users", uid, "fixedDeposits"), {
        amount,
        tenureMonths: tenure,
        interestRate: fdInterestRate,
        startDate: startDate.toISOString(),
        maturityDate: maturityDate.toISOString(),
        maturityAmount: parseFloat(maturityAmount.toFixed(2)),
        status: 'active',
      });

      const investmentsDocRef = collection(db, "users", uid as string, "userInfo", "history", "investments");
      await addDoc(investmentsDocRef, {
        type: "Investment Overview",
        detail: "Total active fixed deposits amount",
        amount: amount,
        interestPay: parseFloat((amount * fdInterestRate * tenure / 12).toFixed(2)),
        totalFixedDepositAmount: amount + parseFloat((amount * fdInterestRate * tenure / 12).toFixed(2)),
        date: new Date().toISOString().split("T")[0],
        time: new Date().toISOString().split("T")[1],
      });
      Alert.alert("Success", "Fixed deposit opened successfully!");
      setIsModalVisible(false);
      setFdAmount('');
      setFdTenure('');
      fetchUserDataAndFixedDeposits(); // Refresh data
    } catch (err) {
      console.error("Error opening fixed deposit: ", err);
      Alert.alert("Error", "Failed to open fixed deposit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEarlyWithdrawal = async (fd: FixedDeposit) => {
    Alert.alert(
      "Confirm Early Withdrawal",
      `Are you sure you want to withdraw ${formatCurrency(fd.amount)} early? You may incur a penalty.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Withdraw",
          onPress: async () => {
            setLoading(true);
            try {
              if (typeof uid !== "string" || !userData || !userData.id) {
                Alert.alert("Error", "User ID or User Data is missing. Cannot process withdrawal.");
                setLoading(false);
                return;
              }

              // Apply a hypothetical penalty (e.g., lose all earned interest for simplicity)
              const amountToReturn = fd.amount; // Only return principal for early withdrawal
              const currentDeposit = parseFloat(userData?.deposit || '0');
              const newDeposit = currentDeposit + amountToReturn;

              // Update user's main deposit
              const userDocRef = doc(db, "users", uid, "userInfo", userData.id);
              await updateDoc(userDocRef, {
                deposit: newDeposit.toString(),
              });

              // Update FD status
              const fdDocRef = doc(db, "users", uid, "fixedDeposits", fd.id);
              await updateDoc(fdDocRef, {
                status: 'early_withdrawn',
              });

              Alert.alert("Withdrawal Successful", `${formatCurrency(amountToReturn)} has been returned to your deposit account.`);
              fetchUserDataAndFixedDeposits(); // Refresh data
            } catch (err) {
              console.error("Error during early withdrawal: ", err);
              Alert.alert("Error", "Failed to process early withdrawal. Please try again.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleMaturedWithdrawal = async (fd: FixedDeposit) => {
    Alert.alert(
      "Confirm Withdrawal",
      `Your Fixed Deposit has matured! Withdraw ${formatCurrency(fd.maturityAmount)}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Withdraw",
          onPress: async () => {
            setLoading(true);
            try {
              if (typeof uid !== "string" || !userData || !userData.id) {
                Alert.alert("Error", "User ID or User Data is missing. Cannot process withdrawal.");
                setLoading(false);
                return;
              }

              const currentDeposit = parseFloat(userData?.deposit || '0');
              const newDeposit = currentDeposit + fd.maturityAmount;

              // Update user's main deposit
              const userDocRef = doc(db, "users", uid, "userInfo", userData.id);
              await updateDoc(userDocRef, {
                deposit: newDeposit.toString(),
              });

              // Update FD status
              const fdDocRef = doc(db, "users", uid, "fixedDeposits", fd.id);
              await updateDoc(fdDocRef, {
                status: 'matured',
              });

              Alert.alert("Withdrawal Successful", `${formatCurrency(fd.maturityAmount)} has been returned to your deposit account, including interest.`);
              fetchUserDataAndFixedDeposits(); // Refresh data
            } catch (err) {
              console.error("Error during matured withdrawal: ", err);
              Alert.alert("Error", "Failed to process withdrawal. Please try again.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const checkMaturity = (fd: FixedDeposit) => {
    const maturityDate = new Date(fd.maturityDate);
    const now = new Date();
    return now >= maturityDate;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerMainContainer}>
        <View style={styles.headerContentRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
            <Ionicons name="arrow-back-outline" size={24} color="#CDFF57" />
          </TouchableOpacity>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.headerLogo}
          />
          <Text style={styles.headerWelcomeText}>
            Fixed Deposits
          </Text>
          <Ionicons
            name="notifications-outline"
            size={24}
            color="#CDFF57"
            style={styles.headerNotificationIcon}
          />
        </View>
        <Text style={styles.growWealthText}>
          SECURE YOUR SAVINGS
        </Text>
      </View>

      <View style={styles.contentArea}>
        {loading ? (
          <ActivityIndicator size="large" color="#CDFF57" />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Your Current Deposit</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Available Balance:</Text>
              <Text style={styles.infoValue}>{formatCurrency(userData?.deposit)}</Text>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>My Fixed Deposits</Text>
            {fixedDeposits.length === 0 ? (
              <View style={styles.noFdContainer}>
                <Ionicons name="information-circle-outline" size={60} color="#CDFF57" />
                <Text style={styles.noFdText}>No Fixed Deposits found.</Text>
                <Text style={styles.noFdSubText}>Start earning guaranteed returns today!</Text>
              </View>
            ) : (
              fixedDeposits.map((fd) => (
                <View key={fd.id} style={styles.fdCard}>
                  <Text style={styles.fdCardTitle}>Fixed Deposit - {fd.tenureMonths} Months</Text>
                  <View style={styles.fdDetailRow}>
                    <Text style={styles.fdDetailLabel}>Amount:</Text>
                    <Text style={styles.fdDetailValue}>{formatCurrency(fd.amount)}</Text>
                  </View>
                  <View style={styles.fdDetailRow}>
                    <Text style={styles.fdDetailLabel}>Interest Rate:</Text>
                    <Text style={styles.fdDetailValue}>{(fd.interestRate * 100).toFixed(2)}% p.a.</Text>
                  </View>
                  <View style={styles.fdDetailRow}>
                    <Text style={styles.fdDetailLabel}>Start Date:</Text>
                    <Text style={styles.fdDetailValue}>{new Date(fd.startDate).toLocaleDateString()}</Text>
                  </View>
                  <View style={styles.fdDetailRow}>
                    <Text style={styles.fdDetailLabel}>Maturity Date:</Text>
                    <Text style={styles.fdDetailValue}>{new Date(fd.maturityDate).toLocaleDateString()}</Text>
                  </View>
                  <View style={styles.fdDetailRow}>
                    <Text style={styles.fdDetailLabel}>Maturity Amount:</Text>
                    <Text style={styles.fdDetailValue}>{formatCurrency(fd.maturityAmount)}</Text>
                  </View>
                  <View style={styles.fdDetailRow}>
                    <Text style={styles.fdDetailLabel}>Status:</Text>
                    <Text style={[styles.fdDetailValue, { color: checkMaturity(fd) ? '#4CAF50' : '#CDFF57' }]}>
                      {checkMaturity(fd) ? 'Matured' : 'Active'}
                    </Text>
                  </View>

                  {checkMaturity(fd) && fd.status === 'active' && (
                    <TouchableOpacity
                      style={styles.withdrawButton}
                      onPress={() => handleMaturedWithdrawal(fd)}
                    >
                      <Text style={styles.withdrawButtonText}>Withdraw Matured FD</Text>
                    </TouchableOpacity>
                  )}
                  {!checkMaturity(fd) && fd.status === 'active' && (
                    <TouchableOpacity
                      style={styles.earlyWithdrawButton}
                      onPress={() => handleEarlyWithdrawal(fd)}
                    >
                      <Text style={styles.earlyWithdrawButtonText}>Early Withdraw (Penalty)</Text>
                    </TouchableOpacity>
                  )}
                  {fd.status !== 'active' && (
                    <Text style={styles.withdrawnStatus}>This FD has been {fd.status.replace('_', ' ')}.</Text>
                  )}
                </View>
              ))
            )}

            <TouchableOpacity style={styles.actionButtonPrimary} onPress={() => setIsModalVisible(true)}>
              <Text style={styles.actionButtonTextPrimary}>Open New Fixed Deposit</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* New Fixed Deposit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Open New Fixed Deposit</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Deposit Amount</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 10000"
                value={fdAmount}
                onChangeText={setFdAmount}
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Tenure (Months)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 12"
                value={fdTenure}
                onChangeText={setFdTenure}
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Interest Rate (Annual):</Text>
              <Text style={styles.detailValue}>{(fdInterestRate * 100).toFixed(2)}%</Text>
            </View>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary]}
              onPress={handleOpenNewFD}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.modalButtonTextPrimary}>Confirm & Open FD</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={() => setIsModalVisible(false)}
              disabled={loading}
            >
              <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  headerMainContainer: {
    backgroundColor: "#111",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
  },
  headerContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerBackBtn: {
    marginRight: 10,
  },
  headerLogo: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
  headerWelcomeText: {
    flex: 1,
    color: "#CDFF57",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: 'left',
    marginLeft: 10,
  },
  headerNotificationIcon: {
    marginLeft: 10,
  },
  growWealthText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "white",
    textAlign: "left",
  },
  contentArea: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: 20,
    borderRadius: 10,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  infoCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
  },
  infoValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  fdCard: {
    backgroundColor: "#f8f8f8",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  fdCardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  fdDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  fdDetailLabel: {
    fontSize: 14,
    color: "#666",
  },
  fdDetailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  actionButtonPrimary: {
    backgroundColor: "#CDFF57",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  actionButtonTextPrimary: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  noFdContainer: {
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  noFdText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  noFdSubText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  errorText: {
    color: '#FF6347',
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#CDFF57',
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 15,
  },
  label: {
    color: '#666',
    fontSize: 15,
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    color: '#333',
    width: '100%',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 15,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  modalButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
  },
  modalButtonPrimary: {
    backgroundColor: '#CDFF57',
  },
  modalButtonTextPrimary: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButtonSecondary: {
    backgroundColor: '#eee',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  modalButtonTextSecondary: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  withdrawButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  withdrawButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  earlyWithdrawButton: {
    backgroundColor: '#FF6347',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  earlyWithdrawButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  withdrawnStatus: {
    color: '#999',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  }
});

export default FixedDepositScreen;