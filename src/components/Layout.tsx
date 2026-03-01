import { NavLink } from 'react-router-dom'
import { Calendar, Coffee, ClipboardList, BarChart3, Settings, BookOpen, MapPin } from 'lucide-react'

const tabs = [
  { to: '/', label: '日历', icon: Calendar },
  { to: '/beans', label: '豆库', icon: Coffee },
  { to: '/records', label: '记录', icon: BookOpen },
  { to: '/outings', label: '外出', icon: MapPin },
  { to: '/cuppings', label: '杯测', icon: ClipboardList },
  { to: '/stats', label: '统计', icon: BarChart3 },
  { to: '/settings', label: '设置', icon: Settings },
]

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <h1 className="text-lg font-semibold text-indigo-800 mb-3">SPOT C</h1>
          <nav className="flex gap-1">
            {tabs.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
