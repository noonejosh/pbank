import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Link } from 'expo-router';
import { signOut, deleteUser } from "firebase/auth";
import { auth, db } from "../../FirebaseConfig";
import { doc, getDoc } from 'firebase/firestore';

export default function ProfileScreen() {
  const { uid } = useLocalSearchParams(); // Get the UID from the URL parameters
  const router = useRouter();
  console.log("UID from params:", uid); // Log the UID for debugging

  interface UserData {
    uid?: string;
    name?: string;
    accountNumber?: string;
    deposit?: string;
    email?: string;
    mobile?: string;
    dateOfBirth?: Date;
    createdAt?: Date;
  }

  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (typeof uid === "string") {
        const docRef = doc(db, "users", uid, "userInfo", "profile");
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data() as UserData);
          } else {
            console.log("No such document!");
          }
        } catch (error) {
          console.error("Error fetching document: ", error);
        }
      } else {
        console.error("Invalid uid:", uid);
      }
    };

    fetchUserData();
  }, [uid]);

  const formatDeposit = (deposit: string) => {
    const number = parseFloat(deposit); // Convert the deposit to a number
    if (isNaN(number)) return "0.00"; // Handle invalid numbers
    return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(number);
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      Alert.alert("Error", "Failed to log out. Please try again.");
    }
  };

  // Handle Delete Account
  const handleDeleteAccount = async () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const user = auth.currentUser;
              if (user) {
                await deleteUser(user);
                Alert.alert("Account Deleted", "Your account has been deleted.");
                router.replace("/signup");
              } else {
                Alert.alert("Error", "No user is currently logged in.");
              }
            } catch (error) {
              console.error("Error deleting account:", error);
              Alert.alert("Error", "Failed to delete account. Please try again.");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Profile</Text>

      {/* Profile Header */}
      <View style={styles.card}>
        <Ionicons name="person-circle" size={60} color="black" style={styles.icon} />
        <Text style={styles.subtitle}>It's a good day for banking.</Text>
        <Text style={styles.name}>{userData?.name || "User Name"}</Text>
      </View>

      {/* Account Information */}
      <View style={styles.card}>
        <Text style={styles.label}>ACCOUNT NUMBER</Text>
        <View style={styles.row}>
          <Text style={styles.value}>
            {userData?.accountNumber || "XXXX XXXX XXXX XXXX"}
          </Text>
          <TouchableOpacity>
            <Feather name="copy" size={16} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Contact Information */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.label}>Contact Number:</Text>
          <Text style={styles.value}>{userData?.mobile || "N/A"}</Text>
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.label}>E-mail Address:</Text>
          <Text style={styles.value}>{userData?.email || "N/A"}</Text>
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.label}>Deposit:</Text>
          <Text style={styles.value}>
            PHP {userData?.deposit ? formatDeposit(userData.deposit) : "0.00"}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.buttonText}>LOG OUT</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
          <Text style={styles.buttonText}>DELETE ACCOUNT</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity
          style={{ alignItems: "center" }}
          onPress={() =>
            router.push({
              pathname: "/(tabs)/homepage",
              params: {
                uid: uid, // Pass the user ID to the profile screen
              },
            })
          }
        >
        <Ionicons name="home" size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity
          style={{ alignItems: "center" }}
          onPress={() =>
            router.push({
              pathname: "/(tabs)/transferfund",
              params: {
                uid: uid, // Pass the user ID to the profile screen
              },
            })
          }
        >
        <Ionicons name="swap-horizontal" size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity
          style={{ alignItems: "center" }}
          onPress={() =>
            router.push({
              pathname: "/(tabs)/history",
              params: {
                uid: uid, // Pass the user ID to the profile screen
              },
            })
          }
        >
        <Ionicons name="document-text" size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity
          style={{ alignItems: "center" }}
          onPress={() =>
            router.push({
              pathname: "/(tabs)/profile",
              params: {
              uid: uid, // Pass the user ID to the profile screen
              },
            })
          }
        >
        <Ionicons name="person" size={24} color="black" />
        </TouchableOpacity>
      </View>
    </View>   
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'white',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#C6FF33',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  icon: {
    alignSelf: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: 'black',
    textAlign: 'center',
    marginBottom: 5,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
  },
  label: {
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 5,
  },
  value: {
    color: 'black',
    fontSize: 14,
    marginRight: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  logoutButton: {
    backgroundColor: '#C6FF33',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#C6FF33',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#C6FF33',
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
});