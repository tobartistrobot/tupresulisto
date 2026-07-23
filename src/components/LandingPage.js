import React, { useState, useEffect, useCallback } from 'react';
import { track, EVENTS } from '../lib/analytics';
import Header from './v30/landing/Header';
import Hero from './v30/landing/Hero';
import Problem from './v30/landing/Problem';
import HowItWorks from './v30/landing/HowItWorks';
import Features from './v30/landing/Features';
import Pricing from './v30/landing/Pricing';
import Comparison from './v30/landing/Comparison';
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

    // Envuelve el registro para saber DESDE QUÉ sección se pulsa. Es lo que luego
    // dice qué parte de la página convierte y cuál sobra.
    const registrarDesde = useCallback((origen) => () => {
        track(EVENTS.REGISTRO_INICIADO, { origen });
        onRegister();
    }, [onRegister]);

    return (
        <div className="font-sans text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 min-h-screen selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden transition-colors">
            <Header
                scrolled={scrolled}
                mobileMenu={mobileMenu}
                setMobileMenu={setMobileMenu}
                onLogin={onLogin}
                onRegister={registrarDesde('cabecera')}
            />

            {/* Orden pensado como un embudo: que se reconozca en el problema, entienda
                cómo se resuelve, vea que sirve para lo suyo, y solo entonces el precio.
                Las dudas van al final, justo donde aparecen antes de decidirse. */}
            <main>
                <Hero onRegister={registrarDesde('hero')} onLogin={onLogin} />
                <Problem />
                <HowItWorks onRegister={registrarDesde('como_funciona')} />
                <Features onShowTour={onShowTour} />
                <Pricing onRegister={registrarDesde('cta_tipos_calculo')} />
                <Comparison />
                <Plans onRegister={registrarDesde('precios')} />
                <FAQ />
                <FinalCTA onRegister={registrarDesde('cierre')} />
            </main>

            <Footer />
        </div>
    );
};

export default LandingPage;
