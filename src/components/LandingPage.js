import React, { useState, useEffect } from 'react';
import Header from './v30/landing/Header';
import Hero from './v30/landing/Hero';
import Problem from './v30/landing/Problem';
import HowItWorks from './v30/landing/HowItWorks';
import Features from './v30/landing/Features';
import Pricing from './v30/landing/Pricing';
import Plans from './v30/landing/Plans';
import FAQ from './v30/landing/FAQ';
import FinalCTA from './v30/landing/FinalCTA';
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
        <div className="font-sans text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 min-h-screen selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden transition-colors">
            <Header
                scrolled={scrolled}
                mobileMenu={mobileMenu}
                setMobileMenu={setMobileMenu}
                onLogin={onLogin}
                onRegister={onRegister}
            />

            {/* Orden pensado como un embudo: que se reconozca en el problema, entienda
                cómo se resuelve, vea que sirve para lo suyo, y solo entonces el precio.
                Las dudas van al final, justo donde aparecen antes de decidirse. */}
            <main>
                <Hero onRegister={onRegister} onLogin={onLogin} />
                <Problem />
                <HowItWorks onRegister={onRegister} />
                <Features onShowTour={onShowTour} />
                <Pricing onRegister={onRegister} />
                <Plans onRegister={onRegister} />
                <FAQ />
                <FinalCTA onRegister={onRegister} />
            </main>

            <Footer />
        </div>
    );
};

export default LandingPage;
