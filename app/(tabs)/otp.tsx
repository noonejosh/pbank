import { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { signInWithPhoneNumber, PhoneAuthProvider } from "firebase/auth";
import { auth } from "@/FirebaseConfig"; // Ensure Firebase is correctly initialized
import { Ionicons } from "@expo/vector-icons";

export default function OTP() {
  const router = useRouter();
  const { mobile, uid } = useLocalSearchParams(); // Retrieve mobile number and user ID
  const [otpArray, setOtpArray] = useState(["", "", "", "", "", ""]); // OTP input state
  const inputsRef = useRef<TextInput[]>([]); // OTP input field refs
  const [confirmationResult, setConfirmationResult] = useState<any>(null); // Stores OTP confirmation result
  const [loading, setLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState(""); // Store generated OTP

  useEffect(() => {
    sendOtp();
  }, []);

  // Function to generate and "send" OTP
  const sendOtp = async () => {
    if (!mobile || typeof mobile !== "string" || !mobile.startsWith("+")) {
      Alert.alert("Error", "Invalid mobile number. Please use E.164 format (e.g., +639XXXXXXXXX).");
      return;
    }

    setLoading(true);
    try {
      // Generate random 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(otp);

      // Simulate sending OTP (show in alert for demo)
      Alert.alert("OTP Sent", `Your OTP is: ${otp}`);
    } catch (error: any) {
      console.error("Error sending OTP:", error?.message || error);
      Alert.alert("Error", "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Combine OTP array into a single string
  const otpCode = otpArray.join("");

  // Verify OTP
  const verifyOtp = async () => {
    if (otpCode.length !== 6) {
      setOtpError("Please enter a 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      if (otpCode === generatedOtp) {
        Alert.alert("Success", "Phone number verified!");
        router.push({ pathname: "./homepage", params: { uid: uid } });
      } else {
        setOtpError("Invalid OTP code. Please try again or resend.");
      }
    } catch (error: any) {
      console.error("Invalid code:", error);
      setOtpError("Invalid OTP code. Please try again or resend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="arrow-back" size={24} color="#C6FF00" />
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>Enter OTP</Text>
      <Text style={styles.subtitle}>We have sent a 6-digit code to: {mobile}</Text>
      {/* OTP Input Fields */}
      <View style={styles.otpContainer}>
        {otpArray.map((_, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputsRef.current[index] = ref!)}
            style={[styles.otpInput, otpError && { borderColor: "red" }]}
            maxLength={1}
            keyboardType="numeric"
            value={otpArray[index]}
            onChangeText={(text) => {
              const newOtpArray = [...otpArray];
              newOtpArray[index] = text;
              setOtpArray(newOtpArray);
              setOtpError("");

              if (text && index < inputsRef.current.length - 1) {
                inputsRef.current[index + 1].focus();
              }
              if (!text && index > 0) {
                inputsRef.current[index - 1].focus();
              }
            }}
          />
        ))}
      </View>

      {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}

      {/* Submit and Resend Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, loading && { opacity: 0.5 }]} onPress={verifyOtp} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? "Processing..." : "Submit"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resendButton} onPress={sendOtp}>
          <Text style={styles.resendButtonText}>Resend OTP</Text>
        </TouchableOpacity>
      </View>
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
  header: {
    position: "absolute",
    top: 20,
    left: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 10,
    width: "100%",
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
    justifyContent: "center",
    alignItems: "center", // Ensures vertical centering
    width: "100%", // Expands container for proper centering
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
    borderWidth: 2,
    borderColor: "white",
  },
  errorText: {
    color: "red",
    fontSize: 14,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  button: {
    backgroundColor: "#CDFF57",
    borderRadius: 8,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    width: "48%",
  },
  buttonText: {
    color: "black",
    fontWeight: "bold",
    fontSize: 16,
  },
  resendButton: {
    backgroundColor: "gray",
    borderRadius: 8,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    width: "48%",
  },
  resendButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
