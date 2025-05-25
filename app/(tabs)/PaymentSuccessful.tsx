import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { AntDesign } from "@expo/vector-icons";

const PaymentSuccessful = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { totalAmount, randomRef, accountNumber, uid } = params;


  // State for Date & Time
  const [dateTime, setDateTime] = useState("");

  useEffect(() => {
    // Generate Current Date & Time
    const now = new Date();
    const formattedDate = now.toLocaleString("en-US", {
      month: "long",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    setDateTime(formattedDate);

  }, []);

  return (
    <View style={styles.container}>
      {/* Check Mark Icon */}
      <AntDesign name="checkcircle" size={100} color="#CDFF57" style={styles.checkMark} />

      <Text style={styles.successMessage}>Payment Successful!</Text>

      {/* Transaction Details */}
      <View style={styles.transactionDetailsContainer}>
        <Text style={styles.detailsLabel}>Transaction Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabelText}>Date & Time:</Text>
          <Text style={styles.detailValueText}>{dateTime}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabelText}>Reference ID:</Text>
          <Text style={styles.detailValueText}>{randomRef}</Text>
        </View>
      </View>

      {/* Bill Amount */}
      <View style={styles.billAmountContainer}>
        <Text style={styles.billAmountLabel}>Total Amount Paid</Text>
        <Text style={styles.billAmountValue}>₱{totalAmount}</Text>
      </View>

      {/* Funds From */}
      <View style={styles.fundsFrom}>
        <Text style={styles.fundsFromLabel}>Funds From:</Text>
        <Text style={styles.fundsFromText}>DEBIT ACCOUNT</Text>
        <Text style={styles.fundsFromText}>Account Number: {accountNumber} </Text>
      </View>

      {/* New Payment Button */}
      <TouchableOpacity style={styles.newPaymentButton} onPress={() => router.push({ pathname: '/paybills', params: { uid: uid, accountNumber: accountNumber }})}>
        <Text style={styles.newPaymentButtonText}>Make Another Payment</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A1A", // Dark background
    padding: 20,
    alignItems: "center",
    justifyContent: "center", // Center content vertically
  },
  successMessage: {
    color: "#CDFF57", // Accent color for success message
    fontSize: 26, // Larger font size
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  checkMark: {
    marginVertical: 20,
  },
  transactionDetailsContainer: {
    backgroundColor: "#2A2A2A", // Darker container background
    borderRadius: 15,
    padding: 20,
    width: "100%",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  detailsLabel: {
    color: "#CDFF57",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailLabelText: {
    color: "#D0D0D0",
    fontSize: 15,
  },
  detailValueText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  billAmountContainer: {
    backgroundColor: "#3A3A3A",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    width: "100%",
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    borderWidth: 2,
    borderColor: "#CDFF57",
  },
  billAmountLabel: {
    color: "#CDFF57",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  billAmountValue: {
    color: "#CDFF57",
    fontSize: 32, // Larger amount
    fontWeight: "bold",
  },
  fundsFrom: {
    alignItems: "center",
    marginBottom: 40, // More space before button
  },
  fundsFromLabel: {
    color: "#D0D0D0",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  fundsFromText: {
    color: "#A0A0A0",
    fontSize: 14,
  },
  newPaymentButton: {
    backgroundColor: "#CDFF57",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  newPaymentButtonText: {
    color: "#1A1A1A",
    fontWeight: "bold",
    fontSize: 18,
  },
});

export default PaymentSuccessful;