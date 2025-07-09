import React, { useState } from 'react';
import { collection, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import FormWrapper from '../components/FormWrapper';
import InputField from '../components/InputField';
import { User, PawPrint } from 'lucide-react';

export default function QuickRegisterPage({ db, userId, setView, setError }) {
    // Owner State
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');

    // Pet State
    const [petName, setPetName] = useState('');
    const [species, setSpecies] = useState('Dog');
    const [breed, setBreed] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('Male');
    
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Validation
        if (!firstName || !lastName || !email || !petName || !species) {
            setError('Owner First/Last Name, Email, and Pet Name/Species are required.');
            return;
        }
        
        setIsSubmitting(true);
        setError('');

        try {
            const batch = writeBatch(db);
            
            const ownerRef = doc(collection(db, `artifacts/default-pet-clinic/public/data/owners`));
            batch.set(ownerRef, { 
                firstName, lastName, email, phone, address, 
                userId, 
                createdAt: serverTimestamp() 
            });

            const petRef = doc(collection(db, `artifacts/default-pet-clinic/public/data/pets`));
            batch.set(petRef, {
                name: petName, species, breed, age, gender,
                ownerId: ownerRef.id, 
                userId,
                createdAt: serverTimestamp()
            });

            await batch.commit();

            setView('ownerDetails', { id: ownerRef.id, firstName, lastName, email, phone, address });

        } catch (err) {
            console.error("Quick registration failed:", err);
            setError('Failed to register owner and pet.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <FormWrapper title="Quick Register" onBack={() => setView('dashboard')}>
            <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-4 pb-2 border-b flex items-center">
                        <User className="mr-2 h-5 w-5" /> Owner Information
                    </h3>
                    <div className="space-y-6 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="First Name" type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                            <InputField label="Last Name" type="text" value={lastName} onChange={e => setLastName(e.target.value)} required />
                        </div>
                        <InputField label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                        <InputField label="Phone Number" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
                        <InputField label="Address" type="textarea" value={address} onChange={e => setAddress(e.target.value)} />
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-4 pb-2 border-b flex items-center">
                       <PawPrint className="mr-2 h-5 w-5" /> Pet Information
                    </h3>
                    <div className="space-y-6 mt-4">
                        <InputField label="Pet's Name" type="text" value={petName} onChange={e => setPetName(e.target.value)} required />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="Species" type="select" value={species} onChange={e => setSpecies(e.target.value)}>
                                <option>Dog</option><option>Cat</option><option>Rabbit</option>
                                <option>Bird</option><option>Fish</option><option>Reptile</option>
                                <option>Other</option>
                            </InputField>
                            <InputField label="Breed" type="text" value={breed} onChange={e => setBreed(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="Age" type="text" value={age} onChange={e => setAge(e.target.value)} />
                            <InputField label="Gender" type="select" value={gender} onChange={e => setGender(e.target.value)}>
                                <option>Male</option><option>Female</option>
                            </InputField>
                        </div>
                    </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors disabled:opacity-50 bg-green-500 hover:bg-green-600">
                    {isSubmitting ? 'Registering...' : 'Register Owner & Pet'}
                </button>
            </form>
        </FormWrapper>
    );
}