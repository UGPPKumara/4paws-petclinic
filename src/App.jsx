import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    sendPasswordResetEmail,
    confirmPasswordReset
} from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    query, 
    where, 
    onSnapshot,
    serverTimestamp,
    doc,
    getDocs,
    updateDoc,
    writeBatch,
    deleteDoc
} from 'firebase/firestore';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import BackupOptionsModal from './components/BackupOptionsModal';

import DashboardPage from './pages/DashboardPage';
import AppointmentsPage from './pages/AppointmentsPage';
import HomePage from './pages/HomePage';
import QuickRegisterPage from './pages/QuickRegisterPage';
import AddAppointmentPage from './pages/AddAppointmentPage';
import EditAppointmentPage from './pages/EditAppointmentPage';
import AddOwnerPage from './pages/AddOwnerPage';
import EditOwnerPage from './pages/EditOwnerPage';
import OwnerDetailsPage from './pages/OwnerDetailsPage';
import AddPetPage from './pages/AddPetPage';
import EditPetPage from './pages/EditPetPage';
import PetDetailsPage from './pages/PetDetailsPage';
import AddMedicalRecordPage from './pages/AddMedicalRecordPage';
import EditMedicalRecordPage from './pages/EditMedicalRecordPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';


// --- Firebase Configuration ---
const firebaseConfig = 
{
    apiKey: "AIzaSyB71laYmoZ1F46hEeJdXoY5M1dOM9izLrs",
    authDomain: "paws-petregistration.firebaseapp.com",
    projectId: "paws-petregistration",
    storageBucket: "paws-petregistration.firebasestorage.app",
    messagingSenderId: "98641695099",
    appId: "1:98641695099:web:efa12343be7a6e0a94adde",
    measurementId: "G-JBJBFZWB6X"
};
const appId = 'default-pet-clinic';

