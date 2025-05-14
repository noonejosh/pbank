import { useState } from "react";
import {  
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  KeyboardAvoidingView, 
  TouchableWithoutFeedback, 
  Keyboard, 
  Platform, 
  Pressable,
  Image,
  Alert
} from "react-native";
import { useRouter, Link } from "expo-router"; 
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, getDocs, doc, getDoc } from "firebase/firestore"; // Import Firestore functions
import { auth, db } from "../../FirebaseConfig"; // Import Firestore and Auth instances

export default function Login() {
  const router = useRouter(); // Initialize router for navigation
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter your email and password.");
      return;
    }

    try {
      // Authenticate the user
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      router.push({
        pathname: "./homepage",
        params: { uid: user.uid }, // Pass the user ID
      });

      /*// Fetch the first document under the userInfo subcollection
      const userInfoCollectionRef = collection(db, "users", user.uid, "userInfo");
      const querySnapshot = await getDocs(userInfoCollectionRef);

      if (!querySnapshot.empty) {
        const firstDoc = querySnapshot.docs[0]; // Get the first document
        const firstDocId = firstDoc.id; // Get the document ID

        // Fetch the user's mobile number using the first document ID
        const userDocRef = doc(db, "users", user.uid, "userInfo", firstDocId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const mobile = userData.mobile; // Get the mobile number from the document

          // Navigate to the OTP screen with the mobile number
          router.push({
            pathname: "./homepage",
            params: { mobile },
          });
        } else {
          Alert.alert("Error", "User data not found in the database.");
        }
      } else {
        Alert.alert("Error", "No documents found in the userInfo subcollection.");
      }*/
    } catch (error) {
      Alert.alert("Login Failed", error instanceof Error ? error.message : "An unknown error occurred.");
    }
  };
    return (
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "padding"} 
        style={styles.container}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.inner}>
            <Text style={styles.subtitle}>Welcome Back!</Text>

            <Image 
            source={require("../../assets/images/D2.png")}
            style={{ position: "absolute", right: -250, top: -350, width: 700, height: 375}} 
            />
             <Image 
            source={require("../../assets/images/logo.png")}
            style={{ position: "absolute", left: 80, top: -120, width: 200, height: 80, borderRadius: 50 }} 
            />
            <Image 
            source={require("../../assets/images/D3.png")}
            style={{ position: "absolute", right: -40, top: 300, width: 120, height: 120}} 
            />
            <Image 
            source={require("../../assets/images/D3.png")}
            style={{ position: "absolute", right: -20, top: 280, width: 120, height: 120}} 
            />
            <Image 
            source={require("../../assets/images/D3.png")}
            style={{ position: "absolute", right: -50, top: 340, width: 140, height: 140}} 
            />

        

        
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="gray"
              keyboardType="email-address"
              value={email} // Bind to email state
              onChangeText={setEmail} // Update email state
            />
  
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="gray"
              secureTextEntry
              value={password} // Bind to password state
              onChangeText={setPassword} // Update password state
            />

            
            <Link href="/fp" style={styles.forgotPassword}>Forgot Password?</Link>
            <Link href="/signup" style={styles.signup}>Create Account</Link>
  
            <Pressable style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Log In</Text>
            </Pressable>
  
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    );
  }
  
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
  },
  inner: {
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 20,
  },
  title: {
    color: "white",
    fontWeight: "bold",
    fontSize: 40,
    fontStyle: "italic",
    marginBottom: 20,
  },
  subtitle: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
    marginBottom: 20,
  },
  input: {
    width: "80%",
    height: 50,
    backgroundColor: "white",
    color: "black",
    paddingHorizontal: 15,
    marginBottom: 15,
    borderRadius: 8,
  },
  forgotPassword: {
    color: "#CDFF57", 
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 15,
    position: "absolute",
    right: 50,
    top: 240,
  },
  signup: {
    color: "#CDFF57", 
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 15,
    position: "absolute",
    left: 50,
    top: 240,
  },
  button: {
    width: "80%",
    height: 50,
    backgroundColor: "#CDFF57",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: "black",
    fontWeight: "bold",
    fontSize: 16,
  },
});