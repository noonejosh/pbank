import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link, router, useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../FirebaseConfig";

const HomeScreen = () => {
  const { uid } = useLocalSearchParams();

  interface UserData {
    name?: string;
    accountNumber?: string;
    deposit?: string;
    email?: string;
    mobile?: string;
    dateOfBirth?: Date;
    createdAt?: Date;
  }

  const [userData, setUserData] = useState<UserData | null>(null);
  const [isAccountVisible, setIsAccountVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("home");

  useEffect(() => {
    const fetchUserData = async () => {
      if (typeof uid === "string") {
        const docRef = doc(db, "users", uid, "userInfo", "profile");

        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            console.log("Document data:", docSnap.data());
            setUserData(docSnap.data());
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
  }, [uid]); // Run the effect when `uid` changes

  const formatDeposit = (deposit: string) => {
    const number = parseFloat(deposit); // Convert the deposit to a number
    if (isNaN(number)) return "0.00"; // Handle invalid numbers
    return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(number);
  };
  
  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {/* Header */}
      <View style={{ backgroundColor: "#111", padding: 20, paddingTop: 50 }}>
        <Text
          style={{
            color: "#CDFF57",
            fontSize: 13,
            fontWeight: "bold",
            position: "relative",
            left: "20%",
            top: "10%",
          }}
        >
          Welcome Back, {userData?.name || "User"}!
        </Text>
        <Image
          source={require("../../assets/images/logo.png")}
          style={{
            width: 40,
            height: 40,
            resizeMode: "contain",
            position: "absolute",
            left: 20,
            top: 40,
          }}
        />
        <Ionicons
          name="notifications-outline"
          size={24}
          color="#CDFF57"
          style={{ position: "absolute", right: 20, top: 45 }}
        />
      </View>

      <Text
        style={{
          fontSize: 10,
          fontWeight: "bold",
          color: "white",
          marginTop: 10,
          textAlign: "left",
          position: "absolute",
          left: 20,
          top: 80,
        }}
      >
        CHECKING & SAVINGS
      </Text>

      {/* Account Info */}
      <View
        style={{
          backgroundColor: "#CDFF57",
          margin: 15,
          padding: 15,
          borderRadius: 10,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontSize: 10, color: "#333", marginTop: 5 }}>
            DEBIT ACCOUNT:{" "}
            {isAccountVisible
              ? userData?.accountNumber || "XXXXX"
              : `******${userData?.accountNumber?.slice(-5) || "XXXXX"}`}
          </Text>
          <TouchableOpacity
            onPress={() => setIsAccountVisible(!isAccountVisible)}
            style={{ marginLeft: 5, top: "12%" }}
          >
            <Ionicons
              name={isAccountVisible ? "eye-off-outline" : "eye-outline"}
              size={14}
              color="#333"
            />
          </TouchableOpacity>
        </View>
        <Text style={{ fontSize: 24, fontWeight: "bold", marginTop: 5 }}>
          PHP {userData?.deposit ? formatDeposit(userData.deposit) : "0.00"}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <View style={{ alignItems: "center" }}>
          <Ionicons name="qr-code-outline" size={32} color="#CDFF57" />
          <Text style={styles.actionText}>Scan QR</Text>
        </View>
        <Link href="/(tabs)/savings" style={{ alignItems: "center" }}>
          <View style={{ alignItems: "center" }}>
            <Ionicons name="trending-up-outline" size={32} color="#CDFF57" />
            <Text style={styles.actionText}>Invest</Text>
          </View>
        </Link>
        <Link href="/(tabs)/paybills" style={{ alignItems: "center" }}>
          <View style={{ alignItems: "center" }}>
            <Ionicons name="receipt-outline" size={32} color="#CDFF57" />
            <Text style={styles.actionText}>Pay Bills</Text>
          </View>
        </Link>
        <Link href="/(tabs)/savings" style={{ alignItems: "center" }}>
          <View style={{ alignItems: "center" }}>
            <Ionicons name="wallet-outline" size={32} color="#CDFF57" />
            <Text style={styles.actionText}>Savings</Text>
          </View>
        </Link>
      </View>

      {/* Updates Section */}
      <ScrollView
        style={{
          flex: 1,
          backgroundColor: "#fff",
          marginTop: 20,
          borderRadius: 10,
          padding: 15,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "bold", color: "#333" }}>
          Recommended for you!
        </Text>
        <Text style={{ fontSize: 16, marginTop: 20, textAlign: "center" }}>
          NO UPDATES AVAILABLE
        </Text>
      </ScrollView>

      {/* Bottom Navigation - Enhanced */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.navButton, activeTab === "home" && styles.navButtonActive]}
          onPress={() => {
            setActiveTab("home");
            router.push({
              pathname: "/(tabs)/homepage",
              params: { uid },
            });
          }}
        >
          <Ionicons name="home" size={20} color={activeTab === "home" ? "#CDFF57" : "black"} />
          <Text style={[styles.navLabel, activeTab === "home" && styles.navLabelActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, activeTab === "transfer" && styles.navButtonActive]}
          onPress={() => {
            setActiveTab("transfer");
            router.push({
              pathname: "/(tabs)/transferfund",
              params: { uid },
            });
          }}
        >
          <Ionicons name="swap-horizontal" size={20} color={activeTab === "transfer" ? "#CDFF57" : "black"} />
          <Text style={[styles.navLabel, activeTab === "transfer" && styles.navLabelActive]}>Transfer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, activeTab === "history" && styles.navButtonActive]}
          onPress={() => {
            setActiveTab("history");
            router.push({
              pathname: "/(tabs)/history",
              params: { uid },
            });
          }}
        >
          <Ionicons name="document-text" size={20} color={activeTab === "history" ? "#CDFF57" : "black"} />
          <Text style={[styles.navLabel, activeTab === "history" && styles.navLabelActive]}>History</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, activeTab === "profile" && styles.navButtonActive]}
          onPress={() => {
            setActiveTab("profile");
            router.push({
              pathname: "/(tabs)/profile",
              params: { uid },
            });
          }}
        >
          <Ionicons name="person" size={20} color={activeTab === "profile" ? "#CDFF57" : "black"} />
          <Text style={[styles.navLabel, activeTab === "profile" && styles.navLabelActive]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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

  navIconActive: { 
    color: "#CDFF57",
  },

  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 20,
    paddingHorizontal: 10,
  },

  actionText: {
    color: "#CDFF57",
    fontSize: 12,
    marginTop: 5,
    textAlign: "center",
  },
});
 
export default HomeScreen;