export default function App() {
    const [view, setView] = useState('login');
    const [owners, setOwners] = useState([]);
    const [allPets, setAllPets] = useState([]);
    const [allMedicalRecords, setAllMedicalRecords] = useState([]);
    const [allAppointments, setAllAppointments] = useState([]);

    const [selectedOwner, setSelectedOwner] = useState(null);
    const [selectedPet, setSelectedPet] = useState(null);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [selectedRecord, setSelectedRecord] = useState(null);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
    const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    
    const [pdfScriptsLoaded, setPdfScriptsLoaded] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    useEffect(() => {
        const jspdfScript = document.createElement('script');
        jspdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        jspdfScript.async = true;

        const autotableScript = document.createElement('script');
        autotableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js';
        autotableScript.async = true;
        
        jspdfScript.onload = () => {
            document.body.appendChild(autotableScript);
        };

        autotableScript.onload = () => {
            setPdfScriptsLoaded(true);
        };

        document.body.appendChild(jspdfScript);

        return () => {
            if (document.body.contains(jspdfScript)) {
               document.body.removeChild(jspdfScript);
            }
            if (document.body.contains(autotableScript)) {
                document.body.removeChild(autotableScript);
            }
        };
    }, []);

    useEffect(() => {
        try {
            const app = initializeApp(firebaseConfig);
            const authInstance = getAuth(app);
            const dbInstance = getFirestore(app);
            setDb(dbInstance);
            setAuth(authInstance);

            const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
                if (user) {
                    setUserId(user.uid);
                    setIsLoggedIn(true);
                    setView('dashboard');
                } else {
                    setUserId(null);
                    setIsLoggedIn(false);
                    setView('login');
                }
                setAuthLoading(false);
            });
            return () => unsubscribe();
        } catch (e) {
            console.error("Firebase initialization error:", e);
            setError("Failed to initialize the application. Check console for details.");
            setAuthLoading(false);
        }
    }, []);
    
    useEffect(() => {
        if (!isLoggedIn || !db || !userId) {
            setOwners([]);
            setAllPets([]);
            setAllMedicalRecords([]);
            setAllAppointments([]);
            if(!authLoading) setLoading(false);
            return;
        };

        setLoading(true);
        const collectionsToFetch = [
            { path: `artifacts/${appId}/public/data/owners`, setter: setOwners, isPrimary: true },
            { path: `artifacts/${appId}/public/data/pets`, setter: setAllPets },
            { path: `artifacts/${appId}/public/data/medicalRecords`, setter: setAllMedicalRecords },
            { path: `artifacts/${appId}/public/data/appointments`, setter: setAllAppointments },
        ];

        const unsubscribes = collectionsToFetch.map(({ path, setter, isPrimary }) => {
            const q = query(collection(db, path), where("userId", "==", userId));
            return onSnapshot(q, (querySnapshot) => {
                const data = querySnapshot.docs.map(doc => {
                    const docData = doc.data();
                    // Convert Firestore Timestamps to JS Dates
                    Object.keys(docData).forEach(key => {
                        if (docData[key] && typeof docData[key].toDate === 'function') {
                            docData[key] = docData[key].toDate();
                        }
                    });
                    return { id: doc.id, ...docData };
                });
                setter(data);
                if (isPrimary) {
                    setLoading(false);
                }
            }, (err) => {
                console.error(`Error fetching ${path}:`, err);
                setError(`Failed to fetch data. See console for details.`);
                setLoading(false);
            });
        });
        
        return () => unsubscribes.forEach(unsub => unsub());
    }, [isLoggedIn, db, userId, authLoading]);

    const ownerPets = useMemo(() => {
        if (!selectedOwner) return [];
        return allPets.filter(p => p.ownerId === selectedOwner.id);
    }, [allPets, selectedOwner]);

    const petRecords = useMemo(() => {
        if (!selectedPet) return [];
        return allMedicalRecords.filter(r => r.petId === selectedPet.id).sort((a,b) => (b.recordDate || 0) - (a.recordDate || 0));
    }, [allMedicalRecords, selectedPet]);

    const dashboardData = useMemo(() => {
        const upcoming = allAppointments.filter(a => a.dateTime && a.dateTime >= new Date());
        const totalPayments = allMedicalRecords.reduce((sum, record) => sum + (Number(record.payment) || 0), 0);
        const stats = {
            owners: owners.length,
            pets: allPets.length,
            upcomingAppointments: upcoming.length,
            totalPayments,
        };
        return { upcomingAppointments: upcoming, stats };
    }, [allAppointments, owners, allPets, allMedicalRecords]);

    const handleLogout = async () => {
        if (auth) {
            await signOut(auth);
            setView('login');
            setSelectedOwner(null);
            setSelectedPet(null);
            setSelectedAppointment(null);
        }
    };

    const handleGenerateBackup = (options) => {
        if (!pdfScriptsLoaded) {
            alert("PDF generation library is still loading. Please try again in a moment.");
            return;
        }

        setIsGeneratingPdf(true);

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const formatDate = (date) => date ? new Date(date).toLocaleDateString() : 'N/A';

        const addSection = (title, headers, data, startY) => {
            doc.setFontSize(16);
            doc.text(title, 14, startY);
            doc.autoTable({
                head: [headers],
                body: data,
                startY: startY + 10,
                theme: 'striped',
                headStyles: { fillColor: [0, 150, 199] },
            });
            return doc.autoTable.previous.finalY + 15;
        };

        const addPageContent = (withLogo) => {
            const pageWidth = doc.internal.pageSize.getWidth();
            const logoWidth = 40;
            const logoHeight = 15;
            const x = pageWidth - 14 - logoWidth;
            const y = 12;
            
            if(withLogo) {
                const logo = new Image();
                logo.src = '/logo1.png';
                doc.addImage(logo, 'PNG', x, y, logoWidth, logoHeight);
            }

            doc.setFontSize(22);
            doc.text("4Paws Pet Clinic - Data Backup", 14, 20);
            doc.setFontSize(10);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 26);
            
            let currentY = 40;

            if(options.includeOwners){
                const ownerData = owners.map((o, index) => [index + 1, `${o.firstName} ${o.lastName}`, o.email, o.phone, o.address]);
                currentY = addSection("Owners", ["#", "Name", "Email", "Phone", "Address"], ownerData, currentY);
            }
            
            if(options.includePets){
                const petData = allPets.map((p, index) => {
                    const owner = owners.find(o => o.id === p.ownerId);
                    return [index + 1, p.name, p.species, p.breed, p.age, p.gender, owner ? `${owner.firstName} ${owner.lastName}` : "N/A"];
                });
                currentY = addSection("Pets", ["#", "Name", "Species", "Breed", "Age", "Gender", "Owner"], petData, currentY);
            }
            
            if(options.includeAppointments){
                const appointmentData = allAppointments.map((a, index) => {
                    const owner = owners.find(o => o.id === a.ownerId);
                    const pet = allPets.find(p => p.id === a.petId);
                    return [index + 1, formatDate(a.dateTime), a.dateTime ? new Date(a.dateTime).toLocaleTimeString() : 'N/A', pet?.name || 'N/A', owner?.firstName || 'N/A', a.reason, a.status]
                })
                currentY = addSection("Appointments", ["#", "Date", "Time", "Pet", "Owner", "Reason", "Status"], appointmentData, currentY);
            }

            if(options.includeMedicalRecords){
                 const recordData = allMedicalRecords.map((r, index) => {
                    const pet = allPets.find(p => p.id === r.petId);
                    return [index + 1, pet?.name || 'N/A', formatDate(r.recordDate), r.diagnosticTest || 'N/A', r.testResult || r.otherTestNotes || 'N/A', `$${(r.payment || 0).toFixed(2)}`, formatDate(r.followUpDate)];
                });
                addSection("Medical Records", ["#", "Pet", "Date", "Test", "Result", "Payment", "Follow-up"], recordData, currentY);
            }

            doc.save(`4paws-clinic-backup-${new Date().toISOString().split('T')[0]}.pdf`);
            setIsGeneratingPdf(false);
        };

        try {
            const logo = new Image();
            logo.src = '/logo1.png';
            logo.onload = () => {
                addPageContent(true);
            };
            logo.onerror = () => {
                addPageContent(false);
            }
        } catch(e) {
            addPageContent(false);
        }
    };

    const navigateTo = (newView, data = null) => {

        if (auth.currentUser) {
        console.log("Current Logged-In User ID:", auth.currentUser.uid);
    }

        setView(newView);
        setError('');
        
        switch(newView) {
            case 'ownerDetails':
            case 'editOwner':
            case 'addPet':
                setSelectedOwner(data);
                break;
            case 'petDetails':
            case 'editPet':
            case 'addMedicalRecord': {
                const owner = owners.find(o => o.id === data.ownerId);
                setSelectedOwner(owner || null);
                setSelectedPet(data);
                break;
            }
            case 'editAppointment':
                setSelectedAppointment(data);
                break;
            case 'editMedicalRecord': {
                const pet = allPets.find(p => p.id === data.petId)
                const owner = owners.find(o => o.id === pet?.ownerId)
                setSelectedPet(pet || null)
                setSelectedOwner(owner || null)
                setSelectedRecord(data);
                break;
            }
            default:
                if (['dashboard', 'owners', 'appointments', 'quickRegister', 'login', 'forgotPassword', 'resetPassword'].includes(newView)) {
                    setSelectedOwner(null);
                    setSelectedPet(null);
                    setSelectedAppointment(null);
                    setSelectedRecord(null);
                }
                break;
        }

        if (window.innerWidth < 768 && isSidebarOpen) {
             setSidebarOpen(false);
        }
    };
    
    const renderView = () => {
        if (authLoading) return <LoadingSpinner message="Initializing..." />;

        if (!isLoggedIn) {
            switch (view) {
                case 'forgotPassword':
                    return <ForgotPasswordPage auth={auth} setError={setError} error={error} navigateTo={navigateTo} sendPasswordResetEmail={sendPasswordResetEmail}/>;
                case 'resetPassword':
                    return <ResetPasswordPage auth={auth} setError={setError} error={error} navigateTo={navigateTo} confirmPasswordReset={confirmPasswordReset}/>;
                case 'login':
                default:
                    return <LoginPage auth={auth} setError={setError} error={error} navigateTo={navigateTo} />;
            }
        }
        
        if (loading) return <LoadingSpinner />;
        if (error) return <ErrorMessage message={error.toString()} />;

        switch (view) {
            case 'addOwner':
                return <AddOwnerPage db={db} userId={userId} setView={navigateTo} setError={setError} />;
            case 'editOwner':
                return <EditOwnerPage owner={selectedOwner} db={db} setView={navigateTo} setError={setError} />;
            case 'ownerDetails':
                 return <OwnerDetailsPage owner={selectedOwner} pets={ownerPets} handleSelectPet={navigateTo} navigateTo={navigateTo} setError={setError} db={db} userId={userId}  />;
            case 'addPet':
                return <AddPetPage owner={selectedOwner} db={db} userId={userId} setView={navigateTo} setError={setError} />;
            case 'editPet':
                return <EditPetPage pet={selectedPet} owner={selectedOwner} db={db} setView={navigateTo} setError={setError} />;
            case 'petDetails':
                return <PetDetailsPage pet={selectedPet} owner={selectedOwner} records={petRecords} db={db} userId={userId} handleBack={() => navigateTo('ownerDetails', selectedOwner)} setError={setError} navigateTo={navigateTo} />;
            case 'addMedicalRecord':
                return <AddMedicalRecordPage pet={selectedPet} owner={selectedOwner} db={db} userId={userId} setError={setError} setView={navigateTo} />;
            case 'editMedicalRecord':
                return <EditMedicalRecordPage record={selectedRecord} pet={selectedPet} owner={selectedOwner} db={db} userId={userId} setError={setError} setView={navigateTo} />;
            case 'owners':
                return <HomePage owners={owners} handleSelectOwner={navigateTo} navigateTo={navigateTo} db={db} allPets={allPets} allAppointments={allAppointments} allMedicalRecords={allMedicalRecords} />;
            case 'appointments':
                return <AppointmentsPage appointments={allAppointments} owners={owners} pets={allPets} navigateTo={navigateTo} db={db} />;
            case 'addAppointment':
                 return <AddAppointmentPage db={db} userId={userId} owners={owners} allPets={allPets} setView={navigateTo} setError={setError} />;
            case 'editAppointment':
                 return <EditAppointmentPage appointment={selectedAppointment} db={db} owners={owners} allPets={allPets} setView={navigateTo} setError={setError} />;
            case 'quickRegister':
                return <QuickRegisterPage db={db} userId={userId} setView={navigateTo} setError={setError} />;
            case 'dashboard':
            default:
                return <DashboardPage stats={dashboardData.stats} allAppointments={dashboardData.upcomingAppointments} allPets={allPets} owners={owners} navigateTo={navigateTo} />;
        }
    };

    if (authLoading) {
        return <div className="h-screen w-screen flex justify-center items-center bg-gray-50"><LoadingSpinner message="Initializing..." /></div>;
    }

    return (
        <div className="bg-gray-50 h-screen font-sans flex overflow-hidden">
           {isLoggedIn && <Sidebar 
                isOpen={isSidebarOpen} 
                navigateTo={navigateTo} 
                currentView={view} 
                handleLogout={handleLogout}
                openBackupModal={() => setIsBackupModalOpen(true)}
            />}
            {isBackupModalOpen && (
                <BackupOptionsModal
                    isOpen={isBackupModalOpen}
                    onClose={() => setIsBackupModalOpen(false)}
                    onGenerate={handleGenerateBackup}
                    isGeneratingPdf={isGeneratingPdf}
                    pdfScriptsLoaded={pdfScriptsLoaded}
                />
            )}
            <div className="flex-1 flex flex-col min-w-0">
                {isLoggedIn && <Header onMenuClick={() => setSidebarOpen(!isSidebarOpen)} owners={owners} allPets={allPets} navigateTo={navigateTo} />}
                <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto">
                    {renderView()}
                </main>
            </div>
        </div>
    );
}