import React, { useState, useMemo } from 'react';
import { doc, deleteDoc, writeBatch, collection, query, where, getDocs } from 'firebase/firestore';
import ConfirmationModal from '../components/ConfirmationModal';
import InputField from '../components/InputField';
import { User, PlusCircle, Edit, Trash2 } from 'lucide-react';

export default function HomePage({ owners, handleSelectOwner, navigateTo, db, allPets, allAppointments, allMedicalRecords }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [ownerToDelete, setOwnerToDelete] = useState(null);

    const filteredOwners = useMemo(() => owners.filter(o => 
        `${o.firstName} ${o.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    ), [owners, searchTerm]);
    
    const handleDelete = async (owner) => {
        if (!owner) return;
        
        try {
            const batch = writeBatch(db);
            const ownerRef = doc(db, `artifacts/default-pet-clinic/public/data/owners`, owner.id);
            batch.delete(ownerRef);

            const petsToDelete = allPets.filter(p => p.ownerId === owner.id);
            const petIdsToDelete = petsToDelete.map(p => p.id);
            petsToDelete.forEach(pet => {
                const petRef = doc(db, `artifacts/default-pet-clinic/public/data/pets`, pet.id);
                batch.delete(petRef);
            });

            const appointmentsToDelete = allAppointments.filter(a => a.ownerId === owner.id);
            appointmentsToDelete.forEach(appointment => {
                const appointmentRef = doc(db, `artifacts/default-pet-clinic/public/data/appointments`, appointment.id);
                batch.delete(appointmentRef);
            });
            
            const recordsToDelete = allMedicalRecords.filter(r => petIdsToDelete.includes(r.petId));
            recordsToDelete.forEach(record => {
                 const recordRef = doc(db, `artifacts/default-pet-clinic/public/data/medicalRecords`, record.id);
                 batch.delete(recordRef);
            });
            
            await batch.commit();
        } catch (e) {
            console.error("Error deleting owner and related data: ", e);
        } finally {
             setOwnerToDelete(null);
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            {ownerToDelete && (
                <ConfirmationModal
                    title="Delete Owner"
                    message={`Are you sure you want to delete ${ownerToDelete.firstName} ${ownerToDelete.lastName}? This will also delete all associated pets, appointments, and medical records.`}
                    onConfirm={() => handleDelete(ownerToDelete)}
                    onCancel={() => setOwnerToDelete(null)}
                    confirmColor="red"
                />
            )}
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
                <h1 className="text-4xl font-bold text-gray-800 flex items-center"><User className="mr-3"/>Owners</h1>
                <div className="flex-grow md:flex-grow-0 md:w-72">
                    <InputField type="text" placeholder="Search by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} noLabel />
                </div>
                <button onClick={() => navigateTo('addOwner')} className="w-full md:w-auto flex items-center justify-center bg-cyan-600 text-white font-bold py-2.5 px-5 rounded-lg shadow-md hover:bg-cyan-700 transition-colors">
                    <PlusCircle className="mr-2" size={20} /> Add Owner
                </button>
            </div>
            {filteredOwners.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed"><p className="text-gray-500">{owners.length > 0 ? "No owners match your search." : "No owners found. Get started by adding one!"}</p></div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Name</th>
                                <th scope="col" className="px-6 py-3">Contact</th>
                                <th scope="col" className="px-6 py-3">Address</th>
                                <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOwners.map(owner => (
                                <tr key={owner.id} className="bg-white border-b hover:bg-gray-50">
                                    <td onClick={() => handleSelectOwner('ownerDetails', owner)} className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap cursor-pointer">
                                        {`${owner.firstName} ${owner.lastName}`}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span>{owner.email}</span>
                                            <span className="text-xs text-gray-400">{owner.phone}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{owner.address}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button onClick={() => navigateTo('editOwner', owner)} className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => setOwnerToDelete(owner)} className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100">
                                                <Trash2 size={16} />
                                            </button>
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