"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { useArticles } from "../contexts/ArticleContext";
import { useDarkMode } from "../hooks/useDarkMode";

const CategoriesPage: React.FC = () => {
  const pathname = usePathname();
  const { darkMode, toggleDarkMode, mounted } = useDarkMode();
  const { user, logout } = useAuth();
  const { articles } = useArticles();

  const navItems: [string, string, boolean][] = [
    ["Home", "/", pathname === "/"],
    ["Explore", "/explore", pathname === "/explore"],
    ["Categories", "/categories", pathname === "/categories"],
    ["About", "/about", pathname === "/about"],
    ["Contact", "/contact", pathname === "/contact"],
  ];

  const categories = [
    { name: "Novel", slug: "novel", icon: "📚" },
    { name: "Cerpen", slug: "cerpen", icon: "📖" },
    { name: "Puisi", slug: "puisi", icon: "✨" },
    { name: "Opini", slug: "opini", icon: "💭" },
    { name: "Desain Grafis", slug: "desain", icon: "🎨" },
    { name: "Coding Project", slug: "coding", icon: "💻" },
    { name: "Cerita Bergambar", slug: "cergam", icon: "🖼️" },
    { name: "Pantun", slug: "pantun", icon: "🎭" },
  ].map((c) => ({
    ...c,
    count: articles.filter((a) => a.category_name === c.name).length,
  }));

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  if (!mounted) {
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  }

  return (
    <div className={darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"}>
      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 border-b backdrop-blur bg-white/80 dark:bg-gray-900/80">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="font-bold text-xl">
            SEIJA
          </Link>

          <div className="hidden md:flex gap-8">
            {navItems.map(([name, href, isActive]) => (
              <Link
                key={name}
                href={href}
                className={`transition ${
                  isActive ? "text-blue-600" : "hover:text-blue-600"
                }`}
              >
                {name}
              </Link>
            ))}
          </div>

          <div className="flex gap-4 items-center">
            <button onClick={toggleDarkMode}>
              {darkMode ? "☀️" : "🌙"}
            </button>

            {user ? (
              <>
                <Link
                  href="/create"
                  className="bg-blue-600 text-white px-3 py-1 rounded"
                >
                  Create
                </Link>
                <button onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <Link href="/auth/login">Login</Link>
            )}
          </div>
        </div>
      </nav>

      {/* CONTENT */}
      <section className="pt-32 max-w-7xl mx-auto px-6">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-bold mb-10"
        >
          Categories
        </motion.h1>

        <div className="grid md:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/explore?category=${cat.slug}`}
              className={`p-6 rounded-xl transition ${
                darkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              <div className="text-4xl">{cat.icon}</div>
              <h3 className="text-xl font-semibold mt-3">{cat.name}</h3>
              <p className="text-sm mt-1">{cat.count} works</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default CategoriesPage;
