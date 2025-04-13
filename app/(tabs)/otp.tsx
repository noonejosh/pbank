import { auth } from "@/FirebaseConfig";
import { useRouter, useLocalSearchParams } from "expo-router";
import { signInWithPhoneNumber } from "firebase/auth";
import React, { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from "react-native";

export default function OTP() {
  const router = useRouter();
  const { mobile } = useLocalSearchParams(); // Get the mobile number from the previous screen
  const [otpArray, setOtpArray] = useState(["", "", "", "", "", ""]); // State for OTP input
  const inputsRef = useRef<TextInput[]>([]); // Refs for OTP input fields
  const [confirmationResult, setConfirmationResult] = useState<any>(null); // To store the confirmation result

  useEffect(() => {
    sendOtp(); // Automatically call sendOtp when the component loads
  }, []);

  const sendOtp = async () => {
    if (!mobile) {
      Alert.alert("Error", "Mobile number is missing.");
      return;
    }

    try {
      if (typeof mobile === "string") {
        const confirmationResult = await signInWithPhoneNumber(auth, mobile); // Automatically handles reCAPTCHA
        setConfirmationResult(confirmationResult); // Save the confirmation result for later verification
        Alert.alert("Success", "OTP sent to your mobile number.");
      } else {
        Alert.alert("Error", "Invalid mobile number format.");
      }
      setConfirmationResult(confirmationResult); // Save the confirmation result for later verification
      Alert.alert("Success", "OTP sent to your mobile number.");
    } catch (error) {
      console.error("Error sending OTP:", error);
      Alert.alert("Error", "Failed to send OTP. Please try again.");
    }
  };

  const verifyOtp = async () => {
    const otp = otpArray.join(""); // Combine the OTP digits into a single string

    if (!otp) {
      Alert.alert("Error", "Please enter the OTP.");
      return;
    }

    try {
      const result = await confirmationResult.confirm(otp); // Verify the OTP
      const user = result.user;
      Alert.alert("Success", "Mobile number verified!");
      router.push({
        pathname: "./homepage",
        params: {
          uid: user.uid, // Pass the user ID to the homepage
        },
      });
    } catch (error) {
      console.error("Error verifying OTP:", error);
      Alert.alert("Error", "Invalid OTP. Please try again.");
    }
  };

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
            onChangeText={(text) => {
              const newOtpArray = [...otpArray];
              newOtpArray[index] = text;
              setOtpArray(newOtpArray);

              // Move to the next input field
              if (text && index < inputsRef.current.length - 1) {
                inputsRef.current[index + 1].focus();
              }
            }}
          />
        ))}
      </View>

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitButton} onPress={verifyOtp}>
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