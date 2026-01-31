// app/article/[id]/page.tsx - COMPLETE FIXED VERSION WITH UUID SUPPORT
"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { useArticles } from "@/app/contexts/ArticleContext";
import { useDarkMode } from "@/app/hooks/useDarkMode";
import Link from 'next/link';

// Static articles data (sama dengan di homepage)
const staticArticles = [
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
    content: `Bayangkan, aku dan kau menikmati deburan ombak
Duduk di pasir yang hangat, tangan saling berpegangan
Matahari terbenam di ufuk barat
Menyisakan cahaya keemasan di cakrawala

Angin sepoi-sepoi membelai rambut
Suara burung camar menambah harmoni
Aku dan kau, dalam keheningan yang bermakna
Bersama menghitung butir-butir pasir

Lautan tak pernah berhenti bergerak
Seperti cinta kita yang tak pernah padam
Ombak datang dan pergi
Tapi kenangan ini akan abadi

Di tepi pantai ini, aku bersumpah
Akan selalu mencintaimu seperti laut mencintai pantai
Selamanya, dalam setiap deburan ombak
Dalam setiap butir pasir yang hangat.`,
    created_at: "2024-01-15T00:00:00.000Z"
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
    content: `Ketika sang surya telah tenggelam di dalam nisha
Dan purnama pun menghiasi malam yang menyiksa
Aku terduduk termenung di tepi jendela
Mengenang setiap detik bersamamu

Dirimu bagai bintang di langit kelam
Menerangi jalan yang gelap dan sepi
Setiap senyumanmu adalah pelangi
Setiap tatapanmu adalah samudera

Dalam diam, kudengar suara hatimu
Berdebar seirama dengan detak jantungku
Kita bagai dua melodi yang berbeda
Tapi saat bersatu, menjadi simfoni sempurna

Waktu terus berlalu tanpa ampun
Tapi kenangan kita takkan pernah usang
Dirimu akan tetap abadi
Dalam setiap puisi yang kutulis
Dalam setiap mimpi yang kuraih.`,
    created_at: "2024-01-12T00:00:00.000Z"
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
    content: `Pohon setelah terluka
Tak akan menunggu permintaan maaf
Ia hanya diam, menahan sakit
Sambil terus memberikan oksigen

Daun-daunnya berguguran satu per satu
Meninggalkan dahan yang kering dan rapuh
Tapi akarnya tetap kokoh di tanah
Bertahan dari terpaan angin dan badai

Seperti pohon yang terluka
Hatiku juga takkan sama lagi
Setiap luka meninggalkan bekas
Setiap air mata meninggalkan jejak

Tapi dari luka itu, tumbuh kekuatan baru
Dari patah itu, muncul tunas harapan
Aku belajar dari pohon
Bahwa bertahan itu perlu
Dan tumbuh kembali itu mungkin

Pohon tak pernah bicara
Tapi mengajarkan banyak makna
Dalam diamnya, ada keteguhan
Dalam kesendiriannya, ada kebijaksanaan.`,
    created_at: "2024-01-10T00:00:00.000Z"
  }
];

