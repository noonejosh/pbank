import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useState, useRef } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from "react-native";

export default function OTP() {
  const router = useRouter();
  const { email, name, accountNumber, mobile, dateOfBirth, deposit, isActive } = useLocalSearchParams(); // Get user details from params
  const [otpArray, setOtpArray] = useState<string[]>(Array(6).fill("")); // State for OTP input
  const [generatedOtp, setGeneratedOtp] = useState<string>(""); // State to store the generated OTP
  const inputsRef = useRef<TextInput[]>([]); // Refs for input fields

  // Generate and send OTP to the user's mobile numbers
  const sendOtpToMobile = async () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
    setGeneratedOtp(otp); // Store the OTP locally

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter OTP</Text>
      <Text style={styles.subtitle}>We have sent a 6-digit code to your mobile: {mobile}</Text>

      {/* OTP Input Fields */}
      <View style={styles.otpContainer}>
        {otpArray.map((_, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputsRef.current[index] = ref!)} // Assign refs to inputs
            style={styles.otpInput}
            maxLength={1}
            keyboardType="numeric"
            value={otpArray[index]}
          />
        ))}
      </View>

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitButton}>
        <Text style={styles.submitButtonText}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "gray",
    marginBottom: 20,
    textAlign: "center",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  otpInput: {
    width: 50,
    height: 50,
    backgroundColor: "white",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 18,
    color: "black",
    marginHorizontal: 5,
  },
  submitButton: {
    backgroundColor: "#CDFF57",
    borderRadius: 8,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  submitButtonText: {
    color: "black",
    fontWeight: "bold",
    fontSize: 16,
  },
});
}