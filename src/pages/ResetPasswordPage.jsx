import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Logo from '../components/Logo';
import InputField from '../components/InputField';

export default function ResetPasswordPage({ auth, setError, error, navigateTo, confirmPasswordReset }) {
    const [searchParams] = useSearchParams();
    const [oobCode, setOobCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [passwordReset, setPasswordReset] = useState(false);

    useEffect(() => {
        const code = searchParams.get('oobCode');
        if (code) {
            setOobCode(code);
        } else {
            setError("Invalid password reset link.");
        }
    }, [searchParams, setError]);

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setError('');
        setIsSubmitting(true);

        try {
            await confirmPasswordReset(auth, oobCode, newPassword);
            setPasswordReset(true);
        } catch (err) {
            setError('Failed to reset password. The link may be invalid or expired.');
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
                    <h1 className="text-2xl font-bold text-gray-800 mt-4">Reset Password</h1>
                </div>

                {passwordReset ? (
                     <div className="p-3 bg-green-100 text-green-700 rounded-lg text-center text-sm">
                        Your password has been successfully reset. You can now log in with your new password.
                    </div>
                ) : (
                    <form className="mt-6 space-y-6" onSubmit={handleResetPassword}>
                        {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-center text-sm">{error}</div>}
                        
                        <InputField 
                            label="New Password" 
                            type="password" 
                            value={newPassword} 
                            onChange={e => setNewPassword(e.target.value)} 
                            required 
                            placeholder="••••••••"
                        />
                         <InputField 
                            label="Confirm New Password" 
                            type="password" 
                            value={confirmPassword} 
                            onChange={e => setConfirmPassword(e.target.value)} 
                            required 
                            placeholder="••••••••"
                        />
                        
                        <div>
                            <button 
                                type="submit" 
                                disabled={isSubmitting || !oobCode} 
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white  bg-cyan-700 hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-300 disabled:bg-cyan-900 transition-colors"
                            >
                                {isSubmitting ? 'Resetting...' : 'Reset Password'}
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