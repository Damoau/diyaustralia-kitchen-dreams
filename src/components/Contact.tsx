import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const Contact = () => {
  return (
    <section id="contact" className="py-20 bg-gradient-to-b from-cream to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Ready to Transform Your Kitchen?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Get in touch for a free consultation. We'll discuss your vision and provide 
            a detailed quote for your custom kitchen project.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Form */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground">Get Your Free Quote</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      First Name *
                    </label>
                    <Input placeholder="John" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Last Name *
                    </label>
                    <Input placeholder="Smith" />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Email Address *
                  </label>
                  <Input type="email" placeholder="john@example.com" />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Phone Number *
                  </label>
                  <Input type="tel" placeholder="0400 000 000" />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Project Details
                  </label>
                  <Textarea 
                    placeholder="Tell us about your kitchen project - size, style preferences, timeline, etc."
                    rows={4}
                  />
                </div>
                
                <Button variant="hero" size="lg" className="w-full">
                  Send My Quote Request
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-8">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-foreground">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-bold">📞</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Phone</h4>
                    <p className="text-muted-foreground">1300 DIY AUS (1300 349 287)</p>
                    <p className="text-muted-foreground">Available Mon-Fri 8AM-6PM</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-bold">✉️</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Email</h4>
                    <p className="text-muted-foreground">info@diyaustralia.com</p>
                    <p className="text-muted-foreground">We respond within 2 hours</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-bold">📍</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Service Areas</h4>
                    <p className="text-muted-foreground">Melbourne Metropolitan</p>
                    <p className="text-muted-foreground">Sydney & Surrounds</p>
                    <p className="text-muted-foreground">Brisbane & Gold Coast</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary to-accent text-white shadow-lg">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4">Special Offer</h3>
                <p className="text-lg mb-4 opacity-90">
                  Book your free consultation this month and receive a 
                  <strong> 10% discount</strong> on your total project cost.
                </p>
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
                  Claim This Offer
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;