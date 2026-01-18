"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "./contexts/AuthContext";
import { useArticles } from "./contexts/ArticleContext";
import { useDarkMode } from "./hooks/useDarkMode";

/* =======================
   TYPES
======================= */
type NavItem = {
  name: string;
  href: string;
};

type Article = {
  id: number;
  title: string;
  excerpt: string;
  author?: string;
  author_name?: string;
  category?: string;
  category_name?: string;
  readTime?: string;
  date?: string;
  likes?: number;
  like_count?: number;
  comments?: number;
  comment_count?: number;
  view_count?: number;
  cover_image?: string;
  created_at?: string;
};

/* =======================
   COMPONENT
======================= */
export default function HomePage() {
  const pathname = usePathname();

  const [currentSlide, setCurrentSlide] = useState(0);

  const { user, logout } = useAuth();
  const {
    articles,
    loading,
    featuredArticles,
    trendingArticles,
    updateFilters,
    likeArticle,
  } = useArticles();

  const { darkMode, toggleDarkMode, mounted } = useDarkMode();

  /* =======================
     NAV ITEMS (FIXED)
  ======================= */
  const navItems: NavItem[] = [
    { name: "Home", href: "/" },
    { name: "Explore", href: "/explore" },
    { name: "Categories", href: "/categories" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  /* =======================
     FALLBACK DATA
  ======================= */
  const fallbackArticles: Article[] = [
    {
      id: 1,
      title: "Laut",
      excerpt: "Bayangkan, aku dan kau menikmati deburan ombak...",
      author_name: "Drupadi Prameswari Ikhwan",
      category_name: "Puisi",
      readTime: "3 min read",
      date: "Jan 15, 2024",
      like_count: 167,
      comment_count: 31,
      view_count: 342,
      cover_image: "/cover/Laut.jpg",
    },
    {
      id: 2,
      title: "Dirimu",
      excerpt: "Ketika sang surya telah tenggelam...",
      author_name: "Febiana Nur Hidayah",
      category_name: "Puisi",
      readTime: "8 min read",
      date: "Jan 12, 2024",
      like_count: 142,
      comment_count: 23,
      view_count: 256,
      cover_image: "/cover/dirimu.jpeg",
    },
    {
      id: 3,
      title: "Pohon",
      excerpt: "Pohon setelah terluka tak akan menunggu...",
      author_name: "Raykenzie Nazaru F",
      category_name: "Puisi",
      readTime: "6 min read",
      date: "Jan 10, 2024",
      like_count: 203,
      comment_count: 42,
      view_count: 321,
      cover_image: "/cover/pohon.jpg",
    },
  ];

  const featured = featuredArticles.length ? featuredArticles : fallbackArticles;
  const trending = trendingArticles.length ? trendingArticles : fallbackArticles;

  /* =======================
     EFFECT
  ======================= */
  useEffect(() => {
    if (!featured.length) return;
    const interval = setInterval(() => {
      setCurrentSlide((p) => (p + 1) % featured.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featured.length]);

  /* =======================
     HELPERS
  ======================= */
  const getAuthorName = (a: Article) =>
    a.author_name || a.author || "Anonymous";

  const getCategory = (a: Article) =>
    a.category_name || a.category || "General";

  const getLikes = (a: Article) =>
    a.like_count ?? a.likes ?? 0;

  /* =======================
     LOADING STATES
  ======================= */
  if (!mounted || (loading && !articles.length)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  /* =======================
     RENDER
  ======================= */
  return (
    <div className={darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"}>

      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

          <Link href="/" className="font-bold text-xl">
            SEIJA
          </Link>

          <div className="hidden md:flex gap-8">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`font-medium transition ${
                    isActive
                      ? "text-blue-600"
                      : darkMode
                      ? "text-gray-300"
                      : "text-gray-700"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button onClick={toggleDarkMode}>
              {darkMode ? "☀️" : "🌙"}
            </button>
            {user ? (
              <button onClick={logout}>Logout</button>
            ) : (
              <Link href="/auth/login">Login</Link>
            )}
          </div>

        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 max-w-7xl mx-auto px-6">
        <h1 className="text-5xl font-bold mb-6">
          Where <span className="text-blue-600">Creativity</span> Meets Innovation
        </h1>
        <p className="text-lg max-w-2xl">
          Discover and share amazing works by students.
        </p>
      </section>

      {/* FEATURED */}
      <section className="py-20 max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8">
        {featured.map((a) => (
          <Link
            key={a.id}
            href={`/article/${a.id}`}
            className="rounded-xl overflow-hidden shadow hover:shadow-lg transition"
          >
            <div
              className="aspect-[4/3] bg-cover bg-center"
              style={{ backgroundImage: `url(${a.cover_image})` }}
            />
            <div className="p-4">
              <span className="text-sm text-blue-600">{getCategory(a)}</span>
              <h3 className="font-bold mt-2">{a.title}</h3>
              <p className="text-sm mt-1 opacity-80">{a.excerpt}</p>
              <div className="mt-3 flex justify-between text-sm">
                <span>{getAuthorName(a)}</span>
                <span>❤️ {getLikes(a)}</span>
              </div>
            </div>
          </Link>
        ))}
      </section>

    </div>
  );
}
