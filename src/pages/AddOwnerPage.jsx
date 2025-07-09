import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import FormWrapper from '../components/FormWrapper';
import InputField from '../components/InputField';

export default function AddOwnerPage({ db, userId, setView, setError }) {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!firstName || !lastName || !email) { setError('First Name, Last Name, and Email are required.'); return; }
        setIsSubmitting(true);
        setError('');
        try {
            await addDoc(collection(db, `artifacts/default-pet-clinic/public/data/owners`), { firstName, lastName, email, phone, address, userId, createdAt: serverTimestamp() });
            setView('owners');
        } catch (err) {
            setError('Failed to add owner.');
        } finally { setIsSubmitting(false); }
    };
    
    return (
        <FormWrapper title="Register New Owner" onBack={() => setView('owners')}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="First Name" type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                    <InputField label="Last Name" type="text" value={lastName} onChange={e => setLastName(e.target.value)} required />
                </div>
                <InputField label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                <InputField label="Phone Number" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
                <InputField label="Address" type="textarea" value={address} onChange={e => setAddress(e.target.value)} />
                <button type="submit" disabled={isSubmitting} className="w-full text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors disabled:opacity-50 bg-cyan-600 hover:bg-cyan-700">
                    {isSubmitting ? 'Saving...' : 'Save Owner'}
                </button>
            </form>
        </FormWrapper>
    );
}