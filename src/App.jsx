import React, { useState, useEffect } from 'react';
import { 
    Menu, X, Activity, ShieldAlert, HardDrive, Settings2, Monitor, Cpu, ChevronLeft, Info, Phone, Mail, MapPin, Check
} from 'lucide-react';

// --- Configuration & Data ---

// NOTE: Using the RAW content link for the logo, as previously agreed.
const GITHUB_RAW_URL = "https://raw.githubusercontent.com/CeaserH/logo/main/logo.png";
const placeholderLogoUrl = "https://placehold.co/320x160/A91C22/ffffff?text=VALLEJO+TECH";

// UPDATED: Using a stable, public-domain image URL from Wikimedia Commons for a general Vallejo cityscape.
const BACKGROUND_IMAGE_URL = "https://upload.wikimedia.org/wikipedia/commons/3/33/Vallejo_-_panoramio_%287%29.jpg";

// Defines the navigation structure and text labels
const NAV_LINKS = [
    { id: 'home', title: 'Home' },
    { id: 'services', title: 'Services & Pricing' },
    { id: 'about', title: 'About Us' },
    { id: 'contact', title: 'Contact' },
];

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

// --- Sub-Components ---

// Component for the dynamic page content
const PageContent = ({ pageId, servicesData }) => {
    switch (pageId) {
        case 'home':
            return <HomePageContent logoUrl={GITHUB_RAW_URL} placeholderLogoUrl={placeholderLogoUrl} />;
        case 'services':
            return <ServicesPageContent services={servicesData} />;
        case 'about':
            return <AboutPageContent />;
        case 'contact':
            return <ContactPageContent />;
        default:
            return <HomePageContent logoUrl={GITHUB_RAW_URL} placeholderLogoUrl={placeholderLogoUrl} />;
    }
};

// Component for a single service card
const ServiceCard = ({ service }) => {
    const IconComponent = service.icon;

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg transition duration-300 border border-gray-100 hover:shadow-xl hover:border-red-500 flex flex-col h-full">
            <div className="flex items-start mb-4">
                <div className="p-3 bg-red-100 rounded-lg mr-4 flex-shrink-0">
                    <IconComponent className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex flex-col flex-grow">
                    <h3 className="text-xl font-bold text-gray-900">{service.title}</h3>
                    <p className="text-md font-extrabold text-red-600">{service.pricing}</p>
                </div>
            </div>
            <p className="text-gray-600 text-base">{service.description}</p>
        </div>
    );
};

// --- Page Content Components ---

const HomePageContent = ({ logoUrl, placeholderLogoUrl }) => (
    <div className="py-12 md:py-20 max-w-4xl mx-auto text-center">
        {/* Main Hero Card - Background is now applied to the main App wrapper, this card needs a solid background for readability */}
        <div className="bg-white p-8 rounded-2xl shadow-2xl border-4 border-red-500/80">
            <div className="mb-10">
                <img 
                    src={logoUrl}
                    onError={(e) => { 
                        e.target.onerror = null; 
                        e.target.src = placeholderLogoUrl; 
                    }}
                    alt="Vallejo Tech Logo - PC & Laptop Repair" 
                    className="mx-auto h-auto w-80 object-contain rounded"
                />
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
                PC & Laptop Repair
            </h1>
            <p className="text-xl text-gray-700 mb-8">
                Fast, reliable, and professional tech support for your home and business. We diagnose the issue, you approve the fix.
            </p>

            <a href="tel:+17075905993" className="inline-block px-8 py-4 text-2xl font-black text-white bg-red-600 rounded-lg shadow-xl 
                                                     transition duration-300 hover:bg-red-700 hover:shadow-2xl transform hover:scale-[1.02]">
                Call Now: (707) 590-5993
            </a>
            <p className="text-md text-gray-600 mt-4">
                Mon-Fri: 8:30 AM - 4:00 PM | Serving Vallejo and surrounding areas.
            </p>
        </div>
        
        {/* Features Card */}
        <div className="mt-12 text-left bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 border-b pb-2">Why Choose Vallejo Tech?</h2>
            <ul className="space-y-4 text-lg text-gray-700">
                <li className="flex items-start">
                    <Check className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    <span className='font-semibold'>Local Expertise:</span> Deep understanding of the Vallejo community's tech needs.
                </li>
                <li className="flex items-start">
                    <Check className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    <span className='font-semibold'>Transparent Pricing:</span> Flat-rate pricing with no hidden fees, visible on our Services page.
                </li>
                <li className="flex items-start">
                    <Check className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                    <span className='font-semibold'>Guaranteed Results:</span> We stand by our work. If we can't fix it, you don't pay.
                </li>
            </ul>
        </div>
    </div>
);

