// server.js - COMPLETE FIXED VERSION WITH ADMIN ENDPOINTS
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3002;

console.log('🚀 SEIJA Magazine API Server - PORT', PORT);

// ==================== MULTER CONFIGURATION ====================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'public/uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `seija_${timestamp}_${random}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Hanya file gambar yang diizinkan!'));
  }
});

// ==================== MIDDLEWARE ====================
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/cover', express.static(path.join(__dirname, 'public/cover')));

// Create directories
const dirs = ['public/uploads', 'public/cover'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// ==================== SUPABASE CONFIG ====================
const SUPABASE_URL = 'https://mfymrinerlgzygnoimve.supabase.co';
const SUPABASE_KEY = 'sb_publishable_nECRhfJNuXfovy-0-V5Crg_NUCRSZic';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('📊 Supabase URL:', SUPABASE_URL);

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
    
    req.user = user;
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
app.post('/api/upload/image', upload.single('image'), (req, res) => {
  try {
    console.log('📤 UPLOAD ENDPOINT HIT - /api/upload/image');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada file yang diupload'
      });
    }
    
    const fileUrl = `/uploads/${req.file.filename}`;
    
    console.log('✅ File uploaded successfully:', {
      filename: req.file.filename,
      size: req.file.size,
      url: fileUrl
    });
    
    res.json({
      success: true,
      message: 'Gambar berhasil diupload',
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size
    });
    
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupload gambar: ' + error.message
    });
  }
});

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SEIJA Magazine API is running on PORT ' + PORT,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      upload: 'POST /api/upload/image',
      articles: 'GET /api/articles',
      createArticle: 'POST /api/articles',
      admin: {
        getPending: 'GET /api/admin/articles/pending',
        getAll: 'GET /api/admin/articles',
        updateStatus: 'PUT /api/admin/articles/:id/status'
      }
    }
  });
});

// ==================== AUTH ENDPOINTS ====================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
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
        message: 'Invalid credentials'
      });
    }
    
    if (password.length < 6) {
      return res.status(401).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }
    
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role || 'user',
      avatar_url: user.avatar_url,
      bio: user.bio
    };
    
    res.json({
      success: true,
      message: 'Login successful',
      user: userData,
      token: JSON.stringify(userData)
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    if (username.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Username must be at least 3 characters'
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }
    
    if (!email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address'
      });
    }
    
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .or(`email.eq.${email},username.eq.${username}`)
      .single();
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }
    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const newUser = {
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password_hash: passwordHash,
      role: 'user',
      avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: user, error } = await supabase
      .from('users')
      .insert(newUser)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar_url: user.avatar_url
    };
    
    res.json({
      success: true,
      message: 'Registration successful',
      user: userData,
      token: JSON.stringify(userData)
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

// ==================== CATEGORIES ====================
app.get('/api/categories', async (req, res) => {
  try {
    console.log('📚 Fetching categories...');
    
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('❌ Database error:', error);
      
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
    
    if (!categories || categories.length === 0) {
      console.log('⚠️ No categories in database');
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
    
    console.log(`✅ Found ${categories.length} categories`);
    res.json({
      success: true,
      data: categories
    });
    
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
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
    
    console.log('📚 Fetching articles with params:', { search, category, sort, page, limit });
    
    let query = supabase
      .from('articles')
      .select('*', { count: 'exact' });
    
    // ONLY SHOW PUBLISHED ARTICLES FOR PUBLIC
    query = query.eq('status', 'published');
    
    if (search && search.trim() !== '') {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`);
    }
    
    if (category && category !== 'all') {
      query = query.eq('category_name', category);
    }
    
    if (sort === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else if (sort === 'oldest') {
      query = query.order('created_at', { ascending: true });
    } else if (sort === 'popular') {
      query = query.order('like_count', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 12;
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;
    
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('❌ Database error:', error);
      throw error;
    }
    
    console.log(`✅ Found ${count || 0} articles, returning ${data?.length || 0}`);
    
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
    console.error('❌ Error fetching articles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching articles',
      error: error.message
    });
  }
});

app.get('/api/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📖 Fetching article: ${id}`);
    
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (articleError || !article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }
    
    // ONLY SHOW PUBLISHED ARTICLES TO PUBLIC
    if (article.status !== 'published') {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }
    
    await supabase
      .from('articles')
      .update({ view_count: (article.view_count || 0) + 1 })
      .eq('id', id);
    
    res.json({
      success: true,
      data: article
    });
    
  } catch (error) {
    console.error('❌ Error fetching article:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching article'
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
    
    console.log('📝 Creating article:', { 
      title, 
      category_name, 
      author: author_name || req.user.username,
      user_role: req.user.role,
      status: req.user.role === 'admin' ? 'published' : 'pending'
    });
    
    if (!title || !content || !category_name) {
      return res.status(400).json({
        success: false,
        message: 'Judul, konten, dan kategori harus diisi'
      });
    }
    
    const validCategories = [
      'Novel', 'Cerpen', 'Puisi', 'Opini', 
      'Desain Grafis', 'Coding Project', 
      'Cerita Bergambar', 'Pantun'
    ];
    
    if (!validCategories.includes(category_name)) {
      return res.status(400).json({
        success: false,
        message: 'Kategori tidak valid'
      });
    }
    
    const readTime = calculateReadTime(content);
    
    let categoryId = null;
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('name', category_name)
      .single();
    
    if (!existingCategory) {
      const { data: newCategory } = await supabase
        .from('categories')
        .insert({
          name: category_name,
          slug: category_name.toLowerCase().replace(/\s+/g, '-'),
          color: '#3B82F6',
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (newCategory) {
        categoryId = newCategory.id;
      }
    } else {
      categoryId = existingCategory.id;
    }
    
    const articleData = {
      title: title.trim(),
      content: content,
      excerpt: excerpt || content.substring(0, 150) + '...',
      category_id: categoryId,
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
    
    console.log('💾 Saving article to database:', articleData);
    
    const { data, error } = await supabase
      .from('articles')
      .insert(articleData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Database error:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal menyimpan artikel: ' + error.message
      });
    }
    
    console.log('✅ Article created successfully:', data.id);
    
    res.json({
      success: true,
      message: req.user.role === 'admin' 
        ? 'Karya berhasil dipublikasikan!' 
        : 'Karya berhasil diajukan! Menunggu persetujuan admin.',
      data: data
    });
    
  } catch (error) {
    console.error('❌ Error creating article:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat artikel: ' + error.message
    });
  }
});

app.put('/api/articles/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const { data: article, error: fetchError } = await supabase
      .from('articles')
      .select('author_id')
      .eq('id', id)
      .single();
    
    if (fetchError || !article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }
    
    if (req.user.role !== 'admin' && article.author_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this article'
      });
    }
    
    const { data, error } = await supabase
      .from('articles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    res.json({
      success: true,
      message: 'Article updated successfully',
      data: data
    });
    
  } catch (error) {
    console.error('Error updating article:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update article'
    });
  }
});

