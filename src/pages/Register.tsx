import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Form data
  const [formData, setFormData] = useState({
    // Organization info
    organizationName: "",
    organizationEmail: "",
    organizationPhone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "JM",
    timezone: "America/Jamaica",
    currency: "JMD",
    
    // Owner info
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await api.request('/register/', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.organizationName,
          email: formData.organizationEmail,
          phone: formData.organizationPhone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postalCode,
          country: formData.country,
          timezone: formData.timezone,
          currency: formData.currency,
          owner_email: formData.email,
          owner_password: formData.password,
          owner_first_name: formData.firstName,
          owner_last_name: formData.lastName,
        }),
      });
      
      if (response.data) {
        // Store tokens
        localStorage.setItem('access_token', response.data.tokens.access);
        localStorage.setItem('refresh_token', response.data.tokens.refresh);
        localStorage.setItem('organization_id', response.data.organization.id);
        
        // Navigate to dashboard
        navigate('/dashboard');
      }
    } catch (error: any) {
      setError(error.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-2xl shadow-lg">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Unitly</h1>
          </div>
        </div>
        
        {/* Registration Card */}
        <div className="bg-white border border-blue-100 rounded-2xl shadow-xl p-8">
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              step === 1 ? 'bg-blue-100 text-blue-700' : 'text-gray-400'
            }`}>
              <span className="font-medium">1. Property Info</span>
            </div>
            <ArrowRight className="h-4 w-4 mx-2 text-gray-400" />
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              step === 2 ? 'bg-blue-100 text-blue-700' : 'text-gray-400'
            }`}>
              <span className="font-medium">2. Your Account</span>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center mb-2">
            Start Managing Your Properties
          </h2>
          <p className="text-center text-muted-foreground mb-6">
            Create your Unitly account and start organizing your rental business
          </p>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            {step === 1 ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="organizationName">Property/Company Name</Label>
                  <Input
                    id="organizationName"
                    value={formData.organizationName}
                    onChange={(e) => updateFormData('organizationName', e.target.value)}
                    placeholder="e.g., The Pods, Sunshine Apartments"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="organizationEmail">Business Email</Label>
                    <Input
                      id="organizationEmail"
                      type="email"
                      value={formData.organizationEmail}
                      onChange={(e) => updateFormData('organizationEmail', e.target.value)}
                      placeholder="contact@yourproperty.com"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="organizationPhone">Business Phone</Label>
                    <Input
                      id="organizationPhone"
                      value={formData.organizationPhone}
                      onChange={(e) => updateFormData('organizationPhone', e.target.value)}
                      placeholder="876-555-0100"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="address">Property Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => updateFormData('address', e.target.value)}
                    placeholder="123 Main Street"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => updateFormData('city', e.target.value)}
                      placeholder="Kingston"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="state">Parish/State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => updateFormData('state', e.target.value)}
                      placeholder="Kingston"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => updateFormData('postalCode', e.target.value)}
                      placeholder="JMAAW10"
                    />
                  </div>
                </div>
                
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => setStep(2)}
                  disabled={!formData.organizationName || !formData.organizationEmail}
                >
                  Continue to Account Setup
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => updateFormData('firstName', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => updateFormData('lastName', e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">Your Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => updateFormData('password', e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Must be at least 8 characters
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? "Creating Account..." : "Create Account"}
                  </Button>
                </div>
              </div>
            )}
          </form>
          
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
        
        {/* Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm font-medium">Easy Setup</p>
            <p className="text-xs text-muted-foreground">Get started in minutes</p>
          </div>
          <div className="text-center">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm font-medium">All-in-One Platform</p>
            <p className="text-xs text-muted-foreground">Manage everything in one place</p>
          </div>
          <div className="text-center">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm font-medium">Professional Tools</p>
            <p className="text-xs text-muted-foreground">Built for property managers</p>
          </div>
        </div>
      </div>
    </div>
  );
}