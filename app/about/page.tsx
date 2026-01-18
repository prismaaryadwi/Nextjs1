"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { useDarkMode } from "../hooks/useDarkMode";

const AboutPage: React.FC = () => {
  const pathname = usePathname();
  const { darkMode, toggleDarkMode, mounted } = useDarkMode();
  const { user, logout } = useAuth();

  const navItems: [string, string, boolean][] = [
    ["Home", "/", pathname === "/"],
    ["Explore", "/explore", pathname === "/explore"],
    ["Categories", "/categories", pathname === "/categories"],
    ["About", "/about", pathname === "/about"],
    ["Contact", "/contact", pathname === "/contact"],
  ];

  const teamMembers = [
    {
      name: "SIJA Students",
      role: "Creative Contributors",
      description:
        "Talented students from SMKN 1 Jakarta's Software Engineering program",
      avatar: "👨‍💻",
    },
    {
      name: "Teachers & Mentors",
      role: "Guidance & Support",
      description: "Dedicated educators nurturing young creative talents",
      avatar: "👩‍🏫",
    },
    {
      name: "School Community",
      role: "Support System",
      description:
        "The entire SMKN 1 Jakarta community supporting creative endeavors",
      avatar: "🏫",
    },
  ];

  const features = [
    {
      icon: "🎨",
      title: "Creative Expression",
      description:
        "Platform for students to express creativity through various media",
    },
    {
      icon: "🤝",
      title: "Community Building",
      description:
        "Connect with like-minded creators and build meaningful relationships",
    },
    {
      icon: "📚",
      title: "Skill Development",
      description:
        "Develop writing, design, and technical skills in a supportive environment",
    },
    {
      icon: "🌟",
      title: "Portfolio Building",
      description:
        "Showcase your work and build an impressive creative portfolio",
    },
  ];

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
      className={`min-h-screen ${
        darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"
      }`}
    >
      {/* NAVBAR */}
      <nav
        className={`fixed top-0 w-full z-50 border-b backdrop-blur ${
          darkMode
            ? "bg-gray-900/80 border-gray-700"
            : "bg-white/80 border-gray-200"
        }`}
      >
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
                  isActive
                    ? "text-blue-600"
                    : darkMode
                    ? "text-gray-300 hover:text-white"
                    : "text-gray-700 hover:text-black"
                }`}
              >
                {name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
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
      <section className="pt-32 px-6 max-w-7xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-bold mb-6"
        >
          About Seija Magazine
        </motion.h1>

        <p className="text-lg max-w-3xl mb-12">
          A creative digital magazine built by SIJA students to showcase talent,
          ideas, and innovation.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {teamMembers.map((member) => (
            <div
              key={member.name}
              className={`p-6 rounded-xl ${
                darkMode ? "bg-gray-800" : "bg-gray-100"
              }`}
            >
              <div className="text-5xl">{member.avatar}</div>
              <h3 className="text-xl font-bold mt-4">{member.name}</h3>
              <p className="text-blue-600">{member.role}</p>
              <p className="text-sm mt-2">{member.description}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-16">
          {features.map((f) => (
            <div key={f.title} className="flex gap-4">
              <div className="text-3xl">{f.icon}</div>
              <div>
                <h4 className="font-semibold">{f.title}</h4>
                <p className="text-sm">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
