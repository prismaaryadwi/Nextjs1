'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

type NavItem = {
  name: string
  href: string
}

export default function ExplorePage() {
  const pathname = usePathname()
  const [darkMode, setDarkMode] = useState(false)

  const navItems: NavItem[] = [
    { name: 'Home', href: '/' },
    { name: 'Explore', href: '/explore' },
    { name: 'Categories', href: '/categories' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ]

  return (
    <main className={darkMode ? 'bg-black text-white' : 'bg-white text-black'}>
      {/* NAVBAR */}
      <header className="w-full border-b border-gray-200 dark:border-gray-800">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Seija Magazine</h1>

          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`font-medium transition-colors ${
                    isActive
                      ? 'text-blue-600'
                      : darkMode
                      ? 'text-gray-300 hover:text-white'
                      : 'text-gray-700 hover:text-black'
                  }`}
                >
                  {item.name}
                </Link>
              )
            })}
          </div>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="text-sm px-3 py-1 border rounded"
          >
            {darkMode ? 'Light' : 'Dark'}
          </button>
        </nav>
      </header>

      {/* CONTENT */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-4xl font-bold mb-6">Explore</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Discover articles, stories, and ideas curated by Seija Magazine.
        </p>
      </section>
    </main>
  )
}
