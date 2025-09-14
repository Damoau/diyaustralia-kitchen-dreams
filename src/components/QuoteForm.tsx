import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileText } from "lucide-react";

const quoteFormSchema = z.object({
  // Personal Details
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  suburb: z.string().min(2, "Suburb is required"),
  
  // Cabinet Details
  kitchenStyle: z.string().min(1, "Kitchen style is required"),
  otherKitchenStyle: z.string().optional(),
  cabinetFinish: z.string().optional(),
  colorPreference: z.string().optional(),
  
  // Project Details
  projectType: z.enum(["new-kitchen", "renovation", "replacement", "other"]),
  approximateBudget: z.enum(["under-10k", "10k-20k", "20k-40k", "40k-plus", "not-sure"]),
  timeframe: z.enum(["asap", "1-3-months", "3-6-months", "6-plus-months", "flexible"]),
  
  // Additional Details
  additionalNotes: z.string().optional(),
});

type QuoteFormData = z.infer<typeof quoteFormSchema>;

interface QuoteFormProps {
  onClose?: () => void;
}

export default function QuoteForm({ onClose }: QuoteFormProps) {
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<QuoteFormData>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      suburb: "",
      kitchenStyle: "",
      otherKitchenStyle: "",
      cabinetFinish: "",
      colorPreference: "",
      projectType: "new-kitchen",
      approximateBudget: "not-sure",
      timeframe: "flexible",
      additionalNotes: "",
    },
  });

  const kitchenStyles = [
    { value: "shaker", label: "Shaker Style" },
    { value: "poly-flat", label: "Poly - Flat Door" },
    { value: "shadowline", label: "Shadowline - Handless" },
    { value: "contemporary", label: "Contemporary" },
    { value: "traditional", label: "Traditional" },
    { value: "other", label: "Other (specify below)" },
  ];

  const cabinetFinishes = [
    { value: "polyurethane", label: "Polyurethane" },
    { value: "laminate", label: "Laminate" },
    { value: "2-pac", label: "2 Pac Painted" },
    { value: "timber-veneer", label: "Timber Veneer" },
    { value: "melamine", label: "Melamine" },
    { value: "other", label: "Other" },
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: QuoteFormData) => {
    setIsSubmitting(true);
    
    try {
      // Save quote request to database
      const { error } = await supabase.from("quote_requests" as any).insert({
        name: data.name,
        email: data.email,
        phone: data.phone,
        suburb: data.suburb,
        kitchen_style: data.kitchenStyle,
        other_kitchen_style: data.otherKitchenStyle,
        cabinet_finish: data.cabinetFinish,
        color_preference: data.colorPreference,
        project_type: data.projectType,
        approximate_budget: data.approximateBudget,
        timeframe: data.timeframe,
        additional_notes: data.additionalNotes,
        file_count: files.length,
      });

      if (error) throw error;

      toast({
        title: "Quote Request Submitted",
        description: "We'll get back to you within 24 hours with your custom quote.",
      });
      
      form.reset();
      setFiles([]);
      onClose?.();
    } catch (error) {
      console.error("Error submitting quote:", error);
      toast({
        title: "Error",
        description: "Failed to submit quote request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const watchKitchenStyle = form.watch("kitchenStyle");

  return (
    <Card className="w-full max-w-2xl mx-auto border-blue-200 bg-gradient-to-br from-blue-50/50 to-white shadow-lg shadow-blue-100/50">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Get Your Cabinet Quote</CardTitle>
        <p className="text-center text-muted-foreground">
          Fill out the form below and we'll provide you with a detailed quote within 24 hours.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="your@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="04XX XXX XXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="suburb"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Suburb *</FormLabel>
                      <FormControl>
                        <Input placeholder="Your suburb" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Cabinet Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Cabinet Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="kitchenStyle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kitchen Style *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select kitchen style" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {kitchenStyles.map((style) => (
                            <SelectItem key={style.value} value={style.value}>
                              {style.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cabinetFinish"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Finish</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select finish type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cabinetFinishes.map((finish) => (
                            <SelectItem key={finish.value} value={finish.value}>
                              {finish.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {watchKitchenStyle === "other" && (
                <FormField
                  control={form.control}
                  name="otherKitchenStyle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Describe Your Kitchen Style</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Please describe the kitchen style you're looking for..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="colorPreference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color Preference</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., White, Charcoal, Natural Wood, etc."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Project Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Project Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="projectType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="new-kitchen">New Kitchen</SelectItem>
                          <SelectItem value="renovation">Renovation</SelectItem>
                          <SelectItem value="replacement">Replacement</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="approximateBudget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Approximate Budget</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="under-10k">Under $10,000</SelectItem>
                          <SelectItem value="10k-20k">$10,000 - $20,000</SelectItem>
                          <SelectItem value="20k-40k">$20,000 - $40,000</SelectItem>
                          <SelectItem value="40k-plus">$40,000+</SelectItem>
                          <SelectItem value="not-sure">Not Sure</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="timeframe"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timeframe</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="asap">ASAP</SelectItem>
                          <SelectItem value="1-3-months">1-3 Months</SelectItem>
                          <SelectItem value="3-6-months">3-6 Months</SelectItem>
                          <SelectItem value="6-plus-months">6+ Months</SelectItem>
                          <SelectItem value="flexible">Flexible</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* File Upload Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Upload Your Plans (Optional)</h3>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload floor plans, inspiration photos, or existing kitchen photos
                  </p>
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <Button type="button" variant="outline" size="sm">
                      Browse Files
                    </Button>
                  </Label>
                  <Input
                    id="file-upload"
                    type="file"
                    multiple
                    accept="image/*,.pdf,.dwg"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">{file.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Additional Notes */}
            <FormField
              control={form.control}
              name="additionalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional details about your project, special requirements, or questions..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Submitting..." : "Submit Quote Request"}
              </Button>
              {onClose && (
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}