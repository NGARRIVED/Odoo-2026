import React from 'react';
import { Button, Card } from '../../../../shared/ui-components';
import { CalendarDays, Clock, Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const defaultActions = [
  { label: 'Register Asset', icon: Plus, variant: 'primary', path: '/assets' },
  { label: 'Book Resource', icon: CalendarDays, variant: 'outline', path: '/bookings' },
  { label: 'Raise Maintenance', icon: Clock, variant: 'outline', path: '/maintenance' },
  { label: 'Search Assets', icon: Search, variant: 'outline', path: '/assets' }
];

export default function QuickActions({ actions = defaultActions }) {
  const navigate = useNavigate();
  return (
    <Card className="p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Button 
              key={action.label} 
              variant={action.variant || 'outline'} 
              className="justify-start gap-2"
              onClick={() => action.path && navigate(action.path)}
            >
              <Icon size={16} />
              {action.label}
            </Button>
          );
        })}
      </div>
    </Card>
  );
}
