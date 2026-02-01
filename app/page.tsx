"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

import { useAuth } from "./contexts/AuthContext";
import { useDarkMode } from "./hooks/useDarkMode";

const fallbackArticles = [
  {
    id: "laut-1",
    title: "Laut",
    excerpt: "Bayangkan, aku dan kau menikmati deburan ombak Duduk di pasir yang hangat",
    author: "Drupadi Prameswari Ikhwan",
    author_name: "Drupadi Prameswari Ikhwan",
    category: "Puisi",
    category_name: "Puisi",
    readTime: "3 min read",
    date: "Jan 15, 2024",
    likes: 167,
    like_count: 167,
    comments: 31,
    comment_count: 31,
    view_count: 342,
    cover_image: "/cover/Laut.jpg",
    content: `Bayangkan, aku dan kau menikmati deburan ombak...` // Konten lengkap
  },
  {
    id: "dirimu-2",
    title: "Dirimu",
    excerpt: "Ketika sang surya telah tenggelam di dalam nisha Dan purnama pun menghiasi malam yang menyiksa",
    author: "Febiana Nur Hidayah",
    author_name: "Febiana Nur Hidayah",
    category: "Puisi",
    category_name: "Puisi",
    readTime: "8 min read", 
    date: "Jan 12, 2024",
    likes: 142,
    like_count: 142,
    comments: 23,
    comment_count: 23,
    view_count: 256,
    cover_image: "/cover/dirimu.jpeg",
    content: `Ketika sang surya telah tenggelam di dalam nisha...` // Konten lengkap
  },
  {
    id: "pohon-3",
    title: "Pohon",
    excerpt: "Pohon setelah terluka Tak akan menunggu permintaan maaf",
    author: "Raykenzie Nazaru F",
    author_name: "Raykenzie Nazaru F",
    category: "Puisi",
    category_name: "Puisi",
    readTime: "6 min read",
    date: "Jan 10, 2024", 
    likes: 203,
    like_count: 203,
    comments: 42,
    comment_count: 42,
    view_count: 321,
    cover_image: "/cover/pohon.jpg",
    content: `Pohon setelah terluka...` // Konten lengkap
  }
];