const ArticleDetailPage: React.FC = () => {
  const { darkMode, toggleDarkMode, mounted } = useDarkMode();
  const params = useParams();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { 
    currentArticle, 
    fetchArticle, 
    likeArticle, 
    articleComments, 
    fetchComments,
    addComment,
    loading 
  } = useArticles();
  
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [articleId, setArticleId] = useState<string>("");
  const [isStaticArticle, setIsStaticArticle] = useState(false);
  const [staticArticle, setStaticArticle] = useState<any>(null);
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    if (params.id) {
      const id = params.id as string;
      setArticleId(id);
      
      // Check if this is a static article ID
      const staticArticleIds = ["laut-1", "dirimu-2", "pohon-3"];
      if (staticArticleIds.includes(id)) {
        setIsStaticArticle(true);
        const foundArticle = staticArticles.find(a => a.id === id);
        setStaticArticle(foundArticle || null);
      } else {
        setIsStaticArticle(false);
        // FIX: Directly use string ID for UUID
        fetchArticle(id).catch(error => {
          console.error('Error fetching article:', error);
          setIsNotFound(true);
        });
        fetchComments(id).catch(console.error);
      }
    }
  }, [params.id]);

  const handleLike = async () => {
    if (!user) {
      alert('Please login to like articles');
      return;
    }
    if (articleId && !isStaticArticle) {
      await likeArticle(articleId);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !articleId || isStaticArticle) return;
    
    if (!user) {
      alert('Please login to comment');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await addComment(articleId, commentText);
      if (success) {
        setCommentText("");
        alert("Comment added successfully!");
      } else {
        alert("Failed to add comment");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const renderContent = (content: string) => {
    if (!content) {
      return (
        <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>No content available for this article.</p>
          <p className="text-sm mt-2">The author hasn't added content yet.</p>
        </div>
      );
    }

    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return (
        <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>No content available.</p>
        </div>
      );
    }

    const avgLineLength = lines.reduce((sum, line) => sum + line.length, 0) / lines.length;
    const isPoetry = avgLineLength < 80 && lines.length > 4;

    if (isPoetry) {
      return (
        <div className="space-y-4 leading-loose text-center font-serif text-lg">
          {lines.map((line, index) => {
            if (line.trim() === '') {
              return <div key={index} className="h-6"></div>;
            }
            return <p key={index} className="m-0">{line}</p>;
          })}
        </div>
      );
    } else {
      return (
        <div className="space-y-6">
          {lines.map((line, index) => (
            <p key={index} className="text-justify leading-relaxed text-lg">
              {line}
            </p>
          ))}
        </div>
      );
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

  // Determine which article to show
  const displayArticle = isStaticArticle ? staticArticle : currentArticle;
  const isLoading = !isStaticArticle && loading && !currentArticle;

  if (isNotFound) {
    return (
      <div className={`min-h-screen transition-colors duration-300 flex items-center justify-center ${
        darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
      }`}>
        <div className="text-center max-w-md p-8">
          <div className="text-6xl mb-4">📄</div>
          <h2 className="text-2xl font-bold mb-4">Article not found</h2>
          <p className="mb-6">
            The article with ID "{articleId}" doesn't exist or has been removed.
          </p>
          <div className="flex flex-col space-y-4">
            <Link 
              href="/" 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all"
            >
              Back to Home
            </Link>
            <Link 
              href="/explore" 
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                darkMode 
                  ? 'border border-gray-700 text-gray-300 hover:border-gray-600 hover:text-white' 
                  : 'border border-gray-300 text-gray-700 hover:border-gray-400 hover:text-gray-900'
              }`}
            >
              Browse Articles
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!displayArticle) {
    return (
      <div className={`min-h-screen transition-colors duration-300 flex items-center justify-center ${
        darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
      }`}>
        <div className="text-center max-w-md p-8">
          <div className="text-6xl mb-4">📄</div>
          <h2 className="text-2xl font-bold mb-4">Article not found</h2>
          <p className="mb-6">
            The article you're looking for doesn't exist or has been removed.
          </p>
          <div className="flex flex-col space-y-4">
            <Link 
              href="/" 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all"
            >
              Back to Home
            </Link>
            <Link 
              href="/explore" 
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                darkMode 
                  ? 'border border-gray-700 text-gray-300 hover:border-gray-600 hover:text-white' 
                  : 'border border-gray-300 text-gray-700 hover:border-gray-400 hover:text-gray-900'
              }`}
            >
              Browse Articles
            </Link>
          </div>
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
                    SEIJA
                  </h1>
                  <p className="text-xs text-gray-500">MAGAZINE</p>
                </div>
              </div>
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              {[
                ["Home", "/"],
                ["Explore", "/explore"],
                ["Categories", "/categories"],
                ["About", "/about"],
                ["Contact", "/contact"]
              ].map(([name, href]) => (
                <Link
                  key={name}
                  href={href}
                  className={`font-medium transition-all hover:text-blue-600 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  {name}
                </Link>
              ))}
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
                    ✨ Create
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

      <article className="pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8"
          >
            <button
              onClick={() => router.back()}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                darkMode 
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <span>←</span>
              <span>Back to {isStaticArticle ? "Home" : "Explore"}</span>
            </button>
          </motion.div>

          {displayArticle.cover_image && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8 rounded-2xl overflow-hidden shadow-2xl"
            >
              <div 
                className="aspect-[16/9] bg-cover bg-center"
                style={{ 
                  backgroundImage: `url(${displayArticle.cover_image || '/cover/default.jpg'})`
                }}
              />
            </motion.div>
          )}

          <motion.header
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-12"
          >
            <div className="mb-4">
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'
              }`}>
                {displayArticle.category_name || 'Uncategorized'}
              </span>
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              {displayArticle.title}
            </h1>
            
            <div className={`flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-lg ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {displayArticle.author_name?.charAt(0) || 'A'}
                  </span>
                </div>
                <span>By {displayArticle.author_name || 'Anonymous'}</span>
              </div>
              <span>•</span>
              <span>{displayArticle.created_at ? new Date(displayArticle.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }) : displayArticle.date || 'Unknown date'}</span>
              {displayArticle.read_time && (
                <>
                  <span>•</span>
                  <span>{displayArticle.read_time} min read</span>
                </>
              )}
            </div>
          </motion.header>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-12"
          >
            <div className={`max-w-2xl mx-auto font-serif text-lg leading-relaxed ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {renderContent(displayArticle.content)}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className={`flex items-center justify-center space-x-8 py-6 border-y ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}
          >
            <button
              onClick={handleLike}
              disabled={isStaticArticle}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                darkMode 
                  ? 'hover:bg-gray-800 text-gray-300' 
                  : 'hover:bg-gray-100 text-gray-600'
              } ${isStaticArticle ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="text-xl">❤️</span>
              <span className="font-semibold">{displayArticle.like_count || 0}</span>
              <span>Likes</span>
            </button>

            <div className="flex items-center space-x-2">
              <span className="text-xl">👁️</span>
              <span className="font-semibold">{displayArticle.view_count || 0}</span>
              <span>Views</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xl">💬</span>
              <span className="font-semibold">{displayArticle.comment_count || 0}</span>
              <span>Comments</span>
            </div>
          </motion.div>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-12"
          >
            <h2 className="text-2xl font-bold mb-6">Comments ({displayArticle.comment_count || 0})</h2>
            
            {isStaticArticle ? (
              <div className={`text-center py-8 rounded-lg ${
                darkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}>
                <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Comments are disabled for demo articles. Create an account to write your own articles!
                </p>
                <Link
                  href="/auth/register"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all inline-block"
                >
                  Join Community
                </Link>
              </div>
            ) : (
              <>
                {user ? (
                  <form onSubmit={handleCommentSubmit} className="mb-8">
                    <div className="flex space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            {user.username?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Share your thoughts..."
                          rows={3}
                          className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                            darkMode 
                              ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                          } focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent`}
                        />
                        <div className="flex justify-end mt-2">
                          <button
                            type="submit"
                            disabled={isSubmitting || !commentText.trim()}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmitting ? 'Posting...' : 'Post Comment'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className={`text-center py-8 rounded-lg ${
                    darkMode ? 'bg-gray-800' : 'bg-gray-100'
                  }`}>
                    <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Please login to leave a comment
                    </p>
                    <Link
                      href="/auth/login"
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all inline-block"
                    >
                      Sign In
                    </Link>
                  </div>
                )}

                <div className="space-y-6">
                  {articleComments.length > 0 ? (
                    articleComments.map((comment) => (
                      <div key={comment.id} className="flex space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">
                              {comment.username?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-semibold">{comment.username}</span>
                            <span className={`text-sm ${
                              darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {new Date(comment.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={`text-center py-8 rounded-lg ${
                      darkMode ? 'bg-gray-800' : 'bg-gray-100'
                    }`}>
                      <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                        No comments yet. Be the first to share your thoughts!
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.section>
        </div>
      </article>

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

export default ArticleDetailPage;