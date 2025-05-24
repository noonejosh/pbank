import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { AntDesign } from "@expo/vector-icons";
import { addDoc, collection, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/FirebaseConfig";

const PaymentConfirm = () => {
  const router = useRouter();
  const { uid, accountNumber, amount, accNum, provider} = useLocalSearchParams();

  interface UserData {
    uid?: string;
    deposit?: number;
  }
  console.log("UID:", uid);
  const convenienceFee = parseFloat(amount as string) * 0.01;
  const totalAmount = parseFloat(amount as string) + convenienceFee;

  const handlePay = async () => {
    if (typeof uid === "string" && typeof accountNumber === "string") {
      const docRef = doc(db, "users", uid, "userInfo", accountNumber);
      const accountRef = doc(db, "userBankInfo", accountNumber);
      
      const historyCollectionRef = collection(db, "users", uid, "userInfo", "history", "paybills"); 
      const randomRef = `REF-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      try {
        // Fetch the current deposit
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userData = docSnap.data() as UserData;
          const currentDeposit = parseFloat(String(userData.deposit || "0"));
          // Check if the deposit is sufficient
          if (currentDeposit < totalAmount) {
            Alert.alert("Error", "Insufficient funds in your deposit.");
            return;
          }

          // Calculate the new deposit
          const newDeposit = currentDeposit - totalAmount;

          // Update the deposit in Firestore
          await updateDoc(docRef, { deposit: newDeposit.toFixed(2) });
          console.log("Deposit updated successfully.");
 
          await updateDoc(accountRef, { deposit: newDeposit.toFixed(2) });

          // Add the transaction to the history collection with the generated transaction ID
          await addDoc(historyCollectionRef, {
            type: "Pay Bills",
            randomRef: randomRef,
            detail: "Payment for " + provider,
            provider: provider,
            accountNumber: accountNumber,
            billAmount: parseFloat(amount as string).toFixed(2),
            convenienceFee: convenienceFee.toFixed(2),
            totalAmount: totalAmount.toFixed(2),
            date: new Date().toISOString().split("T")[0],
            time: new Date().toISOString().split("T")[1],
          });

          // Navigate to the PaymentSuccessful screen
          router.push({
            pathname: "../PaymentSuccessful",
            params: { uid: uid, totalAmount: totalAmount.toFixed(2), accountNumber: accountNumber, randomRef: randomRef },  
          });
        } else {
          Alert.alert("Error", "No such document found.");
        }
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
          <AntDesign name="arrowleft" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Payment</Text>
      </View>

      {/* Payment Details */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Account Number</Text>
          <Text style={styles.inputValue}>{accNum}</Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Bill Amount</Text>
          <Text style={styles.inputValue}>₱{parseFloat(amount as string).toFixed(2)}</Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Convenience Fee</Text>
          <Text style={styles.inputValue}>₱{convenienceFee.toFixed(2)}</Text>
        </View>
      </View>

      {/* Total Amount */}
      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>Total:</Text>
        <Text style={styles.totalAmount}>₱{totalAmount.toFixed(2)}</Text>
      </View>

      {/* Pay Button */}
      <TouchableOpacity style={styles.payButton} onPress={handlePay}>
        <Text style={styles.payButtonText}>Pay</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    justifyContent: "center",
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 0,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  detailsContainer: {
    backgroundColor: "#333",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  detailLabel: {
    color: "#fff",
    fontSize: 16,
  },
  inputValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  totalLabel: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  totalAmount: {
    color: "#A8E063",
    fontSize: 18,
    fontWeight: "bold",
  },
  payButton: {
    backgroundColor: "#A8E063",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
  },
  payButtonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 18,
  },
});

export default PaymentConfirm;
