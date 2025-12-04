import React, { useState, useEffect } from 'react';
// Added Mail icon for the new contact info card
import { Menu, X, Activity, ShieldAlert, HardDrive, Settings2, Monitor, Cpu, ChevronLeft, Info, Phone, Mail } from 'lucide-react';

// --- Services Data ---
const servicesData = [
    {
        title: "Diagnostic & Tune-Up Service",
        icon: Activity,
        description: "The foundational service for all computer issues. Includes a comprehensive system check to precisely identify root causes. Fee waived or applied to final repair cost.",
        pricing: "$79 – $99 (Flat Fee)",
    },
    {
        title: "Virus & Malware Removal",
        icon: ShieldAlert,
        description: "Deep-cleaning service removing all viruses, spyware, and ransomware. Configures robust security software and repairs system files damaged by malware.",
        pricing: "$129 – $169 (Flat Fee)",
    },
    {
        title: "Hardware Repair & Upgrades",
        icon: HardDrive,
        description: "Fixing physical component failures (RAM, SSDs, PSU) and boosting performance. Includes expert parts consultation and professional installation.",
        pricing: "$99 – $149 (Labor Only)",
    },
    {
        title: "Operating System (OS) Install & Data Migration",
        icon: Settings2,
        description: "Clean slate OS reinstallations (Windows/macOS), ensuring all drivers are updated. Includes migrating all your important documents and files.",
        pricing: "$149 – $199 (Flat Fee)",
    },
    {
        title: "Remote Support & Troubleshooting",
        icon: Monitor,
        description: "Quick, secure, and convenient solutions for software issues, printer problems, and minor system cleanups. No physical access needed.",
        pricing: "$49 – $79 (Per Hour)",
    },
    {
        title: "Custom PC Builds & Consultation",
        icon: Cpu,
        description: "Building tailored computers for gaming or specialized tasks. Includes component selection, professional assembly, cable management, and stress testing.",
        pricing: "$199 – $299 (Flat Labor Fee)",
    }
];

// --- Component: ServiceCard ---
const ServiceCard = ({ service }) => {
    const IconComponent = service.icon;

    return (
        <div className="bg-white p-6 rounded-xl shadow-md transition duration-300 border border-gray-100 hover:shadow-xl hover:border-red-300 flex flex-col">
            <div className="flex items-start mb-2">
                <div className="p-3 bg-red-100 rounded-lg mr-4 flex-shrink-0">
                    <IconComponent className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex flex-col flex-grow">
                    <h3 className="text-lg font-bold text-gray-900">{service.title}</h3>
                    <p className="text-sm font-extrabold text-red-600 mb-1">{service.pricing}</p>
                </div>
            </div>
            <p className="text-sm text-gray-600">{service.description}</p>
        </div>
    );
};

// --- Component: MenuOption (Reused component for menu items) ---
const MenuOption = ({ icon: Icon, title, onClick }) => (
    <button 
        onClick={onClick}
        className="flex items-center w-full p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition duration-200 border border-gray-100 hover:border-red-300"
    >
        <Icon className="w-6 h-6 text-red-600 mr-4 flex-shrink-0" />
        <span className="text-lg font-semibold text-gray-800 text-left flex-grow">{title}</span>
        <ChevronLeft className="w-5 h-5 text-gray-400 transform rotate-180" />
    </button>
);


