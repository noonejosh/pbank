// app/(tabs)/requestloan.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../FirebaseConfig'; // Adjust path if necessary

// Consider installing `@react-native-picker/picker` for better dropdowns:
// `npx expo install @react-native-picker/picker`
// import { Picker } from '@react-native-picker/picker';

const RequestLoanForm = () => {
  const { uid } = useLocalSearchParams();
  const [loanAmount, setLoanAmount] = useState('');
  const [loanPurpose, setLoanPurpose] = useState(''); // Using TextInput for simplicity. Use Picker for better UX.
  const [loanTenure, setLoanTenure] = useState('');
  const [annualIncome, setAnnualIncome] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState(''); // Using TextInput for simplicity. Use Picker for better UX.
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!loanAmount || !loanTenure || !loanPurpose || !annualIncome || !employmentStatus) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    const amountNum = parseFloat(loanAmount);
    const tenureNum = parseInt(loanTenure, 10);
    const incomeNum = parseFloat(annualIncome);

    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid loan amount greater than zero.');
      return;
    }
    if (isNaN(tenureNum) || tenureNum <= 0) {
      Alert.alert('Invalid Tenure', 'Please enter a valid loan tenure in months (e.g., 12, 24).');
      return;
    }
    if (isNaN(incomeNum) || incomeNum <= 0) {
      Alert.alert('Invalid Income', 'Please enter a valid annual income greater than zero.');
      return;
    }

    if (!uid || typeof uid !== 'string') {
      Alert.alert('Authentication Error', 'User ID is missing. Please log in again.');
      return;
    }

    setLoading(true);
    try {
      // Simulate EMI and Total Payable calculation (for demonstration purposes)
      // In a real application, this might involve more complex logic or API calls.
      const interestRate = 0.08; // Example: 8% annual interest rate
      const monthlyInterestRate = interestRate / 12;
      const numberOfPayments = tenureNum;
      
      // EMI formula (simplified for illustration, can vary)
      // M = P [ i(1 + i)^n ] / [ (1 + i)^n – 1]
      // M = Monthly Payment, P = Principal Loan Amount, i = Monthly Interest Rate, n = Number of Payments
      let emiAmount = 0;
      let totalPayable = 0;

      if (monthlyInterestRate > 0) {
        emiAmount = amountNum * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
        totalPayable = emiAmount * numberOfPayments;
      } else {
        // For 0% interest or simple loan without compounding
        emiAmount = amountNum / numberOfPayments;
        totalPayable = amountNum;
      }
      
      const newLoanRequest = {
        loanAmount: amountNum,
        purpose: loanPurpose,
        tenureMonths: tenureNum,
        annualIncome: incomeNum,
        employmentStatus: employmentStatus,
        status: 'pending', // Loan status: 'pending', 'approved', 'rejected', 'disbursed'
        requestedAt: new Date().toISOString(),
        emiAmount: parseFloat(emiAmount.toFixed(2)), // Store as number, rounded to 2 decimal places
        interestRate: interestRate,
        totalPayable: parseFloat(totalPayable.toFixed(2)),
        nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Approx. 1 month from request
        disbursementDate: '', // To be updated when loan is approved/disbursed
        totalPaid: 0,
        uid: uid, // Store user ID with the loan request
      };

      // Add the loan request to a new subcollection 'loanApplications' under the user's document
      // This keeps pending requests separate from active loans in 'loans' collection
      await addDoc(collection(db, `users/${uid}/loanApplications`), newLoanRequest);

      Alert.alert(
        'Request Submitted',
        'Your loan application has been successfully submitted! We will review it shortly.',
      );
      router.back(); // Navigate back to the LoanScreen
    } catch (error) {
      console.error("Error submitting loan request: ", error);
      Alert.alert('Submission Failed', 'Could not submit your loan request. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#CDFF57" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request a New Loan</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.formArea} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Desired Loan Amount (PHP)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="e.g., 50000"
          placeholderTextColor="#888"
          value={loanAmount}
          onChangeText={setLoanAmount}
        />

        <Text style={styles.label}>Loan Purpose</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Education, Business, Personal"
          placeholderTextColor="#888"
          value={loanPurpose}
          onChangeText={setLoanPurpose}
        />
        {/* Example using Picker (requires @react-native-picker/picker installation):
        <Picker
          selectedValue={loanPurpose}
          style={styles.picker}
          onValueChange={(itemValue) => setLoanPurpose(itemValue)}
        >
          <Picker.Item label="Select Purpose" value="" enabled={false} />
          <Picker.Item label="Education" value="Education" />
          <Picker.Item label="Business" value="Business" />
          <Picker.Item label="Medical" value="Medical" />
          <Picker.Item label="Personal" value="Personal" />
          <Picker.Item label="Home Improvement" value="Home Improvement" />
        </Picker>
        */}

        <Text style={styles.label}>Loan Tenure (Months)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="e.g., 12, 24, 36"
          placeholderTextColor="#888"
          value={loanTenure}
          onChangeText={setLoanTenure}
        />

        <Text style={styles.label}>Annual Income (PHP)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="e.g., 300000"
          placeholderTextColor="#888"
          value={annualIncome}
          onChangeText={setAnnualIncome}
        />

        <Text style={styles.label}>Employment Status</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Employed, Self-Employed, Unemployed"
          placeholderTextColor="#888"
          value={employmentStatus}
          onChangeText={setEmploymentStatus}
        />
        {/* Example using Picker (requires @react-native-picker/picker installation):
        <Picker
          selectedValue={employmentStatus}
          style={styles.picker}
          onValueChange={(itemValue) => setEmploymentStatus(itemValue)}
        >
          <Picker.Item label="Select Status" value="" enabled={false} />
          <Picker.Item label="Employed" value="Employed" />
          <Picker.Item label="Self-Employed" value="Self-Employed" />
          <Picker.Item label="Unemployed" value="Unemployed" />
          <Picker.Item label="Student" value="Student" />
          <Picker.Item label="Retired" value="Retired" />
        </Picker>
        */}

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Submitting...' : 'Submit Loan Request'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#CDFF57',
  },
  headerSpacer: {
    width: 24,
  },
  formArea: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 14,
    color: '#CDFF57',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#222',
    color: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#444',
  },
  picker: { // Styles for @react-native-picker/picker
    backgroundColor: '#222',
    color: '#fff',
    borderRadius: 8,
    marginBottom: 20,
    height: 50, // Required for iOS for height
    width: '100%',
    borderWidth: 1,
    borderColor: '#444',
  },
  // pickerItem: { // This style is for Android picker items specifically. iOS items are styled via the picker prop.
  //   color: '#fff',
  //   backgroundColor: '#222',
  // },
  submitButton: {
    backgroundColor: '#CDFF57',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  submitButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RequestLoanForm; 