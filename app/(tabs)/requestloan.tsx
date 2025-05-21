import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  ScrollView,
  Keyboard,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db } from '@/FirebaseConfig';
import { addDoc, collection } from 'firebase/firestore';

const RequestLoanScreen = () => {
  const { uid, accountNumber } = useLocalSearchParams();
  const router = useRouter();

  const [loanAmount, setLoanAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [tenureMonths, setTenureMonths] = useState('');
  const [annualIncome, setAnnualIncome] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emiAmount, setEmiAmount] = useState(0);
  const [interestRate] = useState(0.05);
  const [totalPayable, setTotalPayable] = useState(0);

  const calculateEMI = (
    amount: number,
    tenure: number,
    interest: number
  ) => {
    if (interest === 0) return amount / tenure;
    const r = interest / 12;
    const n = tenure;
    const p = amount;
    return (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  };

  const handleRequestLoan = async () => {
    setLoading(true);
    setError(null);

    // Trim all text fields
    const trimmedPurpose = purpose.trim();
    const trimmedEmploymentStatus = employmentStatus.trim();

    if (
      !loanAmount ||
      !trimmedPurpose ||
      !tenureMonths ||
      !annualIncome ||
      !trimmedEmploymentStatus
    ) {
      Alert.alert('Error', 'Please fill in all fields.');
      setLoading(false);
      return;
    }

    // Validate numeric fields
    const amount = parseFloat(loanAmount);
    const tenure = parseInt(tenureMonths, 10);
    const income = parseFloat(annualIncome);

    if (
      isNaN(amount) || amount <= 0 ||
      isNaN(tenure) || tenure <= 0 ||
      isNaN(income) || income <= 0
    ) {
      Alert.alert('Error', 'Please enter valid positive numbers for loan amount, tenure, and income.');
      setLoading(false);
      return;
    }
    try {
      const emi = calculateEMI(amount, tenure, interestRate);
      const totalPayable = emi * tenure;
      await addDoc(collection(db, 'users', uid as string, 'loanApplications'), {
        loanAmount: amount,
        purpose: trimmedPurpose,
        tenureMonths: tenure,
        emiAmount: emi,
        nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        disbursementDate: new Date().toISOString(),
        interestRate,
        totalPayable: totalPayable,
        totalPaid: 0,
        status: 'pending',
        balanceRemaining: amount,
        paymentPercentage: 0,
        annualIncome: income,
        employmentStatus: trimmedEmploymentStatus,
      });

      setEmiAmount(emi);
      setTotalPayable(totalPayable);

      setTimeout(() => {
        Alert.alert(
          'Success',
          'Loan request submitted successfully!',
          [{
            text: 'OK', onPress: () => router.push({
              pathname: '/(tabs)/loanscreen',
              params: { uid: uid }
            })
          }]
        );
        setLoading(false);
      }, 1000);
    } catch (err) {
      Alert.alert('Error', 'Failed to submit loan request.');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#CDFF57" />
        </TouchableOpacity>
        <Image source={require('../../assets/images/logo.png')} style={styles.headerLogoFull} resizeMode="contain" />
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Request a Loan</Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Loan Amount</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter loan amount"
            value={loanAmount}
            onChangeText={setLoanAmount}
            keyboardType="numeric"
            accessibilityLabel="Loan Amount"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Purpose of Loan</Text>
          <TextInput
            style={styles.input}
            placeholder="Purpose"
            value={purpose}
            onChangeText={setPurpose}
            accessibilityLabel="Purpose of Loan"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Tenure (Months)</Text>
          <TextInput
            style={styles.input}
            placeholder="Tenure in months"
            value={tenureMonths}
            onChangeText={setTenureMonths}
            keyboardType="numeric"
            accessibilityLabel="Tenure in Months"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Annual Income</Text>
          <TextInput
            style={styles.input}
            placeholder="Annual Income"
            value={annualIncome}
            onChangeText={setAnnualIncome}
            keyboardType="numeric"
            accessibilityLabel="Annual Income"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Employment Status</Text>
          <TextInput
            style={styles.input}
            placeholder="Employment Status"
            value={employmentStatus}
            onChangeText={setEmploymentStatus}
            accessibilityLabel="Employment Status"
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#CDFF57" />
        ) : (
          <TouchableOpacity style={styles.requestButton} onPress={handleRequestLoan} accessibilityLabel="Submit Loan Request">
            <Text style={styles.requestButtonText}>Submit Request</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#CDFF57',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    color: '#AAA',
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#1A1A1A',
    color: '#FFF',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    borderColor: '#333',
    borderWidth: 1,
  },
  requestButton: {
    backgroundColor: '#2A374B',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  requestButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  error: {
    color: '#FF6347',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default RequestLoanScreen;