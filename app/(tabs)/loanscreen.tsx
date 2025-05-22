// app/(tabs)/loanscreen.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../FirebaseConfig'; // Ensure this path is correct

interface PaymentEntry {
  id: string;
  amountDue: number;
  dueDate: string;
  interestPay: string;
  status?: 'pending' | 'paid';
  paidDate?: string;
}

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
  // Removed payments?: PaymentEntry[]; as per your Firebase structure
}

interface UserData {
  id?: string;
  name?: string;
  deposit?: string;
  email?: string;
  mobile?: string;
  dateOfBirth?: Date;
  createdAt?: Date;
  accountNumber?: string;
}

const formatCurrency = (amount: number | string | undefined) => {
  if (amount === undefined || amount === null) return "₱ 0.00";
  const numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '')) : amount;
  if (isNaN(numAmount)) return "₱ 0.00";
  return `₱ ${new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numAmount)}`;
};

const LoanScreen = () => {
  const { uid, accountNumber } = useLocalSearchParams();
  const [activeOverdueLoans, setActiveOverdueLoans] = useState<LoanData[]>([]);
  const [pendingLoanApplications, setPendingLoanApplications] = useState<LoanData[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCombinedLoanAmount, setTotalCombinedLoanAmount] = useState<number>(0);
  const [totalCombinedBalanceRemaining, setTotalCombinedBalanceRemaining] = useState<number>(0);
  const [overallPaymentPercentage, setOverallPaymentPercentage] = useState<number>(0);

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      const userInfoCollectionRef = collection(db, `users/${userId}/userInfo`);
      const userInfoQuerySnapshot = await getDocs(userInfoCollectionRef);
      if (!userInfoQuerySnapshot.empty) {
        const userInfoDoc = userInfoQuerySnapshot.docs[0];
        setUserData({
          id: userInfoDoc.id,
          accountNumber: userInfoDoc.id,
          ...userInfoDoc.data() as UserData,
        });
      } else {
        setUserData({ name: 'User', accountNumber: 'N/A' });
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError('Failed to load user information.');
    }
  }, []);

  const fetchLoanData = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const loansCollectionRef = collection(db, `users/${userId}/loanApplications`);
      const querySnapshot = await getDocs(loansCollectionRef);

      let tempActiveOverdueLoans: LoanData[] = [];
      let tempPendingLoanApplications: LoanData[] = [];
      let currentCombinedLoanAmount = 0;
      let currentCombinedBalanceRemaining = 0;
      let currentTotalPaidAcrossAllLoans = 0;
      let currentTotalPayableAcrossAllLoans = 0;

      if (!querySnapshot.empty) {
        querySnapshot.docs.forEach((doc) => {
          const loan = { id: doc.id, ...doc.data() } as LoanData;
          // Add balanceRemaining for every loan, regardless of status
         const balance = Number(loan.balanceRemaining) || 0;
          currentCombinedBalanceRemaining += balance;

          if (loan.status === 'active' || loan.status === 'overdue') {
            if (loan.loanAmount) currentCombinedLoanAmount += loan.loanAmount;
            if (loan.totalPaid) currentTotalPaidAcrossAllLoans += loan.totalPaid;
            if (loan.totalPayable) currentTotalPayableAcrossAllLoans += loan.totalPayable;
            tempActiveOverdueLoans.push(loan);
          } else if (loan.status === 'pending') {
            tempPendingLoanApplications.push(loan);
          }
        });
      }

      setActiveOverdueLoans(tempActiveOverdueLoans);
      setPendingLoanApplications(tempPendingLoanApplications);
      setTotalCombinedLoanAmount(currentCombinedLoanAmount);
      setTotalCombinedBalanceRemaining(currentCombinedBalanceRemaining);

      if (currentTotalPayableAcrossAllLoans > 0) {
        const percentage = (currentTotalPaidAcrossAllLoans / currentTotalPayableAcrossAllLoans) * 100;
        setOverallPaymentPercentage(parseFloat(percentage.toFixed(2)));
      } else {
        setOverallPaymentPercentage(0);
      }

      console.log("Active Overdue Loans:", tempActiveOverdueLoans);
      console.log("Pending Loan Applications:", tempPendingLoanApplications);

    } catch (err) {
      console.error("Error fetching loan data:", err);
      setError('Failed to load loan details. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (uid) {
      const userId = Array.isArray(uid) ? uid[0] : uid;
      fetchUserData(userId);
      fetchLoanData(userId);
    } else {
      setError('User ID not found. Please log in again.');
      setLoading(false);
    }
  }, [uid, fetchUserData, fetchLoanData]);

  const navigateToRequestLoan = useCallback(() => {
    router.push({ pathname: "/(tabs)/requestloan", params: { uid } });
  }, [uid]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#CDFF57" />
        <Text style={styles.loadingText}>Loading loan details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.headerMainContainer}>
          <TouchableOpacity style={styles.headerBackBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#CDFF57" />
          </TouchableOpacity>
          <Image source={require('../../assets/images/logo.png')} style={styles.headerLogo} />
        </View>
        <View style={styles.noLoanContainer}>
          <Ionicons name="information-circle-outline" size={80} color="#FF6347" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  const hasActiveOrOverdueLoans = activeOverdueLoans.length > 0;
  const hasPendingLoans = pendingLoanApplications.length > 0;
  const hasAnyLoanData = hasActiveOrOverdueLoans || hasPendingLoans;

  return (
    <View style={styles.container}>
      <View style={styles.headerMainContainer}>
        <View style={styles.headerContentRow}>
          <TouchableOpacity style={styles.headerBackBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#CDFF57" />
          </TouchableOpacity>
          <Image source={require('../../assets/images/logo.png')} style={styles.headerLogo} />
          <Text style={styles.headerWelcomeText}>
            Good Morning, {userData?.name || "User"}!
          </Text>
          <Image
            source={{ uri: 'https://via.placeholder.com/40' }} // Replace with actual user profile image URI
            style={styles.profileImage}
          />
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

      {!hasAnyLoanData ? (
        <View style={styles.noLoanContainer}>
          <Ionicons name="information-circle-outline" size={80} color="#CDFF57" />
          <Text style={styles.noLoanText}>No active loans or pending applications found.</Text>
          <Text style={styles.noLoanSubText}>It looks like you don't have any active loans with Powered Bank or any pending loan applications. Request a new loan to get started!</Text>
          <TouchableOpacity style={styles.requestLoanButton} onPress={navigateToRequestLoan}>
            <Text style={styles.requestLoanButtonText}>Request New Loan</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.contentArea}>
          {hasActiveOrOverdueLoans && (
            <View style={styles.loanSummaryCard}>
              <View style={styles.bankLogoContainer}>
                <Image source={require('../../assets/images/logo.png')} style={styles.bankLogo} />
                <Text style={styles.bankName}>Powered Bank</Text>
              </View>
              <Text style={styles.loanAmountTitle}>Amount of Loan</Text>
              <Text style={styles.loanAmountValue}>{formatCurrency(totalCombinedLoanAmount)}</Text>
              <View style={styles.accountInfoRow}>
                <Text style={styles.accountLabel}>Account Number</Text>
                <Text style={styles.accountValue}>
                  {userData?.accountNumber ? `**** **** ${userData.accountNumber.slice(-5)}` : 'XXXXX'}
                </Text>
              </View>
              <View style={styles.balanceRow}>
                <View>
                  <Text style={styles.balanceLabel}>Balance Remaining</Text>
                  <Text style={styles.balanceValue}>{formatCurrency(totalCombinedBalanceRemaining)}</Text>
                </View>
                <View style={styles.paymentPercentageContainer}>
                  <Text style={styles.paymentPercentageLabel}>Payment in Percentage</Text>
                  <Text style={styles.paymentPercentageValue}>{overallPaymentPercentage || 0}%</Text>
                </View>
              </View>
            </View>
          )}

          {hasActiveOrOverdueLoans && (
            <>
              <Text style={styles.sectionTitle}>Your Loans</Text>
              {activeOverdueLoans.map((loan) => (
                <View key={`loan-${loan.id}`} style={styles.individualLoanCard}>
                  <View style={styles.loanInfo}>
                    <Text style={styles.loanPurpose}>Purpose: {loan.purpose || 'Loan'}</Text>
                    <Text style={styles.loanAmount}>Amount: {formatCurrency(loan.loanAmount)}</Text>
                    <Text style={styles.loanInterest}>
                      Interest Rate: {loan.interestRate !== undefined && loan.interestRate !== null
                        ? `${(loan.interestRate * 100).toFixed(0)}%` // Display as percentage
                        : 'N/A'}
                    </Text>
                  </View>
                  {loan.nextDueDate && (
                    <View style={styles.paymentDetailsCard}>
                      <Text style={styles.paymentDueDate}>Due Date: {loan.nextDueDate}</Text>
                      <Text style={styles.paymentAmountDue}>EMI: {formatCurrency(loan.emiAmount)}</Text>
                      <TouchableOpacity
                      style={styles.resolveButton}
                      onPress={() => {
                        router.push({
                          pathname: "/(tabs)/paymentscreen",
                          params: {
                            uid: uid,
                            accountNumber: accountNumber,
                            loanId: loan.id, // <-- This is the correct Firestore doc ID for this loan
                            amountDue: loan.emiAmount || 0,
                            dueDate: loan.nextDueDate,
                            interestPay: loan.interestRate?.toString() || '0',
                          }
                        });
                      }}
                    >
                      <Text style={styles.resolveButtonText}>Resolve Now</Text>
                    </TouchableOpacity>
                    </View>
                  )}
                  {!loan.nextDueDate && loan.status === 'active' && (
                    <View style={styles.noUpcomingPayment}>
                      <Ionicons name="checkmark-circle-outline" size={30} color="#CDFF57" />
                      <Text style={styles.noUpcomingPaymentText}>No upcoming payments scheduled</Text>
                    </View>
                  )}
                  {loan.status === 'overdue' && (
                    <View style={styles.overdueIndicator}>
                      <Ionicons name="warning-outline" size={30} color="#FF6347" />
                      <Text style={styles.overdueText}>Overdue</Text>
                    </View>
                  )}
                </View>
              ))}
            </>
          )}

          {hasPendingLoans && (
            <>
              <Text style={styles.sectionTitle}>Pending Loan Applications</Text>
              {pendingLoanApplications.map((loan) => (
                <View key={`loan-pending-${loan.id}`} style={styles.pendingLoanCard}>
                  <View style={styles.pendingLoanDetails}>
                    <Text style={styles.pendingLoanTitle}>Purpose: {loan.purpose || 'N/A'}</Text>
                    <Text style={styles.pendingLoanAmount}>Amount: {formatCurrency(loan.loanAmount)}</Text>
                    <Text style={styles.pendingLoanStatus}>Status: {loan.status ? loan.status.charAt(0).toUpperCase() + loan.status.slice(1) : 'N/A'}</Text>
                  </View>
                  <View style={styles.pendingLoanInfoTextContainer}>
                    <Ionicons name="information-circle-outline" size={20} color="#CDFF57" />
                    <Text style={styles.pendingLoanInfoText}>Awaiting acceptance/disbursement.</Text>
                  </View>
                </View>
              ))}
            </>
          )}

          <View style={styles.bottomSpacer} />
          {hasAnyLoanData && (
            <TouchableOpacity style={styles.requestLoanButtonBottom} onPress={navigateToRequestLoan}>
              <Text style={styles.requestLoanButtonText}>Request New Loan</Text>
            </TouchableOpacity>
          )}
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
    marginTop: 10,
    fontWeight: 'bold',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
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
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 10,
    marginRight: 5,
  },
  headerNotificationTouchable: {
    padding: 5,
  },
  headerNotificationIcon: {
    marginLeft: 10,
  },
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
  individualLoanCard: {
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
  loanInfo: {
    marginBottom: 10,
  },
  loanPurpose: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  loanAmount: {
    fontSize: 14,
    color: '#CDFF57',
  },
  loanInterest: {
    fontSize: 13,
    color: '#AAA',
    marginBottom: 10,
  },
  paymentDetailsCard: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#333',
  },
  paymentAmountDue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  paymentDueDate: {
    fontSize: 13,
    color: '#AAA',
    marginBottom: 5,
  },
  resolveButton: {
    backgroundColor: '#2A374B',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resolveButtonText: {
    color: '#CDFF57',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#CDFF57',
    marginBottom: 15,
    marginTop: 10,
  },
  pendingLoanCard: {
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
    borderColor: 'rgba(205, 255, 87, 0.1)',
  },
  pendingLoanDetails: {
    marginBottom: 10,
  },
  pendingLoanTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  pendingLoanAmount: {
    fontSize: 14,
    color: '#CDFF57',
    marginBottom: 5,
  },
  pendingLoanStatus: {
    fontSize: 13,
    color: '#AAA',
  },
  pendingLoanInfoTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    backgroundColor: 'rgba(205, 255, 87, 0.1)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  pendingLoanInfoText: {
    color: '#CDFF57',
    fontSize: 12,
    marginLeft: 8,
    fontWeight: '500',
  },
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
  requestLoanButtonBottom: {
    backgroundColor: 'transparent',
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CDFF57',
    marginTop: 30,
    marginBottom: 20,
  },
  requestLoanButtonText: {
    color: '#CDFF57',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 20,
  },
  noUpcomingPayment: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  noUpcomingPaymentText: {
    color: '#CDFF57',
    marginLeft: 8,
  },
  overdueIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  overdueText: {
    color: '#FF6347',
    marginLeft: 8,
    fontWeight: 'bold',
  },
});

export default LoanScreen;