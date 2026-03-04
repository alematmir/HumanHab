import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';

export function MainLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-main pb-20"> {/* pb-20 leaves space for BottomNav */}
            <main className="w-full max-w-md mx-auto p-4 sm:p-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {children}
            </main>
            <BottomNav />
        </div>
    );
}
