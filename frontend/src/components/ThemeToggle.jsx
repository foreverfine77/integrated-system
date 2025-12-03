import { Moon, Sun } from 'lucide-react'
import { useApp } from '../contexts/AppContext'

/**
 * 主题切换按钮组件
 * 允许用户在深色模式和浅色模式之间切换
 */
function ThemeToggle() {
    const { darkMode, toggleDarkMode } = useApp()

    return (
        <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title={darkMode ? '切换到浅色模式' : '切换到深色模式'}
        >
            {darkMode ? (
                <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
                <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            )}
        </button>
    )
}

export default ThemeToggle
