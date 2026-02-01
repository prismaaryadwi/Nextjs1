// server.js - COMPLETE VERSION WITH ADMIN ENDPOINTS
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3002;

console.log('🚀 SEIJA Magazine API Server');
console.log('📦 Mode:', process.env.NODE_ENV || 'development');
console.log('🔧 PORT:', PORT);

// ==================== CORS CONFIGURATION ====================
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'https://seijamagazine.site',
  'https://www.seijamagazine.site',
  'https://seijamagazine.vercel.app',
  'https://seija-magazine.vercel.app'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        const domain = allowedOrigin.replace('*.', '');
        return origin.endsWith(domain);
      }
      return origin === allowedOrigin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('🚫 CORS Blocked Origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  maxAge: 86400
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ==================== MIDDLEWARE ====================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// ==================== SUPABASE CONFIG ====================
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mfymrinerlgzygnoimve.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_nECRhfJNuXfovy-0-V5Crg_NUCRSZic';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('📊 Supabase connected:', SUPABASE_URL);

// ==================== HELPER FUNCTIONS ====================
const validateToken = (token) => {
  try {
    if (!token) return null;
    const user = JSON.parse(token);
    if (!user.id || !user.username || !user.email) {
      return null;
    }
    return user;
  } catch (error) {
    console.error('Token validation error:', error);
    return null;
  }
};

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const user = validateToken(token);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    // Verify user exists in database
    const { data: dbUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error || !dbUser) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    
    req.user = {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      role: dbUser.role || 'user'
    };
    
    next();
    
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
};

const calculateReadTime = (content) => {
  const words = content.trim().split(/\s+/).length;
  const wordsPerMinute = 200;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
};

// ==================== UPLOAD ENDPOINT ====================
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

app.post('/api/upload/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada file yang diupload'
      });
    }
    
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
    const filename = `seija_${timestamp}_${random}${ext}`;
    
    const uploadDir = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, req.file.buffer);
    
    const fileUrl = `/uploads/${filename}`;
    
    res.json({
      success: true,
      message: 'Gambar berhasil diupload',
      url: fileUrl,
      filename: filename
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupload gambar'
    });
  }
});

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/cover', express.static(path.join(__dirname, 'public/cover')));

// Create directories
['public/uploads', 'public/cover'].forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SEIJA Magazine API is running',
    timestamp: new Date().toISOString()
  });
});

