import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { supabase } from '../supabaseClient'; // Make sure this path is correct
import FormWrapper from '../components/FormWrapper';
import InputField from '../components/InputField';
import { UploadCloud } from 'lucide-react';

export default function AddPetPage({ owner, db, userId, setView, setError }) {
    const [name, setName] = useState('');
    const [species, setSpecies] = useState('Dog');
    const [breed, setBreed] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('Male');
    
    // This state now holds the file object for uploading
    const [imageFile, setImageFile] = useState(null); 
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !species) { setError('Name and Species are required.'); return; }
        setIsSubmitting(true);
        setError('');

        try {
            // Default placeholder image
            let imageUrl = `https://placehold.co/400x400/06b6d4/ffffff?text=${name.charAt(0)}`;

            // --- Start of Supabase Upload Logic ---
            if (imageFile) {
                // 1. Create a unique file path to avoid overwriting files
                const filePath = `${userId}/${Date.now()}-${imageFile.name}`;

                // 2. Upload the file to your Supabase bucket
                const { error: uploadError } = await supabase.storage
                    .from('petimages') // Correct bucket name
                    .upload(filePath, imageFile);

                if (uploadError) {
                    // If upload fails, stop and show the error
                    throw uploadError;
                }

                // 3. Get the public URL of the uploaded file
                const { data } = supabase.storage
                    .from('petimages') // Correct bucket name
                    .getPublicUrl(filePath);
                
                // Set imageUrl to the new Supabase URL
                imageUrl = data.publicUrl;
            }
            // --- End of Supabase Upload Logic ---

            await addDoc(collection(db, `artifacts/default-pet-clinic/public/data/pets`), { 
                name, species, breed, age, gender, 
                imageUrl, // This will be the Supabase URL if an image was uploaded
                ownerId: owner.id, 
                userId, 
                createdAt: serverTimestamp() 
            });

            setView('ownerDetails', owner);
        } catch (err) {
            setError(`Failed to add pet. ${err.message}`);
            console.error(err);
        } finally { 
            setIsSubmitting(false); 
        }
    };
    
    return (
        <FormWrapper title={`Register Pet for ${owner.firstName} ${owner.lastName}`} onBack={() => setView('ownerDetails', owner)}>
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
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="flex text-sm text-gray-600">
                                <label htmlFor="pet-image-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-cyan-600 hover:text-cyan-500 focus-within:outline-none">
                                    <span>Upload an image</span>
                                    {/* ✅ CORRECTED LINE: This now sets the imageFile state */}
                                    <input id="pet-image-upload" name="pet-image-upload" type="file" className="sr-only" onChange={(e) => setImageFile(e.target.files[0])} accept="image/*" />
                                </label>
                            </div>
                            {/* This now correctly displays the name of the selected file */}
                            <p className="text-xs text-gray-500">{imageFile ? `Selected: ${imageFile.name}` : 'PNG, JPG up to 10MB'}</p>
                        </div>
                    </div>
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors disabled:opacity-50 bg-green-500 hover:bg-green-600">
                    {isSubmitting ? 'Saving...' : 'Save Pet'}
                </button>
            </form>
        </FormWrapper>
    );
}