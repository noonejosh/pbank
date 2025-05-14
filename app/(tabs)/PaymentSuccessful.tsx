import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { AntDesign } from "@expo/vector-icons";

const PaymentSuccessful = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { totalAmount, randomRef, accountNumber } = params;


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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <AntDesign name="arrowleft" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Successful!</Text>
      </View>

      {/* Check Mark Icon */}
      <AntDesign name="checkcircle" size={80} color="#4CAF50" style={styles.checkMark} />

      {/* Transaction Details */}
      <View style={styles.transactionDetails}>
        <Text style={styles.detailsLabel}>Transaction Details</Text>
        <Text style={styles.detailsText}>{dateTime}</Text>
        <Text style={styles.detailsText}>Ref: {randomRef}</Text>
      </View>

      {/* Bill Amount */}
      <View style={styles.billAmountContainer}>
        <Text style={styles.billAmountLabel}>Bill Amount</Text>
        <Text style={styles.billAmountValue}>{totalAmount}</Text>
      </View>

      {/* Funds From */}
      <View style={styles.fundsFrom}>
        <Text style={styles.fundsFromLabel}>Funds From:</Text>
        <Text style={styles.fundsFromText}>DEBIT ACCOUNT</Text>
        <Text style={styles.fundsFromText}>Account Number: {accountNumber} </Text>
      </View>

      {/* New Payment Button */}
      <TouchableOpacity style={styles.newPaymentButton} onPress={() => router.push("/BillsPayment")}>
        <Text style={styles.newPaymentButtonText}>Make Another Payment</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    padding: 20,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  backButton: {
    position: "absolute",
    left: 0,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  checkMark: {
    marginVertical: 20,
  },
  transactionDetails: {
    backgroundColor: "#1E1E1E",
    borderRadius: 10,
    padding: 15,
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  detailsLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  detailsText: {
    color: "#ccc",
    fontSize: 14,
  },
  billAmountContainer: {
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  billAmountLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  billAmountValue: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  fundsFrom: {
    alignItems: "center",
    marginBottom: 30,
  },
  fundsFromLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  fundsFromText: {
    color: "#ccc",
    fontSize: 14,
  },
  newPaymentButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    width: "100%",
  },
  newPaymentButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
});

export default PaymentSuccessful;