const App: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode, mounted } = useDarkMode();

  const displayFeaturedArticles = fallbackArticles;
  const displayTrendingArticles = fallbackArticles.slice(0, 3);

  const categories = [
    { name: "Novel", icon: "📚", count: "24", color: "bg-blue-600", slug: "novel" },
    { name: "Cerpen", icon: "📖", count: "56", color: "bg-blue-600", slug: "cerpen" },
    { name: "Puisi", icon: "✨", count: "42", color: "bg-blue-600", slug: "puisi" },
    { name: "Opini", icon: "💭", count: "38", color: "bg-blue-600", slug: "opini" },
    { name: "Desain", icon: "🎨", count: "31", color: "bg-blue-600", slug: "desain" },
    { name: "Coding", icon: "💻", count: "27", color: "bg-blue-600", slug: "coding" },
  ];

  useEffect(() => {
    if (displayFeaturedArticles.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % displayFeaturedArticles.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [displayFeaturedArticles.length]);

  const getAuthorInitials = (article: any) => {
    if (!article) return 'A';
    
    const authorName = article.author_name || article.author || 'Anonymous';
    
    try {
      return authorName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    } catch (error) {
      return 'A';
    }
  };

  const getAuthorName = (article: any) => {
    return article.author_name || article.author || 'Anonymous';
  };

  const getCategory = (article: any) => {
    return article.category_name || article.category || 'General';
  };

  const getLikeCount = (article: any) => {
    return article.like_count || article.likes || 0;
  };

  const handleCategoryClick = (categorySlug: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = `/explore?category=${categorySlug}`;
    }
  };

  const handleLike = async (articleId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      alert('Please login to like articles');
      return;
    }
    
    console.log('Liking article:', articleId);
  };

  const handleLogout = () => {
    logout();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
    }`}>
      
      <nav className={`fixed top-0 w-full z-50 backdrop-blur-md border-b ${
        darkMode ? 'bg-gray-900/80 border-gray-700' : 'bg-white/80 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-blue-600 bg-clip-text text-transparent">
                    SIJA
                  </h1>
                  <p className="text-xs text-gray-500">MAGAZINE</p>
                </div>
              </div>
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              {[
                ["Home", "/", true],
                ["Explore", "/explore"],
                ["Categories", "/categories"],
                ["About", "/about"],
                ["Contact", "/contact"]
              ].map((item) => {
                const name = item[0] as string;
                const href = item[1] as string;
                const isActive = item[2] as boolean | undefined;
  
                return (
                  <Link
                    key={name}
                    href={href}
                    className={`font-medium transition-all hover:text-blue-600 ${
                      isActive 
                        ? 'text-blue-600' 
                        : darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}
                  >
                    {name}
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-all ${
                  darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>

              {user ? (
                <div className="flex items-center space-x-3">
                  <Link
                    href="/create"
                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all"
                  >
                     Create
                  </Link>
                  
                  {user.role === 'admin' && (
                    <Link
                      href="/admin/dashboard"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all"
                    >
                      👑 Dashboard
                    </Link>
                  )}
                  <div className="relative group">
                    <Link href="/profile" className="block">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors">
                        <span className="text-white text-sm font-bold">
                          {user.username?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                    </Link>
                    
                    <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ${
                      darkMode ? 'bg-gray-800' : 'bg-white'
                    }`}>
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium">Signed in as</p>
                        <p className="text-sm text-gray-500 truncate">{user.email || 'user@example.com'}</p>
                      </div>
                      <Link
                        href="/profile"
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      >
                        Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    href="/auth/login"
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div>
                <span className="inline-block bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
                  🎓 Student Magazine Platform
                </span>
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                  Where <span className="bg-blue-600 bg-clip-text text-transparent">Creativity</span> Meets Innovation
                </h1>
                <p className={`text-xl mt-6 leading-relaxed ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {user ? (
                    `Welcome back, ${user.username}! Discover, create, and share amazing content with our community.`
                  ) : (
                    'Discover, create, and share amazing content. Join our community of student writers, designers, and developers showcasing their talents.'
                  )}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/explore"
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-xl transition-all transform hover:-translate-y-1 text-center"
                >
                  Explore Content
                </Link>
                <Link
                  href={user ? "/create" : "/auth/register"}
                  className={`border-2 px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:-translate-y-1 text-center ${
                    darkMode 
                      ? 'border-gray-600 text-gray-300 hover:border-blue-600 hover:text-white' 
                      : 'border-gray-300 text-gray-700 hover:border-blue-600 hover:text-blue-600'
                  }`}
                >
                  {user ? "Create Content" : "Start Creating"}
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-8 pt-8">
                {[
                  { number: fallbackArticles.length + "+", label: "Published Works" },
                  { number: "35", label: "Creative Students" },
                  { number: categories.length + "+", label: "Categories" }
                ].map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl font-bold bg-blue-600 bg-clip-text text-transparent">
                      {stat.number}
                    </div>
                    <div className={`text-sm mt-1 ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {displayFeaturedArticles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative"
              >
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <div 
                    className="aspect-[4/3] bg-cover bg-center relative"
                    style={{ 
                      backgroundImage: `url(${displayFeaturedArticles[currentSlide]?.cover_image || '/cover/Laut.jpg'})`
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                    
                    <div className="absolute bottom-0 left-0 right-0 p-8">
                      <div className="mb-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          darkMode ? 'bg-gray-900/80 text-white' : 'bg-white/90 text-gray-800'
                        }`}>
                          {getCategory(displayFeaturedArticles[currentSlide])}
                        </span>
                      </div>
                      <h3 className="text-white text-2xl font-bold mb-2 line-clamp-2">
                        {displayFeaturedArticles[currentSlide]?.title}
                      </h3>
                      <p className="text-gray-300 text-sm line-clamp-2 mb-4">
                        {displayFeaturedArticles[currentSlide]?.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-blue-300 text-sm">
                          By {getAuthorName(displayFeaturedArticles[currentSlide])}
                        </span>
                        <span className="text-gray-400 text-sm">
                          {displayFeaturedArticles[currentSlide]?.readTime || '5 min read'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center space-x-2 mt-6">
                  {displayFeaturedArticles.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-3 h-3 rounded-full transition-all ${
                        index === currentSlide
                          ? 'bg-blue-600 w-8'
                          : darkMode ? 'bg-gray-600' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      <section className={`py-20 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Explore <span className="bg-blue-600 bg-clip-text text-transparent">Categories</span>
            </h2>
            <p className={`text-xl max-w-2xl mx-auto ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Discover content across various disciplines and interests
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                onClick={() => handleCategoryClick(category.slug)}
                className={`group cursor-pointer rounded-2xl p-6 text-center transition-all ${
                  darkMode 
                    ? 'bg-gray-700 hover:bg-gray-600' 
                    : 'bg-white hover:bg-gray-100 shadow-md hover:shadow-lg'
                }`}
              >
                <div className={`w-16 h-16 ${category.color} rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                  {category.icon}
                </div>
                <h3 className="font-semibold mb-2">{category.name}</h3>
                <p className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {category.count} works
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-16">
            <div>
              <h2 className="text-4xl font-bold mb-4">
                Featured <span className="bg-blue-600 bg-clip-text text-transparent">Articles</span>
              </h2>
              <p className={`text-xl ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {user ? (
                  `Welcome back, ${user.username}! Here are some handpicked articles for you.`
                ) : (
                  'Handpicked content from our talented community'
                )}
              </p>
            </div>
            <Link
              href="/explore"
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                darkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayFeaturedArticles.map((article, index) => (
              <motion.article
                key={article.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                whileHover={{ y: -10 }}
                className={`group rounded-2xl overflow-hidden shadow-lg transition-all ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                }`}
              >
                <Link href={`/article/${article.id}`} className="block">
                  <div className="relative overflow-hidden">
                    <div 
                      className="aspect-[4/3] bg-cover bg-center relative"
                      style={{ 
                        backgroundImage: `url(${article.cover_image || '/cover/Laut.jpg'})`
                      }}
                    >
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all"></div>
                      <div className="absolute top-4 left-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          darkMode ? 'bg-gray-900/80 text-white' : 'bg-white/90 text-gray-800'
                        }`}>
                          {getCategory(article)}
                        </span>
                      </div>
                      <div className="absolute bottom-4 right-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          darkMode ? 'bg-black/50 text-white' : 'bg-white/90 text-gray-800'
                        }`}>
                          {article.view_count} views
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center justify-between text-sm mb-3">
                      <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {article.date || 'Jan 15, 2024'}
                      </span>
                      <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {article.readTime || '5 min read'}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {article.title}
                    </h3>

                    <p className={`mb-4 line-clamp-3 ${
                      darkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {article.excerpt}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {getAuthorInitials(article)}
                          </span>
                        </div>
                        <span className={`text-sm ${
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {getAuthorName(article)}
                        </span>
                      </div>

                      <div className="flex items-center space-x-4 text-sm">
                        <button 
                          onClick={(e) => handleLike(article.id, e)}
                          className="flex items-center space-x-1 hover:text-red-500 transition-colors"
                        >
                          <span>❤️</span>
                          <span>{getLikeCount(article)}</span>
                        </button>
                        <button className="flex items-center space-x-1 hover:text-blue-600 transition-colors">
                          <span>💬</span>
                          <span>{article.comment_count || article.comments || 0}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className={`py-20 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Trending <span className="bg-blue-600 bg-clip-text text-transparent">Now</span>
            </h2>
            <p className={`text-xl ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              See what's capturing the community's attention
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {displayTrendingArticles.map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`flex items-center space-x-4 p-4 rounded-2xl transition-all ${
                  darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100 shadow-md'
                }`}
              >
                <div className="text-3xl font-bold text-gray-400">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <Link href={`/article/${article.id}`}>
                    <h3 className="font-semibold mb-1 line-clamp-2 hover:text-blue-600 transition-colors">
                      {article.title}
                    </h3>
                  </Link>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className={`px-2 py-1 rounded-full ${
                      darkMode ? 'bg-gray-600' : 'bg-gray-200'
                    }`}>
                      {getCategory(article)}
                    </span>
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                      {getAuthorName(article)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-1 text-red-500">
                  <span>❤️</span>
                  <span className="text-sm font-semibold">{getLikeCount(article)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className={`rounded-3xl p-12 ${
              darkMode 
                ? 'bg-gray-800' 
                : 'bg-blue-50'
            }`}
          >
            <h2 className="text-4xl font-bold mb-6">
              {user ? `Welcome, ${user.username}!` : 'Ready to Share Your '}
              <span className="bg-blue-600 bg-clip-text text-transparent">
                {user ? ' What will you create today?' : ' Creativity?'}
              </span>
            </h2>
            <p className={`text-xl mb-8 max-w-2xl mx-auto ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {user ? (
                `You're part of our creative community. Continue building your portfolio and connecting with other creators.`
              ) : (
                'Join hundreds of students showcasing their work, building their portfolio, and connecting with like-minded creators.'
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={user ? "/create" : "/auth/register"}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
              >
                {user ? "Create Content" : "Start Creating Today"}
              </Link>
              <Link
                href="/explore"
                className={`border-2 px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:-translate-y-1 ${
                  darkMode 
                    ? 'border-gray-600 text-gray-300 hover:border-blue-600 hover:text-white' 
                    : 'border-gray-300 text-gray-700 hover:border-blue-600 hover:text-blue-600'
                }`}
              >
                Explore More
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className={`py-12 border-t ${
        darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">S</span>
                </div>
                <span className="text-xl font-bold">SEIJA</span>
              </div>
              <p className={`text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Empowering student creativity through digital expression and community collaboration.
              </p>
            </div>

            {[
              {
                title: "Explore",
                links: ["Featured", "Categories", "Trending", "New Releases"]
              },
              {
                title: "Community",
                links: ["About Us", "Our Team", "Contributors", "Join Us"]
              },
              {
                title: "Support",
                links: ["Help Center", "Guidelines", "Contact", "Privacy"]
              }
            ].map((section, index) => (
              <div key={index}>
                <h4 className="font-semibold mb-4">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a href="#" className={`text-sm hover:text-blue-600 transition-colors ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className={`border-t mt-8 pt-8 text-center ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <p className={`text-sm ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              © 2024 Seija Magazine. Made with Love by SIJA Students.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;