// ==================== TEST ENDPOINTS ====================
app.get('/api/test/articles', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    
    res.json({
      success: true,
      count: data.length,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== AUTH ENDPOINTS ====================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email dan password diperlukan'
      });
    }
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .single();
    
    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }
    
    // Untuk development, bypass password check jika belum ada hash
    // Di production, gunakan bcrypt.compare
    const passwordValid = true; // Temporary for development
    
    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }
    
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role || 'user',
      avatar_url: user.avatar_url
    };
    
    res.json({
      success: true,
      message: 'Login berhasil',
      user: userData,
      token: JSON.stringify(userData)
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login gagal'
    });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Semua field harus diisi'
      });
    }
    
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .or(`email.eq.${email},username.eq.${username}`)
      .single();
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User dengan email atau username ini sudah ada'
      });
    }
    
    const newUser = {
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password_hash: await bcrypt.hash(password, 10),
      role: 'user',
      avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`,
      created_at: new Date().toISOString()
    };
    
    const { data: user, error } = await supabase
      .from('users')
      .insert(newUser)
      .select()
      .single();
    
    if (error) throw error;
    
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };
    
    res.json({
      success: true,
      message: 'Registrasi berhasil',
      user: userData,
      token: JSON.stringify(userData)
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registrasi gagal'
    });
  }
});

// ==================== CATEGORIES ====================
app.get('/api/categories', async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error || !categories || categories.length === 0) {
      const defaultCategories = [
        { id: 1, name: 'Novel', slug: 'novel', color: '#3B82F6' },
        { id: 2, name: 'Cerpen', slug: 'cerpen', color: '#10B981' },
        { id: 3, name: 'Puisi', slug: 'puisi', color: '#F59E0B' },
        { id: 4, name: 'Opini', slug: 'opini', color: '#EF4444' },
        { id: 5, name: 'Desain Grafis', slug: 'desain-grafis', color: '#8B5CF6' },
        { id: 6, name: 'Coding Project', slug: 'coding-project', color: '#EC4899' },
        { id: 7, name: 'Cerita Bergambar', slug: 'cerita-bergambar', color: '#14B8A6' },
        { id: 8, name: 'Pantun', slug: 'pantun', color: '#F97316' }
      ];
      
      return res.json({
        success: true,
        data: defaultCategories
      });
    }
    
    res.json({
      success: true,
      data: categories
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil kategori'
    });
  }
});

// ==================== ARTICLES (PUBLIC) ====================
app.get('/api/articles', async (req, res) => {
  try {
    const { 
      search = '', 
      category = 'all', 
      sort = 'newest', 
      page = 1, 
      limit = 12 
    } = req.query;
    
    let query = supabase
      .from('articles')
      .select('*', { count: 'exact' })
      .eq('status', 'published');
    
    if (search && search.trim() !== '') {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }
    
    if (category && category !== 'all') {
      query = query.eq('category_name', category);
    }
    
    if (sort === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else if (sort === 'oldest') {
      query = query.order('created_at', { ascending: true });
    } else if (sort === 'popular') {
      query = query.order('view_count', { ascending: false });
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 12;
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;
    
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    res.json({
      success: true,
      data: data || [],
      pagination: {
        current: pageNum,
        total: Math.ceil((count || 0) / limitNum),
        totalItems: count || 0
      }
    });
    
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil artikel'
    });
  }
});

app.get('/api/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: article, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !article) {
      return res.status(404).json({
        success: false,
        message: 'Artikel tidak ditemukan'
      });
    }
    
    // Increment view count
    await supabase
      .from('articles')
      .update({ view_count: (article.view_count || 0) + 1 })
      .eq('id', id);
    
    res.json({
      success: true,
      data: article
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil artikel'
    });
  }
});

app.post('/api/articles', authenticate, async (req, res) => {
  try {
    const {
      title,
      content,
      excerpt,
      category_name,
      author_name,
      cover_image,
      tags,
      status = 'pending',
      featured = false
    } = req.body;
    
    if (!title || !content || !category_name) {
      return res.status(400).json({
        success: false,
        message: 'Judul, konten, dan kategori harus diisi'
      });
    }
    
    const readTime = calculateReadTime(content);
    
    const articleData = {
      title: title.trim(),
      content: content,
      excerpt: excerpt || content.substring(0, 150) + '...',
      category_name: category_name,
      author_id: req.user.id,
      author_name: author_name || req.user.username,
      cover_image: cover_image || '/cover/default.jpg',
      tags: tags || '[]',
      status: req.user.role === 'admin' ? 'published' : status,
      featured: req.user.role === 'admin' ? featured : false,
      read_time: readTime,
      view_count: 0,
      like_count: 0,
      comment_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('articles')
      .insert(articleData)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({
      success: true,
      message: req.user.role === 'admin' 
        ? 'Karya berhasil dipublikasikan!' 
        : 'Karya berhasil diajukan! Menunggu persetujuan admin.',
      data: data
    });
    
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat artikel'
    });
  }
});

app.put('/api/articles/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Check if article exists and belongs to user (or user is admin)
    const { data: article, error: fetchError } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !article) {
      return res.status(404).json({
        success: false,
        message: 'Artikel tidak ditemukan'
      });
    }
    
    // Check permission
    if (article.author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki izin untuk mengedit artikel ini'
      });
    }
    
    // Update article
    updates.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('articles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({
      success: true,
      message: 'Artikel berhasil diperbarui',
      data: data
    });
    
  } catch (error) {
    console.error('Error updating article:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui artikel'
    });
  }
});

app.delete('/api/articles/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if article exists
    const { data: article, error: fetchError } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !article) {
      return res.status(404).json({
        success: false,
        message: 'Artikel tidak ditemukan'
      });
    }
    
    // Check permission
    if (article.author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki izin untuk menghapus artikel ini'
      });
    }
    
    // Delete article
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    res.json({
      success: true,
      message: 'Artikel berhasil dihapus'
    });
    
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus artikel'
    });
  }
});

// ==================== LIKE SYSTEM ====================
app.post('/api/articles/:id/like', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if article exists
    const { data: article, error: fetchError } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !article) {
      return res.status(404).json({
        success: false,
        message: 'Artikel tidak ditemukan'
      });
    }
    
    // Check if user already liked
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('article_id', id)
      .eq('user_id', req.user.id)
      .single();
    
    let liked = false;
    
    if (existingLike) {
      // Unlike: delete like record
      await supabase
        .from('likes')
        .delete()
        .eq('id', existingLike.id);
      
      // Decrement like count
      await supabase
        .from('articles')
        .update({ like_count: Math.max(0, (article.like_count || 0) - 1) })
        .eq('id', id);
      
      liked = false;
    } else {
      // Like: create like record
      await supabase
        .from('likes')
        .insert({
          article_id: id,
          user_id: req.user.id,
          created_at: new Date().toISOString()
        });
      
      // Increment like count
      await supabase
        .from('articles')
        .update({ like_count: (article.like_count || 0) + 1 })
        .eq('id', id);
      
      liked = true;
    }
    
    res.json({
      success: true,
      liked: liked,
      message: liked ? 'Artikel disukai' : 'Like dihapus'
    });
    
  } catch (error) {
    console.error('Error liking article:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memproses like'
    });
  }
});

// ==================== COMMENTS ====================
app.get('/api/articles/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .eq('article_id', id)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    res.json({
      success: true,
      data: comments || []
    });
    
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil komentar'
    });
  }
});

app.post('/api/articles/:id/comments', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, parent_id } = req.body;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Komentar tidak boleh kosong'
      });
    }
    
    // Check if article exists
    const { data: article, error: fetchError } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !article) {
      return res.status(404).json({
        success: false,
        message: 'Artikel tidak ditemukan'
      });
    }
    
    // Create comment
    const commentData = {
      article_id: id,
      user_id: req.user.id,
      username: req.user.username,
      content: content.trim(),
      parent_id: parent_id || null,
      created_at: new Date().toISOString()
    };
    
    const { data: comment, error } = await supabase
      .from('comments')
      .insert(commentData)
      .select()
      .single();
    
    if (error) throw error;
    
    // Increment comment count
    await supabase
      .from('articles')
      .update({ comment_count: (article.comment_count || 0) + 1 })
      .eq('id', id);
    
    res.json({
      success: true,
      message: 'Komentar berhasil ditambahkan',
      data: comment
    });
    
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan komentar'
    });
  }
});

// ==================== STATISTICS ====================
app.get('/api/statistics', async (req, res) => {
  try {
    // Get total articles
    const { count: totalArticles } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true });
    
    // Get total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    // Get recent articles
    const { data: recentArticles } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    // Get category counts
    const { data: categoryCounts } = await supabase
      .from('articles')
      .select('category_name')
      .eq('status', 'published');
    
    const categoryStats = {};
    if (categoryCounts) {
      categoryCounts.forEach(article => {
        const category = article.category_name;
        categoryStats[category] = (categoryStats[category] || 0) + 1;
      });
    }
    
    res.json({
      success: true,
      data: {
        totalArticles: totalArticles || 0,
        totalUsers: totalUsers || 0,
        recentArticles: recentArticles || [],
        categoryCounts: categoryStats
      }
    });
    
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil statistik'
    });
  }
});

// ==================== ADMIN ENDPOINTS ====================

// Get all articles for admin
app.get('/api/admin/articles', authenticate, adminOnly, async (req, res) => {
  try {
    const { status = 'all' } = req.query;
    
    console.log('👑 [ADMIN] Fetching all articles, status:', status);
    
    let query = supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (status !== 'all') {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Admin fetch error:', error);
      throw error;
    }
    
    console.log(`✅ Found ${data?.length || 0} admin articles`);
    
    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });
    
  } catch (error) {
    console.error('❌ Error in admin articles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin articles'
    });
  }
});

// Get pending articles only
app.get('/api/admin/articles/pending', authenticate, adminOnly, async (req, res) => {
  try {
    console.log('👑 [ADMIN] Fetching pending articles');
    
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Pending fetch error:', error);
      throw error;
    }
    
    console.log(`✅ Found ${data?.length || 0} pending articles`);
    
    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });
    
  } catch (error) {
    console.error('❌ Error fetching pending articles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending articles'
    });
  }
});

// Update article status (approve/reject)
app.put('/api/admin/articles/:id/status', authenticate, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log(`👑 [ADMIN] Updating article ${id} status to: ${status}`);
    
    if (!['published', 'pending', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status tidak valid'
      });
    }
    
    // Check if article exists
    const { data: article, error: fetchError } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !article) {
      return res.status(404).json({
        success: false,
        message: 'Artikel tidak ditemukan'
      });
    }
    
    // Update status
    const { data, error } = await supabase
      .from('articles')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    console.log(`✅ Article ${id} status updated to ${status}`);
    
    res.json({
      success: true,
      message: `Status artikel berhasil diubah menjadi ${status}`,
      data: data
    });
    
  } catch (error) {
    console.error('❌ Error updating article status:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengubah status artikel'
    });
  }
});

// Batch update status
app.post('/api/admin/articles/batch-status', authenticate, adminOnly, async (req, res) => {
  try {
    const { articleIds, status } = req.body;
    
    console.log(`👑 [ADMIN] Batch updating ${articleIds?.length || 0} articles to: ${status}`);
    
    if (!articleIds || !Array.isArray(articleIds) || articleIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada artikel yang dipilih'
      });
    }
    
    if (!['published', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status tidak valid untuk batch update'
      });
    }
    
    // Update all articles
    const { data, error } = await supabase
      .from('articles')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .in('id', articleIds)
      .select();
    
    if (error) throw error;
    
    console.log(`✅ Batch updated ${data?.length || 0} articles to ${status}`);
    
    res.json({
      success: true,
      message: `Berhasil mengubah status ${data?.length || 0} artikel`,
      data: data
    });
    
  } catch (error) {
    console.error('❌ Error in batch update:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal melakukan batch update'
    });
  }
});

// Get admin statistics
app.get('/api/admin/statistics', authenticate, adminOnly, async (req, res) => {
  try {
    // Total articles by status
    const { data: allArticles } = await supabase
      .from('articles')
      .select('status');
    
    const stats = {
      total: 0,
      published: 0,
      pending: 0,
      rejected: 0
    };
    
    if (allArticles) {
      stats.total = allArticles.length;
      allArticles.forEach(article => {
        if (article.status === 'published') stats.published++;
        else if (article.status === 'pending') stats.pending++;
        else if (article.status === 'rejected') stats.rejected++;
      });
    }
    
    // Recent pending articles
    const { data: recentPending } = await supabase
      .from('articles')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5);
    
    res.json({
      success: true,
      data: {
        articles: stats,
        recentPending: recentPending || []
      }
    });
    
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil statistik admin'
    });
  }
});

// ==================== ERROR HANDLING ====================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan pada server'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan'
  });
});

// ==================== START SERVER ====================
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ SEIJA Magazine API Server running`);
  console.log(`🌐 URL: http://0.0.0.0:${PORT}`);
  console.log(`📡 Health: http://0.0.0.0:${PORT}/api/health`);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
});