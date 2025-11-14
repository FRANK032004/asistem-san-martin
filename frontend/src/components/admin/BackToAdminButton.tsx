'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BackToAdminButtonProps {
  className?: string;
}

export default function BackToAdminButton({ className = '' }: BackToAdminButtonProps) {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      onClick={() => router.push('/admin')}
      className={`flex items-center gap-2 hover:bg-gray-100 transition-colors ${className}`}
    >
      <ArrowLeft className="h-4 w-4" />
      <span>Volver al Panel Admin</span>
    </Button>
  );
}
