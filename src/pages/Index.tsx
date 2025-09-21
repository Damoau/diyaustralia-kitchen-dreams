import DynamicHeader from "@/components/DynamicHeader";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Gallery from "@/components/Gallery";
import About from "@/components/About";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import { ImpersonationLayout } from "@/components/layout/ImpersonationLayout";

const Index = () => {
  return (
    <ImpersonationLayout>
      <div className="min-h-screen">
        <DynamicHeader />
        <Hero />
        <Services />
        <Gallery />
        <About />
        <Contact />
        <Footer />
      </div>
    </ImpersonationLayout>
  );
};

export default Index;
