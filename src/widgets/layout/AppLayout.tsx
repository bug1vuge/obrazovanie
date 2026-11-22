import { LogIn, Moon, Sun } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { ROLE_LABELS } from '@/entities/user/lib';
import { useAuthDialog } from '@/features/auth/authDialogStore';
import { cn } from '@/shared/lib/cn';
import { Avatar, Button } from '@/shared/ui';
import { useCurrentUser } from '@/store/hooks';
import { useThemeStore } from '@/store/themeStore';
import { Logo } from './Logo';
import { ADMIN_ITEM, NAV_ITEMS } from './navigation';

function ThemeToggle({ withLabel = false }: { withLabel?: boolean }) {
  const theme = useThemeStore((state) => state.theme);
  const toggle = useThemeStore((state) => state.toggleTheme);
  const isDark = theme === 'dark';
  const Icon = isDark ? Sun : Moon;
  const label = isDark ? 'Светлая тема' : 'Тёмная тема';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={withLabel ? undefined : 'Сменить тему'}
      className={cn(
        'hover-dim muted flex items-center gap-3 font-medium',
        withLabel ? 'rounded-xl px-3 py-2.5 text-[14px]' : 'rounded-full p-2.5',
      )}
    >
      <Icon size={18} aria-hidden />
      {withLabel && label}
    </button>
  );
}

export function AppLayout() {
  const user = useCurrentUser();
  const openAuth = useAuthDialog((state) => state.open);
  const sideItems = user?.isOwner ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS;

  return (
    <div className="flex min-h-dvh">
      <aside className="hairline-r sticky top-0 hidden h-dvh shrink-0 flex-col gap-6 overflow-y-auto px-4 py-5 md:flex md:w-60 lg:w-64">
        <Logo />
        <nav aria-label="Основная навигация" className="flex flex-col gap-1">
          {sideItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] font-medium transition',
                  isActive ? 'on-primary bg-primary' : 'hover-dim muted',
                )
              }
            >
              <Icon size={18} aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2">
          <ThemeToggle withLabel />
          {user ? (
            <Link
              to="/profile"
              className="hover-dim flex items-center gap-2.5 rounded-xl px-2 py-2"
            >
              <Avatar name={user.displayName} size={34} tone={2} />
              <span className="min-w-0">
                <span className="block truncate text-[13.5px] font-medium">{user.displayName}</span>
                <span className="muted block text-[11.5px]">{ROLE_LABELS[user.role]}</span>
              </span>
            </Link>
          ) : (
            <Button size="sm" onClick={openAuth} className="w-full">
              <LogIn size={15} aria-hidden /> Войти
            </Button>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="app-header hairline-b sticky top-0 z-30 flex shrink-0 items-center justify-between px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] md:hidden">
          <Logo />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            {user ? (
              <Link to="/profile" className="ml-0.5" aria-label="Профиль">
                <Avatar name={user.displayName} size={32} tone={2} />
              </Link>
            ) : (
              <Button size="sm" onClick={openAuth}>
                Войти
              </Button>
            )}
          </div>
        </header>

        <main id="main" className="min-w-0 flex-1">
          <Outlet />
          <div className="h-[calc(5rem+env(safe-area-inset-bottom,0px))] md:h-6" />
        </main>

        <nav
          aria-label="Нижняя навигация"
          className="app-header hairline-t fixed bottom-0 left-0 right-0 z-30 flex pb-[env(safe-area-inset-bottom,0px)] md:hidden"
        >
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center gap-1 py-2.5 text-[10.5px] font-medium transition',
                  isActive ? 'text-primary' : 'muted',
                )
              }
            >
              <Icon size={20} aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
