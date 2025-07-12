import React, { useState, useMemo } from 'react';
import { deleteDoc, doc } from 'firebase/firestore';
import AppointmentTable from '../components/AppointmentTable';
import ConfirmationModal from '../components/ConfirmationModal';
import { Calendar, PlusCircle } from 'lucide-react';

export default function AppointmentsPage({ appointments, owners, pets, navigateTo, db }) {
    const [appointmentToDelete, setAppointmentToDelete] = useState(null);
    const now = new Date();
    
    const upcomingAppointments = useMemo(() => appointments.filter(a => new Date(a.dateTime) >= now).sort((a,b) => new Date(a.dateTime) - new Date(b.dateTime)), [appointments, now]);
    const pastAppointments = useMemo(() => appointments.filter(a => new Date(a.dateTime) < now).sort((a,b) => new Date(b.dateTime) - new Date(a.dateTime)), [appointments, now]);

    const handleDelete = async () => {
        if (!appointmentToDelete) return;
        try {
            await deleteDoc(doc(db, `artifacts/default-pet-clinic/public/data/appointments`, appointmentToDelete.id));
            setAppointmentToDelete(null);
        } catch (e) {
            console.error("Error deleting appointment:", e);
        }
    };
    
    return (
        <div className="max-w-7xl mx-auto">
             {appointmentToDelete && (
                <ConfirmationModal
                    title="Delete Appointment"
                    message={`Are you sure you want to delete the appointment for ${appointmentToDelete.petName} on ${new Date(appointmentToDelete.dateTime).toLocaleDateString()}?`}
                    onConfirm={handleDelete}
                    onCancel={() => setAppointmentToDelete(null)}
                    confirmColor="red"
                />
            )}
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
                <h1 className="text-4xl font-bold text-gray-800 flex items-center"><Calendar className="mr-3"/>Appointments</h1>
                <button onClick={() => navigateTo('addAppointment')} className="flex items-center justify-center bg-green-700 text-white font-bold py-2.5 px-5 rounded-lg shadow-md hover:bg-green-500 transition-colors">
                    <PlusCircle className="mr-2" size={20} />
                    Schedule Appointment
                </button>
            </div>
            
            <div className="space-y-10">
                <AppointmentTable 
                    title="Upcoming"
                    appointments={upcomingAppointments} 
                    owners={owners} 
                    pets={pets} 
                    onEdit={(appointment) => navigateTo('editAppointment', appointment)}
                    onDelete={setAppointmentToDelete}
                />
                <AppointmentTable 
                    title="Past"
                    appointments={pastAppointments} 
                    owners={owners} 
                    pets={pets} 
                    onEdit={(appointment) => navigateTo('editAppointment', appointment)}
                    onDelete={setAppointmentToDelete}
                />
            </div>
        </div>
    );
}