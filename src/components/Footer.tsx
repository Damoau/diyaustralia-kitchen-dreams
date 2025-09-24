const Footer = () => {
  return (
    <footer className="bg-foreground text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-dark rounded-xl"></div>
              <span className="text-2xl font-bold">DIY Kitchens</span>
            </div>
            <p className="text-gray-300 mb-8 max-w-md text-lg leading-relaxed">
              Transforming Australian homes with premium custom kitchen cabinets and benchtops. 
              Quality craftsmanship, exceptional service, guaranteed satisfaction.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-300 hover:text-primary transition-colors font-medium">
                Facebook
              </a>
              <a href="#" className="text-gray-300 hover:text-primary transition-colors font-medium">
                Instagram
              </a>
              <a href="#" className="text-gray-300 hover:text-primary transition-colors font-medium">
                LinkedIn
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xl font-bold mb-6">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <a href="#services" className="text-gray-300 hover:text-primary transition-colors" onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
                }}>
                  Our Services
                </a>
              </li>
              <li>
                <a href="#gallery" className="text-gray-300 hover:text-primary transition-colors" onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' });
                }}>
                  Gallery
                </a>
              </li>
              <li>
                <a href="#about" className="text-gray-300 hover:text-primary transition-colors" onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                }}>
                  About Us
                </a>
              </li>
              <li>
                <a href="#contact" className="text-gray-300 hover:text-primary transition-colors" onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                }}>
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-xl font-bold mb-6">Contact Us</h4>
            <div className="space-y-3 text-gray-300">
              <p className="font-medium">1300 DIY AUS</p>
              <p>info@diyaustralia.com</p>
              <p>Mon-Fri 8AM-6PM</p>
              <p>Australia Wide Service</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400">
          <p>&copy; 2024 DIY Kitchens. All rights reserved. | Privacy Policy | Terms of Service</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;