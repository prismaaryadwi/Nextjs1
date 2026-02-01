// app/create/page.tsx - COMPLETE FIXED VERSION
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { useArticles } from "../contexts/ArticleContext";
import { useDarkMode } from "../hooks/useDarkMode";
import Link from 'next/link';

const categories = [
  "Novel",
  "Cerpen", 
  "Puisi",
  "Opini",
  "Desain Grafis",
  "Coding Project",
  "Cerita Bergambar",
  "Pantun"
];

// Default cover images
const defaultCovers: { [key: string]: string } = {
  'Puisi': '/cover/puisi.jpg',
  'Novel': '/cover/novel.jpg', 
  'Cerpen': '/cover/cerpen.jpg',
  'Opini': '/cover/opini.jpg',
  'Desain Grafis': '/cover/desain.jpg',
  'Coding Project': '/cover/coding.jpg',
  'Cerita Bergambar': '/cover/cergam.jpg',
  'Pantun': '/cover/pantun.jpg'
};

// Fungsi upload gambar yang FIXED
const uploadImage = async (file: File): Promise<string | null> => {
  try {
    console.log('📤 [UPLOAD] Uploading image:', file.name);
    console.log('🏭 NODE_ENV:', process.env.NODE_ENV);
    
    // Gunakan environment variable yang benar
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL 
      ? process.env.NEXT_PUBLIC_API_URL 
      : 'http://localhost:3002';
    
    const UPLOAD_URL = `${API_BASE_URL}/api/upload/image`;
    console.log('🔗 Upload URL:', UPLOAD_URL);
    
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch(UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });
    
    console.log('📤 Response status:', response.status);
    console.log('📤 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Upload failed:', errorText);
      throw new Error(`Upload failed: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📤 Upload response:', data);
    
    if (data.success && data.url) {
      console.log('✅ Upload success!');
      
      // Return URL (relative atau absolute)
      return data.url;
    } else {
      throw new Error(data.message || 'Upload failed');
    }
  } catch (error: any) {
    console.error('❌ Upload error:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Return null untuk menggunakan default image
    return null;
  }
};

export default function CreateArticlePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { darkMode } = useDarkMode();
  const { createArticle } = useArticles();
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    category_name: "",
    author_name: "",
    cover_image: "",
    tags: "",
    status: "pending",
    imageFile: null as File | null
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle category change
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value;
    const defaultCover = defaultCovers[category] || '/cover/default.jpg';
    
    setFormData(prev => ({ 
      ...prev, 
      category_name: category,
      cover_image: defaultCover
    }));
    
    setImagePreview(defaultCover);
    
    if (errors.category_name) {
      setErrors(prev => ({ ...prev, category_name: '' }));
    }
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validasi
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, cover_image: 'Ukuran file maksimal 5MB' }));
        return;
      }

      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, cover_image: 'Hanya file gambar yang diizinkan' }));
        return;
      }

      setErrors(prev => ({ ...prev, cover_image: '' }));

      // Buat preview
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);

      // Simpan file
      setFormData(prev => ({ 
        ...prev, 
        imageFile: file
      }));

      console.log('🖼️ Gambar dipilih:', file.name);
    }
  };

  // Validasi form
  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Judul karya harus diisi';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Konten karya harus diisi';
    }

    if (!formData.category_name) {
      newErrors.category_name = 'Kategori wajib dipilih';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit - SIMPLIFIED
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");
    setDebugInfo(null);
    
    if (!validateForm()) {
      alert('Harap perbaiki error sebelum melanjutkan.');
      return;
    }

    if (!user) {
      alert('Silakan login terlebih dahulu');
      router.push('/auth/login');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('🚀 Starting article creation...');

      // Upload gambar jika ada
      let finalCoverImage = formData.cover_image;
      
      if (formData.imageFile) {
        console.log('🖼️ Uploading cover image...');
        const uploadedUrl = await uploadImage(formData.imageFile);
        if (uploadedUrl) {
          finalCoverImage = uploadedUrl;
          console.log('✅ Image uploaded:', uploadedUrl);
        } else {
          console.log('⚠️ Using default image');
          finalCoverImage = defaultCovers[formData.category_name] || '/cover/default.jpg';
        }
      }

      // Siapkan data
      const articleData = {
        title: formData.title.trim(),
        content: formData.content,
        excerpt: formData.excerpt.trim() || formData.content.substring(0, 150) + '...',
        category_name: formData.category_name,
        author_name: formData.author_name.trim() || user.username,
        cover_image: finalCoverImage,
        tags: formData.tags || '',
        status: user?.role === 'admin' ? 'published' : 'pending',
        featured: false,
        imageFile: formData.imageFile
      };

      console.log('📦 Article data ready:', articleData);

      // Gunakan createArticle dari context
      const success = await createArticle(articleData);
      
      if (success) {
        const message = user?.role === 'admin' 
          ? '🎉 Karya berhasil dipublikasikan!' 
          : '📝 Karya berhasil diajukan! Menunggu persetujuan admin.';
        
        setSuccessMessage(message);
        console.log('✅ Article created successfully');

        // Reset form
        setFormData({
          title: "",
          content: "",
          excerpt: "",
          category_name: "",
          author_name: "",
          cover_image: "",
          tags: "",
          status: "pending",
          imageFile: null
        });
        setImagePreview("");

        // Redirect
        setTimeout(() => {
          if (user?.role === 'admin') {
            router.push('/admin/dashboard');
          } else {
            router.push('/profile');
          }
        }, 2000);

      } else {
        throw new Error('Gagal membuat artikel');
      }
      
    } catch (error: any) {
      console.error('❌ Error creating article:', error);
      alert(`❌ ${error.message || 'Gagal membuat artikel'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Debug function
  const testApiConnection = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api`
        : 'http://localhost:3002/api';
      
      console.log('🔍 Testing API connection to:', `${API_URL}/health`);
      
      const response = await fetch(`${API_URL}/health`);
      const data = await response.json();
      
      setDebugInfo({
        apiUrl: API_URL,
        status: response.status,
        data: data,
        timestamp: new Date().toISOString()
      });
      
      alert(`✅ API Status: ${data.message}\n\nEnvironment: ${data.environment}\nURL: ${API_URL}`);
    } catch (error: any) {
      alert(`❌ API Error: ${error.message}`);
      console.error('🔧 Debug error:', error);
    }
  };

  // Redirect jika belum login
  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        darkMode ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className="text-center">
          <h2 className={`text-2xl font-bold mb-4 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Silakan login untuk membuat karya
          </h2>
          <Link 
            href="/auth/login" 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Login Sekarang
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
    }`}>
      
      {/* Navigation */}
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

            <div className="flex items-center space-x-4">
              <Link
                href="/explore"
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                ← Kembali ke Explore
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Success Message */}
            {successMessage && (
              <div className={`mb-6 p-4 rounded-lg ${
                darkMode ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'
              }`}>
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  <p className="text-green-800 dark:text-green-200">{successMessage}</p>
                </div>
                <p className={`text-sm mt-2 ${
                  darkMode ? 'text-green-300' : 'text-green-600'
                }`}>
                  Akan diarahkan dalam 3 detik...
                </p>
              </div>
            )}

            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-2">Buat Karya Baru</h1>
              <p className={`text-lg ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Bagikan kreativitas Anda dengan komunitas SEIJA
              </p>
            </div>

            {/* Debug Section */}
            <div className={`mb-6 p-4 rounded-lg ${
              darkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'
            }`}>
              <h4 className="font-bold mb-2">🔧 Debug Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-semibold">NODE_ENV:</span> {process.env.NODE_ENV}
                </div>
                <div>
                  <span className="font-semibold">User Role:</span> {user?.role}
                </div>
                <div>
                  <span className="font-semibold">API URL:</span> {process.env.NEXT_PUBLIC_API_URL || 'Not set'}
                </div>
                <div>
                  <span className="font-semibold">Username:</span> {user?.username}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={testApiConnection}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Test API Connection
                </button>
                <button
                  onClick={() => {
                    console.log('Form data:', formData);
                    console.log('User:', user);
                    console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
                  }}
                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                >
                  Log Debug Info
                </button>
              </div>
              
              {debugInfo && (
                <div className="mt-3 p-2 bg-black/20 rounded text-xs">
                  <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Title */}
              <div>
                <label className={`block text-sm font-medium mb-3 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Judul Karya *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Berikan judul yang menarik..."
                  className={`w-full px-4 py-3 rounded-lg border transition-colors text-lg ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } ${
                    errors.title ? 'border-red-500' : 'focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent'
                  }`}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-2">{errors.title}</p>
                )}
              </div>

              {/* Category */}
              <div>
                <label className={`block text-sm font-medium mb-3 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Kategori *
                </label>
                <select
                  name="category_name"
                  value={formData.category_name}
                  onChange={handleCategoryChange}
                  required
                  className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } ${
                    errors.category_name ? 'border-red-500' : 'focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent'
                  }`}
                >
                  <option value="">Pilih kategori karya Anda</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category_name && (
                  <p className="text-red-500 text-sm mt-2">{errors.category_name}</p>
                )}
              </div>

              {/* Author Name */}
              <div>
                <label className={`block text-sm font-medium mb-3 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Nama Penulis
                </label>
                <input
                  type="text"
                  name="author_name"
                  value={formData.author_name}
                  onChange={handleInputChange}
                  placeholder={`Kosongkan untuk menggunakan "${user.username}"`}
                  className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent`}
                />
              </div>

              {/* Cover Image */}
              <div>
                <label className={`block text-sm font-medium mb-3 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Gambar Cover (Opsional)
                </label>
                <div className="space-y-4">
                  {(imagePreview || formData.cover_image) && (
                    <div className="max-w-md mx-auto">
                      <img 
                        src={imagePreview || formData.cover_image} 
                        alt="Cover preview" 
                        className="rounded-lg shadow-lg max-h-64 object-cover w-full"
                      />
                    </div>
                  )}
                  
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-700 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent`}
                  />
                  
                  {errors.cover_image && (
                    <p className="text-red-500 text-sm">{errors.cover_image}</p>
                  )}
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label className={`block text-sm font-medium mb-3 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Deskripsi Singkat (Opsional)
                </label>
                <textarea
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Tulis deskripsi singkat..."
                  className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent`}
                />
              </div>

              {/* Content */}
              <div>
                <label className={`block text-sm font-medium mb-3 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Konten Karya *
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  required
                  rows={15}
                  placeholder="Tulis karya Anda di sini..."
                  className={`w-full px-4 py-3 rounded-lg border transition-colors font-mono ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } ${
                    errors.content ? 'border-red-500' : 'focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent'
                  }`}
                />
                {errors.content && (
                  <p className="text-red-500 text-sm mt-2">{errors.content}</p>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className={`block text-sm font-medium mb-3 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Tag (Opsional)
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="teknologi, tutorial, web"
                  className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent`}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex space-x-4 pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {user.role === 'admin' ? 'Memublikasikan...' : 'Mengajukan...'}
                    </>
                  ) : (
                    user.role === 'admin' ? '🚀 Publikasikan Karya' : '📝 Ajukan untuk Review'
                  )}
                </button>
                
                <Link
                  href="/explore"
                  className={`px-8 py-4 rounded-lg font-semibold transition-colors border ${
                    darkMode 
                      ? 'border-gray-600 text-gray-300 hover:border-gray-500 hover:text-white' 
                      : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:text-gray-900'
                  }`}
                >
                  Batalkan
                </Link>
              </div>
            </form>
          </motion.div>
        </div>
      </main>
    </div>
  );
}