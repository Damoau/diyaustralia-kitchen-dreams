import { Button } from "@/components/ui/button";

const About = () => {
  return (
    <section id="about" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Australian Craftsmanship Since 2008
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              At DIY Kitchens, we're passionate about creating beautiful, functional kitchens 
              that become the heart of your home. With over 15 years of experience, we combine 
              traditional craftsmanship with modern techniques to deliver exceptional results.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-6 text-foreground">Why Choose DIY Kitchens?</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Local Expertise</h4>
                    <p className="text-muted-foreground">
                      Born and bred in Australia, we understand local styles and building requirements.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Quality Materials</h4>
                    <p className="text-muted-foreground">
                      We source only the finest Australian timber and premium imported stone surfaces.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">End-to-End Service</h4>
                    <p className="text-muted-foreground">
                      From initial design consultation to final installation, we handle every detail.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Lifetime Guarantee</h4>
                    <p className="text-muted-foreground">
                      We stand behind our work with comprehensive warranties on all installations.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-cream to-secondary p-8 rounded-2xl">
              <h3 className="text-2xl font-bold mb-4 text-foreground">Our Process</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mr-4 font-bold">
                    1
                  </div>
                  <span className="text-foreground">Free consultation & design</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mr-4 font-bold">
                    2
                  </div>
                  <span className="text-foreground">Detailed quote & planning</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mr-4 font-bold">
                    3
                  </div>
                  <span className="text-foreground">Custom manufacturing</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center mr-4 font-bold">
                    4
                  </div>
                  <span className="text-foreground">Professional installation</span>
                </div>
              </div>
              
              <div className="mt-6">
                <Button variant="hero" className="w-full">
                  Start Your Project
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;