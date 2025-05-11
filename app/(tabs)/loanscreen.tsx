// app/(tabs)/loanscreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../FirebaseConfig';

interface LoanData {
  id: string;
  loanAmount?: number;
  purpose?: string;
  tenureMonths?: number;
  emiAmount?: number;
  nextDueDate?: string;
  disbursementDate?: string;
  interestRate?: number;
  totalPayable?: number;
  totalPaid?: number;
  status?: 'active' | 'completed' | 'overdue' | 'pending';
  accountNumber?: string;
  balanceRemaining?: number;
  paymentPercentage?: number;
  payments?: Array<{
    id: string;
    amountDue: number;
    dueDate: string;
    interestPay: string;
  }>;
}

interface UserData {
  id?: string;
  name?: string;
  deposit?: string;
  email?: string;
  mobile?: string;
  dateOfBirth?: Date;
  createdAt?: Date;
}

const LoanScreen = () => {
  const { uid } = useLocalSearchParams();
  const [loanData, setLoanData] = useState<LoanData | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!uid || typeof uid !== 'string') {
        setError('User ID not found. Please log in again.');
        setLoading(false);
        return;
      }

      try {
        const userInfoCollectionRef = collection(db, `users/${uid}/userInfo`);
        const userInfoQuerySnapshot = await getDocs(userInfoCollectionRef);
        if (!userInfoQuerySnapshot.empty) {
          setUserData(userInfoQuerySnapshot.docs[0].data() as UserData);
        } else {
          setUserData({ name: "User" });
        }

        const loansCollectionRef = collection(db, `users/${uid}/loans`);
        const querySnapshot = await getDocs(loansCollectionRef);

        let activeLoan = null;
        if (!querySnapshot.empty) {
          activeLoan = querySnapshot.docs.find(doc => (doc.data() as LoanData).status === 'active' || (doc.data() as LoanData).status === 'overdue' || (doc.data() as LoanData).status === 'pending');
        }

        if (activeLoan) {
          const rawData = activeLoan.data() as LoanData;
          setLoanData({
            id: activeLoan.id,
            loanAmount: rawData.loanAmount,
            purpose: rawData.purpose,
            tenureMonths: rawData.tenureMonths,
            emiAmount: rawData.emiAmount,
            nextDueDate: rawData.nextDueDate,
            disbursementDate: rawData.disbursementDate,
            interestRate: rawData.interestRate,
            totalPayable: rawData.totalPayable,
            totalPaid: rawData.totalPaid,
            status: rawData.status,
            accountNumber: rawData.accountNumber,
            balanceRemaining: rawData.balanceRemaining,
            paymentPercentage: rawData.paymentPercentage,
            payments: rawData.payments,
          } as LoanData);
        } else {
          setLoanData(null);
        }

      } catch (err) {
        setError('Failed to load details. Please check your internet connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [uid]);

  const formatCurrency = (amount: number | string | undefined) => {
    if (amount === undefined || amount === null) return "₹ 0.00";
    const numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '')) : amount;
    if (isNaN(numAmount)) return "₹ 0.00";
    return `₹ ${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numAmount)}`;
  };

  const navigateToRequestLoan = () => {
    router.push({
      pathname: "/(tabs)/requestloan",
      params: { uid: uid }
    });
  };

  const handleResolveNow = (paymentId: string) => {
    console.log(`Resolve Now clicked for payment: ${paymentId}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading loan details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerMainContainer}>
        <View style={styles.headerContentRow}>
          <TouchableOpacity style={styles.headerBackBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#CDFF57" />
          </TouchableOpacity>
          <Image source={require('../../assets/images/logo.png')} style={styles.headerLogo} />
          <Text style={styles.headerWelcomeText}>
            Future Funded, {userData?.name || "User"}!
          </Text>
          <TouchableOpacity style={styles.headerNotificationTouchable}>
              <Ionicons
              name="notifications-outline"
              size={24} 
              color="#CDFF57"
              style={styles.headerNotificationIcon}
              />
          </TouchableOpacity>
        </View>
      </View>

      {error || !loanData ? (
        <View style={styles.noLoanContainer}>
          <Ionicons name="information-circle-outline" size={80} color="#CDFF57" />
          <Text style={styles.noLoanText}>No active loan found.</Text>
          <Text style={styles.noLoanSubText}>It looks like you don't have any active loans with Powered Bank. Request a new loan to get started!</Text>
          <TouchableOpacity style={styles.requestLoanButton} onPress={navigateToRequestLoan}>
            <Text style={styles.requestLoanButtonText}>Request New Loan</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.contentArea}>
          <View style={styles.loanSummaryCard}>
            <View style={styles.bankLogoContainer}>
              <Image source={require('../../assets/images/logo.png')} style={styles.bankLogo} />
              <Text style={styles.bankName}>Powered Bank</Text>
            </View>
            <Text style={styles.loanAmountTitle}>Amount of Loan</Text>
            <Text style={styles.loanAmountValue}>{formatCurrency(loanData.loanAmount)}</Text>
            <View style={styles.accountInfoRow}>
              <Text style={styles.accountLabel}>Account Number</Text>
              <Text style={styles.accountValue}>**** **** {userData?.id?.slice(-5) || 'XXXXX'}</Text>
            </View>
            <View style={styles.balanceRow}>
              <View>
                <Text style={styles.balanceLabel}>Balance Remaining</Text>
                <Text style={styles.balanceValue}>{formatCurrency(loanData.balanceRemaining)}</Text>
              </View>
              <View style={styles.paymentPercentageContainer}>
                <Text style={styles.paymentPercentageLabel}>Payment in Percentage</Text>
                <Text style={styles.paymentPercentageValue}>{loanData.paymentPercentage || 0}%</Text>
              </View>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Loan Payment</Text>
          {loanData.payments && loanData.payments.length > 0 ? (
            loanData.payments.map((payment) => (
              <View key={payment.id} style={styles.paymentRowCard}>
                <View style={styles.paymentDetails}>
                  <Text style={styles.paymentAmountDue}>{formatCurrency(payment.amountDue)}</Text>
                  <Text style={styles.paymentDueDate}>Due Date: {payment.dueDate}</Text>
                </View>
                <View style={styles.paymentInterestContainer}>
                  <Text style={styles.paymentInterestLabel}>Interest Pay</Text>
                  <Text style={styles.paymentInterestValue}>{payment.interestPay}</Text>
                </View>
                <TouchableOpacity
                  style={styles.resolveButton}
                  onPress={() => handleResolveNow(payment.id)}
                >
                  <Text style={styles.resolveButtonText}>Resolve Now</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.noPaymentsText}>No payment history available.</Text>
          )}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#CDFF57',
    textAlign: 'center',
    fontSize: 16,
  },
  errorText: {
    color: '#FF6347',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    fontWeight: 'bold',
  },
  contentArea: {
    flex: 1,
    padding: 20,
    backgroundColor: '#000',
  },

  // Header Styles
  headerMainContainer: {
    backgroundColor: "#111",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
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
  headerNotificationTouchable: {
    padding: 5,
  },
  headerNotificationIcon: {
    marginLeft: 10,
  },

  // Loan Summary Card Styles
  loanSummaryCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 15,
    padding: 25,
    marginBottom: 25,
    shadowColor: '#CDFF57',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(205, 255, 87, 0.2)',
  },
  bankLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  bankLogo: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
    marginRight: 10,
  },
  bankName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loanAmountTitle: {
    color: '#AAA',
    fontSize: 14,
    marginBottom: 5,
  },
  loanAmountValue: {
    color: '#CDFF57',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  accountInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
  accountLabel: {
    color: '#AAA',
    fontSize: 14,
  },
  accountValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  balanceLabel: {
    color: '#AAA',
    fontSize: 13,
  },
  balanceValue: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
  },
  paymentPercentageContainer: {
    alignItems: 'flex-end',
  },
  paymentPercentageLabel: {
    color: '#AAA',
    fontSize: 13,
  },
  paymentPercentageValue: {
    color: '#CDFF57',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 5,
  },

  // Loan Payment Section Styles
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#CDFF57',
    marginBottom: 15,
    marginTop: 10,
  },
  paymentRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  paymentDetails: {
    flex: 1,
    marginRight: 10,
  },
  paymentAmountDue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  paymentDueDate: {
    fontSize: 13,
    color: '#AAA',
  },
  paymentInterestContainer: {
    alignItems: 'center',
    marginRight: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(205, 255, 87, 0.1)',
  },
  paymentInterestLabel: {
    fontSize: 11,
    color: '#CDFF57',
    opacity: 0.7,
  },
  paymentInterestValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#CDFF57',
  },
  resolveButton: {
    backgroundColor: '#CDFF57',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resolveButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // No Loan Found State Styles
  noLoanContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#000',
  },
  noLoanText: {
    color: '#CDFF57',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  noLoanSubText: {
    color: '#AAA',
    fontSize: 15,
    marginTop: 10,
    marginBottom: 30,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  requestLoanButton: {
    backgroundColor: 'transparent',
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CDFF57',
    marginTop: 20,
  },
  requestLoanButtonText: {
    color: '#CDFF57',
    fontSize: 18,
    fontWeight: 'bold',
  },
  noPaymentsText: {
    color: '#AAA',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
  bottomSpacer: {
    height: 20,
  },
});

export default LoanScreen;