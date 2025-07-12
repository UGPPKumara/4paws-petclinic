import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import Logo from '../components/Logo';
import InputField from '../components/InputField';
import { Link } from 'react-router-dom';

export default function LoginPage({ auth, setError, error, navigateTo }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            setError('Invalid credentials. Please try again.');
            console.error("Login failed:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100 p-4 overflow-hidden">
            <div className="w-full max-w-sm mx-auto p-8 space-y-6 bg-white rounded-2xl shadow-xl">
                <div className="flex flex-col items-center">
                    <Logo className="text-gray-800" />
                    <h1 className="text-2xl font-bold text-gray-800 mt-4">Clinic Admin Login</h1>
                </div>

                <form className="mt-6 space-y-6" onSubmit={handleLogin}>
                    {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-center text-sm">{error}</div>}
                    
                    <InputField 
                        label="Email Address" 
                        type="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        required 
                        placeholder="Enter your email" 
                    />
                    <InputField 
                        label="Password" 
                        type="password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required 
                        placeholder="Enter you password"
                    />
                     <div className="text-sm text-right">
                        <a href="#" onClick={() => navigateTo('forgotPassword')} className="font-medium text-cyan-600 hover:text-cyan-500">
                            Forgot Password?
                        </a>
                    </div>
                    
                    <div>
                        <button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-cyan-700 hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-300 disabled:bg-cyan-900 transition-colors"
                        >
                            {isSubmitting ? 'Signing in...' : 'Sign in'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}