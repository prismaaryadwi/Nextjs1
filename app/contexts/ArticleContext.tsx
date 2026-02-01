// contexts/ArticleContext.tsx - COMPLETE FIXED VERSION FOR PRODUCTION
'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Article {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author_name: string;
  author_id?: string;
  category_name: string;
  created_at: string;
  like_count: number;
  view_count: number;
  comment_count: number;
  cover_image?: string;
  read_time?: number;
  featured?: boolean;
  status?: 'draft' | 'pending' | 'published' | 'rejected';
}

export interface Comment {
  id: string;
  content: string;
  user_id: string;
  article_id: string;
  parent_id?: string;
  username: string;
  avatar?: string;
  created_at: string;
  replies?: Comment[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  article_count: number;
}

interface ArticleContextType {
  articles: Article[];
  filteredArticles: Article[];
  categories: Category[];
  currentArticle: Article | null;
  articleComments: Comment[];
  loading: boolean;
  searchLoading: boolean;
  
  adminArticles: Article[];
  pendingArticles: Article[];
  adminLoading: boolean;
  
  filters: {
    search: string;
    category: string;
    sort: string;
    page: number;
    limit: number;
  };
  
  fetchArticles: (newFilters?: Partial<ArticleContextType['filters']>) => Promise<void>;
  fetchArticle: (id: string) => Promise<Article | null>;
  fetchCategories: () => Promise<void>;
  likeArticle: (articleId: string) => Promise<boolean>;
  addComment: (articleId: string, content: string, parentId?: string) => Promise<boolean>;
  fetchComments: (articleId: string) => Promise<void>;
  
  createArticle: (articleData: any) => Promise<boolean>;
  updateArticle: (articleId: string, updates: any) => Promise<boolean>;
  deleteArticle: (articleId: string) => Promise<boolean>;
  
  fetchAdminArticles: (status?: string) => Promise<void>;
  fetchPendingArticles: () => Promise<void>;
  updateArticleStatus: (articleId: string, status: string) => Promise<boolean>;
  batchUpdateStatus: (articleIds: string[], status: string) => Promise<boolean>;
  
  updateFilters: (newFilters: Partial<ArticleContextType['filters']>) => void;
  clearFilters: () => void;
}

const ArticleContext = createContext<ArticleContextType | undefined>(undefined);

const DEFAULT_CATEGORIES: Category[] = [
  { id: "all", name: "All", slug: "all", article_count: 0 },
  { id: "novel", name: "Novel", slug: "novel", article_count: 0 },
  { id: "cerpen", name: "Cerpen", slug: "cerpen", article_count: 0 },
  { id: "puisi", name: "Puisi", slug: "puisi", article_count: 0 },
  { id: "opini", name: "Opini", slug: "opini", article_count: 0 },
  { id: "desain-grafis", name: "Desain Grafis", slug: "desain-grafis", article_count: 0 },
  { id: "coding-project", name: "Coding Project", slug: "coding-project", article_count: 0 },
  { id: "cerita-bergambar", name: "Cerita Bergambar", slug: "cerita-bergambar", article_count: 0 },
  { id: "pantun", name: "Pantun", slug: "pantun", article_count: 0 },
];

export function ArticleProvider({ children }: { children: ReactNode }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [articleComments, setArticleComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const [adminArticles, setAdminArticles] = useState<Article[]>([]);
  const [pendingArticles, setPendingArticles] = useState<Article[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    sort: 'newest',
    page: 1,
    limit: 12
  });

  // ==================== API URL CONFIGURATION ====================
  const getApiUrl = () => {
    // Use environment variable for production, localhost for development
    if (typeof window !== 'undefined') {
      // Client-side: Check if we're in production
      const isProduction = window.location.hostname !== 'localhost';
      
      if (isProduction && process.env.NEXT_PUBLIC_API_URL) {
        // Production with environment variable
        return `${process.env.NEXT_PUBLIC_API_URL}/api`;
      } else if (process.env.NEXT_PUBLIC_API_URL) {
        // Development with environment variable
        return `${process.env.NEXT_PUBLIC_API_URL}/api`;
      }
    }
    
    // Fallback to localhost:3002 for development
    return 'http://localhost:3002/api';
  };

  const API_URL = getApiUrl();

  // ==================== UPLOAD IMAGE FUNCTION ====================
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      console.log('📤 [UPLOAD IMAGE] Starting upload...');
      console.log('📁 File:', file.name, 'Size:', Math.round(file.size / 1024), 'KB');
      console.log('🔗 API URL:', `${API_URL}/upload/image`);
      
      // Validate file
      if (file.size > 10 * 1024 * 1024) { // 10MB max
        alert('Ukuran file maksimal 10MB');
        return null;
      }
      
      const formData = new FormData();
      formData.append('image', file);
      
      console.log('📤 Sending upload request...');
      
      const response = await fetch(`${API_URL}/upload/image`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header for FormData, browser will set it automatically
      });
      
