import { Card } from "@/components/ui/card";
import heroKitchen from "@/assets/hero-kitchen.jpg";
import cabinetsDetail from "@/assets/cabinets-detail.jpg";
import benchtopDetail from "@/assets/benchtop-detail.jpg";

const Gallery = () => {
  const projects = [
    {
      image: heroKitchen,
      title: "Modern Family Kitchen",
      description: "Complete renovation with custom cabinets and marble benchtops"
    },
    {
      image: cabinetsDetail,
      title: "Luxury Cabinet Details",
      description: "Premium timber with soft-close hardware and LED lighting"
    },
    {
      image: benchtopDetail,
      title: "Marble Benchtop Installation",
      description: "Seamless stone surfaces with waterfall edge feature"
    }
  ];

  return (
    <section id="gallery" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Our Beautiful Work
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Explore our portfolio of stunning kitchen transformations. Each project showcases 
            our commitment to quality craftsmanship and attention to detail.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {projects.map((project, index) => (
            <Card key={index} className="overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2 text-foreground">
                  {project.title}
                </h3>
                <p className="text-muted-foreground">
                  {project.description}
                </p>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-lg text-muted-foreground mb-6">
            Want to see more of our work? Visit our showroom or request a portfolio.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="#contact" 
              className="inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Request Full Portfolio
            </a>
            <a 
              href="#contact" 
              className="inline-flex items-center justify-center px-8 py-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
            >
              Book Showroom Visit
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Gallery;