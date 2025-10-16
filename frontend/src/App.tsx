import { useTheme } from './components/theme-provider'
import { Moon, Sun } from 'lucide-react'

function App() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Theme Toggle Button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md border border-border hover:bg-accent transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-4">
            Library Management System
          </h1>
          <p className="text-muted-foreground mb-2">
            Tailwind CSS 4.x + shadcn/ui is configured and ready!
          </p>
          <p className="text-sm text-muted-foreground">
            React 18.x + TypeScript 5.x + Vite 5.x
          </p>
        </div>

        {/* Status Checklist */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="p-6 bg-card border border-border rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Setup Progress</h2>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <span className="text-green-600 dark:text-green-400">✅</span>
                <span>FE-1.1: Project Setup and Configuration</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600 dark:text-green-400">✅</span>
                <span>FE-1.2: Tailwind CSS 4.x + shadcn/ui Setup</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-muted-foreground">⏳</span>
                <span className="text-muted-foreground">
                  FE-1.3: Install Core shadcn/ui Components
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Theme Demonstration */}
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-2xl font-semibold mb-4 text-center">
            Theme Demonstration
          </h2>

          {/* Light Mode Example */}
          <div className="p-6 bg-card border border-border rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Card Component Example</h3>
            <p className="text-muted-foreground mb-4">
              This card demonstrates the theme variables. Click the theme toggle button
              above to switch between light and dark modes.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm font-medium">
                Primary Badge
              </span>
              <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md text-sm font-medium">
                Secondary Badge
              </span>
              <span className="px-3 py-1 bg-accent text-accent-foreground rounded-md text-sm font-medium">
                Accent Badge
              </span>
              <span className="px-3 py-1 bg-destructive text-destructive-foreground rounded-md text-sm font-medium">
                Destructive Badge
              </span>
            </div>
          </div>

          {/* Button Examples */}
          <div className="p-6 bg-card border border-border rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Button Variants</h3>
            <div className="flex flex-wrap gap-3">
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity font-medium">
                Primary Button
              </button>
              <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition-opacity font-medium">
                Secondary Button
              </button>
              <button className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:opacity-90 transition-opacity font-medium">
                Destructive Button
              </button>
              <button className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors font-medium">
                Outline Button
              </button>
            </div>
          </div>

          {/* Input Example */}
          <div className="p-6 bg-card border border-border rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Form Elements</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Input Field
                </label>
                <input
                  type="text"
                  placeholder="Enter text here..."
                  className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Textarea
                </label>
                <textarea
                  placeholder="Enter text here..."
                  rows={3}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
            </div>
          </div>

          {/* Color Palette */}
          <div className="p-6 bg-card border border-border rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Color Palette</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-20 bg-background border border-border rounded-md"></div>
                <p className="text-xs font-medium">Background</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 bg-primary rounded-md"></div>
                <p className="text-xs font-medium">Primary</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 bg-secondary rounded-md"></div>
                <p className="text-xs font-medium">Secondary</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 bg-accent rounded-md"></div>
                <p className="text-xs font-medium">Accent</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 bg-muted rounded-md"></div>
                <p className="text-xs font-medium">Muted</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 bg-destructive rounded-md"></div>
                <p className="text-xs font-medium">Destructive</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 bg-card border border-border rounded-md"></div>
                <p className="text-xs font-medium">Card</p>
              </div>
              <div className="space-y-2">
                <div className="h-20 bg-popover border border-border rounded-md"></div>
                <p className="text-xs font-medium">Popover</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Current theme: <span className="font-semibold">{theme}</span>
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Ready for FE-1.3: Install Core shadcn/ui Components
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
