import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { sendPasswordResetEmail, fetchSignInMethodsForEmail } from 'firebase/auth';
import { auth } from '../../FirebaseConfig'; // Import Firebase auth instance
import { router } from 'expo-router';

const ForgotPasswordScreen = () => {
    const [email, setEmail] = useState('');

    const handleResetPassword = async () => {
        if (!email) {
            alert("Please enter your email address.");
            return;
        }

        try {
            const signInMethods = await fetchSignInMethodsForEmail(auth, email);
            console.log("Sign-in methods for email:", signInMethods); // Log the sign-in methods for debugging

            // Send password reset email
            await sendPasswordResetEmail(auth, email);
            alert("A password reset email has been sent to your email address.");
            router.push("./login"); // Redirect to login page after sending the email
        } catch (error) {
            console.error("Error resetting password:", error);
            alert("An error occurred while trying to reset the password. Please try again.");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Forgot Password</Text>
            <Text style={styles.subtitle}>
                Enter your email address below and we'll send you a link to reset your password.
            </Text>
            <TextInput
                style={styles.input}
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />
            <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
                <Text style={styles.buttonText}>Reset Password</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        backgroundColor: '#000',
    },
    title: {
        color: '#f5f5f5',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        color: '#f5f5f5',
    },
    input: {
        color: '#f5f5f5',
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#CDFF57',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ForgotPasswordScreen;