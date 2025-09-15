import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  CheckCircle,
  XCircle,
  Send
} from "lucide-react";

export const ProfileSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [displayName, setDisplayName] = useState("John Smith");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("+61 400 123 456");
  const [emailVerified, setEmailVerified] = useState(true);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [quoteUpdates, setQuoteUpdates] = useState(true);
  const [digestFrequency, setDigestFrequency] = useState("weekly");

  const handleSaveProfile = () => {
    // In real app, this would save to the server
    toast({
      title: "Profile updated",
      description: "Your profile information has been saved.",
    });
  };

  const handleVerifyEmail = () => {
    // In real app, this would trigger email verification
    toast({
      title: "Verification email sent",
      description: "Check your inbox for the verification link.",
    });
  };

  const handleVerifyPhone = () => {
    // In real app, this would trigger SMS OTP
    toast({
      title: "Verification code sent",
      description: "Check your phone for the verification code.",
    });
  };

  const handleChangePassword = () => {
    // In real app, this would navigate to change password flow
    toast({
      title: "Password change",
      description: "You'll receive an email with instructions to change your password.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account information and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="flex-1"
                />
                {emailVerified ? (
                  <Badge variant="default" className="shrink-0">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Button variant="outline" size="sm" onClick={handleVerifyEmail}>
                    <Send className="w-3 h-3 mr-1" />
                    Verify
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex gap-2">
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+61 400 000 000"
                  className="flex-1"
                />
                {phoneVerified ? (
                  <Badge variant="default" className="shrink-0">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Button variant="outline" size="sm" onClick={handleVerifyPhone}>
                    <Send className="w-3 h-3 mr-1" />
                    Verify
                  </Button>
                )}
              </div>
            </div>

            <Button onClick={handleSaveProfile} className="w-full">
              Save Profile
            </Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Password</p>
                  <p className="text-sm text-muted-foreground">
                    Last changed 30 days ago
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleChangePassword}>
                  Change
                </Button>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <h4 className="font-medium">Two-Factor Authentication</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">SMS Authentication</p>
                    <p className="text-xs text-muted-foreground">
                      Receive codes via SMS
                    </p>
                  </div>
                  <Switch disabled />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">Email Authentication</p>
                    <p className="text-xs text-muted-foreground">
                      Receive codes via email
                    </p>
                  </div>
                  <Switch disabled />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Email Notifications</h4>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Order Updates</p>
                  <p className="text-xs text-muted-foreground">
                    Production status and shipping updates
                  </p>
                </div>
                <Switch 
                  checked={orderUpdates}
                  onCheckedChange={setOrderUpdates}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Quote Updates</p>
                  <p className="text-xs text-muted-foreground">
                    New quotes and revisions
                  </p>
                </div>
                <Switch 
                  checked={quoteUpdates}
                  onCheckedChange={setQuoteUpdates}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Marketing Communications</p>
                  <p className="text-xs text-muted-foreground">
                    Product news and promotions
                  </p>
                </div>
                <Switch 
                  checked={marketingOptIn}
                  onCheckedChange={setMarketingOptIn}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Delivery Preferences</h4>
              
              <div className="space-y-2">
                <Label>Message Digest Frequency</Label>
                <select 
                  value={digestFrequency}
                  onChange={(e) => setDigestFrequency(e.target.value)}
                  className="w-full p-2 border border-input rounded-md"
                >
                  <option value="immediate">Immediate</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  How often to receive message summaries
                </p>
              </div>
            </div>
          </div>
          
          <Button onClick={handleSaveProfile} className="w-full">
            Save Preferences
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};