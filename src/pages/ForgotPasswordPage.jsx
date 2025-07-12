import React, { useState } from 'react';
import Logo from '../components/Logo';
import InputField from '../components/InputField';

export default function ForgotPasswordPage({ auth, setError, error, navigateTo, sendPasswordResetEmail }) {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await sendPasswordResetEmail(auth, email);
            setEmailSent(true);
        } catch (err) {
            setError('Failed to send password reset email. Please check the email address and try again.');
            console.error("Password reset failed:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="w-full max-w-sm mx-auto p-8 space-y-6 bg-white rounded-2xl shadow-xl">
                <div className="flex flex-col items-center">
                    <Logo className="text-gray-800" />
                    <h1 className="text-2xl font-bold text-gray-800 mt-4">Forgot Password</h1>
                </div>

                {emailSent ? (
                    <div className="p-3 bg-green-100 text-green-700 rounded-lg text-center text-sm">
                        A password reset link has been sent to your email address.
                    </div>
                ) : (
                    <form className="mt-6 space-y-6" onSubmit={handleResetPassword}>
                        {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-center text-sm">{error}</div>}
                        
                        <InputField 
                            label="Email Address" 
                            type="email" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            required 
                            placeholder="your-email@example.com" 
                        />
                        
                        <div>
                            <button 
                                type="submit" 
                                disabled={isSubmitting} 
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-cyan-700 hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-300 disabled:bg-cyan-900 transition-colors"
                            >
                                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </div>
                    </form>
                )}
                 <div className="text-sm text-center">
                    <a href="#" onClick={() => navigateTo('login')} className="font-medium text-cyan-600 hover:text-cyan-500">
                        Back to Login
                    </a>
                </div>
            </div>
        </div>
    );
}