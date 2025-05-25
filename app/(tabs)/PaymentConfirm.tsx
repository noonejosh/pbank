import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { AntDesign } from "@expo/vector-icons";
import { addDoc, collection, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/FirebaseConfig";

const PaymentConfirm = () => {
  const router = useRouter();
  const { uid, accountNumber, amount, accNum, provider } = useLocalSearchParams(); // `accountNumber` is sender's, `accNum` is receiver's

  interface UserData {
    uid?: string;
    deposit?: number;
  }
  console.log("UID:", uid);
  const convenienceFee = parseFloat(amount as string) * 0.01;
  const totalAmount = parseFloat(amount as string) + convenienceFee;

  const handlePay = async () => {
    if (typeof uid === "string" && typeof accountNumber === "string" && typeof accNum === "string") { // Ensure all are strings
      const senderDocRef = doc(db, "users", uid, "userInfo", accountNumber); // Sender's document
      const senderBankInfoRef = doc(db, "userBankInfo", accountNumber); // Sender's bank info
      const receiverBankInfoRef = doc(db, "userBankInfo", accNum); // Receiver's bank info

      const historyCollectionRef = collection(db, "users", uid, "userInfo", "history", "paybills");
      const randomRef = `REF-${Math.floor(1000000000 + Math.random() * 9000000000)}`;

      try {
        // Fetch the sender's current deposit
        const senderDocSnap = await getDoc(senderDocRef);
        if (!senderDocSnap.exists()) {
          Alert.alert("Error", "Sender account not found.");
          return;
        }

        const senderData = senderDocSnap.data() as UserData;
        const currentSenderDeposit = parseFloat(String(senderData.deposit || "0"));

        // Check if the sender's deposit is sufficient
        if (currentSenderDeposit < totalAmount) {
          Alert.alert("Error", "Insufficient funds in your deposit.");
          return;
        }

        // Fetch receiver's current deposit from userBankInfo
        const receiverBankInfoSnap = await getDoc(receiverBankInfoRef);
        let currentReceiverDeposit = 0;
        if (receiverBankInfoSnap.exists()) {
          const receiverData = receiverBankInfoSnap.data() as UserData;
          currentReceiverDeposit = parseFloat(String(receiverData.deposit || "0"));
        } else {
          // If receiver's bank info doesn't exist, it means they might not be a user in userBankInfo
          // For simplicity, we'll proceed but ideally, you'd handle this case more robustly
          // (e.g., prevent payment or create a new entry)
          console.warn("Receiver bank info not found in userBankInfo. Proceeding without updating receiver's balance.");
        }

        // Calculate new deposits
        const newSenderDeposit = currentSenderDeposit - totalAmount;
        const newReceiverDeposit = currentReceiverDeposit + parseFloat(amount as string); // Only the bill amount goes to the receiver

        // Update sender's deposit in Firestore (both userInfo and userBankInfo)
        await updateDoc(senderDocRef, { deposit: newSenderDeposit.toFixed(2) });
        await updateDoc(senderBankInfoRef, { deposit: newSenderDeposit.toFixed(2) });
        console.log("Sender deposit updated successfully.");

        // Update receiver's deposit in userBankInfo if their document exists
        if (receiverBankInfoSnap.exists()) {
          await updateDoc(receiverBankInfoRef, { deposit: newReceiverDeposit.toFixed(2) });
          console.log("Receiver deposit updated successfully.");
        }

        // Add the transaction to the history collection with the generated transaction ID
        await addDoc(historyCollectionRef, {
          type: "Pay Bills",
          randomRef: randomRef,
          detail: "Payment for " + provider,
          provider: provider,
          accountNumber: accNum, // Receiver's account number for history
          billAmount: parseFloat(amount as string).toFixed(2),
          convenienceFee: convenienceFee.toFixed(2),
          totalAmount: totalAmount.toFixed(2),
          date: new Date().toISOString().split("T")[0],
          time: new Date().toISOString().split("T")[1],
        });

        // Navigate to the PaymentSuccessful screen
        router.push({
          pathname: "../PaymentSuccessful",
          params: { uid: uid, totalAmount: totalAmount.toFixed(2), randomRef: randomRef, accountNumber: accountNumber },
        });
      } catch (error) {
        console.error("Error processing payment:", error);
        Alert.alert("Error", "Failed to process payment. Please try again.");
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <AntDesign name="arrowleft" size={24} color="#CDFF57" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Payment</Text>
      </View>

      {/* Payment Details */}
      <View style={styles.detailsContainer}>
        <Text style={styles.sectionTitle}>Payment Details</Text>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Provider</Text>
          <Text style={styles.detailValue}>{provider}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Account Number</Text>
          <Text style={styles.detailValue}>{accNum}</Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Bill Amount</Text>
          <Text style={styles.detailValue}>₱{parseFloat(amount as string).toFixed(2)}</Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Convenience Fee</Text>
          <Text style={styles.detailValue}>₱{convenienceFee.toFixed(2)}</Text>
        </View>
      </View>

      {/* Total Amount */}
      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>Total Amount</Text>
        <Text style={styles.totalAmountValue}>₱{totalAmount.toFixed(2)}</Text>
      </View>

      {/* Pay Button */}
      <TouchableOpacity style={styles.payButton} onPress={handlePay}>
        <Text style={styles.payButtonText}>Confirm and Pay</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A1A", // Darker background
    padding: 20,
    paddingTop: 50, // More top padding
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 0,
    padding: 5,
  },
  headerTitle: {
    color: "#CDFF57", // Accent color for title
    fontSize: 22,
    fontWeight: "bold",
  },
  detailsContainer: {
    backgroundColor: "#2A2A2A", // Darker container background
    borderRadius: 15, // More rounded corners
    padding: 25,
    marginBottom: 20,
    shadowColor: "#000", // Add shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  sectionTitle: {
    color: "#CDFF57", // Accent color for section title
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12, // More space between items
    paddingVertical: 5,
  },
  detailLabel: {
    color: "#D0D0D0",
    fontSize: 15,
  },
  detailValue: {
    color: "#FFFFFF", // White for values
    fontSize: 13,
    fontWeight: "bold",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#3A3A3A", // Different background for total
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    borderWidth: 2, // Add a subtle border
    borderColor: "#CDFF57", // Accent border color
  },
  totalLabel: {
    color: "#CDFF57",
    fontSize: 20,
    fontWeight: "bold",
  },
  totalAmountValue: {
    color: "#CDFF57", 
    fontSize: 24,
    fontWeight: "bold",
  },
  payButton: {
    backgroundColor: "#CDFF57", 
    borderRadius: 12, 
    padding: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  payButtonText: {
    color: "#1A1A1A", 
    fontWeight: "bold",
    fontSize: 18,
  },
});

export default PaymentConfirm;