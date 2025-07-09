import React from 'react';
import { Edit, Trash2 } from 'lucide-react';

export default function AppointmentTable({ title, appointments, owners, pets, onEdit, onDelete }) {
    const getAppointmentDetails = (appointment) => {
        const owner = owners.find(o => o.id === appointment.ownerId);
        const pet = pets.find(p => p.id === appointment.petId);
        return {
            ownerName: owner ? `${owner.firstName} ${owner.lastName}` : 'N/A',
            petName: pet ? pet.name : 'N/A',
        }
    };

    const StatusBadge = ({ status }) => {
        const statusStyles = {
            Scheduled: 'bg-blue-100 text-blue-800',
            Completed: 'bg-green-100 text-green-800',
            Canceled: 'bg-red-100 text-red-800',
        };
        return (
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
                {status}
            </span>
        );
    };

    return (
        <div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4 pb-2 border-b-2">{title}</h2>
            {appointments.length > 0 ? (
                 <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Pet</th>
                                <th scope="col" className="px-6 py-3">Owner</th>
                                <th scope="col" className="px-6 py-3">Date & Time</th>
                                <th scope="col" className="px-6 py-3">Reason</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {appointments.map(app => {
                                const { petName, ownerName } = getAppointmentDetails(app);
                                return (
                                <tr key={app.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{petName}</td>
                                    <td className="px-6 py-4">{ownerName}</td>
                                    <td className="px-6 py-4">{new Date(app.dateTime).toLocaleString([], {dateStyle: 'medium', timeStyle: 'short'})}</td>
                                    <td className="px-6 py-4">{app.reason}</td>
                                    <td className="px-6 py-4"><StatusBadge status={app.status}/></td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button onClick={() => onEdit(app)} className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100"><Edit size={16} /></button>
                                            <button onClick={() => onDelete({ ...app, petName })} className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                                )
                            })}
                        </tbody>
                    </table>
                 </div>
            ) : (
                <div className="text-center py-10 bg-white rounded-xl border border-dashed"><p className="text-gray-500">No {title.toLowerCase()} appointments.</p></div>
            )}
        </div>
    );
}