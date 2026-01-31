// contexts/ArticleContext.tsx - COMPLETE FIXED VERSION
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
  
  // Admin specific
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
  
  // Admin functions - FIXED
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
  
  // Admin states
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

  const API_URL = 'http://localhost:3002/api';

  // ==================== UPLOAD FUNCTION ====================
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      console.log('📤 [UPLOAD IMAGE] Uploading:', file.name);
      
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch(`${API_URL}/upload/image`, {
        method: 'POST',
        body: formData,
      });
      
      console.log('📤 [UPLOAD IMAGE] Response status:', response.status);
      
      const data = await response.json();
      console.log('📤 [UPLOAD IMAGE] Response data:', data);
      
      if (data.success && data.url) {
        console.log('✅ [UPLOAD IMAGE] Success! URL:', data.url);
        return data.url;
      } else {
        console.error('❌ [UPLOAD IMAGE] Failed:', data.message);
        alert('Gagal mengupload gambar: ' + (data.message || 'Unknown error'));
        return null;
      }
    } catch (error: any) {
      console.error('❌ [UPLOAD IMAGE] Error:', error);
      alert('Gagal mengupload gambar: ' + error.message);
      return null;
    }
  };

  // ==================== CREATE ARTICLE ====================
  const createArticle = async (articleData: any): Promise<boolean> => {
    try {
      console.log('📝 [CREATE ARTICLE] Starting...');
      
      const savedUser = localStorage.getItem('seija_user');
      if (!savedUser) {
        alert('Silakan login terlebih dahulu');
        return false;
      }

      const user = JSON.parse(savedUser);
      console.log('📝 [CREATE ARTICLE] User:', user.username);

      // UPLOAD GAMBAR JIKA ADA
      let coverImageUrl = '/cover/default.jpg';
      
      if (articleData.imageFile && articleData.imageFile instanceof File) {
        console.log('🖼️ [CREATE ARTICLE] Found image file, uploading...');
        
        const uploadedUrl = await uploadImage(articleData.imageFile);
        if (uploadedUrl) {
          coverImageUrl = uploadedUrl;
          console.log('✅ [CREATE ARTICLE] Using uploaded image:', coverImageUrl);
        } else {
          console.warn('⚠️ [CREATE ARTICLE] Upload failed, using default image');
        }
      } 
      else if (articleData.cover_image && articleData.cover_image !== '' && articleData.cover_image !== '/cover/default.jpg') {
        coverImageUrl = articleData.cover_image;
        console.log('🔗 [CREATE ARTICLE] Using provided image URL:', coverImageUrl);
      }

      // BUAT READ TIME
      const calculateReadTime = (text: string): number => {
        const words = text.trim().split(/\s+/).length;
        return Math.max(1, Math.ceil(words / 200));
      };

      const formattedData = {
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

      console.log('📤 [CREATE ARTICLE] Sending to API...');

      const response = await fetch(`${API_URL}/articles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${savedUser}`
        },
        body: JSON.stringify(formattedData)
      });

      const data = await response.json();
      console.log('📤 [CREATE ARTICLE] API Response:', data);

      if (data.success) {
        console.log('✅ [CREATE ARTICLE] Article created successfully');
        await fetchArticles();
        await fetchPendingArticles(); // Refresh pending list
        return true;
      } else {
        console.error('❌ [CREATE ARTICLE] API Error:', data.message);
        alert(`Gagal membuat artikel: ${data.message}`);
        return false;
      }
    } catch (error: any) {
      console.error('❌ [CREATE ARTICLE] Error:', error);
      alert(`Terjadi kesalahan: ${error.message}`);
      return false;
    }
  };

  // ==================== FETCH ARTICLES (PUBLIC) ====================
  const fetchArticles = async (newFilters?: Partial<typeof filters>) => {
    try {
      const finalFilters = { ...filters, ...newFilters, page: newFilters?.page || 1 };
      
      console.log('📡 [FETCH ARTICLES] Starting fetch...');
      
      if (newFilters?.search !== undefined) {
        setSearchLoading(true);
      } else {
        setLoading(true);
      }

      const queryParams = new URLSearchParams();
      
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
      console.log('📡 [FETCH ARTICLES] API URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        const loadedArticles = data.data;
        console.log(`✅ [FETCH ARTICLES] Loaded ${loadedArticles.length} articles`);
        
        setArticles(loadedArticles);
        setFilteredArticles(loadedArticles);
        setFilters(finalFilters);
        
        updateCategoryCounts(loadedArticles);
      } else {
        console.warn('⚠️ [FETCH ARTICLES] No articles found');
        setArticles([]);
        setFilteredArticles([]);
      }
    } catch (error) {
      console.error('❌ [FETCH ARTICLES] Error:', error);
      setArticles([]);
      setFilteredArticles([]);
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  // ==================== ADMIN FUNCTIONS ====================
  const fetchAdminArticles = async (status?: string) => {
    try {
      const savedUser = localStorage.getItem('seija_user');
      if (!savedUser) {
        console.error('❌ [FETCH ADMIN ARTICLES] No user found in localStorage');
        return;
      }

      const user = JSON.parse(savedUser);
      console.log('👑 [FETCH ADMIN ARTICLES] User role:', user.role);
      
      if (user.role !== 'admin') {
        console.warn('⚠️ [FETCH ADMIN ARTICLES] Non-admin trying to access admin articles');
        return;
      }

      setAdminLoading(true);
      console.log('👑 [FETCH ADMIN ARTICLES] Starting...');

      let url = `${API_URL}/admin/articles`;
      if (status && status !== 'all') {
        url += `?status=${status}`;
      }

      console.log('👑 [FETCH ADMIN ARTICLES] URL:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${savedUser}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('👑 [FETCH ADMIN ARTICLES] Response status:', response.status);

      const data = await response.json();
      console.log('👑 [FETCH ADMIN ARTICLES] Response data:', data);

      if (data.success && Array.isArray(data.data)) {
        console.log(`✅ [FETCH ADMIN ARTICLES] Loaded ${data.data.length} articles`);
        setAdminArticles(data.data);
      } else {
        console.warn('⚠️ [FETCH ADMIN ARTICLES] No articles found or API error');
        console.warn('⚠️ [FETCH ADMIN ARTICLES] API message:', data.message);
        setAdminArticles([]);
      }
    } catch (error: any) {
      console.error('❌ [FETCH ADMIN ARTICLES] Error:', error.message);
      setAdminArticles([]);
    } finally {
      setAdminLoading(false);
    }
  };

  // ==================== FETCH PENDING ARTICLES - FIXED VERSION ====================
  const fetchPendingArticles = async () => {
    try {
      const savedUser = localStorage.getItem('seija_user');
      if (!savedUser) {
        console.error('❌ [FETCH PENDING] No user found in localStorage');
        return;
      }

      const user = JSON.parse(savedUser);
      console.log('👑 [FETCH PENDING] User role:', user.role);
      
      // Cek role dulu sebelum fetch
      if (user.role !== 'admin') {
        console.warn('⚠️ [FETCH PENDING] Non-admin trying to access pending articles');
        return;
      }

      setAdminLoading(true);
      console.log('👑 [FETCH PENDING] Starting...');

      const url = `${API_URL}/admin/articles/pending`;
      console.log('👑 [FETCH PENDING] URL:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${savedUser}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('👑 [FETCH PENDING] Response status:', response.status);

      const data = await response.json();
      console.log('👑 [FETCH PENDING] Response data:', data);

      if (data.success) {
        if (Array.isArray(data.data)) {
          console.log(`✅ [FETCH PENDING] Loaded ${data.data.length} pending articles`);
          setPendingArticles(data.data);
        } else {
          console.warn('⚠️ [FETCH PENDING] Data is not an array:', data.data);
          setPendingArticles([]);
        }
      } else {
        console.warn('⚠️ [FETCH PENDING] API error:', data.message);
        setPendingArticles([]);
      }
    } catch (error: any) {
      console.error('❌ [FETCH PENDING] Error:', error.message);
      setPendingArticles([]);
    } finally {
      setAdminLoading(false);
    }
  };

  const updateArticleStatus = async (articleId: string, status: string): Promise<boolean> => {
    try {
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

      console.log(`👑 [UPDATE ARTICLE STATUS] Updating ${articleId} to ${status}`);

      const response = await fetch(`${API_URL}/admin/articles/${articleId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${savedUser}`
        },
        body: JSON.stringify({ status })
      });

      const data = await response.json();

      if (data.success) {
        console.log(`✅ [UPDATE ARTICLE STATUS] Success: ${data.message}`);
        
        // Update local state
        await fetchArticles();
        await fetchAdminArticles();
        await fetchPendingArticles();
        
        return true;
      } else {
        console.error('❌ [UPDATE ARTICLE STATUS] Failed:', data.message);
        alert(`Gagal mengubah status: ${data.message}`);
        return false;
      }
    } catch (error: any) {
      console.error('❌ [UPDATE ARTICLE STATUS] Error:', error);
      alert(`Terjadi kesalahan: ${error.message}`);
      return false;
    }
  };

  const batchUpdateStatus = async (articleIds: string[], status: string): Promise<boolean> => {
    try {
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

      console.log(`👑 [BATCH UPDATE STATUS] Updating ${articleIds.length} articles to ${status}`);

      const response = await fetch(`${API_URL}/admin/articles/batch-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${savedUser}`
        },
        body: JSON.stringify({ articleIds, status })
      });

      const data = await response.json();

      if (data.success) {
        console.log(`✅ [BATCH UPDATE STATUS] Success: ${data.message}`);
        
        // Update local state
        await fetchArticles();
        await fetchAdminArticles();
        await fetchPendingArticles();
        
        return true;
      } else {
        console.error('❌ [BATCH UPDATE STATUS] Failed:', data.message);
        alert(`Gagal batch update: ${data.message}`);
        return false;
      }
    } catch (error: any) {
      console.error('❌ [BATCH UPDATE STATUS] Error:', error);
      alert(`Terjadi kesalahan: ${error.message}`);
      return false;
    }
  };

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

  const fetchArticle = async (id: string): Promise<Article | null> => {
    try {
      setLoading(true);
      console.log(`📡 [FETCH ARTICLE] Fetching article ${id}`);
      
      const response = await fetch(`${API_URL}/articles/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success && data.data) {
        console.log(`✅ [FETCH ARTICLE] Loaded:`, data.data.title);
        setCurrentArticle(data.data);
        return data.data;
      } else {
        console.error(`❌ [FETCH ARTICLE] Article not found`);
        setCurrentArticle(null);
        return null;
      }
    } catch (error) {
      console.error(`❌ [FETCH ARTICLE] Error:`, error);
      setCurrentArticle(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      console.log('📡 [FETCH CATEGORIES] Fetching categories');
      const response = await fetch(`${API_URL}/categories`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        console.log('✅ [FETCH CATEGORIES] Loaded', data.data.length, 'categories');
        const formattedCategories = data.data.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          article_count: 0
        }));
        setCategories(formattedCategories);
      }
    } catch (error) {
      console.error('❌ [FETCH CATEGORIES] Error:', error);
    }
  };

  const likeArticle = async (articleId: string): Promise<boolean> => {
    try {
      const savedUser = localStorage.getItem('seija_user');
      if (!savedUser) {
        alert('Please login to like articles');
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

      const data = await response.json();

      if (data.success) {
        console.log(`✅ [LIKE ARTICLE] Success, liked: ${data.liked}`);
        
        // Fungsi untuk update like count
        const updateArticleLikes = (article: Article) => {
          return {
            ...article,
            like_count: article.id === articleId 
              ? (data.liked ? article.like_count + 1 : Math.max(0, article.like_count - 1))
              : article.like_count
          };
        };

        // Update articles dan filteredArticles
        setArticles(prev => prev.map(updateArticleLikes));
        setFilteredArticles(prev => prev.map(updateArticleLikes));

        // Update currentArticle - PERBAIKAN DI SINI
        if (currentArticle?.id === articleId) {
          setCurrentArticle(prev => {
            if (!prev) return null;
            return updateArticleLikes(prev);
          });
        }

        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ [LIKE ARTICLE] Error:', error);
      return false;
    }
  };

  const fetchComments = async (articleId: string) => {
    try {
      console.log(`💬 [FETCH COMMENTS] Fetching comments for article ${articleId}`);
      
      const response = await fetch(`${API_URL}/articles/${articleId}/comments`);
      const data = await response.json();

      if (data.success) {
        const comments = data.data;
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
        console.log(`✅ [FETCH COMMENTS] Loaded ${rootComments.length} root comments`);
      }
    } catch (error) {
      console.error('❌ [FETCH COMMENTS] Error:', error);
    }
  };

  const addComment = async (articleId: string, content: string, parentId?: string): Promise<boolean> => {
    try {
      const savedUser = localStorage.getItem('seija_user');
      if (!savedUser) {
        alert('Please login to comment');
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

      const data = await response.json();

      if (data.success) {
        console.log('✅ [ADD COMMENT] Comment added successfully');
        
        await fetchComments(articleId);
        
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
    } catch (error) {
      console.error('❌ [ADD COMMENT] Error:', error);
      return false;
    }
  };

  const updateArticle = async (articleId: string, updates: any): Promise<boolean> => {
    try {
      const savedUser = localStorage.getItem('seija_user');
      console.log(`✏️ [UPDATE ARTICLE] Updating article ${articleId}`);
      
      const response = await fetch(`${API_URL}/articles/${articleId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${savedUser}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ [UPDATE ARTICLE] Article updated successfully');
        await fetchArticles();
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ [UPDATE ARTICLE] Error:', error);
      return false;
    }
  };

  const deleteArticle = async (articleId: string): Promise<boolean> => {
    try {
      const savedUser = localStorage.getItem('seija_user');
      console.log(`🗑️ [DELETE ARTICLE] Deleting article ${articleId}`);
      
      const response = await fetch(`${API_URL}/articles/${articleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${savedUser}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ [DELETE ARTICLE] Article deleted successfully');
        await fetchArticles();
        await fetchAdminArticles();
        await fetchPendingArticles();
        return true;
      }
      console.error('❌ [DELETE ARTICLE] Failed:', data.message);
      return false;
    } catch (error) {
      console.error('❌ [DELETE ARTICLE] Error:', error);
      return false;
    }
  };

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

  // ==================== INITIAL LOAD ====================
  useEffect(() => {
    const loadInitialData = async () => {
      console.log('🚀 [INIT] Loading initial data...');
      await fetchArticles();
      await fetchCategories();
      
      // Check if user is admin and load admin data
      const savedUser = localStorage.getItem('seija_user');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        console.log('👤 [INIT] Current user role:', user.role);
        
        if (user.role === 'admin') {
          console.log('👑 [INIT] Loading admin data...');
          await fetchPendingArticles();
          await fetchAdminArticles();
        }
      }
      
      console.log('✅ [INIT] Initial data loaded');
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const fetchWithFilters = async () => {
      if (!loading) {
        console.log('🔄 [FILTER CHANGE] Filters changed, fetching articles...');
        await fetchArticles();
      }
    };

    fetchWithFilters();
  }, [filters.search, filters.category, filters.sort, filters.page]);

  const value: ArticleContextType = {
    articles,
    filteredArticles,
    categories,
    currentArticle,
    articleComments,
    loading,
    searchLoading,
    
    // Admin specific
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
    
    // Admin functions
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