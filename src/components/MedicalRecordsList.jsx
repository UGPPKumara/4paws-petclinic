import React from 'react';
import { Edit, Trash2, Download } from 'lucide-react';

export default function MedicalRecordsList({ records, onEdit, onDelete }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border h-full">
            {records.length === 0 ? (
                <div className="text-center py-10"><p className="text-gray-500">No medical records found.</p></div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                         <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Diagnosis & Treatment</th>
                                <th className="px-4 py-3">Prescription & Notes</th>
                                <th className="px-4 py-3">Payment</th>
                                <th className="px-4 py-3">Follow-up</th>
                                <th className="px-4 py-3">File</th>
                                <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                         </thead>
                         <tbody>
                            {records.map(record => (
                                <tr key={record.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-4 py-4 font-medium text-gray-900 whitespace-nowrap">
                                        {new Date(record.recordDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-4 max-w-sm">
                                        <p><strong>Test:</strong> {record.diagnosticTest || 'N/A'}</p>
                                        <p className="truncate"><strong>Result:</strong> {record.testResult || 'N/A'}</p>
                                        <p><strong>Diagnosis:</strong> {record.diagnosis || 'N/A'}</p>
                                        <p className="truncate"><strong>Treatment:</strong> {record.treatment || 'N/A'}</p>
                                    </td>
                                    <td className="px-4 py-4 max-w-sm">
                                        <p className="truncate"><strong>Prescription:</strong> {record.prescribedMedicine || 'N/A'}</p>
                                        <p className="pt-1 mt-1 border-t border-gray-200 truncate"><strong>Notes:</strong> {record.notes || 'N/A'}</p>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        ${(record.payment || 0).toFixed(2)}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        {record.followUpDate ? new Date(record.followUpDate).toLocaleDateString() : 'None'}
                                    </td>
                                     <td className="px-4 py-4">
                                        {record.fileName ? (
                                            <button className="flex items-center text-cyan-600 hover:text-cyan-800" title="Download is not available in this environment">
                                                <Download size={16} className="mr-1" />
                                                <span className="truncate max-w-28">{record.fileName}</span>
                                            </button>
                                        ) : 'None'}
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                         <div className="flex items-center justify-end space-x-1">
                                            <button onClick={() => onEdit(record)} className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100"><Edit size={16} /></button>
                                            <button onClick={() => onDelete(record)} className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100"><Trash2 size={16} /></button>
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