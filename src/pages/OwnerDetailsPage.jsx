import React, { useState, useMemo } from 'react';
import { doc, deleteDoc, writeBatch, collection, query, where, getDocs } from 'firebase/firestore';
import ConfirmationModal from '../components/ConfirmationModal';
import InputField from '../components/InputField';
import { User, PawPrint, PlusCircle, Edit, Trash2 } from 'lucide-react';
import BackButton from '../components/BackButton';

export default function OwnerDetailsPage({ owner, pets, handleSelectPet, navigateTo, db }) {
    const [petToDelete, setPetToDelete] = useState(null);
    const [petSearchTerm, setPetSearchTerm] = useState('');

    const filteredPets = useMemo(() => {
        if (!petSearchTerm) return pets;
        return pets.filter(pet => 
            pet.name.toLowerCase().includes(petSearchTerm.toLowerCase()) ||
            pet.species.toLowerCase().includes(petSearchTerm.toLowerCase()) ||
            pet.breed.toLowerCase().includes(petSearchTerm.toLowerCase())
        );
    }, [pets, petSearchTerm]);
    
    const handleDeletePet = async (petId) => {
        if (!petId) return;

        const batch = writeBatch(db);
        const petRef = doc(db, `artifacts/default-pet-clinic/public/data/pets`, petId);
        batch.delete(petRef);

        const recordsQuery = query(collection(db, `artifacts/default-pet-clinic/public/data/medicalRecords`), where('petId', '==', petId));
        const appointmentsQuery = query(collection(db, `artifacts/default-pet-clinic/public/data/appointments`), where('petId', '==', petId));
        
        try {
            const [recordsSnapshot, appointmentsSnapshot] = await Promise.all([getDocs(recordsQuery), getDocs(appointmentsQuery)]);
            recordsSnapshot.forEach(recordDoc => batch.delete(recordDoc.ref));
            appointmentsSnapshot.forEach(appointmentDoc => batch.delete(appointmentDoc.ref));
            await batch.commit();
        } catch(e) {
            console.error("Error deleting pet and related data: ", e);
        } finally {
            setPetToDelete(null);
        }
    };

    if (!owner) return <div className="text-center p-8">Owner not found. Please go back to the owners list.</div>;

    return (
        <div className="max-w-7xl mx-auto">
            {petToDelete && (
                <ConfirmationModal
                    title="Delete Pet"
                    message={`Are you sure you want to delete ${petToDelete.name}? This will also delete all associated medical records and appointments.`}
                    onConfirm={() => handleDeletePet(petToDelete.id)}
                    onCancel={() => setPetToDelete(null)}
                    confirmColor="red"
                />
            )}
            <BackButton onBack={() => navigateTo('owners')} />
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border">
                <div className="flex items-center space-x-5">
                    <div className="bg-red-100 p-4 rounded-full"><User className="h-8 w-8 text-red-600" /></div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">{`${owner.firstName} ${owner.lastName}`}</h1>
                        <p className="text-gray-500">{owner.email} &bull; {owner.phone}</p>
                        <p className="text-gray-500 mt-1">{owner.address}</p>
                    </div>
                </div>
            </div>
            
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
                <h2 className="text-2xl font-semibold text-gray-700 flex items-center"><PawPrint className="mr-2"/> Pets</h2>
                <div className="flex-grow md:flex-grow-0 md:w-60">
                     <InputField 
                        type="text" 
                        placeholder="Search pets..." 
                        value={petSearchTerm} 
                        onChange={(e) => setPetSearchTerm(e.target.value)} 
                        noLabel 
                    />
                </div>
                <button onClick={() => navigateTo('addPet', owner)} className="w-full md:w-auto flex items-center justify-center bg-green-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-green-600 transition-colors">
                    <PlusCircle className="mr-2" size={20} /> Add Pet
                </button>
            </div>
            {pets.length === 0 ? (
                 <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed"><p className="text-gray-500">This owner has no registered pets.</p></div>
            ) : filteredPets.length === 0 ? (
                 <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed"><p className="text-gray-500">No pets match your search.</p></div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Image</th>
                                <th scope="col" className="px-6 py-3">Name</th>
                                <th scope="col" className="px-6 py-3">Species</th>
                                <th scope="col" className="px-6 py-3">Breed</th>
                                <th scope="col" className="px-6 py-3">Age</th>
                                <th scope="col" className="px-6 py-3">Gender</th>
                                <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPets.map(pet => (
                                <tr key={pet.id} className="bg-white border-b hover:bg-gray-50">
                                     <td className="px-6 py-4">
                                        <img src={pet.imageUrl || `https://placehold.co/40x40/06b6d4/ffffff?text=${pet.name.charAt(0)}`} alt={pet.name} className="w-10 h-10 rounded-full object-cover"/>
                                     </td>
                                    <td onClick={() => handleSelectPet('petDetails', pet)} className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap cursor-pointer">{pet.name}</td>
                                    <td className="px-6 py-4">{pet.species}</td>
                                    <td className="px-6 py-4">{pet.breed}</td>
                                    <td className="px-6 py-4">{pet.age}</td>
                                    <td className="px-6 py-4">{pet.gender}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button onClick={() => navigateTo('editPet', pet)} className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100"><Edit size={16} /></button>
                                            <button onClick={() => setPetToDelete(pet)} className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}