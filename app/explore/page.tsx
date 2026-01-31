// app/explore/page.tsx - COMPLETE FIXED VERSION
"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from '../contexts/AuthContext';
import { useArticles } from '../contexts/ArticleContext';
import { useDarkMode } from "../hooks/useDarkMode";
import Link from 'next/link';

const ExplorePage: React.FC = () => {
  const { darkMode, toggleDarkMode, mounted } = useDarkMode();
  const [searchQuery, setSearchQuery] = useState("");
  const { user, logout } = useAuth();
  const { 
    filteredArticles, 
    loading, 
    searchLoading,
    filters,
    updateFilters,
    likeArticle,
    categories 
  } = useArticles();

  // Use data langsung dari context
  const displayArticles = filteredArticles;

  // Sync search query with filters
  useEffect(() => {
    setSearchQuery(filters.search);
  }, [filters.search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchQuery, page: 1 });
  };

  const handleCategoryClick = (categorySlug: string) => {
    updateFilters({ category: categorySlug, page: 1 });
  };

  const handleSortChange = (sortBy: string) => {
    updateFilters({ sort: sortBy, page: 1 });
  };

  const handleLike = async (articleId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      alert('Please login to like articles');
      return;
    }

    await likeArticle(articleId);
  };

  const handleLogout = () => {
    logout();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  // Helper functions
  const getAuthorName = (article: any) => {
    return article.author_name || article.author || 'Anonymous';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
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
      
      {/* Navigation Bar */}
      <nav className={`fixed top-0 w-full z-50 backdrop-blur-md border-b ${
        darkMode ? 'bg-gray-900/80 border-gray-700' : 'bg-white/80 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-blue-600 bg-clip-text text-transparent">
                    SEIJA
                  </h1>
                  <p className="text-xs text-gray-500">MAGAZINE</p>
                </div>
              </div>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              {[
                { name: "Home", href: "/" },
                { name: "Explore", href: "/explore", isActive: true },
                { name: "Categories", href: "/categories" },
                { name: "About", href: "/about" },
                { name: "Contact", href: "/contact" }
              ].map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`font-medium transition-all hover:text-blue-600 ${
                    item.isActive 
                      ? 'text-blue-600' 
                      : darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-all ${
                  darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>

              {/* Auth Section */}
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
                          {user.username?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </Link>
                    
                    {/* Dropdown Menu */}
                    <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ${
                      darkMode ? 'bg-gray-800' : 'bg-white'
                    }`}>
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium">Signed in as</p>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
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

      {/* Header Section */}
      <section className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl lg:text-6xl font-bold mb-6">
              Explore <span className="bg-blue-600 bg-clip-text text-transparent">Content</span>
            </h1>
            <p className={`text-xl max-w-2xl mx-auto mb-8 ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Discover amazing content from our creative community. Filter by category, search for specific topics, and find your next favorite read.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search articles, authors, or categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full px-6 py-4 rounded-2xl border-2 transition-colors text-lg ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent`}
                />
                <button 
                  type="submit"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-2 rounded-lg hover:shadow-lg transition-all"
                >
                  🔍
                </button>
              </div>
            </form>

            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <select
                value={filters.category}
                onChange={(e) => handleCategoryClick(e.target.value)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {categories.map(category => (
                  <option key={category.slug} value={category.slug}>
                    {category.name} ({category.article_count})
                  </option>
                ))}
              </select>

              <select
                value={filters.sort}
                onChange={(e) => handleSortChange(e.target.value)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="most-liked">Most Liked</option>
                <option value="most-viewed">Most Viewed</option>
              </select>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">
              {displayArticles.length} {displayArticles.length === 1 ? 'Article' : 'Articles'} Found
              {filters.search && ` for "${filters.search}"`}
              {filters.category !== 'all' && ` in ${categories.find(c => c.slug === filters.category)?.name}`}
            </h2>
          </div>

          {(searchLoading || loading) ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : displayArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayArticles.map((article, index) => (
                <motion.article
                  key={article.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className={`group rounded-2xl overflow-hidden shadow-lg transition-all ${
                    darkMode ? 'bg-gray-800' : 'bg-white'
                  }`}
                >
                  <Link href={`/article/${article.id}`} className="block">
                    <div className="relative overflow-hidden">
                      <div 
                        className="aspect-[4/3] bg-cover bg-center relative"
                        style={{ 
                          backgroundImage: `url(${article.cover_image || '/cover/default.jpg'})`
                        }}
                      >
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all"></div>
                        <div className="absolute top-4 left-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            darkMode ? 'bg-gray-900/80 text-white' : 'bg-white/90 text-gray-800'
                          }`}>
                            {article.category_name}
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
                          {formatDate(article.created_at)}
                        </span>
                        <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          By {getAuthorName(article)}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {article.title}
                      </h3>

                      <p className={`mb-4 line-clamp-3 ${
                        darkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {article.excerpt || ''}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm">
                          <button 
                            onClick={(e) => handleLike(article.id, e)}
                            className="flex items-center space-x-1 hover:text-red-500 transition-colors"
                          >
                            <span>❤️</span>
                            <span>{article.like_count}</span>
                          </button>
                          <button className="flex items-center space-x-1 hover:text-blue-600 transition-colors">
                            <span>💬</span>
                            <span>{article.comment_count}</span>
                          </button>
                        </div>
                        
                        <span className={`text-sm px-3 py-1 rounded-full ${
                          darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                        }`}>
                          Read More →
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-2xl font-bold mb-4">No articles yet</h3>
              <p className={`text-lg mb-8 ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {filters.search || filters.category !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Be the first to publish an article!'
                }
              </p>
              {user && (
                <Link
                  href="/create"
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all inline-block"
                >
                  Start Creating
                </Link>
              )}
            </motion.div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-12 border-t ${
        darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
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

export default ExplorePage;