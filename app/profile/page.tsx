"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from '../contexts/AuthContext';
import { useDarkMode } from "../hooks/useDarkMode";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const ProfilePage: React.FC = () => {
  const { darkMode, toggleDarkMode, mounted } = useDarkMode();
  const { user, logout } = useAuth();
  const router = useRouter();
  
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    bio: '',
    avatar_url: ''
  });

  const [myArticles, setMyArticles] = useState<any[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);

  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || '',
        avatar_url: user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'User')}`
      });
      
      // Load user's articles
      fetchUserArticles();
    }
  }, [user]);

  const fetchUserArticles = () => {
    try {
      setLoadingArticles(true);
      
      // Dummy articles data
      const dummyArticles = [
        {
          id: 1,
          title: "Laut",
          category_name: "Puisi",
          created_at: "2024-01-15",
          view_count: 342,
          like_count: 167,
          excerpt: "Bayangkan, aku dan kau menikmati deburan ombak Duduk di pasir yang hangat"
        },
        {
          id: 2,
          title: "Dirimu", 
          category_name: "Puisi",
          created_at: "2024-01-12",
          view_count: 256,
          like_count: 142,
          excerpt: "Ketika sang surya telah tenggelam di dalam nisha Dan purnama pun menghiasi malam yang menyiksa"
        },
        {
          id: 3,
          title: "Pohon",
          category_name: "Puisi",
          created_at: "2024-01-10",
          view_count: 321,
          like_count: 203,
          excerpt: "Pohon setelah terluka Tak akan menunggu permintaan maaf"
        }
      ];
      
      setMyArticles(dummyArticles);
    } catch (error) {
      console.error('Error loading articles:', error);
      setMyArticles([]);
    } finally {
      setLoadingArticles(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      // Save to localStorage for now
      const updatedUser = {
        ...user,
        username: profileData.username,
        bio: profileData.bio,
        avatar_url: profileData.avatar_url
      };
      
      localStorage.setItem('seija_user', JSON.stringify(updatedUser));
      
      setEditMode(false);
      alert('Profile updated successfully!');
      
      // Refresh page
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  const handleLogout = () => {
    logout();
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

  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        darkMode ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className="text-center">
          <h2 className={`text-2xl font-bold mb-4 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Please login to view profile
          </h2>
          <Link 
            href="/auth/login" 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Login
          </Link>
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

              <div className="flex items-center space-x-3">
                <Link
                  href="/create"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all"
                >
                  ✨ Create
                </Link>
                
                <div className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-600 text-white">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-bold">
                      {user.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span>Profile</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Profile Content */}
      <div className="pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`rounded-2xl p-6 ${
                  darkMode ? 'bg-gray-800' : 'bg-white shadow-lg'
                }`}
              >
                <div className="text-center">
                  <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl font-bold">
                      {user.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold mb-2">{user.username}</h2>
                  <p className={`text-sm mb-4 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {user.email}
                  </p>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm mb-6 ${
                    darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                  </div>

                  <div className="space-y-2 text-left">
                    <div className="flex justify-between">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Articles</span>
                      <span className="font-semibold">{myArticles.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Member since</span>
                      <span className="font-semibold">
                        {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl p-6 ${
                  darkMode ? 'bg-gray-800' : 'bg-white shadow-lg'
                }`}
              >
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold">Profile Settings</h1>
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editMode ? 'Cancel' : 'Edit Profile'}
                  </button>
                </div>

                {editMode ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Username</label>
                      <input
                        type="text"
                        value={profileData.username}
                        onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Bio</label>
                      <textarea
                        value={profileData.bio}
                        onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                        rows={4}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                    <button
                      onClick={handleSaveProfile}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Username</label>
                      <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{profileData.username}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{profileData.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Bio</label>
                      <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                        {profileData.bio || 'No bio provided'}
                      </p>
                    </div>
                  </div>
                )}

                {/* My Articles Section */}
                <div className="mt-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">My Articles ({myArticles.length})</h3>
                    <Link
                      href="/create"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      + Create New
                    </Link>
                  </div>
                  
                  {loadingArticles ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-500">Loading articles...</p>
                    </div>
                  ) : myArticles.length === 0 ? (
                    <div className={`text-center py-8 rounded-lg ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                        You haven't published any articles yet.
                      </p>
                      <Link
                        href="/create"
                        className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Create Your First Article
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {myArticles.map((article) => (
                        <div 
                          key={article.id} 
                          className={`flex items-center justify-between p-4 rounded-lg hover:shadow-md transition-all cursor-pointer ${
                            darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                          onClick={() => router.push(`/article/${article.id}`)}
                        >
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{article.title}</h4>
                            <p className={`text-sm mb-2 line-clamp-2 ${
                              darkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {article.excerpt}
                            </p>
                            <div className="flex items-center space-x-4 text-xs">
                              <span className={`px-2 py-1 rounded ${
                                darkMode ? 'bg-gray-600' : 'bg-gray-200'
                              }`}>
                                {article.category_name}
                              </span>
                              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                                {new Date(article.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              darkMode ? 'bg-gray-600' : 'bg-gray-200'
                            }`}>
                              {article.view_count} views
                            </span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              darkMode ? 'bg-gray-600' : 'bg-gray-200'
                            }`}>
                              {article.like_count} likes
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;