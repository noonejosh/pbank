import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../FirebaseConfig";

interface UserData {
  id?: string;
  name?: string;
  deposit?: string;
  email?: string;
  mobile?: string;
  dateOfBirth?: Date;
  createdAt?: Date;
}

interface FixedDeposit {
  id: string;
  amount: number;
  tenureMonths: number;
  interestRate: number;
  maturityDate: string;
  startDate: string;
  maturityAmount: number;
  status: 'active' | 'matured' | 'early_withdrawn';
}

const InvestScreen = () => {
  const { uid } = useLocalSearchParams();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [totalFixedDepositAmount, setTotalFixedDepositAmount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (amount: number | string | undefined) => {
    if (amount === undefined || amount === null) return "₱ 0.00";
    const numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '')) : amount;
    if (isNaN(numAmount)) return "₱ 0.00";
    return `₱ ${new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numAmount)}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (typeof uid !== "string") {
        setError("Invalid user ID.");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch user info
        const userInfoCollectionRef = collection(db, "users", uid, "userInfo");
        const userInfoQuerySnapshot = await getDocs(userInfoCollectionRef);
        if (!userInfoQuerySnapshot.empty) {
          setUserData({ id: userInfoQuerySnapshot.docs[0].id, ...userInfoQuerySnapshot.docs[0].data() as UserData });
        } else {
          setUserData({ name: 'User', deposit: '0', id: 'default' });
        }

        // Fetch fixed deposits and calculate total active amount
        const fdCollectionRef = collection(db, "users", uid, "fixedDeposits");
        const fdQuerySnapshot = await getDocs(fdCollectionRef);
        let activeFdsTotal = 0;
        fdQuerySnapshot.docs.forEach(doc => {
          const fd = doc.data() as FixedDeposit;
          // Only sum 'active' fixed deposits
          if (fd.status === 'active') {
            activeFdsTotal += fd.amount;
          }
        });
        setTotalFixedDepositAmount(activeFdsTotal);

      } catch (err) {
        console.error("Error fetching data: ", err);
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [uid]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#000" }}>
      {/* Refactored Header */}
      <View style={styles.headerMainContainer}>
        <View style={styles.headerContentRow}>
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
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
        {loading ? (
          <ActivityIndicator size="large" color="#CDFF57" style={{ marginTop: 50 }} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Your Investment Portfolio</Text>
            <View style={styles.investmentCard}>
              <Ionicons name="pie-chart-outline" size={30} color="#000" />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.cardTitle}>Total Active Fixed Deposits</Text>
                <Text style={styles.cardValue}>{formatCurrency(totalFixedDepositAmount)}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.actionButtonPrimary}
              onPress={() => router.push({ pathname: "/(tabs)/fixeddepositscreen", params: { uid } })}
            >
              <Text style={styles.actionButtonTextPrimary}>View Your Investment</Text>
            </TouchableOpacity>

            <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Explore Investment Options</Text>

            {/* Investment Option 1: Fixed Deposits */}
            <TouchableOpacity
              style={styles.investmentOptionCard}
              onPress={() => router.push({ pathname: "/(tabs)/fixeddepositscreen", params: { uid } })}
            >
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
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // --- New/Modified Header Styles ---
  headerMainContainer: {
    backgroundColor: "#111",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
  },
  headerContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerBackBtn: {
    marginRight: 10,
  },
  headerLogo: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
  headerWelcomeText: {
    flex: 1,
    color: "#CDFF57",
    fontSize: 13,
    fontWeight: "bold",
    textAlign: 'left',
    marginLeft: 10,
  },
  headerNotificationIcon: {
    marginLeft: 10,
  },
  growWealthText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "white",
    textAlign: "left",
  },

  // --- Existing Styles (remain the same) ---
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
  errorText: {
    color: '#FF6347',
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
});

export default InvestScreen;