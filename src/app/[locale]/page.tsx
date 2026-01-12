'use client'
import HowtWork from '@/components/ui/HowtWork';
import Hero from '@/components/ui/Hero';
import Services from '@/components/ui/Services';
import TrackSection from '@/components/ui/TrackSection';
import RequestPermit from '@/components/ui/RequestPermit';
import Assistance from '@/components/ui/Assistance';


export default function HomePage() {

    return (
        <div className="min-h-screen bg-white">

            {/* Hero Section */}
            <Hero />
            {/* Features Section */}
            <HowtWork />
            {/* Services Section */}
            <Services />
            {/* Track Section */}
            <TrackSection />
            {/* RequestPermit Section */}
            <RequestPermit />
            {/* Assistance Section */}
            <Assistance />

        </div>
    );
}
