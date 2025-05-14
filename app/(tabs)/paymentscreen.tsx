// app/(tabs)/paymentscreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { doc, getDoc, updateDoc, runTransaction } from 'firebase/firestore';
import { db } from '../../FirebaseConfig';

interface UserData {
  uid?: string;
  name?: string;
  accountNumber?: string;
  deposit?: string; // Keep as string to align with Firestore
  email?: string;
  mobile?: string;
  dateOfBirth?: Date;
  createdAt?: Date;
}

interface PaymentDetails {
  id: string;
  amountDue: number;
  dueDate: string;
  interestPay: number;
  status?: 'pending' | 'paid';
  paidDate?: string;
}

interface LoanData {
  id: string;
  balanceRemaining?: number;
  totalPaid?: number;
  payments?: PaymentDetails[];
  status?: 'active' | 'completed' | 'overdue' | 'pending';
}

const PaymentScreen = () => {
  const { uid, loanId, paymentId, amountDue, dueDate, interestPay } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);

  // Convert string params to numbers for calculations
  const paymentAmountDue = parseFloat(amountDue as string || '0');
  const paymentInterestPay = parseFloat(interestPay as string || '0');

  useEffect(() => {
    const fetchUserData = async () => {
      if (!uid || typeof uid !== 'string') {
        setError('User ID not found.');
        setLoading(false);
        return;
      }

      try {
        // Assuming your user data (including deposit) is directly under the 'users' collection
        const userDocRef = doc(db, 'users', uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setUserData({ uid: userDocSnap.id, ...(userDocSnap.data() as Omit<UserData, 'uid'>) });
        } else {
          setError('User deposit information not found.');
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError('Failed to load user balance. Please check your internet connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [uid]);

  const formatCurrency = (amount: string | number | undefined) => {
    if (amount === undefined || amount === null) return "₱ 0.00";
    const numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '')) : amount;
    if (isNaN(numAmount)) return "₱ 0.00";
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numAmount);
  };

  const handleConfirmPayment = async () => {
    if (!uid || typeof uid !== 'string' || !loanId || typeof loanId !== 'string' || !paymentId || typeof paymentId !== 'string') {
      Alert.alert("Error", "Missing necessary details to process payment.");
      return;
    }

    const currentDeposit = parseFloat(userData?.deposit || '0');
    const amountToPay = paymentAmountDue;

    if (currentDeposit < amountToPay) {
      Alert.alert("Insufficient Funds", "You do not have enough balance in your deposit account to make this payment.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Get references to the user's document and the specific loan application document
      const userDocRef = doc(db, `users/${uid}`);
      const loanDocRef = doc(db, `users/${uid}/loanApplications`, loanId);

      await runTransaction(db, async (transaction) => {
        // 1. Get the latest user deposit
        const userDocSnap = await transaction.get(userDocRef);
        if (!userDocSnap.exists()) {
          throw "User information not found!";
        }
        const currentUserDeposit = parseFloat(userDocSnap.data()?.deposit as string || '0');

        if (currentUserDeposit < amountToPay) {
          throw "Insufficient funds for this transaction.";
        }

        // 2. Get the loan document
        const loanDocSnap = await transaction.get(loanDocRef);
        if (!loanDocSnap.exists()) {
          throw "Loan application not found!";
        }
        const currentLoanData = loanDocSnap.data() as LoanData;

        // 3. Update user's deposit
        const newDeposit = currentUserDeposit - amountToPay;
        transaction.update(userDocRef, { deposit: newDeposit.toString() }); // Store back as string

        // 4. Update the specific payment within the loan's payments array
        const updatedPayments = currentLoanData.payments?.map(p => {
          if (p.id === paymentId) {
            return { ...p, status: 'paid', paidDate: new Date().toISOString().split('T')[0] }; //YYYY-MM-DD
          }
          return p;
        }) || [];

        // 5. Update loan's totalPaid and balanceRemaining
        const newTotalPaid = (currentLoanData.totalPaid || 0) + amountToPay;
        const newBalanceRemaining = (currentLoanData.balanceRemaining || 0) - amountToPay;

        // Determine if the loan is matured (fully paid)
        const isMatured = newBalanceRemaining <= 0;
        const newLoanStatus = isMatured ? 'completed' : currentLoanData.status;

        transaction.update(loanDocRef, {
          payments: updatedPayments,
          totalPaid: newTotalPaid,
          balanceRemaining: newBalanceRemaining,
          status: newLoanStatus, // Update loan status if matured
        });
      });

      setSuccessMessage("Payment successful! Returning to loan details...");
      // Update local state or trigger a re-fetch on previous screen
      setTimeout(() => {
        router.push({
          pathname: '/(tabs)/loanscreen',
          params: { uid: uid },
        });
      }, 2000);

    } catch (e: any) {
      console.error("Payment transaction failed: ", e);
      setError(`Payment failed: ${e.message || e}`);
      Alert.alert("Payment Error", e.message || e.toString());
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#CDFF57" />
        <Text style={styles.loadingText}>Loading payment details...</Text>
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
            Confirm Payment
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

      <View style={styles.contentArea}>
        {error && <Text style={styles.errorText}>{error}</Text>}
        {successMessage && <Text style={styles.successText}>{successMessage}</Text>}

        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Payment Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount Due:</Text>
            <Text style={styles.detailValue}>{formatCurrency(paymentAmountDue)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Interest:</Text>
            <Text style={styles.detailValue}>{formatCurrency(paymentInterestPay)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Due Date:</Text>
            <Text style={styles.detailValue}>{dueDate}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Your Current Deposit:</Text>
            <Text style={styles.detailValue}>{formatCurrency(userData?.deposit)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={handleConfirmPayment}
          disabled={loading || !!successMessage}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.payButtonText}>Confirm Payment</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
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
  },
  errorText: {
    color: '#FF6347',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  successText: {
    color: '#4CAF50',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  contentArea: {
    flex: 1,
    padding: 20,
    backgroundColor: '#000',
    alignItems: 'center', // Center content horizontally
  },

  // Header Styles (Copied from LoanScreen for consistency)
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

  // Summary Card Styles
  summaryCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 15,
    padding: 25,
    marginBottom: 30,
    width: '100%', // Take full width
    maxWidth: 400, // Max width for larger screens
    shadowColor: '#CDFF57',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(205, 255, 87, 0.2)',
  },
  cardTitle: {
    color: '#CDFF57',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  detailLabel: {
    color: '#AAA',
    fontSize: 16,
  },
  detailValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 15,
  },

  // Buttons
  payButton: {
    backgroundColor: '#CDFF57',
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 300,
    marginBottom: 15,
  },
  payButtonDisabled: {
    backgroundColor: '#A0A0A0',
  },
  payButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 300,
    borderWidth: 1.5,
    borderColor: '#CDFF57',
  },
  cancelButtonText: {
    color: '#CDFF57',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PaymentScreen;