const ServicesPageContent = ({ services }) => (
    <div className="py-12 max-w-6xl mx-auto">
        <h1 className="text-4xl font-extrabold text-white text-center mb-4 text-shadow-md">
            Our Services & Transparent Pricing
        </h1>
        <p className="text-xl text-gray-200 text-center mb-12 text-shadow-sm">
            Professional solutions for every type of computer trouble, with clear, flat-rate fees.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
                <ServiceCard key={index} service={service} />
            ))}
        </div>
    </div>
);

const AboutPageContent = () => (
    <div className="py-12 max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-2xl border border-gray-200">
        <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-8">
            About Vallejo Tech
        </h1>
        <p className="text-lg text-gray-700 mb-6">
            Vallejo Tech was founded by local computer specialist Ceaser Hernandez with a simple mission: to provide the Vallejo community with honest, expert, and affordable technical support. In an industry often plagued by confusing jargon and high prices, we prioritize transparency and education.
        </p>
        <p className="text-lg text-gray-700 mb-6">
            Unlike large big-box stores, we are dedicated to personal service. Every diagnostic is thorough, and every repair is handled with meticulous care. We believe technology should work for you, not the other way around. Our commitment is to get your devices running smoothly so you can focus on what matters most.
        </p>
        
        <div className="border-t pt-6 mt-6">
            <h2 className="text-2xl font-bold text-red-600 mb-3">Our Core Values</h2>
            <ul className="list-disc list-inside text-lg text-gray-700 space-y-2">
                <li><span className="font-semibold">Integrity:</span> Honest assessments and fair pricing, always.</li>
                <li><span className="font-semibold">Expertise:</span> Certified knowledge in Windows, macOS, and hardware diagnostics.</li>
                <li><span className="font-semibold">Community:</span> Serving Vallejo first, with a focus on local needs.</li>
            </ul>
        </div>
    </div>
);

const ContactPageContent = () => (
    <div className="py-12 max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold text-white text-center mb-4 text-shadow-md">
            Get In Touch with Vallejo Tech
        </h1>
        <p className="text-xl text-gray-200 text-center mb-12 text-shadow-sm">
            We are ready to assist with your technical issue. Contact us to schedule a service or get a consultation.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Contact Info Card */}
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-500/70 space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Info className="w-6 h-6 text-red-600 mr-2"/> Contact Information
                </h2>
                
                <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                        <Phone className="w-6 h-6 text-red-600 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-gray-500">Call Us</p>
                            <a href="tel:+17075905993" className="text-xl font-black text-gray-900 hover:text-red-600 transition duration-200">
                                (707) 590-5993
                            </a>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        <Mail className="w-6 h-6 text-red-600 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-gray-500">Email Us</p>
                            <a href="mailto:support@vallejotech.org" className="text-xl font-bold text-gray-900 hover:text-red-600 transition duration-200 break-all">
                                support@vallejotech.org
                            </a>
                        </div>
                    </div>

                    <div className="flex items-start space-x-4">
                        <MapPin className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                        <div>
                            <p className="text-sm font-semibold text-gray-500">Service Area</p>
                            <p className="text-xl font-bold text-gray-900">Vallejo & Surrounding Cities</p>
                            <p className="text-sm text-gray-600">(We are a mobile/on-site service)</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Business Hours Card */}
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200 space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Activity className="w-6 h-6 text-red-600 mr-2"/> Business Hours
                </h2>
                <div className="text-lg space-y-2">
                    <p className="flex justify-between font-semibold">
                        <span>Monday - Friday:</span>
                        <span className="text-red-600">8:30 AM - 4:00 PM</span>
                    </p>
                    <p className="flex justify-between">
                        <span>Saturday:</span>
                        <span className="text-gray-500">Closed</span>
                    </p>
                    <p className="flex justify-between">
                        <span>Sunday:</span>
                        <span className="text-gray-500">Closed</span>
                    </p>
                </div>
                <p className="pt-4 border-t text-sm text-gray-600">
                    *Appointments and urgent services can sometimes be arranged outside of standard hours.
                </p>
            </div>
        </div>
    </div>
);

// --- Header Component ---

const Header = ({ currentPage, setCurrentPage, toggleDrawer }) => (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm shadow-md py-4 border-b border-red-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            
            {/* Logo/Brand Name */}
            <button onClick={() => setCurrentPage('home')} className="flex items-center space-x-2 focus:outline-none">
                <img 
                    src={GITHUB_RAW_URL} 
                    onError={(e) => { e.target.onerror = null; e.target.src = placeholderLogoUrl; }}
                    alt="Vallejo Tech" 
                    className="h-8 w-auto object-contain rounded"
                />
            </button>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
                {NAV_LINKS.map(link => (
                    <button
                        key={link.id}
                        onClick={() => setCurrentPage(link.id)}
                        className={`text-lg font-semibold transition duration-200 
                            ${currentPage === link.id 
                                ? 'text-red-600 border-b-2 border-red-600 pb-1' 
                                : 'text-gray-700 hover:text-red-500'}`}
                    >
                        {link.title}
                    </button>
                ))}
            </nav>

            {/* Mobile Menu Button (Hamburger) */}
            <button 
                onClick={toggleDrawer} 
                className="md:hidden p-2 text-gray-600 hover:text-red-600 transition duration-200 focus:outline-none"
                aria-label="Open menu"
            >
                <Menu className="w-6 h-6" />
            </button>
        </div>
    </header>
);

