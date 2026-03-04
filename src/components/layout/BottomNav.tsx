import { NavLink } from 'react-router-dom';
import { Clock, ClipboardList, CircleDot, User } from 'lucide-react';

const navItems = [
    { name: 'Ciclo', path: '/', icon: Clock },
    { name: 'Registro', path: '/registro', icon: ClipboardList },
    { name: 'Coherencia', path: '/coherencia', icon: CircleDot },
    { name: 'Perfil', path: '/perfil', icon: User }
];

export function BottomNav() {
    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-main border-t border-border px-6 py-4 flex justify-between items-center z-50">
            {navItems.map((item) => (
                <NavLink
                    key={item.name}
                    to={item.path}
                    className={({ isActive }) =>
                        `flex flex-col items-center gap-1 transition-colors duration-200 min-w-[64px] ${isActive ? 'text-accent' : 'text-secondary hover:text-primary'
                        }`
                    }
                >
                    <item.icon className="w-6 h-6" strokeWidth={2} />
                    <span className="text-[10px] font-medium tracking-wide">
                        {item.name}
                    </span>
                </NavLink>
            ))}
        </nav>
    );
}
