import React from "react";
import { Link } from "react-router-dom";
import { Button, Card, CardHeader, CardTitle, CardContent } from "../../../shared/ui-components";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2 font-bold text-xl">
          <div className="h-8 w-8 bg-brand-900 text-white rounded-md flex items-center justify-center text-sm">
            AF
          </div>
          AssetFlow
        </div>
        <div className="flex items-center gap-6">
          <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900">Features</a>
          <a href="#why-us" className="text-sm font-medium text-gray-600 hover:text-gray-900">Why Us</a>
          <Link to="/login">
            <Button variant="primary" size="sm">Log In</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-8 py-20 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 space-y-6">
          <h1 className="text-5xl font-bold leading-tight tracking-tight text-gray-900">
            Streamline Your Enterprise Assets
          </h1>
          <p className="text-lg text-gray-600 max-w-lg">
            The disciplined orchestrator for modern organizations. Manage tracking, maintenance, and resource allocation from a single, authoritative source of truth.
          </p>
          <div className="flex gap-4 pt-4">
            <Link to="/signup">
              <Button size="lg">Get Started</Button>
            </Link>
            <Button variant="outline" size="lg">View Demo</Button>
          </div>
        </div>
        <div className="flex-1 w-full flex items-center justify-center">
          <img 
            src="/hero-image.png" 
            alt="AssetFlow Dashboard" 
            className="w-full h-auto max-h-[500px] object-contain rounded-xl shadow-lg border border-gray-200"
          />
        </div>
      </section>

      {/* Features Overview */}
      <section id="features" className="bg-white py-20 px-8 border-y border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold tracking-tight">Comprehensive System Overview</h2>
            <p className="text-gray-600">Everything you need to maintain control over your organization's physical resources.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="h-full">
              <CardHeader>
                <div className="w-12 h-12 bg-brand-50 text-brand-900 rounded-lg flex items-center justify-center mb-4">
                  {/* Icon placeholder */}
                  <span className="font-bold text-xl">#</span>
                </div>
                <CardTitle className="text-xl">Asset Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Maintain a precise directory of all hardware, furniture, and equipment with real-time location and status updates.
                </p>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <div className="w-12 h-12 bg-brand-50 text-brand-900 rounded-lg flex items-center justify-center mb-4">
                  <span className="font-bold text-xl">W</span>
                </div>
                <CardTitle className="text-xl">Maintenance Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Schedule preventative care and track repair workflows through a streamlined Kanban interface to minimize downtime.
                </p>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <div className="w-12 h-12 bg-brand-50 text-brand-900 rounded-lg flex items-center justify-center mb-4">
                  <span className="font-bold text-xl">C</span>
                </div>
                <CardTitle className="text-xl">Resource Booking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Avoid conflicts with a centralized booking system for meeting rooms, shared vehicles, and specialized equipment.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why AssetFlow / Stats */}
      <section id="why-us" className="bg-gray-50 py-20 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-16 items-center">
          <div className="flex-1 space-y-8">
            <h2 className="text-3xl font-bold tracking-tight mb-8">Why AssetFlow?</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span className="text-brand-900">⚡</span> Operational Efficiency
                </h3>
                <p className="text-sm text-gray-600 mt-1">Reduce time spent searching for assets and coordinating repairs. Our structured workflows ensure everyone knows exactly what needs to be done.</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span className="text-brand-900">👁️</span> Total Transparency
                </h3>
                <p className="text-sm text-gray-600 mt-1">Audit trails and automated discrepancy reports provide a clear view of asset history, lifecycle, and utilization across all departments.</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span className="text-brand-900">🛡️</span> Accountability
                </h3>
                <p className="text-sm text-gray-600 mt-1">Assign responsibility explicitly. From allocations to transfers, every action is logged to ensure resources are managed carefully.</p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col sm:flex-row gap-6 w-full">
            <Card className="flex-1 flex flex-col items-center justify-center py-16">
              <h4 className="text-5xl font-bold text-gray-900 mb-2">99%</h4>
              <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">Uptime</p>
            </Card>
            <Card className="flex-1 flex flex-col items-center justify-center py-16">
              <h4 className="text-5xl font-bold text-gray-900 mb-2">50k+</h4>
              <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">Assets Tracked</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-bold text-gray-900">AssetFlow</div>
          <div className="flex gap-6 text-xs text-gray-500">
            <a href="#" className="hover:text-gray-900">Privacy Policy</a>
            <a href="#" className="hover:text-gray-900">Terms of Service</a>
            <a href="#" className="hover:text-gray-900">Support</a>
            <a href="#" className="hover:text-gray-900">Documentation</a>
          </div>
          <div className="text-xs text-gray-400">
            © 2026 AssetFlow Enterprise Resource Management. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