      console.log('📤 Upload response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Upload failed with status:', response.status);
        console.error('❌ Error response:', errorText);
        
        // Try to parse as JSON if possible
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || `Upload failed: ${response.status}`);
        } catch {
          throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
        }
      }
      
      const data = await response.json();
      console.log('📤 Upload response data:', data);
      
      if (data.success && data.url) {
        console.log('✅ Upload successful! URL:', data.url);
        
        // If URL is relative, convert to absolute
        let finalUrl = data.url;
        if (data.url.startsWith('/')) {
          // Extract base URL from API_URL
          const baseUrl = API_URL.replace('/api', '');
          finalUrl = `${baseUrl}${data.url}`;
          console.log('🔄 Converted to absolute URL:', finalUrl);
        }
        
        return finalUrl;
      } else {
        console.error('❌ API returned error:', data.message);
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('❌ Upload error:', error);
      console.error('❌ Error stack:', error.stack);
      
      // Show user-friendly error message
      const errorMessage = error.message.includes('NetworkError') || error.message.includes('Failed to fetch')
        ? 'Gagal terhubung ke server. Cek koneksi internet Anda.'
        : error.message;
      
      alert(`Gagal mengupload gambar: ${errorMessage}`);
      return null;
    }
  };

  // ==================== CREATE ARTICLE ====================
  const createArticle = async (articleData: any): Promise<boolean> => {
    try {
      console.log('📝 [CREATE ARTICLE] Starting...');
      console.log('🔗 API URL:', API_URL);
      console.log('🏭 NODE_ENV:', process.env.NODE_ENV);
      console.log('📡 NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
      
      const savedUser = localStorage.getItem('seija_user');
      if (!savedUser) {
        alert('Silakan login terlebih dahulu');
        return false;
      }

      const user = JSON.parse(savedUser);
      console.log('👤 User:', user.username, 'Role:', user.role);

      let coverImageUrl = '/cover/default.jpg';
      
      // Handle image upload
      if (articleData.imageFile && articleData.imageFile instanceof File) {
        console.log('🖼️ Found image file, uploading...');
        const uploadedUrl = await uploadImage(articleData.imageFile);
        if (uploadedUrl) {
          coverImageUrl = uploadedUrl;
          console.log('✅ Using uploaded image:', coverImageUrl);
        } else {
          console.warn('⚠️ Upload failed, using default image');
          // Use category-specific default image
          const category = articleData.category_name || 'Puisi';
          const defaultImages: Record<string, string> = {
            'Puisi': '/cover/puisi.jpg',
            'Novel': '/cover/novel.jpg',
            'Cerpen': '/cover/cerpen.jpg',
            'Opini': '/cover/opini.jpg',
            'Desain Grafis': '/cover/desain.jpg',
            'Coding Project': '/cover/coding.jpg',
            'Cerita Bergambar': '/cover/cergam.jpg',
            'Pantun': '/cover/pantun.jpg'
          };
          coverImageUrl = defaultImages[category] || '/cover/default.jpg';
        }
      } else if (articleData.cover_image && articleData.cover_image !== '') {
        coverImageUrl = articleData.cover_image;
        console.log('🔗 Using provided cover image:', coverImageUrl);
      }

      // Calculate read time
      const calculateReadTime = (text: string): number => {
        const words = text.trim().split(/\s+/).length;
        return Math.max(1, Math.ceil(words / 200));
      };

      // Prepare article data
      const articlePayload = {
        title: articleData.title || '',
        content: articleData.content || '',
        excerpt: articleData.excerpt || (articleData.content ? articleData.content.substring(0, 150) + '...' : ''),
        category_name: articleData.category_name || '',
        author_name: articleData.author_name || user.username || '',
        cover_image: coverImageUrl,
        tags: articleData.tags || '',
        status: user.role === 'admin' ? 'published' : 'pending',
        featured: false,
        read_time: calculateReadTime(articleData.content || '')
      };

      console.log('📦 Article payload:', articlePayload);
      console.log('📤 Sending to API...');

      const response = await fetch(`${API_URL}/articles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${savedUser}`
        },
        body: JSON.stringify(articlePayload)
      });

      console.log('📥 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || `API Error: ${response.status}`);
        } catch {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      console.log('📥 API Response:', data);

      if (data.success) {
        console.log('✅ Article created successfully:', data.data?.id);
        
        // Refresh articles list
        await fetchArticles();
        
        // If user is admin, refresh admin articles
        if (user.role === 'admin') {
          await fetchPendingArticles();
          await fetchAdminArticles();
        }
        
        return true;
      } else {
        console.error('❌ API returned error:', data.message);
        throw new Error(data.message || 'Failed to create article');
      }
    } catch (error: any) {
      console.error('❌ Create article error:', error);
      console.error('❌ Error stack:', error.stack);
      
      alert(`Gagal membuat artikel: ${error.message}`);
      return false;
    }
  };

  // ==================== FETCH ARTICLES ====================
  const fetchArticles = async (newFilters?: Partial<typeof filters>) => {
    try {
      const finalFilters = { ...filters, ...newFilters, page: newFilters?.page || 1 };
      
      console.log('📡 [FETCH ARTICLES] Fetching...');
      console.log('🔗 API URL:', API_URL);
      console.log('🔧 Filters:', finalFilters);
      
      if (newFilters?.search !== undefined) {
        setSearchLoading(true);
      } else {
        setLoading(true);
      }

      const queryParams = new URLSearchParams();
      
      // Map category slug to category name
      let categoryName = '';
      if (finalFilters.category && finalFilters.category !== 'all') {
        const foundCategory = DEFAULT_CATEGORIES.find(c => c.slug === finalFilters.category);
        if (foundCategory) {
          categoryName = foundCategory.name;
          queryParams.append('category', categoryName);
        }
      }
      
      if (finalFilters.search) {
        queryParams.append('search', finalFilters.search);
      }
      if (finalFilters.sort) {
        queryParams.append('sort', finalFilters.sort);
      }
      
      queryParams.append('page', finalFilters.page.toString());
      queryParams.append('limit', finalFilters.limit.toString());
      
      const url = `${API_URL}/articles?${queryParams.toString()}`;
      console.log('🌐 Fetching URL:', url);
      
      const response = await fetch(url, {
        cache: 'no-store' // Don't cache for fresh data
      });
      
      console.log('📥 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📥 Response data count:', data.data?.length || 0);

      if (data.success && Array.isArray(data.data)) {
        const loadedArticles = data.data;
        console.log(`✅ Loaded ${loadedArticles.length} articles`);
        
        setArticles(loadedArticles);
        setFilteredArticles(loadedArticles);
        setFilters(finalFilters);
        
        // Update category counts
        updateCategoryCounts(loadedArticles);
      } else {
        console.warn('⚠️ No articles found or invalid response format');
        console.warn('Response:', data);
        setArticles([]);
        setFilteredArticles([]);
      }
    } catch (error: any) {
      console.error('❌ Error fetching articles:', error);
      console.error('❌ Error stack:', error.stack);
      
      // Fallback: Show empty state
      setArticles([]);
      setFilteredArticles([]);
      
      // Only show error in development
      if (process.env.NODE_ENV === 'development') {
        alert(`Error fetching articles: ${error.message}`);
      }
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  // ==================== FETCH ADMIN ARTICLES ====================
  const fetchAdminArticles = async (status?: string) => {
    try {
      console.log('👑 [FETCH ADMIN ARTICLES] Starting...');
      
      const savedUser = localStorage.getItem('seija_user');
      if (!savedUser) {
        console.error('❌ No user found in localStorage');
        return;
      }

      const user = JSON.parse(savedUser);
      console.log('👤 User role:', user.role);
      
      if (user.role !== 'admin') {
        console.warn('⚠️ Non-admin trying to access admin articles');
        return;
      }

      setAdminLoading(true);

      let url = `${API_URL}/admin/articles`;
      if (status && status !== 'all') {
        url += `?status=${status}`;
      }

      console.log('🌐 Fetching URL:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${savedUser}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📥 Response data count:', data.data?.length || 0);

      if (data.success && Array.isArray(data.data)) {
        console.log(`✅ Loaded ${data.data.length} admin articles`);
        setAdminArticles(data.data);
      } else {
        console.warn('⚠️ No admin articles found');
        setAdminArticles([]);
      }
    } catch (error: any) {
      console.error('❌ Error fetching admin articles:', error);
      console.error('❌ Error stack:', error.stack);
      setAdminArticles([]);
    } finally {
      setAdminLoading(false);
    }
  };

  // ==================== FETCH PENDING ARTICLES ====================
  const fetchPendingArticles = async () => {
    try {
      console.log('👑 [FETCH PENDING ARTICLES] Starting...');
      
      const savedUser = localStorage.getItem('seija_user');
      if (!savedUser) {
        console.error('❌ No user found in localStorage');
        return;
      }

      const user = JSON.parse(savedUser);
      console.log('👤 User role:', user.role);
      
      if (user.role !== 'admin') {
        console.warn('⚠️ Non-admin trying to access pending articles');
        return;
      }

      setAdminLoading(true);

      const url = `${API_URL}/admin/articles/pending`;
      console.log('🌐 Fetching URL:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${savedUser}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📥 Response data count:', data.data?.length || 0);

      if (data.success) {
        if (Array.isArray(data.data)) {
          console.log(`✅ Loaded ${data.data.length} pending articles`);
          setPendingArticles(data.data);
        } else {
          console.warn('⚠️ Data is not an array:', data.data);
          setPendingArticles([]);
        }
      } else {
        console.warn('⚠️ API error:', data.message);
        setPendingArticles([]);
      }
    } catch (error: any) {
      console.error('❌ Error fetching pending articles:', error);
      console.error('❌ Error stack:', error.stack);
      setPendingArticles([]);
    } finally {
      setAdminLoading(false);
    }
  };

  // ==================== UPDATE ARTICLE STATUS ====================
  const updateArticleStatus = async (articleId: string, status: string): Promise<boolean> => {
    try {
      console.log(`👑 [UPDATE ARTICLE STATUS] Updating ${articleId} to ${status}`);
      
      const savedUser = localStorage.getItem('seija_user');
      if (!savedUser) {
        alert('Silakan login terlebih dahulu');
        return false;
      }

      const user = JSON.parse(savedUser);
      if (user.role !== 'admin') {
        alert('Hanya admin yang bisa mengubah status artikel');
        return false;
      }

      const response = await fetch(`${API_URL}/admin/articles/${articleId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${savedUser}`
        },
        body: JSON.stringify({ status })
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📥 Response:', data);

      if (data.success) {
        console.log(`✅ Status updated successfully: ${data.message}`);
        
        // Refresh all data
        await fetchArticles();
        await fetchAdminArticles();
        await fetchPendingArticles();
        
        return true;
      } else {
        console.error('❌ API error:', data.message);
        alert(`Gagal mengubah status: ${data.message}`);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Error updating article status:', error);
      console.error('❌ Error stack:', error.stack);
      alert(`Terjadi kesalahan: ${error.message}`);
      return false;
    }
  };

  // ==================== BATCH UPDATE STATUS ====================
  const batchUpdateStatus = async (articleIds: string[], status: string): Promise<boolean> => {
    try {
      console.log(`👑 [BATCH UPDATE] Updating ${articleIds.length} articles to ${status}`);
      
      const savedUser = localStorage.getItem('seija_user');
      if (!savedUser) {
        alert('Silakan login terlebih dahulu');
        return false;
      }

      const user = JSON.parse(savedUser);
      if (user.role !== 'admin') {
        alert('Hanya admin yang bisa melakukan batch update');
        return false;
      }

      const response = await fetch(`${API_URL}/admin/articles/batch-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${savedUser}`
        },
        body: JSON.stringify({ articleIds, status })
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📥 Response:', data);

      if (data.success) {
        console.log(`✅ Batch update successful: ${data.message}`);
        
        // Refresh all data
        await fetchArticles();
        await fetchAdminArticles();
        await fetchPendingArticles();
        
        return true;
      } else {
        console.error('❌ API error:', data.message);
        alert(`Gagal batch update: ${data.message}`);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Error in batch update:', error);
      console.error('❌ Error stack:', error.stack);
      alert(`Terjadi kesalahan: ${error.message}`);
      return false;
    }
  };

  // ==================== HELPER FUNCTIONS ====================
  const updateCategoryCounts = (articles: Article[]) => {
    const categoryCounts: { [key: string]: number } = {
      'all': articles.length,
      'novel': articles.filter(a => a.category_name?.toLowerCase() === 'novel').length,
      'cerpen': articles.filter(a => a.category_name?.toLowerCase() === 'cerpen').length,
      'puisi': articles.filter(a => a.category_name?.toLowerCase() === 'puisi').length,
      'opini': articles.filter(a => a.category_name?.toLowerCase() === 'opini').length,
      'desain-grafis': articles.filter(a => a.category_name?.toLowerCase() === 'desain grafis').length,
      'coding-project': articles.filter(a => a.category_name?.toLowerCase() === 'coding project').length,
      'cerita-bergambar': articles.filter(a => a.category_name?.toLowerCase() === 'cerita bergambar').length,
      'pantun': articles.filter(a => a.category_name?.toLowerCase() === 'pantun').length,
    };

    const updatedCategories = DEFAULT_CATEGORIES.map(cat => ({
      ...cat,
      article_count: categoryCounts[cat.slug] || 0
    }));

    setCategories(updatedCategories);
  };

  // ==================== FETCH SINGLE ARTICLE ====================
  const fetchArticle = async (id: string): Promise<Article | null> => {
    try {
      setLoading(true);
      console.log(`📡 [FETCH ARTICLE] Fetching article ${id}`);
      console.log(`🔗 URL: ${API_URL}/articles/${id}`);
      
      const response = await fetch(`${API_URL}/articles/${id}`);
      
      console.log('📥 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📥 Response data:', data);

      if (data.success && data.data) {
        console.log(`✅ Loaded article: ${data.data.title}`);
        setCurrentArticle(data.data);
        return data.data;
      } else {
        console.error(`❌ Article not found`);
        setCurrentArticle(null);
        return null;
      }
    } catch (error: any) {
      console.error(`❌ Error fetching article:`, error);
      console.error('❌ Error stack:', error.stack);
      setCurrentArticle(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ==================== FETCH CATEGORIES ====================
  const fetchCategories = async () => {
    try {
      console.log('📡 [FETCH CATEGORIES] Fetching...');
      console.log(`🔗 URL: ${API_URL}/categories`);
      
      const response = await fetch(`${API_URL}/categories`);
      
      console.log('📥 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📥 Response data count:', data.data?.length || 0);

      if (data.success && Array.isArray(data.data)) {
        console.log('✅ Loaded', data.data.length, 'categories');
        const formattedCategories = data.data.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          article_count: 0
        }));
        setCategories(formattedCategories);
      }
    } catch (error: any) {
      console.error('❌ Error fetching categories:', error);
      console.error('❌ Error stack:', error.stack);
    }
  };

  // ==================== LIKE ARTICLE ====================
  const likeArticle = async (articleId: string): Promise<boolean> => {
    try {
      const savedUser = localStorage.getItem('seija_user');
      if (!savedUser) {
        alert('Silakan login untuk menyukai artikel');
        return false;
      }

      console.log(`❤️ [LIKE ARTICLE] Liking article ${articleId}`);
      
      const response = await fetch(`${API_URL}/articles/${articleId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${savedUser}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📥 Response:', data);

      if (data.success) {
        console.log(`✅ Like successful, liked: ${data.liked}`);
        
        // Update local state
        const updateArticleLikes = (article: Article) => {
          return {
            ...article,
            like_count: article.id === articleId 
              ? (data.liked ? article.like_count + 1 : Math.max(0, article.like_count - 1))
              : article.like_count
          };
        };

        setArticles(prev => prev.map(updateArticleLikes));
        setFilteredArticles(prev => prev.map(updateArticleLikes));

        if (currentArticle?.id === articleId) {
          setCurrentArticle(prev => {
            if (!prev) return null;
            return updateArticleLikes(prev);
          });
        }

        return true;
      }
      return false;
    } catch (error: any) {
      console.error('❌ Error liking article:', error);
      console.error('❌ Error stack:', error.stack);
      return false;
    }
  };

  // ==================== COMMENTS ====================
  const fetchComments = async (articleId: string) => {
    try {
      console.log(`💬 [FETCH COMMENTS] Fetching comments for article ${articleId}`);
      
      const response = await fetch(`${API_URL}/articles/${articleId}/comments`);
      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📥 Response data count:', data.data?.length || 0);

      if (data.success) {
        const comments = data.data || [];
        const commentMap = new Map();
        const rootComments: Comment[] = [];

        comments.forEach((comment: Comment) => {
          commentMap.set(comment.id, { ...comment, replies: [] });
        });

        comments.forEach((comment: Comment) => {
          if (comment.parent_id) {
            const parent = commentMap.get(comment.parent_id);
            if (parent) {
              parent.replies.push(commentMap.get(comment.id));
            }
          } else {
            rootComments.push(commentMap.get(comment.id));
          }
        });

        setArticleComments(rootComments);
        console.log(`✅ Loaded ${rootComments.length} root comments`);
      }
    } catch (error: any) {
      console.error('❌ Error fetching comments:', error);
      console.error('❌ Error stack:', error.stack);
    }
  };

  const addComment = async (articleId: string, content: string, parentId?: string): Promise<boolean> => {
    try {
      const savedUser = localStorage.getItem('seija_user');
      if (!savedUser) {
        alert('Silakan login untuk berkomentar');
        return false;
      }

      console.log(`💬 [ADD COMMENT] Adding comment to article ${articleId}`);
      
      const response = await fetch(`${API_URL}/articles/${articleId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${savedUser}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, parent_id: parentId }),
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📥 Response:', data);

      if (data.success) {
        console.log('✅ Comment added successfully');
        
        // Refresh comments
        await fetchComments(articleId);
        
        // Update comment count
        const updateCommentCount = (article: Article) => {
          if (article.id === articleId) {
            return { ...article, comment_count: article.comment_count + 1 };
          }
          return article;
        };

        setArticles(prev => prev.map(updateCommentCount));
        setFilteredArticles(prev => prev.map(updateCommentCount));

        if (currentArticle?.id === articleId) {
          setCurrentArticle(prev => {
            if (!prev) return null;
            return updateCommentCount(prev);
          });
        }

        return true;
      }
      return false;
    } catch (error: any) {
      console.error('❌ Error adding comment:', error);
      console.error('❌ Error stack:', error.stack);
      return false;
    }
  };

  // ==================== UPDATE ARTICLE ====================
  const updateArticle = async (articleId: string, updates: any): Promise<boolean> => {
    try {
      console.log(`✏️ [UPDATE ARTICLE] Updating article ${articleId}`);
      
      const savedUser = localStorage.getItem('seija_user');
      if (!savedUser) {
        alert('Silakan login terlebih dahulu');
        return false;
      }

      console.log('📦 Updates:', updates);

      const response = await fetch(`${API_URL}/articles/${articleId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${savedUser}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📥 Response:', data);

      if (data.success) {
        console.log('✅ Article updated successfully');
        await fetchArticles();
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('❌ Error updating article:', error);
      console.error('❌ Error stack:', error.stack);
      return false;
    }
  };

  // ==================== DELETE ARTICLE ====================
  const deleteArticle = async (articleId: string): Promise<boolean> => {
    try {
      console.log(`🗑️ [DELETE ARTICLE] Deleting article ${articleId}`);
      
      const savedUser = localStorage.getItem('seija_user');
      if (!savedUser) {
        alert('Silakan login terlebih dahulu');
        return false;
      }

      const response = await fetch(`${API_URL}/articles/${articleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${savedUser}`,
        },
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📥 Response:', data);

      if (data.success) {
        console.log('✅ Article deleted successfully');
        
        // Refresh all data
        await fetchArticles();
        await fetchAdminArticles();
        await fetchPendingArticles();
        
        return true;
      }
      console.error('❌ Delete failed:', data.message);
      return false;
    } catch (error: any) {
      console.error('❌ Error deleting article:', error);
      console.error('❌ Error stack:', error.stack);
      return false;
    }
  };

  // ==================== FILTER FUNCTIONS ====================
  const updateFilters = (newFilters: Partial<typeof filters>) => {
    console.log('🔧 [UPDATE FILTERS] New filters:', newFilters);
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    console.log('🧹 [CLEAR FILTERS] Clearing all filters');
    setFilters({
      search: '',
      category: 'all',
      sort: 'newest',
      page: 1,
      limit: 12
    });
  };

  // ==================== INITIALIZATION ====================
  useEffect(() => {
    console.log('🚀 [ARTICLE CONTEXT] Initializing...');
    console.log('🔗 API_URL:', API_URL);
    console.log('🏭 NODE_ENV:', process.env.NODE_ENV);
    console.log('📡 NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
    console.log('🌐 Current host:', typeof window !== 'undefined' ? window.location.hostname : 'SSR');
    
    const loadInitialData = async () => {
      console.log('📦 Loading initial data...');
      await fetchArticles();
      await fetchCategories();
      
      const savedUser = localStorage.getItem('seija_user');
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          console.log('👤 Current user role:', user.role);
          
          if (user.role === 'admin') {
            console.log('👑 Loading admin data...');
            await fetchPendingArticles();
            await fetchAdminArticles();
          }
        } catch (error) {
          console.error('❌ Error parsing user data:', error);
        }
      }
      
      console.log('✅ Initial data loaded');
    };

    loadInitialData();
  }, []);

  // Fetch articles when filters change
  useEffect(() => {
    const fetchWithFilters = async () => {
      if (!loading) {
        console.log('🔄 [FILTER CHANGE] Fetching articles with new filters...');
        await fetchArticles();
      }
    };

    fetchWithFilters();
  }, [filters.search, filters.category, filters.sort, filters.page]);

  // ==================== CONTEXT VALUE ====================
  const value: ArticleContextType = {
    articles,
    filteredArticles,
    categories,
    currentArticle,
    articleComments,
    loading,
    searchLoading,
    
    adminArticles,
    pendingArticles,
    adminLoading,
    
    filters,
    fetchArticles,
    fetchArticle,
    fetchCategories,
    likeArticle,
    addComment,
    fetchComments,
    createArticle,
    updateArticle,
    deleteArticle,
    
    fetchAdminArticles,
    fetchPendingArticles,
    updateArticleStatus,
    batchUpdateStatus,
    
    updateFilters,
    clearFilters,
  };

  return (
    <ArticleContext.Provider value={value}>
      {children}
    </ArticleContext.Provider>
  );
}

export function useArticles() {
  const context = useContext(ArticleContext);
  if (context === undefined) {
    throw new Error('useArticles must be used within an ArticleProvider');
  }
  return context;
}