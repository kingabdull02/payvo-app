import {
  Home,
  Car,
  Phone,
  Zap,
  Wifi,
  ShoppingBag,
  Heart,
  CreditCard,
  Utensils,
  Dumbbell,
  Landmark,
  HelpCircle
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface CategoryItem {
  id: string;
  name: string;
  iconName: string;
  icon: LucideIcon;
  color: string;      // Tailwind text/bg color combos
  bgColor: string;
  badgeColor: string;
}

export const CATEGORIES: CategoryItem[] = [
  {
    id: 'boende',
    name: 'Boende',
    iconName: 'Hus',
    icon: Home,
    color: '#FF4D6D',
    bgColor: 'bg-[#FF4D6D]/10',
    badgeColor: 'text-[#FF4D6D] bg-[#FF4D6D]/10'
  },
  {
    id: 'bil',
    name: 'Bil',
    iconName: 'Bil',
    icon: Car,
    color: '#3A86FF',
    bgColor: 'bg-[#3A86FF]/10',
    badgeColor: 'text-[#3A86FF] bg-[#3A86FF]/10'
  },
  {
    id: 'telefon',
    name: 'Telefon',
    iconName: 'Telefon',
    icon: Phone,
    color: '#8338EC',
    bgColor: 'bg-[#8338EC]/10',
    badgeColor: 'text-[#8338EC] bg-[#8338EC]/10'
  },
  {
    id: 'el',
    name: 'El',
    iconName: 'Blixt',
    icon: Zap,
    color: '#00C2D1',
    bgColor: 'bg-[#00C2D1]/10',
    badgeColor: 'text-[#00C2D1] bg-[#00C2D1]/10'
  },
  {
    id: 'wifi',
    name: 'Wifi',
    iconName: 'Wifi',
    icon: Wifi,
    color: '#3B82F6',
    bgColor: 'bg-[#3B82F6]/10',
    badgeColor: 'text-[#3B82F6] bg-[#3B82F6]/10'
  },
  {
    id: 'shopping',
    name: 'Shopping',
    iconName: 'Shopping',
    icon: ShoppingBag,
    color: '#F15BB5',
    bgColor: 'bg-[#F15BB5]/10',
    badgeColor: 'text-[#F15BB5] bg-[#F15BB5]/10'
  },
  {
    id: 'halsa',
    name: 'Hälsa',
    iconName: 'Hjärta',
    icon: Heart,
    color: '#EF4444',
    bgColor: 'bg-[#EF4444]/10',
    badgeColor: 'text-[#EF4444] bg-[#EF4444]/10'
  },
  {
    id: 'prenumeration',
    name: 'Prenumeration',
    iconName: 'Prenumeration',
    icon: CreditCard,
    color: '#FFB347',
    bgColor: 'bg-[#FFB347]/10',
    badgeColor: 'text-[#FFB347] bg-[#FFB347]/10'
  },
  {
    id: 'mat',
    name: 'Mat',
    iconName: 'Mat',
    icon: Utensils,
    color: '#10B981',
    bgColor: 'bg-[#10B981]/10',
    badgeColor: 'text-[#10B981] bg-[#10B981]/10'
  },
  {
    id: 'gym',
    name: 'Gym',
    iconName: 'Gym',
    icon: Dumbbell,
    color: '#6B7280',
    bgColor: 'bg-[#6B7280]/10',
    badgeColor: 'text-[#6B7280] bg-[#6B7280]/10'
  },
  {
    id: 'bank',
    name: 'Bank',
    iconName: 'Bank',
    icon: Landmark,
    color: '#4B5563',
    bgColor: 'bg-[#4B5563]/10',
    badgeColor: 'text-[#4B5563] bg-[#4B5563]/10'
  },
  {
    id: 'ovrigt',
    name: 'Övrigt',
    iconName: 'Övrigt',
    icon: HelpCircle,
    color: '#9CA3AF',
    bgColor: 'bg-[#9CA3AF]/10',
    badgeColor: 'text-[#9CA3AF] bg-[#9CA3AF]/10'
  }
];

export const getCategoryByName = (name: string): CategoryItem => {
  return CATEGORIES.find(c => c.name === name || c.iconName === name) || CATEGORIES[11];
};
