import React, {
  useState,
  useCallback,
  useEffect,
  useRef
} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Animated
} from 'react-native';
import {
  Ionicons
} from '@expo/vector-icons';
import {
  router,
  useLocalSearchParams
} from 'expo-router';
import {
  collection,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import {
  db
} from '../../FirebaseConfig';


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
  payments?: PaymentEntry[]; // Add this line
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
  if (amount === undefined || amount === null) return '₱ 0.00';
  const numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '')) : amount;
  if (isNaN(numAmount)) return '₱ 0.00';
  return `₱ ${new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount)}`;
};


const LoanScreen = () => {
  const {
    uid
  } = useLocalSearchParams();
  const [activeOverdueLoans, setActiveOverdueLoans] = useState < LoanData[] > ([]);
  const [pendingLoanApplications, setPendingLoanApplications] = useState < LoanData[] > ([]);
  const [userData, setUserData] = useState < UserData | null > (null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState < string | null > (null);
  const [totalCombinedLoanAmount, setTotalCombinedLoanAmount] = useState < number > (0);
  const [
    totalCombinedBalanceRemaining,
    setTotalCombinedBalanceRemaining,
  ] = useState < number > (0);
  const [overallPaymentPercentage, setOverallPaymentPercentage] = useState < number > (0);

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('id', '==', userId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        setUserData(userDoc.data() as UserData);
      } else {
        setUserData({
          name: 'User',
          accountNumber: 'N/A'
        });
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load user information.');
    }
  }, []);

  const fetchLoanData = useCallback(async (accountNumber: string) => {
    setLoading(true);
    setError(null);
    try {
      const loanApplicationsCollectionRef = collection(db, `loanApplications`);
      const q = query(
        loanApplicationsCollectionRef,
        where('accountNumber', '==', accountNumber)
      );
      const querySnapshot = await getDocs(q);

      let tempActiveOverdueLoans: LoanData[] = [];
      let tempPendingLoanApplications: LoanData[] = [];
      let currentCombinedLoanAmount = 0;
      let currentCombinedBalanceRemaining = 0;
      let currentTotalPaidAcrossAllLoans = 0;
      let currentTotalPayableAcrossAllLoans = 0;

      if (!querySnapshot.empty) {
        querySnapshot.docs.forEach((doc) => {
          const loan = {
            id: doc.id,
            ...doc.data()
          } as LoanData;
          if (loan.status === 'active' || loan.status === 'overdue') {
            if (loan.loanAmount) currentCombinedLoanAmount += loan.loanAmount;
            if (loan.balanceRemaining)
              currentCombinedBalanceRemaining += loan.balanceRemaining;
            if (loan.totalPaid) currentTotalPaidAcrossAllLoans += loan.totalPaid;
            if (loan.totalPayable)
              currentTotalPayableAcrossAllLoans += loan.totalPayable;
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
        const percentage =
          (currentTotalPaidAcrossAllLoans / currentTotalPayableAcrossAllLoans) *
          100;
        setOverallPaymentPercentage(parseFloat(percentage.toFixed(2)));
      } else {
        setOverallPaymentPercentage(0);
      }
    } catch (err: any) {
      console.error('Error fetching loan data:', err);
      setError(
        `Failed to load loan details. Please check your internet connection. Error: ${err.message}`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (uid) {
      const userId = Array.isArray(uid) ? uid[0] : uid;
      fetchUserData(userId);
    } else {
      setError('User ID not found. Please log in again.');
      setLoading(false);
    }
  }, [uid, fetchUserData]);

  useEffect(() => {
    if (userData?.accountNumber) {
      fetchLoanData(userData.accountNumber);
    }
  }, [userData, fetchLoanData]);

  const navigateToRequestLoan = useCallback(() => {
    router.push({
      pathname: '/(tabs)/requestloan',
      params: {
        uid,
        accountNumber: userData?.accountNumber
      },
    });
  }, [uid, userData?.accountNumber]);

  const handlePayNow = useCallback(
    (
      loan: {
        id: string
      },
      payment: {
        id: string;
        amountDue: number;
        dueDate: string;
        interestPay: string;
      }
    ) => {
      if (!uid || !loan.id || !userData?.accountNumber) {
        Alert.alert(
          'Error',
          'User ID, Loan ID, or Account Number is missing. Cannot proceed with payment.'
        );
        return;
      }
      router.push({
        pathname: '/(tabs)/paymentscreen',
        params: {
          uid,
          loanId: loan.id,
          accountNumber: userData.accountNumber,
          amountDue: payment.amountDue.toString(),
          dueDate: payment.dueDate,
          interestPay: payment.interestPay,
        },
      });
    },
    [uid, router, userData?.accountNumber]
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large"
          color="#CDFF57" />
        <Text style={styles.loadingText}>Loading loan details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton}
            onPress={() => router.back()}>
            <Ionicons name="arrow-back"
              size={24}
              color="#CDFF57" />
          </TouchableOpacity>
          <Image source={require('../../assets/images/logo.png')}
            style={styles.headerLogoFull}
            resizeMode="contain" />
          <View style={{
            width: 24
          }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline"
            size={60}
            color="#FF6347" />
          <Text style={styles.errorText}> {
            error
          } </Text>
        </View>
      </View>
    );
  }

  const hasActiveOrOverdueLoans = activeOverdueLoans.length > 0;
  const hasPendingLoans = pendingLoanApplications.length > 0;
  const hasAnyLoanData = hasActiveOrOverdueLoans || hasPendingLoans;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}
          onPress={() => router.back()}>
          <Ionicons name="arrow-back"
            size={24}
            color="#CDFF57" />
        </TouchableOpacity>
        <Image source={require('../../assets/images/logo.png')}
          style={styles.headerLogoFull}
          resizeMode="contain" />
        <View style={{
          width: 24
        }} />
      </View>

      {!hasAnyLoanData ? (
        <View style={styles.noLoanContainer}>
          <Ionicons name="information-circle-outline"
            size={80}
            color="#CDFF57" />
          <Text style={styles.noLoanText}>No Active Loans or Applications</Text>
          <Text style={styles.noLoanSubText}>
            It appears you don't have any active loans or pending loan
            applications.
          </Text>
          <TouchableOpacity style={styles.matureButton}
            onPress={navigateToRequestLoan}>
            <Text style={styles.matureButtonText}>Request a New Loan</Text>
            <Ionicons name="add-circle-outline"
              size={24}
              color="#FFF"
              style={{
                marginLeft: 10
              }} />
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.contentArea}>
          {
            hasActiveOrOverdueLoans && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Loan Summary</Text>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total Loan Amount</Text>
                  <Text style={styles.summaryValue}> {
                    formatCurrency(totalCombinedLoanAmount)
                  } </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Balance Remaining</Text>
                  <Text style={styles.summaryValue}> {
                    formatCurrency(totalCombinedBalanceRemaining)
                  } </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Overall Payment Progress</Text>
                  <Text style={styles.summaryValue}> {
                    overallPaymentPercentage || 0
                  }% </Text>
                </View>
                {
                  userData?.accountNumber && (
                    <View style={styles.accountInfoRow}>
                      <Text style={styles.accountLabel}>Account Number</Text>
                      <Text style={styles.accountValue}>
                        **** **** {
                          userData.accountNumber.slice(-5)
                        }
                      </Text>
                    </View>
                  )
                }
              </View>
            )
          }

          {
            hasActiveOrOverdueLoans && ( <
              >
              <Text style={styles.sectionTitle}>Active Loans</Text> {
                activeOverdueLoans.map((loan) => {
                  const payButtonScale = useRef(new Animated.Value(1)).current;
                  const handlePressIn = () => {
                    Animated.spring(payButtonScale, {
                      toValue: 0.95,
                      useNativeDriver: true,
                    }).start();
                  };
                  const handlePressOut = () => {
                    Animated.spring(payButtonScale, {
                      toValue: 1,
                      useNativeDriver: true,
                    }).start();
                  };

                  return (
                    <View key={`loan-${loan.id}`}
                      style={styles.loanCard}>
                      <View style={styles.loanCardHeader}>
                        <Text style={styles.loanPurpose}> {
                          loan.purpose || 'Loan'
                        } </Text>
                        <Text style={[styles.loanStatus, loan.status === 'overdue' && {
                          color: '#FF6347'
                        }, ]}>
                          {
                            loan.status?.toUpperCase()
                          }
                        </Text>
                      </View>
                      <View style={styles.loanDetails}>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Amount</Text>
                          <Text style={styles.detailValue}> {
                            formatCurrency(loan.loanAmount)
                          } </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Remaining</Text>
                          <Text style={styles.detailValue}> {
                            formatCurrency(loan.balanceRemaining)
                          } </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Next Due</Text>
                          <Text style={styles.detailValue}> {
                            loan.nextDueDate
                          } </Text>
                        </View>
                      </View>
                      {
                        loan.status === 'active' && (
                          <Animated.View style={{
                            transform: [{
                              scale: payButtonScale
                            }]
                          }}>
                            <TouchableOpacity style={styles.payButton}
                              onPressIn={handlePressIn}
                              onPressOut={handlePressOut}
                              onPress={() => handlePayNow(loan, {
                                id: '',
                                amountDue: loan.emiAmount || 0,
                                dueDate: loan.nextDueDate || '',
                                interestPay: '0'
                              })}>
                              <Text style={styles.payButtonText}>Pay Now</Text>
                            </TouchableOpacity>
                          </Animated.View>
                        )
                      }
                    </View>
                  );
                })
              }
              </>
            )
          }

          {
            hasPendingLoans && ( <
              >
              <Text style={styles.sectionTitle}>Pending Applications</Text> {
                pendingLoanApplications.map((loan) => (
                  <View key={`pending-loan-${loan.id}`}
                    style={styles.pendingLoanCard}>
                    <View style={styles.pendingLoanCardHeader}>
                      <Text style={styles.pendingLoanPurpose}> {
                        loan.purpose || 'Loan Application'
                      } </Text>
                      <Text style={styles.pendingLoanStatus}> {
                        loan.status?.toUpperCase()
                      } </Text>
                    </View>
                    <View style={styles.pendingLoanDetails}>
                      <Text style={styles.pendingLoanAmount}>
                        Amount: {
                          formatCurrency(loan.loanAmount)
                        }
                      </Text>
                      <View style={styles.pendingInfo}>
                        <Ionicons name="information-circle-outline"
                          size={16}
                          color="#AAA" />
                        <Text style={styles.pendingInfoText}>
                          Your application is under review.
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              }
              </>
            )
          }

          {
            (hasActiveOrOverdueLoans || hasPendingLoans) && (
              <TouchableOpacity style={styles.matureButton}
                onPress={navigateToRequestLoan}>
                <Text style={styles.matureButtonText}>Request Another Loan</Text>
                <Ionicons name="add-circle-outline"
                  size={24}
                  color="#FFF"
                  style={{
                    marginLeft: 10
                  }} />
              </TouchableOpacity>
            )
          }
        </ScrollView>
      )
      }
    </View>
  );
};

 const styles = StyleSheet.create({
  container: {
   flex: 1,
   backgroundColor: '#000',
  },
  header: {
   flexDirection: 'row',
   justifyContent: 'space-between',
   alignItems: 'center',
   paddingHorizontal: 20,
   paddingTop: 50,
   paddingBottom: 15,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
   },
   backButton: {
    padding: 8,
   },
   headerLogoFull: {
    height: 30,
    flex: 1,
    marginLeft: 10,
   },
   contentArea: {
    flex: 1,
    padding: 20,
   },
   summaryCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
   },
   summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 15,
   },
   summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
   },
   summaryLabel: {
    color: '#AAA',
    fontSize: 16,
   },
   summaryValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
   },
   accountInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
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
   sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#CDFF57',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
   },
   loanCard: {
    backgroundColor: '#2A374B',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
   },
   loanCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
   },
   loanPurpose: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
   },
   loanStatus: {
    fontSize: 14,
    color: '#CDFF57',
    fontWeight: 'bold',
   },
   loanDetails: {
    marginBottom: 10,
   },
   detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
   },
   detailLabel: {
    color: '#AAA',
    fontSize: 14,
   },
   detailValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
   },
   payButton: {
    backgroundColor: '#CDFF57',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
   },
   payButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
   },
   pendingLoanCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
   },
   pendingLoanCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
   },
   pendingLoanPurpose: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
   },
   pendingLoanStatus: {
    fontSize: 14,
    color: '#AAA',
    fontWeight: 'bold',
   },
   pendingLoanDetails: {},
   pendingLoanAmount: {
    color: '#FFF',
    fontSize: 14,
    marginBottom: 5,
   },
   pendingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
   },
   pendingInfoText: {
    color: '#AAA',
    fontSize: 12,
    marginLeft: 5,
   },
   noLoanContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
   },
   noLoanText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#CDFF57',
    marginTop: 20,
    textAlign: 'center',
   },
   noLoanSubText: {
    color: '#AAA',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
   },
   matureButton: {
    backgroundColor: '#2A374B',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    flexDirection: 'row',
   },
   matureButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
   },
   loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
   },
   loadingText: {
    color: '#CDFF57',
    fontSize: 16,
    marginTop: 10,
   },
   errorContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
   },
   errorText: {
    color: '#FF6347',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
   },
  });

  export default LoanScreen;