"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useDarkMode } from "../hooks/useDarkMode";
import { useAuth } from "../contexts/AuthContext";

/* =========================
   TYPES
========================= */
type NavItem = {
  name: string;
  href: string;
  isActive: boolean;
};

/* =========================
   NAV ITEMS (TYPED)
========================= */
const navItems: NavItem[] = [
  { name: "Home", href: "/", isActive: false },
  { name: "Explore", href: "/explore", isActive: false },
  { name: "Categories", href: "/categories", isActive: false },
  { name: "About", href: "/about", isActive: false },
  { name: "Contact", href: "/contact", isActive: true },
];

export default function ContactPage() {
  const { darkMode, toggleDarkMode, mounted } = useDarkMode();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors ${
        darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"
      }`}
    >
      {/* =========================
          NAVBAR
      ========================= */}
      <nav
        className={`fixed top-0 w-full z-50 border-b backdrop-blur ${
          darkMode
            ? "bg-gray-900/80 border-gray-700"
            : "bg-white/80 border-gray-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="font-bold text-xl">
              SEIJA
            </Link>

            {/* Nav Links */}
            <div className="hidden md:flex space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`font-medium transition-colors hover:text-blue-600 ${
                    item.isActive
                      ? "text-blue-600"
                      : darkMode
                      ? "text-gray-300"
                      : "text-gray-700"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              {/* Dark Mode */}
              <button
                onClick={toggleDarkMode}
                className="px-3 py-1 rounded border"
              >
                {darkMode ? "☀️" : "🌙"}
              </button>

              {/* Auth */}
              {user ? (
                <div className="flex items-center gap-3">
                  <Link
                    href="/create"
                    className="bg-green-600 text-white px-4 py-2 rounded"
                  >
                    Create
                  </Link>

                  {user.role === "admin" && (
                    <Link
                      href="/admin/dashboard"
                      className="bg-blue-600 text-white px-4 py-2 rounded"
                    >
                      Dashboard
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="text-red-500"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Link href="/auth/login">Sign In</Link>
                  <Link
                    href="/auth/register"
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* =========================
          CONTENT
      ========================= */}
      <main className="pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold mb-6"
          >
            Contact Us
          </motion.h1>

          <p
            className={`text-lg mb-12 ${
              darkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Have questions or ideas? Reach out and let’s collaborate.
          </p>

          <div
            className={`rounded-xl p-8 ${
              darkMode ? "bg-gray-800" : "bg-gray-100"
            }`}
          >
            <p>Email: contact@seija.com</p>
            <p>Instagram: @seijamagazine</p>
          </div>
        </div>
      </main>

      {/* =========================
          FOOTER
      ========================= */}
      <footer
        className={`border-t py-6 text-center ${
          darkMode
            ? "border-gray-700 text-gray-400"
            : "border-gray-200 text-gray-600"
        }`}
      >
        © 2024 Seija Magazine
      </footer>
    </div>
  );
}
