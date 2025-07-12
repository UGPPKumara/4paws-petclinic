import React, { useState } from 'react';
import { doc, deleteDoc } from 'firebase/firestore';
import ConfirmationModal from '../components/ConfirmationModal';
import MedicalRecordsList from '../components/MedicalRecordsList';
import BackButton from '../components/BackButton';
import { PlusCircle } from 'lucide-react';

export default function PetDetailsPage({ pet, owner, records, db, userId, handleBack, setError, navigateTo }) {
    const [recordToDelete, setRecordToDelete] = useState(null);

    const handleDelete = async () => {
        if (!recordToDelete) return;
        try {
            await deleteDoc(doc(db, `artifacts/default-pet-clinic/public/data/medicalRecords`, recordToDelete.id));
            setRecordToDelete(null);
        } catch (e) {
            console.error("Error deleting medical record:", e);
            setError("Failed to delete medical record.");
        }
    }

    if (!pet || !owner) return <div className="text-center p-8">Pet or owner data not found.</div>;
    
    return (
        <div className="max-w-7xl mx-auto">
            {recordToDelete && (
                <ConfirmationModal
                    title="Delete Medical Record"
                    message={`Are you sure you want to delete this medical record from ${new Date(recordToDelete.recordDate).toLocaleDateString()}? This action cannot be undone.`}
                    onConfirm={handleDelete}
                    onCancel={() => setRecordToDelete(null)}
                    confirmColor="red"
                />
            )}
            <BackButton onBack={handleBack} />
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border">
                <div className="flex flex-col sm:flex-row items-center text-center sm:text-left sm:space-x-5">
                    <img 
                        src={pet.imageUrl || `https://placehold.co/100x100/06b6d4/ffffff?text=${pet.name.charAt(0)}`}
                        alt={pet.name}
                        className="w-24 h-24 rounded-full object-cover flex-shrink-0 mb-4 sm:mb-0"
                        onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/100x100/06b6d4/ffffff?text=${pet.name.charAt(0)}`; }}
                    />
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">{pet.name}</h1>
                        <p className="text-gray-500">{pet.species} | {pet.breed} | {pet.gender}</p>
                        <p className="text-gray-500 mt-1">Age: {pet.age}</p>
                        <p className="text-gray-500 mt-1">Owner: {`${owner.firstName} ${owner.lastName}`}</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-700">Medical History</h2>
                <button onClick={() => navigateTo('addMedicalRecord', pet)} className="flex items-center justify-center bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-green-500 transition-colors">
                    <PlusCircle className="mr-2" size={20} /> Add Record
                </button>
            </div>
            <MedicalRecordsList 
                records={records}
                onEdit={(record) => navigateTo('editMedicalRecord', record)}
                onDelete={setRecordToDelete}
            />
        </div>
    );
}