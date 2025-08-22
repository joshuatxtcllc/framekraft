import { useState } from "react";
import { Link } from "wouter";
import { useAuthNew } from "@/hooks/useAuthNew";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Loader2, Eye, EyeOff, UserPlus, Mail, Lock, User, Building, AlertCircle, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function RegisterPage() {
  const { register, isRegistering, registerError } = useAuthNew();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    businessName: "",
    agreeToTerms: false,
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState(0);

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 10;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 20;
    if (/[!@#$%^&*]/.test(password)) strength += 20;
    return Math.min(strength, 100);
  };

  const getPasswordStrengthLabel = (strength: number): string => {
    if (strength < 30) return "Weak";
    if (strength < 60) return "Fair";
    if (strength < 80) return "Good";
    return "Strong";
  };

  const getPasswordStrengthColor = (strength: number): string => {
    if (strength < 30) return "bg-red-500";
    if (strength < 60) return "bg-yellow-500";
    if (strength < 80) return "bg-blue-500";
    return "bg-green-500";
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email";
    }
    
    if (!formData.firstName) {
      errors.firstName = "First name is required";
    }
    
    if (!formData.lastName) {
      errors.lastName = "Last name is required";
    }
    
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(formData.password)) {
      errors.password = "Password must contain at least one uppercase letter";
    } else if (!/[0-9]/.test(formData.password)) {
      errors.password = "Password must contain at least one number";
    } else if (!/[!@#$%^&*]/.test(formData.password)) {
      errors.password = "Password must contain at least one special character";
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    
    if (!formData.agreeToTerms) {
      errors.agreeToTerms = "You must agree to the terms and conditions";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      register(formData);
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "Please check your information and try again",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }));
    
    // Update password strength
    if (name === "password") {
      setPasswordStrength(calculatePasswordStrength(value));
    }
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const passwordRequirements = [
    { met: formData.password.length >= 8, text: "At least 8 characters" },
    { met: /[A-Z]/.test(formData.password), text: "One uppercase letter" },
    { met: /[0-9]/.test(formData.password), text: "One number" },
    { met: /[!@#$%^&*]/.test(formData.password), text: "One special character" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12">
      <div className="absolute inset-0 bg-grid-slate-200/50 dark:bg-grid-slate-700/25 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      
      <Card className="w-full max-w-lg z-10 shadow-2xl border-slate-200 dark:border-slate-700">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Create your account</CardTitle>
          <CardDescription className="text-center">
            Start managing your framing business today
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {registerError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {registerError.message || "Registration failed. Please try again."}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`pl-9 ${validationErrors.firstName ? 'border-red-500' : ''}`}
                    disabled={isRegistering}
                  />
                </div>
                {validationErrors.firstName && (
                  <p className="text-sm text-red-500">{validationErrors.firstName}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`pl-9 ${validationErrors.lastName ? 'border-red-500' : ''}`}
                    disabled={isRegistering}
                  />
                </div>
                {validationErrors.lastName && (
                  <p className="text-sm text-red-500">{validationErrors.lastName}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name (Optional)</Label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="businessName"
                  name="businessName"
                  type="text"
                  placeholder="Acme Framing Co."
                  value={formData.businessName}
                  onChange={handleInputChange}
                  className="pl-9"
                  disabled={isRegistering}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`pl-9 ${validationErrors.email ? 'border-red-500' : ''}`}
                  disabled={isRegistering}
                  autoComplete="email"
                />
              </div>
              {validationErrors.email && (
                <p className="text-sm text-red-500">{validationErrors.email}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`pl-9 pr-9 ${validationErrors.password ? 'border-red-500' : ''}`}
                  disabled={isRegistering}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              
              {formData.password && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Password strength:</span>
                    <span className={`font-medium ${
                      passwordStrength < 30 ? 'text-red-500' :
                      passwordStrength < 60 ? 'text-yellow-500' :
                      passwordStrength < 80 ? 'text-blue-500' :
                      'text-green-500'
                    }`}>
                      {getPasswordStrengthLabel(passwordStrength)}
                    </span>
                  </div>
                  <Progress value={passwordStrength} className="h-2" />
                  
                  <div className="space-y-1 mt-2">
                    {passwordRequirements.map((req, index) => (
                      <div key={index} className="flex items-center text-xs">
                        {req.met ? (
                          <Check className="h-3 w-3 text-green-500 mr-1" />
                        ) : (
                          <X className="h-3 w-3 text-slate-400 mr-1" />
                        )}
                        <span className={req.met ? 'text-green-600' : 'text-slate-500'}>
                          {req.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {validationErrors.password && (
                <p className="text-sm text-red-500">{validationErrors.password}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`pl-9 pr-9 ${validationErrors.confirmPassword ? 'border-red-500' : ''}`}
                  disabled={isRegistering}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-sm text-red-500">Passwords do not match</p>
              )}
              {validationErrors.confirmPassword && (
                <p className="text-sm text-red-500">{validationErrors.confirmPassword}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="agreeToTerms"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, agreeToTerms: checked as boolean }))
                  }
                  disabled={isRegistering}
                  className="mt-1"
                />
                <Label 
                  htmlFor="agreeToTerms" 
                  className="text-sm font-normal cursor-pointer leading-relaxed"
                >
                  I agree to the{" "}
                  <Link href="/terms">
                    <a className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                      Terms of Service
                    </a>
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy">
                    <a className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                      Privacy Policy
                    </a>
                  </Link>
                </Label>
              </div>
              {validationErrors.agreeToTerms && (
                <p className="text-sm text-red-500">{validationErrors.agreeToTerms}</p>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isRegistering}
              size="lg"
            >
              {isRegistering ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>
            
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white dark:bg-slate-800 px-2 text-slate-500">
                  Already have an account?
                </span>
              </div>
            </div>
            
            <Link href="/auth/login">
              <Button variant="outline" className="w-full" type="button">
                Sign in instead
              </Button>
            </Link>
          </CardFooter>
        </form>
      </Card>
      
      <div className="absolute bottom-4 text-center text-sm text-slate-500">
        <p>© {new Date().getFullYear()} FrameCraft. All rights reserved.</p>
      </div>
    </div>
  );
}