// --- Main Component: App ---
export default function App() {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    // State to track what is currently showing in the drawer: 'main_menu', 'services', or 'contact_info'
    const [drawerContent, setDrawerContent] = useState('main_menu');

    // Effect to control body scrolling when the drawer is open
    useEffect(() => {
        document.body.style.overflow = isDrawerOpen ? 'hidden' : '';
    }, [isDrawerOpen]);

    const toggleDrawer = () => {
        // When closing the drawer, always reset the view to the main menu for the next open.
        if (isDrawerOpen) {
            setDrawerContent('main_menu');
        }
        setIsDrawerOpen(prev => !prev);
    };

    // Determine the icon and text for the always-visible floating button
    const ToggleIcon = isDrawerOpen ? X : Menu;
    const toggleButtonText = isDrawerOpen ? 'Close Menu' : 'Menu';
    const drawerTranslateClass = isDrawerOpen ? 'translate-x-0' : '-translate-x-full';

    const getDrawerHeader = () => {
        if (drawerContent === 'services') {
            return { 
                title: 'Our Core Services', 
                backButton: () => setDrawerContent('main_menu'),
                closeButton: toggleDrawer
            };
        }
        // ADDED logic for the Contact Info page
        if (drawerContent === 'contact_info') {
            return { 
                title: 'Get In Touch', 
                backButton: () => setDrawerContent('main_menu'),
                closeButton: toggleDrawer
            };
        }
        // Default (main_menu)
        return { 
            title: 'Main Menu', 
            backButton: null,
            closeButton: toggleDrawer
        };
    };

    const header = getDrawerHeader();

    // Placeholder image for the logo (used in case of URL failure)
    const placeholderLogoUrl = "https://placehold.co/320x160/A91C22/ffffff?text=VALLEJO+TECH";

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#f7f9fc] font-inter">
            
            {/* 1. Backdrop */}
            {isDrawerOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
                    onClick={toggleDrawer} // Clicking backdrop closes the whole menu
                ></div>
            )}

            {/* 2. Floating Toggle Button (Always Visible) */}
            <button 
                onClick={toggleDrawer} 
                className="fixed top-4 left-4 z-50 flex items-center 
                          px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-lg shadow-lg 
                          transition duration-300 transform hover:bg-red-700 hover:scale-105 
                          focus:outline-none focus:ring-4 focus:ring-red-300"
            >
                <ToggleIcon className="w-5 h-5 mr-2" /> 
                {toggleButtonText}
            </button>

            {/* 3. Main Splash Page Content */}
            <div className="w-full max-w-7xl flex items-center justify-center p-4 md:p-8">
                <div className="w-full max-w-md rounded-xl px-6 py-10 md:px-12 md:py-16 text-center shadow-2xl border border-black bg-white">
                    
                    {/* Logo Image Section */}
                    <div className="mb-10">
                        <img 
                            src={placeholderLogoUrl} // Using a consistent placeholder as the previous URL failed
                            alt="Vallejo Tech Logo - PC & Laptop Repair" 
                            className="mx-auto h-auto w-80 object-contain rounded"
                        />
                    </div>

                    {/* Call to Action (Phone Number) */}
                    <div className="bg-white p-6 rounded-xl border-4 border-red-500 shadow-xl transition-shadow duration-300 hover:shadow-2xl">
                        <p className="text-2xl font-bold text-red-700 mb-2">
                            Need immediate help?
                        </p>
                        <p className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                            Contact us now!
                        </p>
                        <a href="tel:+17075905993" className="inline-block mt-4 text-3xl sm:text-4xl font-black text-red-600 hover:text-red-800 transition duration-300">
                            (707) 590-5993
                        </a>
                        <p className="text-md text-gray-600 mt-3">
                            Mon-Fri: 8:30 AM - 4:00 PM (Serving Vallejo and surrounding areas)
                        </p>
                    </div>

                    {/* Footer / Placeholder */}
                    <div className="mt-10 text-gray-500 text-sm">
                        <p>Full website launching soon.</p>
                        <p>&copy; 2025 Vallejo Tech. All Rights Reserved.</p>
                    </div>
                </div>
            </div>
            
            {/* 4. SLIDE-OUT SERVICES DRAWER */}
            <div 
                id="services-drawer" 
                className={`fixed top-0 left-0 h-full overflow-y-auto bg-gray-50 p-6 z-50 transform transition-transform duration-300 ease-in-out shadow-2xl 
                            w-full max-w-sm md:max-w-md ${drawerTranslateClass}`}
            >
                
                {/* Drawer Header (Dynamic based on content) */}
                <header className="pb-6 border-b border-gray-300 mb-6 flex justify-between items-center sticky top-0 bg-gray-50 z-10">
                    <div className="flex items-center">
                        {header.backButton && (
                            <button onClick={header.backButton} className="text-gray-600 hover:text-red-600 transition duration-200 mr-3">
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                        )}
                        <h1 className="text-2xl font-extrabold text-gray-800">{header.title}</h1>
                    </div>
                    
                    {/* Close Button */}
                    <button onClick={header.closeButton} className="text-red-600 hover:text-red-800 transition duration-200">
                        <X className="w-6 h-6" />
                    </button>
                </header>

                {/* Conditional Content Rendering */}
                {drawerContent === 'main_menu' && (
                    <div className="space-y-4">
                        <MenuOption 
                            icon={Activity} 
                            title="View Services & Pricing" 
                            onClick={() => setDrawerContent('services')} 
                        />
                        <MenuOption 
                            icon={Info} 
                            title="About Us (Coming Soon)" 
                            // Replaced alert() with a console log + simple custom message box in the UI
                            onClick={() => {
                                console.log("About Us page coming soon!");
                                // Basic feedback modal:
                                const modal = document.getElementById('coming-soon-modal');
                                modal.classList.remove('hidden');
                                setTimeout(() => modal.classList.add('hidden'), 2000);
                            }} 
                        />
                         <MenuOption 
                            icon={Phone} 
                            title="Contact Information" 
                            // Changed to switch content to the new contact_info card
                            onClick={() => setDrawerContent('contact_info')} 
                        />
                    </div>
                )}

                {drawerContent === 'services' && (
                    <div className="space-y-6">
                        {servicesData.map((service, index) => (
                            <ServiceCard key={index} service={service} />
                        ))}
                    </div>
                )}
                
                {/* NEW: Contact Information Card Content */}
                {drawerContent === 'contact_info' && (
                    <div className="space-y-6 p-6 bg-white rounded-xl shadow-lg border border-red-300">
                        <h2 className="text-xl font-bold text-gray-900 border-b pb-3 mb-3">Reach Out to Vallejo Tech</h2>
                        <p className="text-gray-700">
                            We're here to help you get your computer running perfectly again. Contact us during business hours for support.
                        </p>
                        
                        <div className="space-y-4">
                            {/* Phone Contact */}
                            <div className="flex items-start space-x-4 p-4 bg-red-50 rounded-lg shadow-sm">
                                <Phone className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                                <div>
                                    <p className="text-sm font-semibold text-gray-500">Call for Immediate Service</p>
                                    <a href="tel:+17075905993" className="text-2xl font-black text-gray-900 hover:text-red-600 transition duration-200">
                                        (707) 590-5993
                                    </a>
                                </div>
                            </div>
                            
                            {/* Email Contact */}
                            <div className="flex items-start space-x-4 p-4 bg-red-50 rounded-lg shadow-sm">
                                <Mail className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                                <div>
                                    <p className="text-sm font-semibold text-gray-500">Send an Email</p>
                                    <a href="mailto:support@vallejotech.org" className="text-lg font-bold text-gray-900 hover:text-red-600 transition duration-200 break-all">
                                        support@vallejotech.org
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 text-sm text-gray-600 border-t mt-4">
                            <p className="font-extrabold text-gray-800 mb-1">Business Hours:</p>
                            <p>Monday - Friday: <span className="font-semibold">8:30 AM - 4:00 PM</span></p>
                            <p className="mt-1">Serving Vallejo and surrounding areas.</p>
                        </div>
                    </div>
                )}
                
                {/* Footer is only rendered when on the 'main_menu' view. */}
                {drawerContent === 'main_menu' && (
                    <footer className="text-center mt-10 p-4 border-t border-gray-300 bg-gray-100 -mx-6 sticky bottom-0">
                         <p className="text-lg font-medium text-gray-700 mb-2">Ready to Book?</p>
                         <a href="tel:+17075905993" className="text-2xl font-black text-red-600 hover:text-red-800 transition duration-300">(707) 590-5993</a>
                         <p className="mt-4 text-gray-500 text-sm">Mon-Fri: 8:30 AM - 4:00 PM</p>
                    </footer>
                )}
            </div>

            {/* Global Notification Modal (Replaces alert() for 'Coming Soon') */}
            <div id="coming-soon-modal" className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50 hidden">
                <div className="bg-white p-6 rounded-xl shadow-2xl border-2 border-red-500 transform transition-transform duration-300 scale-100">
                    <p className="text-lg font-semibold text-gray-800">
                        About Us page is launching soon!
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Check back later.</p>
                </div>
            </div>
        </div>
    );
}