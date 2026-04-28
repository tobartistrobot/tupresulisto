import React, { useState, useEffect } from 'react';
import Header from './v30/landing/Header';
import Hero from './v30/landing/Hero';
import Features from './v30/landing/Features';
import Pricing from './v30/landing/Pricing';
import Footer from './v30/landing/Footer';

/**
 * LandingPage - Componente principal de la página de inicio.
 * Refactorizado para utilizar componentes modulares en v30/landing/.
 */
const LandingPage = ({ onLogin, onRegister, onShowTour }) => {
    const [mobileMenu, setMobileMenu] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="font-sans text-slate-800 bg-slate-50 min-h-screen selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
            <Header
                scrolled={scrolled}
                mobileMenu={mobileMenu}
                setMobileMenu={setMobileMenu}
                onLogin={onLogin}
                onRegister={onRegister}
            />

            <main>
                <Hero onRegister={onRegister} onLogin={onLogin} />
                <Features onShowTour={onShowTour} />
                <Pricing onRegister={onRegister} />
            </main>

            <Footer />
        </div>
    );
};

export default LandingPage;
