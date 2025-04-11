import { useState } from "react";
import { View, Text, TextInput, StyleSheet, Pressable, Alert, TouchableOpacity } from "react-native";
import { Picker } from "@react-native-picker/picker";
import Ionicons from "react-native-vector-icons/Ionicons";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../../FirebaseConfig"; // Ensure auth and db are exported from FirebaseConfig
import { useRouter } from "expo-router";

export default function SignUp() {
  const [name, setName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [deposit] = useState(0); // Initialize deposit state
  const [isActive, setIsActive] = useState(true); // State for active status
  const [otp] = useState(0); // Initialize OTP state
  const [isPasswordVisible, setIsPasswordVisible] = useState(false); // State for password visibility
  const [isPasswordValid, setIsPasswordValid] = useState(false); // State for password validation

  const router = useRouter(); // Initialize the router

  const handleSignUp = async () => {
    if (!name || !accountNumber || !email || !mobile || !password || !selectedMonth || !selectedDay || !selectedYear) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    try {
      //Validate information
      const docRef = doc(db, "userBankInfo", "users", "accountNumbers", accountNumber);
      const docSnap = await getDoc(docRef);
      const dob = `${selectedMonth} ${selectedDay}, ${selectedYear}`;
      if (docSnap.exists()) { 
        if(docSnap.data().name == name && docSnap.data().email === email && docSnap.data().mobile === mobile && docSnap.data().dob === dob) {
          // Register user in Firebase Authentication
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;

          // Store user details in Firestore
          await setDoc(doc(collection(db, "users", user.uid, "userInfo"), "profile"), {
            name,
            accountNumber,
            email,
            mobile,
            dateOfBirth: `${selectedMonth} ${selectedDay}, ${selectedYear}`,
            deposit: docSnap.data().deposit,
            isActive,
            otp,
            createdAt: new Date().toISOString()
          });

          Alert.alert("Success", "Account created successfully!", [
            { text: "OK", onPress: () => router.push("./login") } // Navigate to 'index' screen
          ]);
          return;
        }
        else if(docSnap.data().name !== name) {
          Alert.alert("Error", "Account name or details do not match.");
        }
        else if(docSnap.data().dob !== dob) {
          Alert.alert("Error", "Account dob or details do not match.");
        }
        else if(docSnap.data().email !== email) {
          Alert.alert("Error", "Account email or details do not match.");
        }
        else if(docSnap.data().mobile !== mobile) {
          Alert.alert("Error", "Account mobile or details do not match.");
        }
        else {
          Alert.alert("Error", "Account details do not match.");
        }
      }
    } catch (error) {
      Alert.alert("Signup Failed", error instanceof Error ? error.message : "An unknown error occurred.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back-circle" size={30} color="#CDFF57" />
      </Pressable>

      {/* Title */}
      <Text style={styles.title}>Sign Up</Text>
      <Text style={styles.subtitle}>Hi there!</Text>
      <Text style={styles.heading}>Let’s Get Started</Text>

      <View style={styles.inputContainer}>
        <Ionicons name="card-outline" size={20} color="gray" style={styles.icon} />
        <TextInput 
          style={styles.input} 
          placeholder="Full Name" 
          placeholderTextColor="gray"
          value={name}
          onChangeText={setName}
        />
      </View>
      {/* Account Number Input */}
      <View style={styles.inputContainer}>
        <Ionicons name="card-outline" size={20} color="gray" style={styles.icon} />
        <TextInput 
          style={styles.input} 
          placeholder="Account Number or Debit Card Number" 
          placeholderTextColor="gray"
          value={accountNumber}
          onChangeText={setAccountNumber}
          keyboardType="numeric"
        />
      </View>

      {/* Email Input */}
      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={20} color="gray" style={styles.icon} />
        <TextInput 
          style={styles.input} 
          placeholder="Email linked to Account" 
          placeholderTextColor="gray"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
      </View>

      {/* Mobile Input */}
      <View style={styles.inputContainer}>
        <Ionicons name="call-outline" size={20} color="gray" style={styles.icon} />
        <TextInput 
          style={styles.input} 
          placeholder="Mobile number linked to Account" 
          placeholderTextColor="gray"
          value={mobile}
          onChangeText={setMobile}
          keyboardType="phone-pad"
        />
      </View>

      {/* Date of Birth */}
      <Text style={styles.dobLabel}>Date of Birth:</Text>
      <View style={styles.dobContainer}>
        <Picker selectedValue={selectedMonth} style={styles.picker} onValueChange={setSelectedMonth}>
          <Picker.Item label="Month" value="" />
          <Picker.Item label="January" value="January" />
          <Picker.Item label="February" value="Febuary" />
          <Picker.Item label="March" value="March" />
        </Picker>
        <Picker selectedValue={selectedDay} style={styles.picker} onValueChange={setSelectedDay}>
          <Picker.Item label="Day" value="" />
          <Picker.Item label="1" value="1" />
          <Picker.Item label="2" value="2" />
          <Picker.Item label="3" value="3" />
        </Picker>
        <Picker selectedValue={selectedYear} style={styles.picker} onValueChange={setSelectedYear}>
          <Picker.Item label="Year" value="" />
          <Picker.Item label="2000" value="2000" />
          <Picker.Item label="2001" value="2001" />
          <Picker.Item label="2002" value="2002" />
        </Picker>
      </View>

      {/* Password Input */}
      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed-outline" size={20} color="gray" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="gray"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setIsPasswordValid(text.length >= 6); // Validate password length
          }}
          secureTextEntry={!isPasswordVisible} // Toggle visibility
        />
        <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
          <Ionicons
            name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
            size={20}
            color="gray"
          />
        </TouchableOpacity>
      </View>
      {!isPasswordValid && password.length > 0 && (
        <Text style={styles.validationText}>Password must be at least 6 characters long.</Text>
      )}

      {/* Create Account Button */}
      <Pressable style={styles.createAccountButton} onPress={handleSignUp}>
        <Text style={styles.createAccountText}>Create an Account</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black", padding: 20 },
  backButton: { position: "absolute", top: 40, left: 20 },
  title: { color: "white", fontSize: 30, fontWeight: "bold", textAlign: "center", marginTop: 60 },
  subtitle: { color: "white", fontSize: 18, textAlign: "center", marginTop: 10 },
  heading: { color: "white", fontSize: 22, fontWeight: "bold", textAlign: "center", marginVertical: 20 },
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "white", borderRadius: 8, paddingHorizontal: 10, marginBottom: 15, width: "100%" },
  icon: { marginRight: 10 },
  input: { flex: 1, height: 50, color: "black" },
  dobLabel: { color: "white", fontSize: 16, marginBottom: 5 },
  dobContainer: { flexDirection: "row", justifyContent: "space-between", width: "100%", marginBottom: 15 },
  picker: { width: "32%", backgroundColor: "white", borderRadius: 8 },
  createAccountButton: { backgroundColor: "#CDFF57", borderRadius: 8, height: 50, justifyContent: "center", alignItems: "center", marginTop: 10 },
  createAccountText: { color: "black", fontWeight: "bold", fontSize: 16 },
  validationText: {
    color: "red",
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
  },
});