app.delete('/api/articles/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: article, error: fetchError } = await supabase
      .from('articles')
      .select('author_id')
      .eq('id', id)
      .single();
    
    if (fetchError || !article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }
    
    if (req.user.role !== 'admin' && article.author_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this article'
      });
    }
    
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw error;
    }
    
    res.json({
      success: true,
      message: 'Article deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete article'
    });
  }
});

app.post('/api/articles/:id/like', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const { data: existingLike, error: checkError } = await supabase
      .from('article_likes')
      .select('id')
      .eq('article_id', id)
      .eq('user_id', userId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }
    
    let liked = false;
    
    if (existingLike) {
      await supabase
        .from('article_likes')
        .delete()
        .eq('id', existingLike.id);
      
      await supabase
        .from('articles')
        .update({ like_count: supabase.raw('GREATEST(like_count - 1, 0)') })
        .eq('id', id);
      
    } else {
      await supabase
        .from('article_likes')
        .insert({
          article_id: id,
          user_id: userId,
          created_at: new Date().toISOString()
        });
      
      await supabase
        .from('articles')
        .update({ like_count: supabase.raw('like_count + 1') })
        .eq('id', id);
      
      liked = true;
    }
    
    res.json({
      success: true,
      liked: liked,
      message: liked ? 'Article liked' : 'Article unliked'
    });
    
  } catch (error) {
    console.error('Error liking article:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like article'
    });
  }
});

// ==================== ADMIN ENDPOINTS ====================
// GET pending articles only (admin dashboard)
app.get('/api/admin/articles/pending', authenticate, adminOnly, async (req, res) => {
  try {
    console.log('👑 [ADMIN] Fetching pending articles');
    
    const { data: articles, error } = await supabase
      .from('articles')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Database error:', error);
      throw error;
    }

    console.log(`✅ [ADMIN] Found ${articles?.length || 0} pending articles`);

    res.json({
      success: true,
      message: `Found ${articles?.length || 0} pending articles`,
      data: articles || []
    });

  } catch (error) {
    console.error('❌ Error fetching pending articles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending articles'
    });
  }
});

