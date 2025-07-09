import React, { useState, useMemo } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import FormWrapper from '../components/FormWrapper';
import InputField from '../components/InputField';

export default function AddAppointmentPage({ db, userId, owners, allPets, setView, setError }) {
    const [selectedOwnerId, setSelectedOwnerId] = useState('');
    const [selectedPetId, setSelectedPetId] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const availablePets = useMemo(() => {
        if (!selectedOwnerId) return [];
        return allPets.filter(p => p.ownerId === selectedOwnerId);
    }, [selectedOwnerId, allPets]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedOwnerId || !selectedPetId || !date || !time || !reason) { setError('All fields are required.'); return; }
        setIsSubmitting(true);
        setError('');
        try {
            const dateTime = new Date(`${date}T${time}`);
            await addDoc(collection(db, `artifacts/default-pet-clinic/public/data/appointments`), { 
                ownerId: selectedOwnerId, 
                petId: selectedPetId, 
                dateTime, 
                reason, 
                status: 'Scheduled',
                userId, 
                createdAt: serverTimestamp() 
            });
            setView('appointments');
        } catch (err) {
            setError('Failed to add appointment.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <FormWrapper title="Schedule New Appointment" onBack={() => setView('appointments')}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <InputField label="Owner" type="select" value={selectedOwnerId} onChange={e => setSelectedOwnerId(e.target.value)} required>
                    <option value="">Select an Owner</option>
                    {owners.map(o => <option key={o.id} value={o.id}>{`${o.firstName} ${o.lastName}`}</option>)}
                </InputField>
                <InputField label="Pet" type="select" value={selectedPetId} onChange={e => setSelectedPetId(e.target.value)} required disabled={!selectedOwnerId}>
                    <option value="">Select a Pet</option>
                    {availablePets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </InputField>
                <div className="grid grid-cols-2 gap-4">
                    <InputField label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
                    <InputField label="Time" type="time" value={time} onChange={e => setTime(e.target.value)} required />
                </div>
                <InputField label="Reason for Visit" type="text" value={reason} onChange={e => setReason(e.target.value)} required />
                <button type="submit" disabled={isSubmitting} className="w-full text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors disabled:opacity-50 bg-cyan-600 hover:bg-cyan-700">
                    {isSubmitting ? 'Saving...' : 'Schedule Appointment'}
                </button>
            </form>
        </FormWrapper>
    );
}