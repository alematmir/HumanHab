import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';

export function MainLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen pb-20 overflow-x-hidden transition-all duration-1000"
            style={{ paddingLeft: 'var(--ui-rigidity)', paddingRight: 'var(--ui-rigidity)' }}>
            <main className="w-full max-w-md mx-auto p-4 sm:p-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
                {children}
            </main>
            <BottomNav />
        </div>
    );
}
