import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp, doc, writeBatch } from 'firebase/firestore';
import FormWrapper from '../components/FormWrapper';
import InputField from '../components/InputField';
import { UploadCloud } from 'lucide-react';

export default function AddMedicalRecordPage({ pet, owner, db, userId, setError, setView }) {
    const today = new Date().toISOString().split('T')[0];
    const [recordDate, setRecordDate] = useState(today);
    const [diagnosticTest, setDiagnosticTest] = useState('');
    const [testResult, setTestResult] = useState('');
    const [diagnosis, setDiagnosis] = useState('');
    const [treatment, setTreatment] = useState('');
    const [prescribedMedicine, setPrescribedMedicine] = useState('');
    const [followUpDate, setFollowUpDate] = useState('');
    const [followUpTime, setFollowUpTime] = useState('');
    const [notes, setNotes] = useState('');
    const [payment, setPayment] = useState('');
    const [file, setFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const diagnosticOptions = [
        'Blood Test', 'X-Ray', 'Urine Test', 'Ultrasound', 'Skin Test', 'Other'
    ];
    
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        // --- Start of temporary debugging code ---
        
        try {
            let fileUrl = '';
            let fileName = '';

            // 1. Handle the file upload to Cloudinary (this part is working)
            if (file) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', 'pet-clinic'); // Replace with your preset name
                const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/prasanna-cloud/auto/upload`, { // Replace with your cloud name
                    method: 'POST',
                    body: formData,
                });
                const uploadData = await uploadResponse.json();
                if (uploadData.secure_url) {
                    fileUrl = uploadData.secure_url;
                    fileName = file.name;
                } else {
                    throw new Error('Cloudinary upload failed.');
                }
            }

            // 2. Create the data object for the medical record
            const recordData = {
                petId: pet.id,
                userId,
                recordDate: new Date(recordDate),
                diagnosticTest,
                testResult,
                diagnosis,
                treatment,
                prescribedMedicine,
                notes,
                payment: Number(payment) || 0,
                followUpDate: followUpDate ? new Date(`${followUpDate}T${followUpTime || '00:00'}`) : null,
                fileUrl,
                fileName,
                createdAt: serverTimestamp()
            };

            // 3. Try to save ONLY the medical record first
            console.log("Attempting to save medical record...");
            await addDoc(collection(db, `artifacts/default-pet-clinic/public/data/medicalRecords`), recordData);
            console.log("Medical record saved successfully!");

            // 4. If the record saves, then try to save the follow-up appointment
            if (followUpDate && followUpTime) {
                const followUpDateTime = new Date(`${followUpDate}T${followUpTime}`);
                const appointmentData = {
                    ownerId: owner.id,
                    petId: pet.id,
                    dateTime: followUpDateTime,
                    reason: `Follow-up for ${diagnosticTest || 'previous visit'}`,
                    status: 'Scheduled',
                    userId,
                    createdAt: serverTimestamp()
                };
                console.log("Attempting to save follow-up appointment...");
                await addDoc(collection(db, `artifacts/default-pet-clinic/public/data/appointments`), appointmentData);
                console.log("Appointment saved successfully!");
            }

            setView('petDetails', pet);

        } catch (err) {
            console.error("Error during submit:", err); // This will now give us a more specific error
            setError('Failed to add record. Check console for details.');
        } finally {
            setIsSubmitting(false);
        }
        
        // --- End of temporary debugging code ---
    };
    return (
        <FormWrapper title={`Add Record for ${pet.name}`} onBack={() => setView('petDetails', pet)}>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <InputField label="Date of Record" type="date" value={recordDate} onChange={e => setRecordDate(e.target.value)} required />
                    <InputField label="Diagnosis" type="text" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="e.g., Allergic reaction" className="md:col-span-2" />
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Diagnostic Test</label>
                        <InputField type="select" value={diagnosticTest} onChange={e => setDiagnosticTest(e.target.value)} noLabel>
                             <option value="">Select Test</option>
                             {diagnosticOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </InputField>
                    </div>
                    <InputField label="Test Result" type="textarea" value={testResult} onChange={e => setTestResult(e.target.value)} placeholder="Enter test results" className="md:col-span-2" />
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
                    <InputField label="Payment Amount ($)" type="number" value={payment} onChange={e => setPayment(e.target.value)} placeholder="0.00" />
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Upload Report (Optional)</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="flex text-sm text-gray-600">
                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-cyan-600 hover:text-cyan-500 focus-within:outline-none">
                                        <span>Upload a file</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.jpg,.png" />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500">{file ? `Selected: ${file.name}` : 'PDF, PNG, JPG up to 10MB'}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <button type="submit" disabled={isSubmitting} className={`w-full text-white font-bold py-2.5 px-4 rounded-lg shadow-md transition-colors disabled:opacity-50 bg-cyan-600 hover:bg-cyan-700 mt-6`}>
                    {isSubmitting ? 'Saving...' : 'Add Record'}
                </button>
            </form>
        </FormWrapper>
    );
}