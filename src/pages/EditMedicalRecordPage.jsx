import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import FormWrapper from '../components/FormWrapper';
import InputField from '../components/InputField';
import { UploadCloud } from 'lucide-react';

export default function EditMedicalRecordPage({ record, pet, owner, db, userId, setError, setView }) {
    const [recordDate, setRecordDate] = useState(record.recordDate ? new Date(record.recordDate).toISOString().split('T')[0] : '');
    const [diagnosticTest, setDiagnosticTest] = useState(record.diagnosticTest || '');
    const [testResult, setTestResult] = useState(record.testResult || '');
    const [diagnosis, setDiagnosis] = useState(record.diagnosis || '');
    const [treatment, setTreatment] = useState(record.treatment || '');
    const [prescribedMedicine, setPrescribedMedicine] = useState(record.prescribedMedicine || '');
    const [followUpDate, setFollowUpDate] = useState(record.followUpDate ? new Date(record.followUpDate).toISOString().split('T')[0] : '');
    const [followUpTime, setFollowUpTime] = useState(record.followUpDate ? new Date(record.followUpDate).toTimeString().substring(0,5) : '');
    const [notes, setNotes] = useState(record.notes || '');
    const [payment, setPayment] = useState(record.payment || '');
    const [fileName, setFileName] = useState(record.fileName || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

     const diagnosticOptions = [
        'Blood Test', 'X-Ray', 'Urine Test', 'Ultrasound', 'Skin Test', 'Other'
    ];
    
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFileName(e.target.files[0].name);
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        
        try {
            const recordRef = doc(db, `artifacts/default-pet-clinic/public/data/medicalRecords`, record.id);
            const recordData = {
                ...record, // preserve existing data
                recordDate: new Date(recordDate),
                diagnosticTest,
                testResult,
                diagnosis,
                treatment,
                prescribedMedicine,
                notes,
                payment: Number(payment) || 0,
                followUpDate: followUpDate ? new Date(`${followUpDate}T${followUpTime || '00:00'}`) : null,
                fileName,
            };
            await updateDoc(recordRef, recordData);
            setView('petDetails', pet);
        } catch (err) {
            console.error("Failed to update medical record:", err);
            setError('Failed to update record. Check console for details.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
         <FormWrapper title={`Edit Record for ${pet.name}`} onBack={() => setView('petDetails', pet)}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <InputField label="Date of Record" type="date" value={recordDate} onChange={e => setRecordDate(e.target.value)} required />
                    <InputField label="Payment Amount ($)" type="number" value={payment} onChange={e => setPayment(e.target.value)} placeholder="0.00" />

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Diagnostic Test</label>
                        <InputField type="select" value={diagnosticTest} onChange={e => setDiagnosticTest(e.target.value)} noLabel>
                             <option value="">Select Test</option>
                             {diagnosticOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </InputField>
                    </div>
                    <InputField label="Test Result" type="textarea" value={testResult} onChange={e => setTestResult(e.target.value)} placeholder="Enter test results" className="md:col-span-2" />
                    <InputField label="Diagnosis" type="textarea" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="e.g., Allergic reaction" className="md:col-span-2" />
                    <InputField label="Treatment" type="textarea" value={treatment} onChange={e => setTreatment(e.target.value)} placeholder="e.g., Administered antihistamine" className="md:col-span-2" />
                    <InputField label="Prescribed Medicine" type="textarea" value={prescribedMedicine} onChange={e => setPrescribedMedicine(e.target.value)} placeholder="e.g., Amoxicillin 250mg, 1 tablet twice a day for 7 days" className="md:col-span-2" />
                    <InputField label="General Notes" type="textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add any general notes about the visit..." className="md:col-span-2" />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Follow-up Appointment</label>
                        <div className="grid grid-cols-2 gap-4">
                             <InputField type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} noLabel />
                             <InputField type="time" value={followUpTime} onChange={e => setFollowUpTime(e.target.value)} noLabel />
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Upload Report (Optional)</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="flex text-sm text-gray-600">
                                    <label htmlFor="file-upload-edit" className="relative cursor-pointer bg-white rounded-md font-medium text-cyan-600 hover:text-cyan-500 focus-within:outline-none">
                                        <span>Upload a file</span>
                                        <input id="file-upload-edit" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.jpg,.png" />
                                    </label>
                                </div>
                                <p className="text-xs text-gray-500">{fileName ? `Selected: ${fileName}` : 'PDF, PNG, JPG up to 10MB'}</p>
                                <p className="text-xs text-yellow-600">(Note: File upload is simulated and not stored.)</p>
                            </div>
                        </div>
                    </div>
                </div>

                <button type="submit" disabled={isSubmitting} className={`w-full text-white font-bold py-2.5 px-4 rounded-lg shadow-md transition-colors disabled:opacity-50 bg-cyan-600 hover:bg-cyan-700 mt-6`}>
                    {isSubmitting ? 'Updating...' : 'Update Record'}
                </button>
            </form>
         </FormWrapper>
    )
}