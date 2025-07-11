import React, { useState, useMemo } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import emailjs from '@emailjs/browser';
import FormWrapper from '../components/FormWrapper';
import InputField from '../components/InputField';

export default function EditAppointmentPage({ appointment, db, owners, allPets, setView, setError }) {
    const [selectedOwnerId, setSelectedOwnerId] = useState(appointment.ownerId || '');
    const [selectedPetId, setSelectedPetId] = useState(appointment.petId || '');
    const [date, setDate] = useState(appointment.dateTime ? new Date(appointment.dateTime).toISOString().split('T')[0] : '');
    const [time, setTime] = useState(appointment.dateTime ? new Date(appointment.dateTime).toTimeString().substring(0,5) : '');
    const [reason, setReason] = useState(appointment.reason || '');
    const [status, setStatus] = useState(appointment.status || 'Scheduled');
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
            const appointmentRef = doc(db, `artifacts/default-pet-clinic/public/data/appointments`, appointment.id);
            await updateDoc(appointmentRef, { ownerId: selectedOwnerId, petId: selectedPetId, dateTime, reason, status });

            // Send email based on status
            const owner = owners.find(o => o.id === selectedOwnerId);
            const pet = allPets.find(p => p.id === selectedPetId);

            if (owner && pet && owner.email) {
                const templateParams = {
                    owner_name: `${owner.firstName} ${owner.lastName}`,
                    owner_email: owner.email,
                    pet_name: pet.name,
                    appointment_date: new Date(date).toLocaleDateString(),
                    appointment_time: time,
                    reason: reason,
                };
                
                let templateId = '';
                if (status === 'Completed' && appointment.status !== 'Completed') {
                    templateId = 'YOUR_COMPLETED_TEMPLATE_ID'; // Replace with your "Completed" template ID
                } else if (status === 'Canceled' && appointment.status !== 'Canceled') {
                    templateId = 'template_kzeizsm'; // Replace with your "Canceled" template ID
                }

                if (templateId) {
                    await emailjs.send(
                        'service_u6fytgq', // Replace with your EmailJS Service ID
                        templateId,
                        templateParams,
                        'hUE2q-nFU-UDEZhby' // Replace with your EmailJS Public Key
                    );
                }
            }

            setView('appointments');
        } catch (err) {
            console.error(err)
            setError('Failed to update appointment.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <FormWrapper title="Edit Appointment" onBack={() => setView('appointments')}>
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
                <InputField label="Status" type="select" value={status} onChange={e => setStatus(e.target.value)} required>
                    <option>Scheduled</option>
                    <option>Completed</option>
                    <option>Canceled</option>
                </InputField>
                <button type="submit" disabled={isSubmitting} className="w-full text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors disabled:opacity-50 bg-cyan-600 hover:bg-cyan-700">
                    {isSubmitting ? 'Updating...' : 'Update Appointment'}
                </button>
            </form>
        </FormWrapper>
    );
}