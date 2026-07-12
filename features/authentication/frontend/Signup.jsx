import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Alert } from "../../../shared/ui-components";
import { Eye, EyeOff } from "lucide-react";

export function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSignup = (e) => {
    e.preventDefault();
    // Simulate signup for now
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md p-2 shadow-sm rounded-xl">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto h-12 w-12 bg-brand-900 text-white rounded-lg flex items-center justify-center font-bold text-xl mb-4">
            AF
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
            AssetFlow
          </CardTitle>
          <p className="text-sm text-gray-500 mt-2">Create your employee account</p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <Input 
              label="Full Name" 
              type="text" 
              placeholder="Jane Doe" 
              required 
            />

            <Input 
              label="Email" 
              type="email" 
              placeholder="name@company.com" 
              required 
            />
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Alert className="w-full mb-4">
                Sign up creates an employee account only. Admin roles assigned later.
              </Alert>
            </div>

            <Button type="submit" className="w-full">
              Create Account &rarr;
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link to="/login" className="font-semibold text-gray-900 hover:underline">
              Login here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