// GET all articles with all statuses (admin only)
app.get('/api/admin/articles', authenticate, adminOnly, async (req, res) => {
  try {
    const { 
      search = '', 
      category = 'all', 
      status = 'all',
      sort = 'newest', 
      page = 1, 
      limit = 20 
    } = req.query;
    
    console.log('👑 [ADMIN] Fetching all articles with params:', { search, category, status, sort, page, limit });
    
    let query = supabase
      .from('articles')
      .select('*', { count: 'exact' });
    
    // Admin can see ALL articles regardless of status
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    if (search && search.trim() !== '') {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,author_name.ilike.%${search}%`);
    }
    
    if (category && category !== 'all') {
      query = query.eq('category_name', category);
    }
    
    if (sort === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else if (sort === 'oldest') {
      query = query.order('created_at', { ascending: true });
    } else if (sort === 'popular') {
      query = query.order('like_count', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;
    
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('❌ Database error:', error);
      throw error;
    }
    
    console.log(`✅ [ADMIN] Found ${count || 0} articles`);
    
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
    console.error('❌ Error fetching admin articles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching articles'
    });
  }
});

// UPDATE article status (approve/reject)
app.put('/api/admin/articles/:id/status', authenticate, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['published', 'pending', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    console.log(`🔄 [ADMIN] ${req.user.username} changing article ${id} status to ${status}`);

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

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    const statusMessage = status === 'published' ? 'dipublikasikan' : 
                         status === 'rejected' ? 'ditolak' : 'diubah';

    res.json({
      success: true,
      message: `Artikel berhasil ${statusMessage}`,
      data: data
    });

  } catch (error) {
    console.error('❌ Error updating article status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update article status'
    });
  }
});

// BATCH update status (approve/reject multiple)
app.post('/api/admin/articles/batch-status', authenticate, adminOnly, async (req, res) => {
  try {
    const { articleIds, status } = req.body;

    if (!Array.isArray(articleIds) || articleIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Article IDs array required'
      });
    }

    if (!['published', 'pending', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    console.log(`🔄 [ADMIN] Batch updating ${articleIds.length} articles to ${status}`);

    const { data, error } = await supabase
      .from('articles')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .in('id', articleIds)
      .select();

    if (error) throw error;

    const statusMessage = status === 'published' ? 'dipublikasikan' : 
                         status === 'rejected' ? 'ditolak' : 'diubah';

    res.json({
      success: true,
      message: `${articleIds.length} artikel berhasil ${statusMessage}`,
      data: data || []
    });

  } catch (error) {
    console.error('❌ Error batch updating articles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update articles'
    });
  }
});

// ==================== COMMENTS ====================
app.get('/api/articles/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        users:user_id(username, avatar_url)
      `)
      .eq('article_id', id)
      .eq('status', 'approved')
      .order('created_at', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    res.json({
      success: true,
      data: comments || []
    });
    
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments'
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
        message: 'Comment content is required'
      });
    }
    
    const commentData = {
      article_id: id,
      user_id: req.user.id,
      content: content.trim(),
      parent_id: parent_id || null,
      status: 'approved',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('comments')
      .insert(commentData)
      .select(`
        *,
        users:user_id(username, avatar_url)
      `)
      .single();
    
    if (error) {
      throw error;
    }
    
    await supabase
      .from('articles')
      .update({ comment_count: supabase.raw('comment_count + 1') })
      .eq('id', id);
    
    res.json({
      success: true,
      message: 'Comment added successfully',
      data: data
    });
    
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment'
    });
  }
});

// ==================== OTHER ENDPOINTS ====================
app.get('/api/users/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, role, avatar_url, bio, created_at')
      .eq('id', id)
      .single();
    
    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // User can only see their own articles or admin can see all
    let articlesQuery = supabase
      .from('articles')
      .select('*')
      .eq('author_id', id);
    
    // Non-admin users can only see their published articles
    if (req.user.role !== 'admin') {
      articlesQuery = articlesQuery.eq('status', 'published');
    }
    
    const { data: articles } = await articlesQuery.order('created_at', { ascending: false });
    
    res.json({
      success: true,
      data: {
        ...user,
        articles: articles || []
      }
    });
    
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
});

app.get('/api/test/articles', async (req, res) => {
  try {
    const { data: articles, error } = await supabase
      .from('articles')
      .select('*')
      .limit(5);
    
    if (error) {
      throw error;
    }
    
    res.json({
      success: true,
      count: articles?.length || 0,
      data: articles || []
    });
    
  } catch (error) {
    console.error('Test error:', error);
    res.status(500).json({
      success: false,
      message: 'Test failed'
    });
  }
});