// --- Main Component: App (State Management) ---

export default function App() {
    // State to manage the current page view
    const [currentPage, setCurrentPage] = useState('home');
    
    // State to manage the mobile drawer open/close
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Effect to control body scrolling when the mobile drawer is open
    useEffect(() => {
        document.body.style.overflow = isDrawerOpen ? 'hidden' : '';
    }, [isDrawerOpen]);
    
    const toggleDrawer = () => {
        setIsDrawerOpen(prev => !prev);
    };
    
    // Function to handle navigation from the mobile drawer
    const navigateFromDrawer = (pageId) => {
        setCurrentPage(pageId);
        setIsDrawerOpen(false); // Close drawer after navigation
    }

    // Apply the background to the main container
    const backgroundStyle = {
        // Use the reddish bay sunset image
        backgroundImage: `url('${BACKGROUND_IMAGE_URL}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed', // Keeps the image stable as content scrolls
        minHeight: '100vh',
    };

    return (
        <div className="min-h-screen flex flex-col font-inter relative" style={backgroundStyle}>
            {/* Background Overlay for better text contrast, especially on non-home pages */}
            <div className="absolute inset-0 bg-black opacity-40 z-0"></div>
            
            {/* Content wrapper with higher Z-index */}
            <div className="relative z-10 flex flex-col min-h-screen">
                
                {/* 1. Header (Navigation Bar) */}
                <Header 
                    currentPage={currentPage} 
                    setCurrentPage={setCurrentPage} 
                    toggleDrawer={toggleDrawer}
                />
                
                {/* 2. Main Content Area */}
                <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
                    {/* Dynamic Page Rendering */}
                    <PageContent pageId={currentPage} servicesData={servicesData} />
                </main>

                {/* 3. Footer */}
                <footer className="w-full bg-gray-900/90 text-white mt-12 pt-10 pb-6">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <p className="text-xl font-bold mb-4">Vallejo Tech</p>
                        <div className="flex justify-center space-x-6 mb-6 text-sm">
                            {NAV_LINKS.map(link => (
                                <button key={link.id} onClick={() => setCurrentPage(link.id)} className="hover:text-red-500 transition duration-150">
                                    {link.title}
                                </button>
                            ))}
                        </div>
                        <p className="text-gray-400 text-sm border-t border-gray-800 pt-4">
                            &copy; {new Date().getFullYear()} Vallejo Tech. All rights reserved.
                        </p>
                    </div>
                </footer>
            </div>
            
            {/* 4. Mobile Drawer (For smaller screens) - Outside the Z-10 content wrapper */}
            
            {/* Backdrop */}
            {isDrawerOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    onClick={toggleDrawer} 
                ></div>
            )}
            
            {/* Drawer Panel */}
            <div 
                className={`fixed top-0 left-0 h-full w-64 bg-white z-50 transform transition-transform duration-300 shadow-2xl md:hidden 
                            ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="p-6 flex flex-col h-full">
                    {/* Drawer Header */}
                    <div className="flex justify-between items-center pb-4 border-b border-gray-200 mb-6">
                        <span className="text-xl font-extrabold text-red-600">Menu</span>
                        <button onClick={toggleDrawer} className="text-gray-600 hover:text-red-600">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    
                    {/* Drawer Navigation Links */}
                    <nav className="space-y-4 flex-grow">
                        {NAV_LINKS.map(link => (
                            <button
                                key={link.id}
                                onClick={() => navigateFromDrawer(link.id)}
                                className={`flex items-center w-full p-3 rounded-lg text-left transition duration-200 
                                            ${currentPage === link.id 
                                                ? 'bg-red-50 text-red-700 font-bold' 
                                                : 'text-gray-700 hover:bg-gray-100 font-semibold'}`}
                            >
                                {link.title}
                            </button>
                        ))}
                    </nav>
                    
                    {/* Quick Contact Footer */}
                    <div className="mt-auto pt-4 border-t text-sm text-gray-500">
                        <p className="font-semibold mb-1">Need help now?</p>
                        <a href="tel:+17075905993" className="text-red-600 font-bold">(707) 590-5993</a>
                    </div>
                </div>
            </div>
            
        </div>
    );
}