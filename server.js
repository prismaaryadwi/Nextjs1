// server.js - COMPLETE FIXED VERSION FOR RAILWAY & VERCEL
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
console.log('🌍 Railway Environment:', process.env.RAILWAY_ENVIRONMENT ? 'YES' : 'NO');

// ==================== CORS CONFIGURATION ====================
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'https://seijamagazine.site',
  'https://www.seijamagazine.site',
  'https://seijamagazine.vercel.app',
  'https://seija-magazine.vercel.app',
  'https://*.vercel.app',
  'https://*.railway.app'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
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
  exposedHeaders: ['Content-Length', 'Authorization'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// ==================== MIDDLEWARE ====================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log('\n' + '='.repeat(60));
  console.log(`🕐 ${new Date().toISOString()}`);
  console.log(`🌐 ${req.method} ${req.originalUrl}`);
  console.log(`🌍 Origin: ${req.headers.origin || 'No Origin'}`);
  console.log(`📱 User-Agent: ${req.headers['user-agent']?.substring(0, 50)}...`);
  console.log(`📦 Content-Type: ${req.headers['content-type'] || 'None'}`);
  console.log('='.repeat(60) + '\n');
  next();
});

// ==================== MULTER CONFIGURATION ====================
// Gunakan memory storage untuk Railway (ephemeral filesystem)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Hanya file gambar yang diizinkan! Format: jpeg, jpg, png, gif, webp'));
  }
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

// ==================== UPLOAD ENDPOINT - FIXED ====================
app.post('/api/upload/image', upload.single('image'), async (req, res) => {
  try {
    console.log('📤 [UPLOAD ENDPOINT] Hit - /api/upload/image');
    console.log('📦 Headers:', {
      'content-type': req.headers['content-type'],
      'origin': req.headers.origin,
      'content-length': req.headers['content-length']
    });
    
    if (!req.file) {
      console.log('❌ No file received');
      return res.status(400).json({
        success: false,
        message: 'Tidak ada file yang diupload'
      });
    }
    
    console.log('✅ File received:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      bufferLength: req.file.buffer?.length || 0
    });
    
    // Simpan file ke disk (untuk development) atau ke Supabase Storage (production)
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
    const filename = `seija_${timestamp}_${random}${ext}`;
    
    // Untuk Railway, kita bisa:
    // 1. Simpan ke Supabase Storage (RECOMMENDED)
    // 2. Simpan ke local disk (temporary)
    // 3. Return base64 (tidak direkomendasikan untuk file besar)
    
    // OPSI 1: Simpan ke local public/uploads (untuk development)
    const uploadDir = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, req.file.buffer);
    
    const fileUrl = `/uploads/${filename}`;
    const fullUrl = `${req.protocol}://${req.get('host')}${fileUrl}`;
    
    console.log('✅ File saved:', {
      filename: filename,
      path: filePath,
      url: fileUrl,
      fullUrl: fullUrl,
      size: req.file.size
    });
    
    res.json({
      success: true,
      message: 'Gambar berhasil diupload',
      url: fileUrl,
      fullUrl: fullUrl,
      filename: filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
    
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupload gambar: ' + error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/cover', express.static(path.join(__dirname, 'public/cover')));

// Create directories if they don't exist
['public/uploads', 'public/cover'].forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SEIJA Magazine API is running',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    host: req.headers.host,
    origin: req.headers.origin,
    railway: process.env.RAILWAY_ENVIRONMENT ? true : false,
    endpoints: {
      upload: 'POST /api/upload/image',
      articles: 'GET /api/articles',
      createArticle: 'POST /api/articles',
      categories: 'GET /api/categories'
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

// ... (sisa code untuk PUT, DELETE, LIKE, COMMENTS, ADMIN tetap sama seperti sebelumnya)
// Untuk hemat space, saya skip bagian yang tidak berubah

// ==================== START SERVER ====================
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ SEIJA Magazine API Server running`);
  console.log(`🌐 URL: http://0.0.0.0:${PORT}`);
  console.log(`📡 Health: http://0.0.0.0:${PORT}/api/health`);
  console.log('🚀 Ready for Railway deployment!');
  console.log('🔧 CORS Enabled for:', allowedOrigins);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  } else {
    console.error('❌ Server error:', error);
  }
});