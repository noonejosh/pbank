import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link, router, useLocalSearchParams } from "expo-router"; // Make sure 'router' is imported
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../FirebaseConfig";

// Define the UserData interface (reused from HomeScreen)
interface UserData {
  id?: string; // Document ID
  name?: string;
  deposit?: string;
  email?: string;
  mobile?: string;
  dateOfBirth?: Date;
  createdAt?: Date;
}

const InvestScreen = () => {
  const { uid } = useLocalSearchParams(); // Get UID from navigation params
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const fetchUserInfoDocuments = async () => {
      if (typeof uid === "string") {
        const userInfoCollectionRef = collection(db, "users", uid, "userInfo");

        try {
          const querySnapshot = await getDocs(userInfoCollectionRef);
          const documents = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          if (documents.length > 0) {
            setUserData(documents[0] as UserData);
          } else {
            console.log("No user info documents found.");
          }
        } catch (error) {
          console.error("Error fetching user info documents: ", error);
        }
      } else {
        // This log should ideally not fire if uid is passed from HomeScreen
        console.error("Invalid uid: undefined (InvestScreen received no UID)");
      }
    };

    fetchUserInfoDocuments();
  }, [uid]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#000" }}>
      {/* Refactored Header */}
      <View style={styles.headerMainContainer}>
        <View style={styles.headerContentRow}>
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()} // Uses expo-router's back functionality
            style={styles.headerBackBtn}
          >
            <Ionicons name="arrow-back-outline" size={24} color="#CDFF57" />
          </TouchableOpacity>

          {/* Logo */}
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.headerLogo}
          />

          {/* Welcome Text */}
          <Text style={styles.headerWelcomeText}>
            Explore Investments, {userData?.name || "User"}!
          </Text>

          {/* Notifications Icon */}
          <Ionicons
            name="notifications-outline"
            size={24}
            color="#CDFF57"
            style={styles.headerNotificationIcon}
          />
        </View>

        {/* "GROW YOUR WEALTH" text - now part of the header, but below the main row */}
        <Text style={styles.growWealthText}>
          GROW YOUR WEALTH
        </Text>
      </View>

      {/* Main Content Area */}
      <View
        style={{
          flex: 1,
          backgroundColor: "#fff",
          marginTop: 20,
          borderRadius: 10,
          padding: 15,
        }}
      >
        <Text style={styles.sectionTitle}>Your Investment Portfolio</Text>
        <View style={styles.investmentCard}>
          <Ionicons name="pie-chart-outline" size={30} color="#000" />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.cardTitle}>Total Portfolio Value</Text>
            <Text style={styles.cardValue}>PHP 0.00</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.actionButtonPrimary}>
          <Text style={styles.actionButtonTextPrimary}>View Your Investments</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Explore Investment Options</Text>

        {/* Investment Option 1: Fixed Deposits */}
        <TouchableOpacity style={styles.investmentOptionCard}>
          <Ionicons name="cash-outline" size={24} color="#333" />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={styles.optionTitle}>Fixed Deposits</Text>
            <Text style={styles.optionDescription}>Earn guaranteed returns with low risk.</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={20} color="#999" />
        </TouchableOpacity>

        {/* Investment Option 2: Mutual Funds */}
        <TouchableOpacity style={styles.investmentOptionCard}>
          <Ionicons name="trending-up-outline" size={24} color="#333" />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={styles.optionTitle}>Mutual Funds</Text>
            <Text style={styles.optionDescription}>Diversified investments managed by experts.</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={20} color="#999" />
        </TouchableOpacity>

        {/* Investment Option 3: Stocks */}
        <TouchableOpacity style={styles.investmentOptionCard}>
          <Ionicons name="analytics-outline" size={24} color="#333" />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={styles.optionTitle}>Stocks</Text>
            <Text style={styles.optionDescription}>Invest in leading companies and grow with them.</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={20} color="#999" />
        </TouchableOpacity>

        {/* Investment Option 4: Savings Accounts with Higher Interest */}
        <TouchableOpacity style={styles.investmentOptionCard}>
          <Ionicons name="wallet-outline" size={24} color="#333" />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={styles.optionTitle}>High-Yield Savings</Text>
            <Text style={styles.optionDescription}>Boost your savings with competitive interest rates.</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButtonSecondary}>
          <Text style={styles.actionButtonTextSecondary}>Learn More About Investing</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // --- New/Modified Header Styles ---
  headerMainContainer: {
    backgroundColor: "#111",
    paddingHorizontal: 20,
    paddingTop: 50, // Top padding for status bar clearance
    paddingBottom: 10, // Padding at the bottom of the header section
  },
  headerContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Distributes items with space between them
    marginBottom: 10, // Space between this row and "GROW YOUR WEALTH" text
  },
  headerBackBtn: {
    // No specific styling needed here unless it requires extra hit area or padding
    marginRight: 10, // Space between back button and the next element
  },
  headerLogo: {
    width: 40,
    height: 40,
    resizeMode: "contain",
    // No need for absolute positioning anymore
  },
  headerWelcomeText: {
    flex: 1, // Allows the text to take up available space, pushing other items
    color: "#CDFF57",
    fontSize: 13,
    fontWeight: "bold",
    textAlign: 'left', // Align text within its flex container
    marginLeft: 10, // Space between logo and welcome text
  },
  headerNotificationIcon: {
    marginLeft: 10, // Space between welcome text and notification icon
  },
  growWealthText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "white",
    textAlign: "left",
    // No need for absolute positioning, left, top, marginTop properties here anymore
  }, 

  // --- Existing Styles (remain the same) ---
  // You can remove the 'footer' related styles if your footer is in a shared layout file
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

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  investmentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    color: "#666",
  },
  cardValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 5,
  },
  actionButtonPrimary: {
    backgroundColor: "#CDFF57",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  actionButtonTextPrimary: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  investmentOptionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  optionDescription: {
    fontSize: 12,
    color: "#666",
    marginTop: 3,
  },
  actionButtonSecondary: {
    backgroundColor: "#eee",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  actionButtonTextSecondary: {
    color: "#333",
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default InvestScreen;