import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import FormWrapper from '../components/FormWrapper';
import InputField from '../components/InputField';
import { UploadCloud } from 'lucide-react';

export default function EditPetPage({ pet, owner, db, setView, setError }) {
    const [name, setName] = useState(pet.name || '');
    const [species, setSpecies] = useState(pet.species || 'Dog');
    const [breed, setBreed] = useState(pet.breed || '');
    const [age, setAge] = useState(pet.age || '');
    const [gender, setGender] = useState(pet.gender || 'Male');
    const [imageFile, setImageFile] = useState(null); // Add state for the new image file
    const [imageName, setImageName] = useState(pet.imageUrl ? 'Current Image' : '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
            setImageName(e.target.files[0].name);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !species) { setError('Name and Species are required.'); return; }
        setIsSubmitting(true);
        setError('');
        try {
            let imageUrl = pet.imageUrl; // Start with the existing image URL

            // If a new image file is selected, upload it to Cloudinary
            if (imageFile) {
                const formData = new FormData();
                formData.append('file', imageFile);
                formData.append('upload_preset', 'pet-clinic'); // Replace with your preset name

                const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/prasanna-cloud/image/upload`, { // Replace with your cloud name
                    method: 'POST',
                    body: formData,
                });

                const uploadData = await uploadResponse.json();
                if (uploadData.secure_url) {
                    imageUrl = uploadData.secure_url;
                } else {
                    throw new Error('Cloudinary upload failed.');
                }
            }

            const petRef = doc(db, `artifacts/default-pet-clinic/public/data/pets`, pet.id);
            await updateDoc(petRef, { name, species, breed, age, gender, imageUrl });
            setView('ownerDetails', owner);
        } catch (err) {
            setError('Failed to update pet.');
        } finally { setIsSubmitting(false); }
    };
    
    return (
        <FormWrapper title={`Edit Information for ${pet.name}`} onBack={() => setView('ownerDetails', owner)}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <InputField label="Pet's Name" type="text" value={name} onChange={e => setName(e.target.value)} required />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="Species" type="select" value={species} onChange={e => setSpecies(e.target.value)}>
                        <option>Dog</option><option>Cat</option><option>Rabbit</option>
                        <option>Bird</option><option>Fish</option><option>Reptile</option>
                        <option>Other</option>
                    </InputField>
                    <InputField label="Breed" type="text" value={breed} onChange={e => setBreed(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="Age" type="text" value={age} onChange={e => setAge(e.target.value)} />
                    <InputField label="Gender" type="select" value={gender} onChange={e => setGender(e.target.value)}>
                        <option>Male</option><option>Female</option>
                    </InputField>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Pet Image</label>
                     <img src={pet.imageUrl || `https://placehold.co/100x100/06b6d4/ffffff?text=${pet.name.charAt(0)}`} alt={pet.name} className="w-24 h-24 rounded-full object-cover mb-4"/>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="flex text-sm text-gray-600">
                                <label htmlFor="pet-image-upload-edit" className="relative cursor-pointer bg-white rounded-md font-medium text-cyan-600 hover:text-cyan-500 focus-within:outline-none">
                                    <span>Upload a file</span>
                                    <input id="pet-image-upload-edit" name="pet-image-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                                </label>
                            </div>
                            <p className="text-xs text-gray-500">{imageName ? `Selected: ${imageName}` : 'PNG, JPG up to 10MB'}</p>
                        </div>
                    </div>
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors disabled:opacity-50 bg-cyan-700 hover:bg-cyan-500">
                    {isSubmitting ? 'Updating...' : 'Update Pet'}
                </button>
            </form>
        </FormWrapper>
    );
}