app.get('/api/statistics', async (req, res) => {
  try {
    const { count: totalArticles, error: articlesError } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');
    
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    const { data: articlesByCategory, error: categoryError } = await supabase
      .from('articles')
      .select('category_name')
      .eq('status', 'published');
    
    const categoryCounts = {};
    if (articlesByCategory) {
      articlesByCategory.forEach(article => {
        const category = article.category_name || 'Uncategorized';
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });
    }
    
    const { data: recentArticles, error: recentError } = await supabase
      .from('articles')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (articlesError || usersError || categoryError || recentError) {
      throw new Error('Failed to fetch statistics');
    }
    
    res.json({
      success: true,
      data: {
        totalArticles: totalArticles || 0,
        totalUsers: totalUsers || 0,
        categoryCounts,
        recentArticles: recentArticles || []
      }
    });
    
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

app.post('/api/init-categories', async (req, res) => {
  try {
    console.log('🔄 Initializing SEIJA categories...');
    
    const categories = [
      { name: 'Novel', slug: 'novel', color: '#3B82F6' },
      { name: 'Cerpen', slug: 'cerpen', color: '#10B981' },
      { name: 'Puisi', slug: 'puisi', color: '#F59E0B' },
      { name: 'Opini', slug: 'opini', color: '#EF4444' },
      { name: 'Desain Grafis', slug: 'desain-grafis', color: '#8B5CF6' },
      { name: 'Coding Project', slug: 'coding-project', color: '#EC4899' },
      { name: 'Cerita Bergambar', slug: 'cerita-bergambar', color: '#14B8A6' },
      { name: 'Pantun', slug: 'pantun', color: '#F97316' }
    ];

    const results = [];
    for (const category of categories) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .upsert(category, { onConflict: 'name' })
          .select()
          .single();
        
        if (error) {
          if (error.code === '23505') {
            console.log(`✅ ${category.name} already exists`);
            results.push({ name: category.name, status: 'exists' });
          } else {
            console.error(`❌ Error with ${category.name}:`, error.message);
            results.push({ name: category.name, status: 'error', error: error.message });
          }
        } else {
          console.log(`✅ ${category.name} created`);
          results.push({ name: category.name, status: 'created', data });
        }
      } catch (err) {
        console.error(`❌ Failed to process ${category.name}:`, err.message);
        results.push({ name: category.name, status: 'failed', error: err.message });
      }
    }

    res.json({
      success: true,
      message: 'SEIJA Magazine categories initialized',
      data: results
    });
    
  } catch (error) {
    console.error('❌ Error initializing categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize categories'
    });
  }
});

// ==================== ERROR HANDLING ====================
app.use('*', (req, res) => {
  console.log(`❌ Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`
  });
});

app.use((err, req, res, next) => {
  console.error('🔥 Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ==================== START SERVER ====================
const server = app.listen(PORT, () => {
  console.log(`\n✅ SEIJA Magazine API Server running on http://localhost:${PORT}`);
  console.log('\n📡 AVAILABLE ENDPOINTS:');
  console.log('   POST /api/upload/image     - Upload gambar');
  console.log('   GET  /api/health           - Health check');
  console.log('   POST /api/auth/login       - Login user');
  console.log('   POST /api/auth/register    - Register user');
  console.log('   GET  /api/categories       - Get categories');
  console.log('   GET  /api/articles         - Get all published articles');
  console.log('   GET  /api/articles/:id     - Get single published article');
  console.log('   POST /api/articles         - Create article (auto-pending for non-admin)');
  console.log('   PUT  /api/articles/:id     - Update article');
  console.log('   DELETE /api/articles/:id   - Delete article');
  console.log('   POST /api/articles/:id/like - Like article');
  console.log('   GET  /api/articles/:id/comments - Get comments');
  console.log('   POST /api/articles/:id/comments - Add comment');
  console.log('   👑 ADMIN ENDPOINTS:');
  console.log('   GET  /api/admin/articles   - Get all articles (all statuses)');
  console.log('   GET  /api/admin/articles/pending - Get pending articles');
  console.log('   PUT  /api/admin/articles/:id/status - Approve/reject article');
  console.log('   POST /api/admin/articles/batch-status - Batch approve/reject');
  console.log('   GET  /api/users/:id        - Get user profile');
  console.log('   GET  /api/statistics       - Get statistics');
  console.log('   GET  /api/test/articles    - Test endpoint');
  console.log('   POST /api/init-categories  - Initialize categories');
  console.log('\n🎯 CATEGORIES: Novel, Cerpen, Puisi, Opini, Desain Grafis, Coding Project, Cerita Bergambar, Pantun');
  console.log('📁 Upload folder: public/uploads/');
  console.log('📁 Cover folder: public/cover/');
  console.log('\n🔥 TEST UPLOAD: curl -X POST http://localhost:3002/api/upload/image -F "image=@test.jpg"');
  console.log('\n👑 TEST ADMIN: curl -H "Authorization: Bearer {token}" http://localhost:3002/api/admin/articles/pending');
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    console.log('💡 Try: lsof -ti:3002 | xargs kill -9');
    console.log('💡 Or change PORT to 3003 in server.js');
  } else {
    console.error('❌ Server error:', error);
  }
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down SEIJA API server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});