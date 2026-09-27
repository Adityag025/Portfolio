import { Nav } from '@/components/sections/Nav';
import { Hero } from '@/components/sections/Hero';
import { Work } from '@/components/sections/Work';
import { Stack } from '@/components/sections/Stack';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { Experience } from '@/components/sections/Experience';
import { Lab } from '@/components/sections/Lab';
import { Contact } from '@/components/sections/Contact';
import { Footer } from '@/components/sections/Footer';

export default function Home() {
  return (
    <>
      <Nav />
      <main id="main">
        <Hero />
        <Work />
        <Stack />
        <Dashboard />
        <Experience />
        <Lab />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
