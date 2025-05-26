import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { signOut, deleteUser } from "firebase/auth";
import { auth, db } from "../../FirebaseConfig";
import { doc, getDoc } from 'firebase/firestore';

export default function ProfileScreen() {
  const { uid, accountNumber } = useLocalSearchParams();
  const router = useRouter();
  const [isAccountVisible, setIsAccountVisible] = useState(false);
  console.log(uid)
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

  useEffect(() => {
    const fetchUserData = async () => {
      if (typeof uid === "string" && typeof accountNumber === "string") {
        const docRef = doc(db, "users", uid, "userInfo", accountNumber);
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
      }
    };

    fetchUserData();
  }, [uid]);

  const [userData, setUserData] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  
  const formatDeposit = (deposit: string) => {
    const number = parseFloat(deposit);
    if (isNaN(number)) return "0.00";
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(number);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      Alert.alert("Error", "Failed to log out. Please try again.");
    }
  };

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

      <View style={styles.profileHeader}>
        <Ionicons name="person-circle-outline" size={80} color="#C6FF33" />
        <Text style={styles.greeting}>Welcome back</Text>
        <Text style={styles.username}>{userData?.name || "User Name"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Account Number</Text>
        <View style={styles.row}>
          <Text style={styles.accountNumber}>
            {isAccountVisible ? accountNumber || "XXXX XXXX XXXX XXXX" : "**** **** **** ****"}
          </Text>
          <TouchableOpacity onPress={() => setIsAccountVisible(!isAccountVisible)}>
            <Feather name={isAccountVisible ? "eye-off" : "eye"} size={18} color="#C6FF33" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <Text style={styles.infoLabel}>Mobile</Text>
        <Text style={styles.infoValue}>{userData?.mobile || "N/A"}</Text>
        <Text style={styles.infoLabel}>Email</Text>
        <Text style={styles.infoValue}>{userData?.email || "N/A"}</Text>
        <Text style={styles.infoLabel}>Balance</Text>
        <Text style={styles.infoValue}>PHP {userData?.deposit ? formatDeposit(userData.deposit) : "0.00"}</Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.buttonText}>Log Out</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
          <Text style={styles.buttonText}>Delete Account</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.navButton, activeTab === "home" && styles.navButtonActive]}
          onPress={() => {
            setActiveTab("home");
            router.push({ pathname: "/(tabs)/homepage", params: { uid: uid , accountNumber: accountNumber } });
          }}
        >
          <Ionicons name="home" size={20} color={activeTab === "home" ? "#CDFF57" : "black"} />
          <Text style={[styles.navLabel, activeTab === "home" && styles.navLabelActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, activeTab === "transfer" && styles.navButtonActive]}
          onPress={() => {
            setActiveTab("transfer");
            router.push({ pathname: "/(tabs)/transfer", params: { uid: uid , accountNumber: accountNumber } });
          }}
        >
          <Ionicons name="swap-horizontal" size={20} color={activeTab === "transfer" ? "#CDFF57" : "black"} />
          <Text style={[styles.navLabel, activeTab === "transfer" && styles.navLabelActive]}>Transfer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, activeTab === "history" && styles.navButtonActive]}
          onPress={() => {
            setActiveTab("history");
            router.push({ pathname: "/(tabs)/history", params: { uid: uid , accountNumber: accountNumber } });
          }}
        >
          <Ionicons name="document-text" size={20} color={activeTab === "history" ? "#CDFF57" : "black"} />
          <Text style={[styles.navLabel, activeTab === "history" && styles.navLabelActive]}>History</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, activeTab === "profile" && styles.navButtonActive]}
          onPress={() => {
            setActiveTab("profile");
            router.push({ pathname: "/(tabs)/profile", params: { uid: uid , accountNumber: accountNumber } });
          }}
        >
          <Ionicons name="person" size={20} color={activeTab === "profile" ? "#CDFF57" : "black"} />
          <Text style={[styles.navLabel, activeTab === "profile" && styles.navLabelActive]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#C6FF33',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 8,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#C6FF33',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  
  sectionTitle: {
    fontSize: 14,
    color: '#C6FF33',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountNumber: {
    fontSize: 16,
    color: '#fff',
    letterSpacing: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 8,
  },
  infoValue: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  logoutButton: {
    flex: 1,
    backgroundColor: '#D3D3D3',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FF6666',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 13,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#C6FF33",
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 3,
    borderColor: "#000",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  navButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    borderRadius: 10,
  },
  navButtonActive: {
    backgroundColor: "#000",
  },
  navLabel: {
    fontSize: 11,
    marginTop: 3,
    color: "#000",
    fontWeight: "600",
    textAlign: 'center',
  },
  navLabelActive: {
    color: "#CDFF57",
  },
});
