import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input, Card, CardHeader, CardTitle, CardContent, CardFooter, Alert } from "../../../shared/ui-components";
import { Eye, EyeOff } from "lucide-react";

export function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Simulate login for now
    navigate("/dashboard");
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
          <p className="text-sm text-gray-500 mt-2">Enterprise EAM Login</p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input 
              label="Email" 
              type="email" 
              placeholder="name@company.com" 
              required 
            />
            
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <Link to="/forgot-password" className="text-xs font-medium text-brand-500 hover:text-brand-800">
                  Forgot password?
                </Link>
              </div>
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

            <Button type="submit" className="w-full mt-2">
              Login &rarr;
            </Button>
          </form>

          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">New here? </span>
            <Link to="/signup" className="font-semibold text-gray-900 hover:underline">
              Create Account
            </Link>
          </div>
        </CardContent>
        
        <CardFooter>
          <Alert className="w-full">
            Sign up creates an employee account only. Admin roles are assigned later by system administrators.
          </Alert>
        </CardFooter>
      </Card>
    </div>
  );
}
