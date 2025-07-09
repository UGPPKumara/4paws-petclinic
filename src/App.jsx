import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import logoImage from '/logo1.png';
import { 
    getAuth, 
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
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
import { ArrowLeft, PlusCircle, User, PawPrint, Stethoscope, Menu, LayoutDashboard, LogOut, Calendar, Edit, Trash2, AlertTriangle, Search, HeartPulse, UploadCloud, Download, DollarSign, FileDown, X } from 'lucide-react';

// --- Firebase Configuration ---
// These are assumed to be provided by the environment.
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : 
{
    apiKey: "AIzaSyDe0t1zfi2PD4ZJKALgF4kz3E5foW0PI3w",
    authDomain: "paws-5f24e.firebaseapp.com",
    projectId: "paws-5f24e",
    storageBucket: "paws-5f24e.firebasestorage.app",
    messagingSenderId: "123105192704",
    appId: "1:123105192704:web:180e235255cc9ec680e1e5",
    measurementId: "G-NNM76SHRFR"
}
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-pet-clinic';

// --- Main App Component ---
export default function App() {
    // --- State Management ---
    const [view, setView] = useState('dashboard');
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

    // --- Authentication State ---
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    
    // --- PDF Generation State ---
    const [pdfScriptsLoaded, setPdfScriptsLoaded] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    // --- Dynamic Script Loader for PDF Generation ---
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

    // --- Firebase Initialization & Auth Handling ---
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
                } else {
                    setUserId(null);
                    setIsLoggedIn(false);
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
    
    // --- Data Fetching for Logged-In User ---
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

    // --- Memoized data derivations to prevent re-calculation on every render ---
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


    // --- Handlers ---
    const handleLoginSuccess = async () => {
        setAuthLoading(true);
        try {
            await signInAnonymously(auth);
        } catch(e) {
            console.error("Firebase sign-in failed:", e);
            setError("Could not establish a secure session.");
            setAuthLoading(false);
        }
    };
    
    const handleLogout = async () => {
        if (auth) {
            await signOut(auth);
            setView('dashboard');
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

    const navigateTo = (newView, data = null) => {
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
                if (['dashboard', 'owners', 'appointments', 'quickRegister'].includes(newView)) {
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
    
    // --- View Renderer ---
    const renderView = () => {
        if (loading) return <LoadingSpinner />;
        if (error) return <ErrorMessage message={error.toString()} />;

        switch (view) {
            case 'addOwner':
                return <AddOwnerPage db={db} userId={userId} setView={navigateTo} setError={setError} />;
            case 'editOwner':
                return <EditOwnerPage owner={selectedOwner} db={db} setView={navigateTo} setError={setError} />;
            case 'ownerDetails':
                 return <OwnerDetailsPage owner={selectedOwner} pets={ownerPets} handleSelectPet={navigateTo} navigateTo={navigateTo} db={db} />;
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
    if (!isLoggedIn) {
        // No longer needs onLoginSuccess, but now needs the auth object.
        return <LoginPage auth={auth} setError={setError} error={error}/>
    }

    return (
        <div className="bg-gray-50 h-screen font-sans flex overflow-hidden">
            <Sidebar 
                isOpen={isSidebarOpen} 
                navigateTo={navigateTo} 
                currentView={view} 
                handleLogout={handleLogout}
                openBackupModal={() => setIsBackupModalOpen(true)}
            />
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
                <Header onMenuClick={() => setSidebarOpen(!isSidebarOpen)} owners={owners} allPets={allPets} navigateTo={navigateTo} />
                <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto">
                    {renderView()}
                </main>
            </div>
        </div>
    );
}

// --- Components ---

function Logo({ className }) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <img src={logoImage} alt="4Paws Logo" className="h-10 w-auto" />
      </div>
    );
  }

// --- NEW LOGIN-ONLY PAGE COMPONENT ---
// Replace your previous LoginPage with this simplified version.

function LoginPage({ auth, setError, error }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            // Attempt to sign in with the provided email and password
            await signInWithEmailAndPassword(auth, email, password);
            
            // onAuthStateChanged in App.js will handle successful login
        } catch (err) {
            // If login fails, show a generic error.
            // The console will have more specific details (e.g., user-not-found, wrong-password)
            setError('Invalid credentials. Please try again.');
            console.error("Login failed:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="w-full max-w-sm mx-auto p-8 space-y-6 bg-white rounded-2xl shadow-xl">
                <div className="flex flex-col items-center">
                    <Logo className="text-gray-800" />
                    <h1 className="text-2xl font-bold text-gray-800 mt-4">Admin Login</h1>
                </div>

                <form className="mt-6 space-y-6" onSubmit={handleLogin}>
                    {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-center text-sm">{error}</div>}
                    
                    <InputField 
                        label="Email Address" 
                        type="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        required 
                        placeholder="admin@clinic.com" 
                    />
                    <InputField 
                        label="Password" 
                        type="password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required 
                        placeholder="••••••••"
                    />
                    
                    <div>
                        <button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:bg-cyan-300 transition-colors"
                        >
                            {isSubmitting ? 'Signing in...' : 'Sign in'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function Sidebar({ isOpen, navigateTo, currentView, handleLogout, openBackupModal }) {
    const navItems = [
        { name: 'Dashboard', view: 'dashboard', icon: LayoutDashboard },
        { name: 'Appointments', view: 'appointments', icon: Calendar },
        { name: 'Owners', view: 'owners', icon: User },
    ];

    return (
        <aside className={`bg-gray-900 text-gray-200 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out ${isOpen ? 'w-60' : 'w-0'} overflow-hidden`}>
            <div className={`p-5 h-[68px] flex items-center justify-center font-bold text-xl border-b border-gray-800 whitespace-nowrap`}>
                <div className={`transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
                   <Logo />
                </div>
            </div>
            <nav className="flex-grow pt-4 overflow-y-auto">
                <ul>
                    {navItems.map(item => (
                        <li key={item.name} className="px-3">
                            <a href="#" onClick={(e) => { e.preventDefault(); navigateTo(item.view); }} className={`flex items-center py-3 px-4 transition-colors duration-200 rounded-lg whitespace-nowrap ${currentView === item.view ? `bg-cyan-600 text-white shadow-md` : `hover:bg-gray-800 text-gray-300`}`}>
                                <item.icon className="mr-3 flex-shrink-0" size={20} />
                                <span>{item.name}</span>
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="p-3 border-t border-gray-800 space-y-2">
                 <button 
                    onClick={openBackupModal}
                    className="w-full flex items-center py-3 px-4 transition-colors hover:bg-gray-800 rounded-lg text-gray-300 whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <FileDown className="mr-3 flex-shrink-0" size={20} />
                    <span>Backup Data</span>
                </button>
                <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }} className="flex items-center py-3 px-4 transition-colors hover:bg-gray-800 rounded-lg text-gray-300 whitespace-nowrap">
                    <LogOut className="mr-3 flex-shrink-0" size={20} />
                    <span>Logout</span>
                </a>
            </div>
        </aside>
    );
}

function Header({ onMenuClick, owners, allPets, navigateTo }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        if (searchTerm.length > 1) {
            const ownerResults = owners
                .filter(o => `${o.firstName} ${o.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(o => ({...o, type: 'Owner'}));
            const petResults = allPets
                .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(p => ({...p, type: 'Pet'}));
            setResults([...ownerResults, ...petResults]);
        } else {
            setResults([]);
        }
    }, [searchTerm, owners, allPets]);

    const handleSelect = (item) => {
        navigateTo(item.type === 'Owner' ? 'ownerDetails' : 'petDetails', item);
        setSearchTerm('');
        setResults([]);
        setIsFocused(false);
    }

    return (
        <header className="bg-white/60 backdrop-blur-lg sticky top-0 z-20 border-b border-gray-200">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 h-[68px] flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <button onClick={onMenuClick} className="p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none">
                        <Menu />
                    </button>
                </div>
                <div className="relative w-full max-w-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search owners or pets..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                    />
                    {isFocused && results.length > 0 && (
                        <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                            {results.map(item => (
                                <li key={`${item.type}-${item.id}`} onMouseDown={() => handleSelect(item)} className="cursor-pointer select-none relative py-2 pl-3 pr-9 text-gray-900 hover:bg-gray-100">
                                    <div className="flex items-center">
                                        <span className={`inline-block h-2 w-2 rounded-full mr-2 ${item.type === 'Owner' ? 'bg-red-400' : 'bg-cyan-400' }`}></span>
                                        <span className="font-normal block truncate">
                                            {item.type === 'Owner' ? `${item.firstName} ${item.lastName}` : item.name}
                                        </span>
                                        <span className="ml-2 text-xs text-gray-400">({item.type})</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </header>
    );
}

// --- Pie Chart Component ---
function PetSpeciesPieChart({ data }) {
    if (!data || data.length === 0) {
        return <p className="text-center text-gray-500 py-4">No pet data to display.</p>;
    }

    const total = data.reduce((acc, entry) => acc + entry.value, 0);
    let cumulativePercentage = 0;

    const COLORS = ['#06b6d4', '#ec4899', '#8b5cf6', '#f59e0b', '#10b981', '#64748b'];

    return (
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 p-4">
            <div className="relative w-40 h-40">
                <svg className="w-full h-full" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                    {data.map((entry, index) => {
                        const percentage = (entry.value / total) * 100;
                        const strokeDasharray = `${percentage} ${100 - percentage}`;
                        const strokeDashoffset = 25 - cumulativePercentage;
                        cumulativePercentage += percentage;
                        
                        return (
                            <circle
                                key={entry.name}
                                cx="18"
                                cy="18"
                                r="15.9155"
                                fill="transparent"
                                stroke={COLORS[index % COLORS.length]}
                                strokeWidth="3.8"
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset={strokeDashoffset}
                                transform="rotate(-90 18 18)"
                            />
                        );
                    })}
                </svg>
                 <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-gray-700">{total} <span className="text-sm font-normal ml-1">Pets</span></div>
            </div>
            <div className="flex flex-col gap-2 text-sm">
                {data.map((entry, index) => (
                    <div key={entry.name} className="flex items-center">
                        <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                        <span className="font-medium text-gray-700">{entry.name}:</span>
                        <span className="ml-2 text-gray-500">{entry.value} ({((entry.value / total) * 100).toFixed(0)}%)</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- DASHBOARD PAGE (UPDATED) ---
function DashboardPage({ stats, allAppointments, owners, allPets, navigateTo }) {
    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const speciesData = useMemo(() => {
        if (!allPets || allPets.length === 0) {
            return [];
        }
        const counts = allPets.reduce((acc, pet) => {
            const species = pet.species || 'Other';
            acc[species] = (acc[species] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [allPets]);

    const todaysAppointments = useMemo(() => allAppointments
        .filter(a => a.dateTime && a.dateTime >= today && a.dateTime < new Date(today.getTime() + 24 * 60 * 60 * 1000) && a.status === 'Scheduled')
        .sort((a,b) => a.dateTime - b.dateTime), [allAppointments, today]);

    const getDetails = (item) => ({
        owner: owners.find(o => o.id === item.ownerId),
        pet: allPets.find(p => p.id === item.petId),
    });

    const statItems = [
        { label: "Upcoming Appointments", value: stats.upcomingAppointments, icon: Calendar, color: 'cyan' },
        { label: "Total Owners", value: stats.owners, icon: User, color: 'red' },
        { label: "Total Pets", value: stats.pets, icon: PawPrint, color: 'cyan' },
        { label: "Total Payments", value: `$${stats.totalPayments.toFixed(2)}`, icon: DollarSign, color: 'red' },
    ];
    const colorClasses = {
        cyan: { border: 'border-cyan-500', bg: 'bg-cyan-50', text: 'text-cyan-600' },
        red: { border: 'border-red-500', bg: 'bg-red-50', text: 'text-red-600' },
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
                <h1 className="text-4xl font-bold text-gray-800">Dashboard</h1>
                <button onClick={() => navigateTo('quickRegister')} className="flex items-center justify-center bg-green-500 text-white font-bold py-2.5 px-5 rounded-lg shadow-md hover:bg-green-600 transition-colors">
                    <PlusCircle className="mr-2" size={20} />
                    Quick Register
                </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statItems.map(item => (
                    <div key={item.label} className={`bg-white rounded-2xl shadow-sm p-6 flex items-center space-x-5 border-l-4 ${colorClasses[item.color].border}`}>
                        <div className={`flex-shrink-0 p-4 rounded-full ${colorClasses[item.color].bg}`}>
                           <item.icon className={`h-7 w-7 ${colorClasses[item.color].text}`} />
                        </div>
                        <div>
                            <p className="text-gray-500 font-medium truncate">{item.label}</p>
                            <p className="text-3xl font-bold text-gray-900">{item.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                <div className="flex flex-col gap-8">
                     <div className="bg-white p-6 rounded-2xl shadow-sm border">
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Pet Species Distribution</h2>
                        <PetSpeciesPieChart data={speciesData} />
                    </div>
                </div>
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Today's Appointments</h2>
                    {todaysAppointments.length > 0 ? (
                        <ul className="space-y-3">
                            {todaysAppointments.map(app => {
                                const { owner, pet } = getDetails(app);
                                return (
                                    <li key={app.id} className="p-3 bg-gray-50 rounded-lg">
                                        <p className="font-semibold text-gray-700">{app.reason}</p>
                                        <p className="text-sm text-gray-500">{pet?.name || 'N/A'} with {owner?.firstName || 'N/A'}</p>
                                        <p className="text-sm font-bold text-cyan-600">{app.dateTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</p>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (<p className="text-center text-gray-500 py-4">No appointments scheduled for today.</p>)}
                </div>
            </div>
        </div>
    );
}

// --- NEW COMPONENT ---
function QuickRegisterPage({ db, userId, setView, setError }) {
    // Owner State
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');

    // Pet State
    const [petName, setPetName] = useState('');
    const [species, setSpecies] = useState('Dog');
    const [breed, setBreed] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('Male');
    
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Validation
        if (!firstName || !lastName || !email || !petName || !species) {
            setError('Owner First/Last Name, Email, and Pet Name/Species are required.');
            return;
        }
        
        setIsSubmitting(true);
        setError('');

        try {
            const batch = writeBatch(db);
            
            // 1. Create a new document reference for the owner (so we can get its ID)
            const ownerRef = doc(collection(db, `artifacts/${appId}/public/data/owners`));

            // 2. Set the owner data in the batch
            batch.set(ownerRef, { 
                firstName, lastName, email, phone, address, 
                userId, 
                createdAt: serverTimestamp() 
            });

            // 3. Create a new document reference for the pet
            const petRef = doc(collection(db, `artifacts/${appId}/public/data/pets`));

            // 4. Set the pet data in the batch, using the new owner's ID
            batch.set(petRef, {
                name: petName, species, breed, age, gender,
                ownerId: ownerRef.id, // Use the ID from the new owner reference
                userId,
                createdAt: serverTimestamp()
            });

            // 5. Commit the batch
            await batch.commit();

            // 6. Navigate to the new owner's detail page
            // We pass a temporary owner object because the live data from onSnapshot hasn't updated yet.
            setView('ownerDetails', { id: ownerRef.id, firstName, lastName, email, phone, address });

        } catch (err) {
            console.error("Quick registration failed:", err);
            setError('Failed to register owner and pet.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <FormWrapper title="Quick Register" onBack={() => setView('dashboard')}>
            <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-4 pb-2 border-b flex items-center">
                        <User className="mr-2 h-5 w-5" /> Owner Information
                    </h3>
                    <div className="space-y-6 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="First Name" type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                            <InputField label="Last Name" type="text" value={lastName} onChange={e => setLastName(e.target.value)} required />
                        </div>
                        <InputField label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                        <InputField label="Phone Number" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
                        <InputField label="Address" type="textarea" value={address} onChange={e => setAddress(e.target.value)} />
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-4 pb-2 border-b flex items-center">
                       <PawPrint className="mr-2 h-5 w-5" /> Pet Information
                    </h3>
                    <div className="space-y-6 mt-4">
                        <InputField label="Pet's Name" type="text" value={petName} onChange={e => setPetName(e.target.value)} required />
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
                    </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors disabled:opacity-50 bg-green-500 hover:bg-green-600">
                    {isSubmitting ? 'Registering...' : 'Register Owner & Pet'}
                </button>
            </form>
        </FormWrapper>
    );
}

function AppointmentsPage({ appointments, owners, pets, navigateTo, db }) {
    const [appointmentToDelete, setAppointmentToDelete] = useState(null);
    const now = new Date();
    
    const upcomingAppointments = useMemo(() => appointments.filter(a => a.dateTime && a.dateTime >= now).sort((a,b) => a.dateTime - b.dateTime), [appointments, now]);
    const pastAppointments = useMemo(() => appointments.filter(a => a.dateTime && a.dateTime < now).sort((a,b) => b.dateTime - a.dateTime), [appointments, now]);

    const handleDelete = async () => {
        if (!appointmentToDelete) return;
        try {
            await deleteDoc(doc(db, `artifacts/${appId}/public/data/appointments`, appointmentToDelete.id));
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
                    message={`Are you sure you want to delete the appointment for ${appointmentToDelete.petName} on ${appointmentToDelete.dateTime.toLocaleDateString()}?`}
                    onConfirm={handleDelete}
                    onCancel={() => setAppointmentToDelete(null)}
                    confirmColor="red"
                />
            )}
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
                <h1 className="text-4xl font-bold text-gray-800 flex items-center"><Calendar className="mr-3"/>Appointments</h1>
                <button onClick={() => navigateTo('addAppointment')} className="flex items-center justify-center bg-cyan-600 text-white font-bold py-2.5 px-5 rounded-lg shadow-md hover:bg-cyan-700 transition-colors">
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

function AppointmentTable({ title, appointments, owners, pets, onEdit, onDelete }) {
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
                                    <td className="px-6 py-4">{app.dateTime.toLocaleString([], {dateStyle: 'medium', timeStyle: 'short'})}</td>
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

function AddAppointmentPage({ db, userId, owners, allPets, setView, setError }) {
    const [selectedOwnerId, setSelectedOwnerId] = useState('');
    const [selectedPetId, setSelectedPetId] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const availablePets = useMemo(() => {
        if (!selectedOwnerId) return [];
        return allPets.filter(p => p.ownerId === selectedOwnerId);
    }, [selectedOwnerId, allPets]);

    useEffect(() => { setSelectedPetId(''); }, [selectedOwnerId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedOwnerId || !selectedPetId || !date || !time || !reason) { setError('All fields are required.'); return; }
        setIsSubmitting(true);
        setError('');
        try {
            const dateTime = new Date(`${date}T${time}`);
            await addDoc(collection(db, `artifacts/${appId}/public/data/appointments`), { 
                ownerId: selectedOwnerId, 
                petId: selectedPetId, 
                dateTime, 
                reason, 
                status: 'Scheduled',
                userId, 
                createdAt: serverTimestamp() 
            });
            setView('appointments');
        } catch (err) {
            setError('Failed to add appointment.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <FormWrapper title="Schedule New Appointment" onBack={() => setView('appointments')}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <InputField label="Owner" type="select" value={selectedOwnerId} onChange={e => setSelectedOwnerId(e.target.value)} required>
                    <option value="">Select an Owner</option>
                    {owners.map(o => <option key={o.id} value={o.id}>{`${o.firstName} ${o.lastName}`}</option>)}
                </InputField>
                <InputField label="Pet" type="select" value={selectedPetId} onChange={e => setSelectedPetId(e.target.value)} required disabled={!selectedOwnerId}>
                    <option value="">Select a Pet</option>
                    {availablePets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </InputField>
                <div className="grid grid-cols-2 gap-4">
                    <InputField label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
                    <InputField label="Time" type="time" value={time} onChange={e => setTime(e.target.value)} required />
                </div>
                <InputField label="Reason for Visit" type="text" value={reason} onChange={e => setReason(e.target.value)} required />
                <button type="submit" disabled={isSubmitting} className="w-full text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors disabled:opacity-50 bg-cyan-600 hover:bg-cyan-700">
                    {isSubmitting ? 'Saving...' : 'Schedule Appointment'}
                </button>
            </form>
        </FormWrapper>
    );
}

function EditAppointmentPage({ appointment, db, owners, allPets, setView, setError }) {
    const [selectedOwnerId, setSelectedOwnerId] = useState(appointment.ownerId || '');
    const [selectedPetId, setSelectedPetId] = useState(appointment.petId || '');
    const [date, setDate] = useState(appointment.dateTime ? appointment.dateTime.toISOString().split('T')[0] : '');
    const [time, setTime] = useState(appointment.dateTime ? appointment.dateTime.toTimeString().substring(0,5) : '');
    const [reason, setReason] = useState(appointment.reason || '');
    const [status, setStatus] = useState(appointment.status || 'Scheduled');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const availablePets = useMemo(() => {
        if (!selectedOwnerId) return [];
        return allPets.filter(p => p.ownerId === selectedOwnerId);
    }, [selectedOwnerId, allPets]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedOwnerId || !selectedPetId || !date || !time || !reason) { setError('All fields are required.'); return; }
        setIsSubmitting(true);
        setError('');
        try {
            const dateTime = new Date(`${date}T${time}`);
            const appointmentRef = doc(db, `artifacts/${appId}/public/data/appointments`, appointment.id);
            await updateDoc(appointmentRef, { ownerId: selectedOwnerId, petId: selectedPetId, dateTime, reason, status });
            setView('appointments');
        } catch (err) {
            console.error(err)
            setError('Failed to update appointment.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <FormWrapper title="Edit Appointment" onBack={() => setView('appointments')}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <InputField label="Owner" type="select" value={selectedOwnerId} onChange={e => setSelectedOwnerId(e.target.value)} required>
                    <option value="">Select an Owner</option>
                    {owners.map(o => <option key={o.id} value={o.id}>{`${o.firstName} ${o.lastName}`}</option>)}
                </InputField>
                <InputField label="Pet" type="select" value={selectedPetId} onChange={e => setSelectedPetId(e.target.value)} required disabled={!selectedOwnerId}>
                    <option value="">Select a Pet</option>
                    {availablePets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </InputField>
                <div className="grid grid-cols-2 gap-4">
                    <InputField label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
                    <InputField label="Time" type="time" value={time} onChange={e => setTime(e.target.value)} required />
                </div>
                <InputField label="Reason for Visit" type="text" value={reason} onChange={e => setReason(e.target.value)} required />
                <InputField label="Status" type="select" value={status} onChange={e => setStatus(e.target.value)} required>
                    <option>Scheduled</option>
                    <option>Completed</option>
                    <option>Canceled</option>
                </InputField>
                <button type="submit" disabled={isSubmitting} className="w-full text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors disabled:opacity-50 bg-cyan-600 hover:bg-cyan-700">
                    {isSubmitting ? 'Updating...' : 'Update Appointment'}
                </button>
            </form>
        </FormWrapper>
    );
}

function HomePage({ owners, handleSelectOwner, navigateTo, db, allPets, allAppointments, allMedicalRecords }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [ownerToDelete, setOwnerToDelete] = useState(null);

    const filteredOwners = useMemo(() => owners.filter(o => 
        `${o.firstName} ${o.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
    ), [owners, searchTerm]);
    
    const handleDelete = async (owner) => {
        if (!owner) return;
        
        try {
            const batch = writeBatch(db);
            const ownerRef = doc(db, `artifacts/${appId}/public/data/owners`, owner.id);
            batch.delete(ownerRef);

            const petsToDelete = allPets.filter(p => p.ownerId === owner.id);
            const petIdsToDelete = petsToDelete.map(p => p.id);
            petsToDelete.forEach(pet => {
                const petRef = doc(db, `artifacts/${appId}/public/data/pets`, pet.id);
                batch.delete(petRef);
            });

            const appointmentsToDelete = allAppointments.filter(a => a.ownerId === owner.id);
            appointmentsToDelete.forEach(appointment => {
                const appointmentRef = doc(db, `artifacts/${appId}/public/data/appointments`, appointment.id);
                batch.delete(appointmentRef);
            });
            
            const recordsToDelete = allMedicalRecords.filter(r => petIdsToDelete.includes(r.petId));
            recordsToDelete.forEach(record => {
                 const recordRef = doc(db, `artifacts/${appId}/public/data/medicalRecords`, record.id);
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

function AddOwnerPage({ db, userId, setView, setError }) {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!firstName || !lastName || !email) { setError('First Name, Last Name, and Email are required.'); return; }
        setIsSubmitting(true);
        setError('');
        try {
            await addDoc(collection(db, `artifacts/${appId}/public/data/owners`), { firstName, lastName, email, phone, address, userId, createdAt: serverTimestamp() });
            setView('owners');
        } catch (err) {
            setError('Failed to add owner.');
        } finally { setIsSubmitting(false); }
    };
    
    return (
        <FormWrapper title="Register New Owner" onBack={() => setView('owners')}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="First Name" type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                    <InputField label="Last Name" type="text" value={lastName} onChange={e => setLastName(e.target.value)} required />
                </div>
                <InputField label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                <InputField label="Phone Number" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
                <InputField label="Address" type="textarea" value={address} onChange={e => setAddress(e.target.value)} />
                <button type="submit" disabled={isSubmitting} className="w-full text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors disabled:opacity-50 bg-cyan-600 hover:bg-cyan-700">
                    {isSubmitting ? 'Saving...' : 'Save Owner'}
                </button>
            </form>
        </FormWrapper>
    );
}

function EditOwnerPage({ owner, db, setView, setError }) {
    const [firstName, setFirstName] = useState(owner.firstName || '');
    const [lastName, setLastName] = useState(owner.lastName || '');
    const [email, setEmail] = useState(owner.email || '');
    const [phone, setPhone] = useState(owner.phone || '');
    const [address, setAddress] = useState(owner.address || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!firstName || !lastName || !email) { setError('First Name, Last Name, and Email are required.'); return; }
        setIsSubmitting(true);
        setError('');
        try {
            const ownerRef = doc(db, `artifacts/${appId}/public/data/owners`, owner.id);
            await updateDoc(ownerRef, { firstName, lastName, email, phone, address });
            setView('owners');
        } catch (err) {
            setError('Failed to update owner.');
        } finally { setIsSubmitting(false); }
    };
    
    return (
        <FormWrapper title="Edit Owner Information" onBack={() => setView('owners')}>
            <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="First Name" type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                    <InputField label="Last Name" type="text" value={lastName} onChange={e => setLastName(e.target.value)} required />
                </div>
                <InputField label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                <InputField label="Phone Number" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
                <InputField label="Address" type="textarea" value={address} onChange={e => setAddress(e.target.value)} />
                <button type="submit" disabled={isSubmitting} className="w-full text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors disabled:opacity-50 bg-cyan-600 hover:bg-cyan-700">
                    {isSubmitting ? 'Updating...' : 'Update Owner'}
                </button>
            </form>
        </FormWrapper>
    );
}

function OwnerDetailsPage({ owner, pets, handleSelectPet, navigateTo, db }) {
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
        const petRef = doc(db, `artifacts/${appId}/public/data/pets`, petId);
        batch.delete(petRef);

        const recordsQuery = query(collection(db, `artifacts/${appId}/public/data/medicalRecords`), where('petId', '==', petId));
        const appointmentsQuery = query(collection(db, `artifacts/${appId}/public/data/appointments`), where('petId', '==', petId));
        
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

function AddPetPage({ owner, db, userId, setView, setError }) {
    const [name, setName] = useState('');
    const [species, setSpecies] = useState('Dog');
    const [breed, setBreed] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('Male');
    const [imageName, setImageName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !species) { setError('Name and Species are required.'); return; }
        setIsSubmitting(true);
        setError('');
        try {
            const imageUrl = `https://placehold.co/400x400/06b6d4/ffffff?text=${name.charAt(0)}`;

            await addDoc(collection(db, `artifacts/${appId}/public/data/pets`), { 
                name, species, breed, age, gender, 
                imageUrl,
                ownerId: owner.id, userId, createdAt: serverTimestamp() 
            });
            setView('ownerDetails', owner);
        } catch (err) {
            setError('Failed to add pet.');
        } finally { setIsSubmitting(false); }
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
                                    <input id="pet-image-upload" name="pet-image-upload" type="file" className="sr-only" onChange={(e) => setImageName(e.target.files[0]?.name)} accept="image/*" />
                                </label>
                            </div>
                            <p className="text-xs text-gray-500">{imageName ? `Selected: ${imageName}` : 'PNG, JPG up to 10MB'}</p>
                            <p className="text-xs text-yellow-600">(Note: File upload is simulated.)</p>
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

function EditPetPage({ pet, owner, db, setView, setError }) {
    const [name, setName] = useState(pet.name || '');
    const [species, setSpecies] = useState(pet.species || 'Dog');
    const [breed, setBreed] = useState(pet.breed || '');
    const [age, setAge] = useState(pet.age || '');
    const [gender, setGender] = useState(pet.gender || 'Male');
    const [imageName, setImageName] = useState(pet.imageUrl ? 'Current Image' : '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !species) { setError('Name and Species are required.'); return; }
        setIsSubmitting(true);
        setError('');
        try {
            const petRef = doc(db, `artifacts/${appId}/public/data/pets`, pet.id);
            const imageUrl = `https://placehold.co/400x400/06b6d4/ffffff?text=${name.charAt(0)}`;
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
                                    <input id="pet-image-upload-edit" name="pet-image-upload" type="file" className="sr-only" onChange={(e) => setImageName(e.target.files[0]?.name)} accept="image/*" />
                                </label>
                            </div>
                            <p className="text-xs text-gray-500">{imageName ? `Selected: ${imageName}` : 'PNG, JPG up to 10MB'}</p>
                            <p className="text-xs text-yellow-600">(Note: File upload is simulated.)</p>
                        </div>
                    </div>
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors disabled:opacity-50 bg-green-500 hover:bg-green-600">
                    {isSubmitting ? 'Updating...' : 'Update Pet'}
                </button>
            </form>
        </FormWrapper>
    );
}

// --- PET DETAILS PAGE (UPDATED) ---
function PetDetailsPage({ pet, owner, records, db, userId, handleBack, setError, navigateTo }) {
    const [recordToDelete, setRecordToDelete] = useState(null);

    const handleDelete = async () => {
        if (!recordToDelete) return;
        try {
            await deleteDoc(doc(db, `artifacts/${appId}/public/data/medicalRecords`, recordToDelete.id));
            setRecordToDelete(null);
        } catch (e) {
            console.error("Error deleting medical record:", e);
            setError("Failed to delete medical record.");
        }
    }

    if (!pet || !owner) return <div className="text-center p-8">Pet or owner data not found.</div>;
    
    return (
        <div className="max-w-7xl mx-auto">
            {recordToDelete && (
                <ConfirmationModal
                    title="Delete Medical Record"
                    message={`Are you sure you want to delete this medical record from ${recordToDelete.recordDate.toLocaleDateString()}? This action cannot be undone.`}
                    onConfirm={handleDelete}
                    onCancel={() => setRecordToDelete(null)}
                    confirmColor="red"
                />
            )}
            <BackButton onBack={handleBack} />
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border">
                <div className="flex flex-col sm:flex-row items-center text-center sm:text-left sm:space-x-5">
                    <img 
                        src={pet.imageUrl || `https://placehold.co/100x100/06b6d4/ffffff?text=${pet.name.charAt(0)}`}
                        alt={pet.name}
                        className="w-24 h-24 rounded-full object-cover flex-shrink-0 mb-4 sm:mb-0"
                        onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/100x100/06b6d4/ffffff?text=${pet.name.charAt(0)}`; }}
                    />
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">{pet.name}</h1>
                        <p className="text-gray-500">{pet.species} | {pet.breed} | {pet.gender}</p>
                        <p className="text-gray-500 mt-1">Age: {pet.age}</p>
                        <p className="text-gray-500 mt-1">Owner: {`${owner.firstName} ${owner.lastName}`}</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-700">Medical History</h2>
                <button onClick={() => navigateTo('addMedicalRecord', pet)} className="flex items-center justify-center bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-cyan-700 transition-colors">
                    <PlusCircle className="mr-2" size={20} /> Add Record
                </button>
            </div>
            <MedicalRecordsList 
                records={records}
                onEdit={(record) => navigateTo('editMedicalRecord', record)}
                onDelete={setRecordToDelete}
            />
        </div>
    );
}

// --- ADD MEDICAL RECORD PAGE ---
function AddMedicalRecordPage({ pet, owner, db, userId, setError, setView }) {
    const today = new Date().toISOString().split('T')[0];
    const [recordDate, setRecordDate] = useState(today);
    const [diagnosticTest, setDiagnosticTest] = useState('');
    const [testResult, setTestResult] = useState('');
    const [otherTestNotes, setOtherTestNotes] = useState('');
    const [prescribedMedicine, setPrescribedMedicine] = useState('');
    const [followUpDate, setFollowUpDate] = useState('');
    const [followUpTime, setFollowUpTime] = useState('');
    const [notes, setNotes] = useState('');
    const [payment, setPayment] = useState('');
    const [fileName, setFileName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const diagnosticOptions = [
        'Blood Test', 'X-Ray', 'Urine Test', 'Ultrasound', 'Skin Test', 'Other'
    ];
    const resultOptions = {
        'Blood Test': ['Normal', 'Abnormal'],
        'X-Ray': ['Clear', 'Issue Found'],
        'Urine Test': ['Normal', 'Abnormal'],
        'Ultrasound': ['Normal', 'Abnormal'],
        'Skin Test': ['Allergic Reaction', 'Normal'],
        'Other': []
    };
    
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
            const batch = writeBatch(db);
            
            const recordRef = doc(collection(db, `artifacts/${appId}/public/data/medicalRecords`));
            const recordData = {
                petId: pet.id,
                userId,
                recordDate: new Date(recordDate),
                diagnosticTest,
                testResult,
                otherTestNotes,
                prescribedMedicine,
                notes,
                payment: Number(payment) || 0,
                followUpDate: followUpDate ? new Date(`${followUpDate}T${followUpTime || '00:00'}`) : null,
                fileName,
                createdAt: serverTimestamp()
            };
            batch.set(recordRef, recordData);

            if (followUpDate && followUpTime) {
                const appointmentRef = doc(collection(db, `artifacts/${appId}/public/data/appointments`));
                const followUpDateTime = new Date(`${followUpDate}T${followUpTime}`);
                batch.set(appointmentRef, {
                    ownerId: owner.id,
                    petId: pet.id,
                    dateTime: followUpDateTime,
                    reason: `Follow-up for ${diagnosticTest || 'previous visit'}`,
                    status: 'Scheduled',
                    userId,
                    createdAt: serverTimestamp()
                });
            }

            await batch.commit();
            setView('petDetails', pet);

        } catch (err) {
            console.error("Failed to add medical record:", err);
            setError('Failed to add record. Check console for details.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <FormWrapper title={`Add Record for ${pet.name}`} onBack={() => setView('petDetails', pet)}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <InputField label="Date of Record" type="date" value={recordDate} onChange={e => setRecordDate(e.target.value)} required />
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Diagnostic Tests & Results</label>
                    <div className="grid grid-cols-2 gap-4">
                        <InputField type="select" value={diagnosticTest} onChange={e => {setDiagnosticTest(e.target.value); setTestResult('')}} noLabel>
                             <option value="">Select Test</option>
                             {diagnosticOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </InputField>
                        <InputField type="select" value={testResult} onChange={e => setTestResult(e.target.value)} noLabel disabled={!diagnosticTest || diagnosticTest === 'Other'}>
                             <option value="">Select Result</option>
                             {(resultOptions[diagnosticTest] || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </InputField>
                    </div>
                     {diagnosticTest === 'Other' && (
                        <InputField type="text" placeholder="Specify test and result notes..." value={otherTestNotes} onChange={e => setOtherTestNotes(e.target.value)} noLabel className="mt-2"/>
                     )}
                </div>

                <InputField label="Prescribed Medicine" type="textarea" value={prescribedMedicine} onChange={e => setPrescribedMedicine(e.target.value)} placeholder="e.g., Amoxicillin 250mg, 1 tablet twice a day for 7 days" />
                
                <InputField label="General Notes" type="textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add any general notes about the visit..." />

                <InputField label="Payment Amount ($)" type="number" value={payment} onChange={e => setPayment(e.target.value)} placeholder="0.00" />


                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Follow-up Appointment</label>
                    <div className="grid grid-cols-2 gap-4">
                         <InputField type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} noLabel />
                         <InputField type="time" value={followUpTime} onChange={e => setFollowUpTime(e.target.value)} noLabel />
                    </div>
                </div>
                
                 <div>
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
                            <p className="text-xs text-gray-500">{fileName ? `Selected: ${fileName}` : 'PDF, PNG, JPG up to 10MB'}</p>
                            <p className="text-xs text-yellow-600">(Note: File upload is simulated and not stored.)</p>
                        </div>
                    </div>
                </div>

                <button type="submit" disabled={isSubmitting} className={`w-full text-white font-bold py-2.5 px-4 rounded-lg shadow-md transition-colors disabled:opacity-50 bg-cyan-600 hover:bg-cyan-700`}>
                    {isSubmitting ? 'Saving...' : 'Add Record'}
                </button>
            </form>
        </FormWrapper>
    );
}

// --- EDIT MEDICAL RECORD PAGE ---
function EditMedicalRecordPage({ record, pet, owner, db, userId, setError, setView }) {
    const [recordDate, setRecordDate] = useState(record.recordDate ? record.recordDate.toISOString().split('T')[0] : '');
    const [diagnosticTest, setDiagnosticTest] = useState(record.diagnosticTest || '');
    const [testResult, setTestResult] = useState(record.testResult || '');
    const [otherTestNotes, setOtherTestNotes] = useState(record.otherTestNotes || '');
    const [prescribedMedicine, setPrescribedMedicine] = useState(record.prescribedMedicine || '');
    const [followUpDate, setFollowUpDate] = useState(record.followUpDate ? record.followUpDate.toISOString().split('T')[0] : '');
    const [followUpTime, setFollowUpTime] = useState(record.followUpDate ? record.followUpDate.toTimeString().substring(0,5) : '');
    const [notes, setNotes] = useState(record.notes || '');
    const [payment, setPayment] = useState(record.payment || '');
    const [fileName, setFileName] = useState(record.fileName || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

     const diagnosticOptions = [
        'Blood Test', 'X-Ray', 'Urine Test', 'Ultrasound', 'Skin Test', 'Other'
    ];
    const resultOptions = {
        'Blood Test': ['Normal', 'Abnormal'],
        'X-Ray': ['Clear', 'Issue Found'],
        'Urine Test': ['Normal', 'Abnormal'],
        'Ultrasound': ['Normal', 'Abnormal'],
        'Skin Test': ['Allergic Reaction', 'Normal'],
        'Other': []
    };
    
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
            const recordRef = doc(db, `artifacts/${appId}/public/data/medicalRecords`, record.id);
            const recordData = {
                ...record, // preserve existing data
                recordDate: new Date(recordDate),
                diagnosticTest,
                testResult,
                otherTestNotes,
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
                 <InputField label="Date of Record" type="date" value={recordDate} onChange={e => setRecordDate(e.target.value)} required />
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Diagnostic Tests & Results</label>
                    <div className="grid grid-cols-2 gap-4">
                        <InputField type="select" value={diagnosticTest} onChange={e => {setDiagnosticTest(e.target.value); setTestResult('')}} noLabel>
                             <option value="">Select Test</option>
                             {diagnosticOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </InputField>
                        <InputField type="select" value={testResult} onChange={e => setTestResult(e.target.value)} noLabel disabled={!diagnosticTest || diagnosticTest === 'Other'}>
                             <option value="">Select Result</option>
                             {(resultOptions[diagnosticTest] || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </InputField>
                    </div>
                     {diagnosticTest === 'Other' && (
                        <InputField type="text" placeholder="Specify test and result notes..." value={otherTestNotes} onChange={e => setOtherTestNotes(e.target.value)} noLabel className="mt-2"/>
                     )}
                </div>

                <InputField label="Prescribed Medicine" type="textarea" value={prescribedMedicine} onChange={e => setPrescribedMedicine(e.target.value)} placeholder="e.g., Amoxicillin 250mg, 1 tablet twice a day for 7 days" />
                
                <InputField label="General Notes" type="textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add any general notes about the visit..." />
                
                <InputField label="Payment Amount ($)" type="number" value={payment} onChange={e => setPayment(e.target.value)} placeholder="0.00" />

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Follow-up Appointment</label>
                    <div className="grid grid-cols-2 gap-4">
                         <InputField type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} noLabel />
                         <InputField type="time" value={followUpTime} onChange={e => setFollowUpTime(e.target.value)} noLabel />
                    </div>
                </div>
                
                 <div>
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

                <button type="submit" disabled={isSubmitting} className={`w-full text-white font-bold py-2.5 px-4 rounded-lg shadow-md transition-colors disabled:opacity-50 bg-cyan-600 hover:bg-cyan-700`}>
                    {isSubmitting ? 'Updating...' : 'Update Record'}
                </button>
            </form>
         </FormWrapper>
    )
}

// --- MEDICAL RECORDS LIST (REWORKED) ---
function MedicalRecordsList({ records, onEdit, onDelete }) {
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
                                <th className="px-4 py-3">Details</th>
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
                                        {record.recordDate ? record.recordDate.toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-4 py-4 max-w-sm">
                                        <p><strong>Test:</strong> {record.diagnosticTest || 'N/A'}</p>
                                        <p className="truncate"><strong>Result:</strong> {record.testResult || record.otherTestNotes || 'N/A'}</p>
                                        <p className="truncate"><strong>Prescription:</strong> {record.prescribedMedicine || 'N/A'}</p>
                                        <p className="pt-1 mt-1 border-t border-gray-200 truncate"><strong>Notes:</strong> {record.notes || 'N/A'}</p>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        ${(record.payment || 0).toFixed(2)}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        {record.followUpDate ? record.followUpDate.toLocaleDateString() : 'None'}
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

function LoadingSpinner({ message = 'Loading...' }) {
    return (
        <div className="flex flex-col items-center justify-center p-12">
            <div className="w-12 h-12 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600 font-medium">{message}</p>
        </div>
    );
}

function ErrorMessage({ message }) {
    if (!message) return null;
    return (
        <div className="max-w-4xl mx-auto p-4 my-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg">
            <p><strong>Error:</strong> {message}</p>
        </div>
    );
}

function BackButton({ onBack }) {
    return (
        <button onClick={onBack} className="flex items-center text-sm text-gray-600 hover:text-gray-900 font-semibold mb-6">
            <ArrowLeft size={16} className="mr-1" /> Back
        </button>
    );
}

function FormWrapper({ title, onBack, children }) {
    return (
        <div className="max-w-2xl mx-auto">
            {onBack && <BackButton onBack={onBack} />}
            <div className="bg-white p-8 rounded-xl shadow-sm border">
                <h2 className="text-3xl font-bold text-gray-800 text-center mb-8">{title}</h2>
                {children}
            </div>
        </div>
    );
}

function InputField({ label, type, value, onChange, required=false, placeholder, noLabel=false, disabled=false, children, className }) {
    const commonClasses = `block w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm transition-shadow disabled:bg-gray-100 disabled:cursor-not-allowed ${className}`;
    return (
        <div>
            {!noLabel && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
            {type === 'textarea' ? (
                <textarea value={value} onChange={onChange} required={required} placeholder={placeholder} disabled={disabled} rows="4" className={commonClasses}></textarea>
            ) : type === 'select' ? (
                <select value={value} onChange={onChange} required={required} disabled={disabled} className={commonClasses}>{children}</select>
            ) : (
                <input type={type} value={value} onChange={onChange} required={required} placeholder={placeholder} disabled={disabled} className={commonClasses} />
            )}
        </div>
    );
}

function ConfirmationModal({ title, message, onConfirm, onCancel, confirmColor = 'red' }) {
    const colorClasses = {
        red: { bg: 'bg-red-600', hoverBg: 'hover:bg-red-700', iconBg: 'bg-red-100', iconText: 'text-red-600' },
        cyan: { bg: 'bg-cyan-600', hoverBg: 'hover:bg-cyan-700', iconBg: 'bg-cyan-100', iconText: 'text-cyan-600' },
    }
    const theme = colorClasses[confirmColor];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex items-start">
                    <div className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${theme.iconBg} sm:mx-0 sm:h-10 sm:w-10`}>
                        <AlertTriangle className={`h-6 w-6 ${theme.iconText}`} aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500">{message}</p>
                        </div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                        type="button"
                        className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white ${theme.bg} ${theme.hoverBg} focus:outline-none sm:ml-3 sm:w-auto sm:text-sm`}
                        onClick={onConfirm}
                    >
                        Confirm
                    </button>
                    <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}


function BackupOptionsModal({ isOpen, onClose, onGenerate, isGeneratingPdf, pdfScriptsLoaded }) {
    const [options, setOptions] = useState({
        includeOwners: true,
        includePets: true,
        includeAppointments: true,
        includeMedicalRecords: true,
    });

    if (!isOpen) return null;

    const handleCheckboxChange = (e) => {
        const { name, checked } = e.target;
        setOptions(prev => ({ ...prev, [name]: checked }));
    };
    
    const handleGenerate = () => {
        onGenerate(options);
        onClose();
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Backup Options</h3>
                     <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200"><X size={20}/></button>
                </div>
                 <p className="text-sm text-gray-500 mb-4">Select the data you want to include in the PDF backup.</p>
                <div className="space-y-4">
                    {Object.keys(options).map(key => (
                        <label key={key} className="flex items-center">
                            <input
                                type="checkbox"
                                name={key}
                                checked={options[key]}
                                onChange={handleCheckboxChange}
                                className="h-4 w-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                            />
                            <span className="ml-3 text-sm text-gray-700">{key.replace('include', '')}</span>
                        </label>
                    ))}
                </div>
                <div className="mt-6 sm:flex sm:flex-row-reverse">
                     <button
                        type="button"
                        disabled={isGeneratingPdf || !pdfScriptsLoaded}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-cyan-600 text-base font-medium text-white hover:bg-cyan-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                        onClick={handleGenerate}
                    >
                        {isGeneratingPdf ? 'Generating...' : 'Generate Backup'}
                    </button>
                    <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
