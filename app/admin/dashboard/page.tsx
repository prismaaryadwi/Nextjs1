// app/admin/dashboard/page.tsx - COMPLETE FIXED VERSION WITH DEBUG TOOLS
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useArticles } from '@/app/contexts/ArticleContext';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  total_articles: number;
  published_articles: number;
  pending_articles: number;
  rejected_articles: number;
  total_users: number;
  total_comments: number;
  total_likes: number;
  popular_articles: any[];
  category_stats: any[];
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { 
    articles, 
    pendingArticles,
    adminArticles,
    categories, 
    loading, 
    adminLoading,
    createArticle, 
    updateArticle, 
    deleteArticle,
    fetchArticles,
    fetchPendingArticles,
    fetchAdminArticles,
    updateArticleStatus,
    batchUpdateStatus
  } = useArticles();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category_name: 'Puisi',
    author_name: '',
    cover_image: '',
    featured: false,
    tags: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [batchAction, setBatchAction] = useState<'approve' | 'reject' | ''>('');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [forceRefreshCount, setForceRefreshCount] = useState(0);

  // Redirect jika bukan admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      alert('Hanya admin yang bisa mengakses dashboard ini');
      router.push('/');
    }
  }, [user, router]);

  // Load admin data
  const loadAdminData = async () => {
    try {
      console.log('👑 [ADMIN DASHBOARD] Loading admin data...');
      
      // Load semua data admin
      await fetchPendingArticles();
      await fetchAdminArticles();
      await fetchStats();
      
      // Debug log
      console.log('📊 Pending articles loaded:', pendingArticles.length);
      console.log('📊 Admin articles loaded:', adminArticles.length);
      
    } catch (error) {
      console.error('❌ Error loading admin data:', error);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const savedUser = localStorage.getItem('seija_user');
      if (!savedUser) {
        console.error('No user found in localStorage');
        return;
      }
      
      // Fetch statistics
      const statsResponse = await fetch('http://localhost:3002/api/statistics');
      const statsData = await statsResponse.json();
      
      // Fetch pending articles count
      const pendingResponse = await fetch('http://localhost:3002/api/admin/articles/pending', {
        headers: {
          'Authorization': `Bearer ${savedUser}`,
          'Content-Type': 'application/json'
        }
      });
      const pendingData = await pendingResponse.json();
      
      // Fetch all articles for counts
      const allResponse = await fetch('http://localhost:3002/api/admin/articles', {
        headers: {
          'Authorization': `Bearer ${savedUser}`,
          'Content-Type': 'application/json'
        }
      });
      const allData = await allResponse.json();
      
      if (statsData.success) {
        const allArticles = allData.success ? allData.data : [];
        const publishedCount = allArticles.filter((a: any) => a.status === 'published').length;
        const pendingCount = pendingData.success ? pendingData.data.length : 0;
        const rejectedCount = allArticles.filter((a: any) => a.status === 'rejected').length;
        
        setStats({
          total_articles: statsData.data.totalArticles || 0,
          published_articles: publishedCount,
          pending_articles: pendingCount,
          rejected_articles: rejectedCount,
          total_users: statsData.data.totalUsers || 0,
          total_comments: 0,
          total_likes: 0,
          popular_articles: statsData.data.recentArticles || [],
          category_stats: Object.entries(statsData.data.categoryCounts || {}).map(([name, count]) => ({ name, count }))
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Force refresh pending articles
  const forceRefreshPending = async () => {
    try {
      console.log('🔄 Force refreshing pending articles...');
      
      const savedUser = localStorage.getItem('seija_user');
      if (!savedUser) {
        alert('Silakan login ulang');
        return;
      }
      
      // Clear cache
      setDebugInfo(null);
      setForceRefreshCount(prev => prev + 1);
      
      // Direct API call
      const response = await fetch('http://localhost:3002/api/admin/articles/pending', {
        headers: {
          'Authorization': `Bearer ${savedUser}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });
      
      const data = await response.json();
      console.log('Force refresh response:', data);
      
      setDebugInfo({
        timestamp: new Date().toISOString(),
        url: 'http://localhost:3002/api/admin/articles/pending',
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        data: data
      });
      
      if (data.success && Array.isArray(data.data)) {
        // Update context
        await fetchPendingArticles();
        alert(`✅ Loaded ${data.data.length} pending articles`);
      } else {
        alert(`❌ Failed: ${data.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Force refresh error:', error);
      setDebugInfo({
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack
      });
      alert(`Error: ${error.message}`);
    }
  };

  // Test direct API connection
  const testDirectApi = async () => {
    try {
      const savedUser = localStorage.getItem('seija_user');
      if (!savedUser) {
        alert('Silakan login ulang');
        return;
      }
      
      console.log('🔍 Testing direct API connection...');
      
      const response = await fetch('http://localhost:3002/api/admin/articles/pending', {
        headers: {
          'Authorization': `Bearer ${savedUser}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      alert(`API Response: ${data.success ? 'SUCCESS' : 'FAILED'}\n\n` +
            `Status: ${response.status}\n` +
            `Message: ${data.message}\n` +
            `Data Count: ${Array.isArray(data.data) ? data.data.length : 'N/A'}\n\n` +
            `First item: ${data.data?.[0] ? JSON.stringify(data.data[0], null, 2) : 'No data'}`);
      
      console.log('Direct API test result:', data);
      
    } catch (error: any) {
      alert(`API Error: ${error.message}`);
      console.error('Direct API test error:', error);
    }
  };

  // Load data on mount
  useEffect(() => {
    if (user?.role === 'admin') {
      console.log('✅ User is admin, loading data...');
      loadAdminData();
      fetchArticles();
    }
  }, [user]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content || !formData.category_name) {
      alert('Judul, konten, dan kategori wajib diisi!');
      return;
    }

    try {
      setIsSubmitting(true);
      const success = await createArticle(formData);

      if (success) {
        alert('Karya berhasil dipublikasikan!');
        // Reset form
        setFormData({
          title: '',
          content: '',
          excerpt: '',
          category_name: 'Puisi',
          author_name: '',
          cover_image: '',
          featured: false,
          tags: ''
        });
        await loadAdminData();
        setActiveTab('articles');
      } else {
        alert('Gagal mempublikasikan karya');
      }
    } catch (error) {
      console.error('Error creating article:', error);
      alert('Terjadi kesalahan saat mempublikasikan karya');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Article
  const handleDeleteArticle = async (articleId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus karya ini? Tindakan ini tidak dapat dibatalkan!')) {
      return;
    }

    try {
      setDeletingId(articleId);
      console.log('🗑️ Deleting article:', articleId);
      
      const success = await deleteArticle(articleId);
      
      if (success) {
        alert('Karya berhasil dihapus!');
        await loadAdminData();
      } else {
        alert('Gagal menghapus karya. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Error deleting article:', error);
      alert('Terjadi kesalahan saat menghapus karya');
    } finally {
      setDeletingId(null);
    }
  };

  // View article
  const handleViewArticle = (articleId: string) => {
    router.push(`/article/${articleId}`);
  };

  // Approve pending article
  const handleApproveArticle = async (articleId: string) => {
    try {
      const success = await updateArticleStatus(articleId, 'published');
      
      if (success) {
        alert('Karya berhasil disetujui dan dipublikasikan!');
        await loadAdminData();
      }
    } catch (error) {
      console.error('Error approving article:', error);
      alert('Terjadi kesalahan saat menyetujui karya');
    }
  };

  // Reject article
  const handleRejectArticle = async (articleId: string) => {
    try {
      const success = await updateArticleStatus(articleId, 'rejected');
      
      if (success) {
        alert('Karya telah ditolak!');
        await loadAdminData();
      }
    } catch (error) {
      console.error('Error rejecting article:', error);
      alert('Terjadi kesalahan saat menolak karya');
    }
  };

  // Select article for batch action
  const handleSelectArticle = (articleId: string) => {
    setSelectedArticles(prev => 
      prev.includes(articleId) 
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId]
    );
  };

  // Select all articles
  const handleSelectAll = () => {
    const articlesToShow = getFilteredArticles();
    if (selectedArticles.length === articlesToShow.length) {
      setSelectedArticles([]);
    } else {
      setSelectedArticles(articlesToShow.map(article => article.id));
    }
  };

  // Execute batch action
  const handleBatchAction = async () => {
    if (selectedArticles.length === 0) {
      alert('Pilih minimal 1 artikel untuk diproses');
      return;
    }

    if (!batchAction) {
      alert('Pilih aksi yang akan dilakukan');
      return;
    }

    const confirmMessage = batchAction === 'approve' 
      ? `Apakah Anda yakin ingin menyetujui ${selectedArticles.length} karya?`
      : `Apakah Anda yakin ingin menolak ${selectedArticles.length} karya?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const status = batchAction === 'approve' ? 'published' : 'rejected';
      const success = await batchUpdateStatus(selectedArticles, status);
      
      if (success) {
        alert(`${selectedArticles.length} karya berhasil ${batchAction === 'approve' ? 'disetujui' : 'ditolak'}!`);
        setSelectedArticles([]);
        setBatchAction('');
        await loadAdminData();
      }
    } catch (error) {
      console.error('Error in batch action:', error);
      alert('Terjadi kesalahan saat memproses batch action');
    }
  };

  // Filter articles by status
  const getFilteredArticles = () => {
    if (statusFilter === 'all') {
      return adminArticles;
    }
    return adminArticles.filter(article => article.status === statusFilter);
  };

  // Clear localStorage and reload
  const hardReset = () => {
    if (confirm('Reset semua data lokal? Ini akan logout semua user.')) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    }
  };

  // Check database directly
  const checkDatabase = async () => {
    try {
      const savedUser = localStorage.getItem('seija_user');
      const response = await fetch('http://localhost:3002/api/test/articles');
      const data = await response.json();
      
      alert(`Database test:\n\n` +
            `Total articles in DB: ${data.count}\n` +
            `Status: ${data.success ? 'OK' : 'ERROR'}\n\n` +
            `Recent articles:\n${data.data?.map((a: any) => 
              `- ${a.title} (${a.status}) by ${a.author_name}`
            ).join('\n') || 'None'}`);
    } catch (error: any) {
      alert(`Database check failed: ${error.message}`);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const filteredArticles = getFilteredArticles();

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
              <p className="text-gray-600">Selamat datang, {user?.username}!</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                  User ID: {user.id?.substring(0, 8)}...
                </span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  Role: {user.role}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                👑 Admin
              </span>
              <button
                onClick={() => router.push('/')}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-600"
              >
                Kembali ke Home
              </button>
              <button
                onClick={logout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'stats', name: '📊 Dashboard', count: stats?.pending_articles },
              { id: 'create', name: '📝 Buat Karya' },
              { id: 'articles', name: '📚 Kelola Karya', count: adminArticles.length },
              { id: 'pending', name: '⏳ Pending Review', count: pendingArticles.length },
              { id: 'debug', name: '🔧 Debug', count: forceRefreshCount }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
                {tab.count !== undefined && (
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                    tab.id === 'pending' && tab.count > 0 
                      ? 'bg-red-500 text-white' 
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Dashboard Stats */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <span className="text-blue-600 text-2xl">📄</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Artikel</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.total_articles || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <span className="text-green-600 text-2xl">✅</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Published</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.published_articles || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <span className="text-yellow-600 text-2xl">⏳</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.pending_articles || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center">
                  <div className="bg-red-100 p-3 rounded-lg">
                    <span className="text-red-600 text-2xl">❌</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Rejected</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.rejected_articles || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">📋 Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('pending')}
                  className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-center hover:bg-yellow-100 transition-colors"
                >
                  <div className="text-yellow-600 text-2xl mb-2">⏳</div>
                  <p className="font-medium text-yellow-800">Review Pending</p>
                  <p className="text-sm text-yellow-600">{stats?.pending_articles || 0} karya menunggu</p>
                </button>
                
                <button
                  onClick={() => setActiveTab('create')}
                  className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center hover:bg-blue-100 transition-colors"
                >
                  <div className="text-blue-600 text-2xl mb-2">📝</div>
                  <p className="font-medium text-blue-800">Buat Artikel</p>
                  <p className="text-sm text-blue-600">Publikasi langsung</p>
                </button>
                
                <button
                  onClick={() => setActiveTab('articles')}
                  className="bg-purple-50 border border-purple-200 p-4 rounded-lg text-center hover:bg-purple-100 transition-colors"
                >
                  <div className="text-purple-600 text-2xl mb-2">📚</div>
                  <p className="font-medium text-purple-800">Kelola Semua</p>
                  <p className="text-sm text-purple-600">{adminArticles.length} total karya</p>
                </button>
              </div>
            </div>

            {/* Recent Pending Articles */}
            {pendingArticles.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">⏳ Karya Pending Terbaru</h3>
                  <button
                    onClick={() => setActiveTab('pending')}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Lihat Semua →
                  </button>
                </div>
                <div className="space-y-3">
                  {pendingArticles.slice(0, 5).map((article) => (
                    <div key={article.id} className="flex items-center justify-between p-3 border border-yellow-200 rounded-lg bg-yellow-50 hover:bg-yellow-100 transition-colors">
                      <div>
                        <h4 className="font-medium text-gray-900">{article.title}</h4>
                        <p className="text-sm text-gray-500">
                          Oleh: {article.author_name} • {article.category_name} • {new Date(article.created_at).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproveArticle(article.id)}
                          className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
                        >
                          Setujui
                        </button>
                        <button
                          onClick={() => handleRejectArticle(article.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
                        >
                          Tolak
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Create Article */}
        {activeTab === 'create' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-6">Buat Karya Baru</h2>
            <p className="text-gray-600 mb-6">Sebagai admin, karya Anda akan langsung dipublikasikan.</p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Judul Karya *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Masukkan judul karya..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategori *
                  </label>
                  <select
                    name="category_name"
                    value={formData.category_name}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Puisi">Puisi</option>
                    <option value="Cerpen">Cerpen</option>
                    <option value="Novel">Novel</option>
                    <option value="Opini">Opini</option>
                    <option value="Desain Grafis">Desain Grafis</option>
                    <option value="Coding Project">Coding Project</option>
                    <option value="Cerita Bergambar">Cerita Bergambar</option>
                    <option value="Pantun">Pantun</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Penulis
                  </label>
                  <input
                    type="text"
                    name="author_name"
                    value={formData.author_name}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Nama penulis (opsional)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kutipan/Excerpt
                </label>
                <textarea
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Kutipan singkat karya (opsional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Konten Karya *
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  required
                  rows={12}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Tulis konten karya Anda di sini..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL Cover Image
                  </label>
                  <input
                    type="text"
                    name="cover_image"
                    value={formData.cover_image}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://example.com/cover.jpg"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="featured"
                      checked={formData.featured}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Featured Article</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setFormData({
                    title: '',
                    content: '',
                    excerpt: '',
                    category_name: 'Puisi',
                    author_name: '',
                    cover_image: '',
                    featured: false,
                    tags: ''
                  })}
                  className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Memublikasikan...
                    </>
                  ) : (
                    '🚀 Publikasikan Karya'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Manage All Articles */}
        {activeTab === 'articles' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold">Kelola Semua Karya ({adminArticles.length})</h2>
                <div className="flex space-x-2 mt-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                  >
                    <option value="all">Semua Status ({adminArticles.length})</option>
                    <option value="published">Published ({adminArticles.filter(a => a.status === 'published').length})</option>
                    <option value="pending">Pending ({adminArticles.filter(a => a.status === 'pending').length})</option>
                    <option value="rejected">Ditolak ({adminArticles.filter(a => a.status === 'rejected').length})</option>
                  </select>
                  <button
                    onClick={() => loadAdminData()}
                    className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
                  >
                    🔄 Refresh
                  </button>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('create')}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm hover:bg-purple-700"
                >
                  + Buat Karya Baru
                </button>
              </div>
            </div>

            {/* Batch Actions */}
            {selectedArticles.length > 0 && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="font-medium text-blue-800">
                      {selectedArticles.length} artikel terpilih
                    </span>
                    <select
                      value={batchAction}
                      onChange={(e) => setBatchAction(e.target.value as any)}
                      className="border border-blue-300 rounded-md px-3 py-1 text-sm"
                    >
                      <option value="">Pilih aksi...</option>
                      <option value="approve">Setujui & Publikasikan</option>
                      <option value="reject">Tolak</option>
                    </select>
                    <button
                      onClick={handleBatchAction}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
                    >
                      Jalankan Aksi
                    </button>
                  </div>
                  <button
                    onClick={() => setSelectedArticles([])}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Batalkan
                  </button>
                </div>
              </div>
            )}

            {adminLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Memuat karya...</p>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Belum ada karya dengan status ini.</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-md text-sm hover:bg-purple-700"
                >
                  Buat Karya Pertama
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Select All */}
                <div className="flex items-center p-2 border-b">
                  <input
                    type="checkbox"
                    checked={selectedArticles.length === filteredArticles.length && filteredArticles.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Pilih semua ({filteredArticles.length})</span>
                </div>

                {filteredArticles.map((article) => (
                  <div key={article.id} className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedArticles.includes(article.id)}
                      onChange={() => handleSelectArticle(article.id)}
                      className="mr-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                        {article.cover_image ? (
                          <img 
                            src={article.cover_image} 
                            alt={article.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-500 text-sm">Cover</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">{article.title}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            article.status === 'published' ? 'bg-green-100 text-green-800' :
                            article.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            article.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {article.status || 'draft'}
                          </span>
                          {article.featured && (
                            <span className="px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-800">
                              Featured
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm truncate">Oleh: {article.author_name}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {article.category_name}
                          </span>
                          <span className="text-gray-500 text-xs">
                            {new Date(article.created_at).toLocaleDateString('id-ID')}
                          </span>
                          <span className="text-gray-500 text-xs">
                            ID: {article.id.substring(0, 8)}...
                          </span>
                        </div>
                        <div className="flex space-x-4 mt-1 text-xs text-gray-500">
                          <span>👁️ {article.view_count} views</span>
                          <span>❤️ {article.like_count} likes</span>
                          <span>💬 {article.comment_count} comments</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button 
                        onClick={() => handleViewArticle(article.id)}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
                      >
                        Lihat
                      </button>
                      {article.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleApproveArticle(article.id)}
                            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
                          >
                            Setujui
                          </button>
                          <button 
                            onClick={() => handleRejectArticle(article.id)}
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
                          >
                            Tolak
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => handleDeleteArticle(article.id)}
                        disabled={deletingId === article.id}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {deletingId === article.id ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                            Hapus...
                          </>
                        ) : (
                          'Hapus'
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pending Review Tab */}
        {activeTab === 'pending' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold">Review Karya Pending ({pendingArticles.length})</h2>
                <p className="text-gray-600 text-sm mt-1">
                  Karya dari user biasa yang menunggu persetujuan admin
                </p>
                {/* DEBUG INFO */}
                <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                  <p>API Data: {pendingArticles.length} items loaded</p>
                  <p>Last loaded: {new Date().toLocaleTimeString()}</p>
                  <p>User Role: {user.role}</p>
                  <p>User ID: {user.id}</p>
                </div>
              </div>
              {pendingArticles.length > 0 && (
                <div className="flex space-x-2">
                  <button
                    onClick={async () => {
                      if (confirm(`Approve semua ${pendingArticles.length} karya?`)) {
                        const allIds = pendingArticles.map(a => a.id);
                        await batchUpdateStatus(allIds, 'published');
                        alert(`${pendingArticles.length} karya berhasil diapprove!`);
                      }
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700"
                  >
                    ✅ Approve Semua
                  </button>
                  <button
                    onClick={() => loadAdminData()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
                  >
                    🔄 Refresh Data
                  </button>
                </div>
              )}
            </div>

            {/* Debug Tools */}
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <h4 className="font-medium text-yellow-800 mb-2">🔧 Debug Tools</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={testDirectApi}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Test Direct API
                </button>
                <button
                  onClick={forceRefreshPending}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Force Refresh Pending
                </button>
                <button
                  onClick={checkDatabase}
                  className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                >
                  Check Database
                </button>
                <button
                  onClick={hardReset}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Hard Reset
                </button>
              </div>
            </div>

            {debugInfo && (
              <div className="mb-6 p-4 bg-gray-100 border border-gray-300 rounded">
                <h4 className="font-medium text-gray-800 mb-2">📊 Debug Info</h4>
                <div className="text-xs overflow-auto max-h-40">
                  <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                </div>
              </div>
            )}

            {adminLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Memuat karya pending...</p>
              </div>
            ) : pendingArticles.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-4xl mb-4">🎉</div>
                <h3 className="text-xl font-semibold text-gray-700">Tidak ada karya pending!</h3>
                <p className="text-gray-500 mt-2">Semua karya sudah direview.</p>
                <div className="mt-4 space-x-2">
                  <button
                    onClick={() => loadAdminData()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
                  >
                    🔄 Refresh
                  </button>
                  <button
                    onClick={testDirectApi}
                    className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700"
                  >
                    🔍 Test API
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {pendingArticles.map((article) => (
                  <div key={article.id} className="border border-yellow-200 rounded-lg p-6 bg-yellow-50">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{article.title}</h3>
                        <p className="text-gray-600 mt-1">Oleh: {article.author_name}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {article.category_name}
                          </span>
                          <span className="text-gray-500 text-xs">
                            Diajukan: {new Date(article.created_at).toLocaleDateString('id-ID')}
                          </span>
                          <span className="text-gray-500 text-xs">
                            ID: {article.id.substring(0, 8)}...
                          </span>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                        ⏳ Pending Review
                      </span>
                    </div>
                    
                    {article.cover_image && article.cover_image !== '/cover/default.jpg' && (
                      <div className="mb-4">
                        <img 
                          src={article.cover_image} 
                          alt={article.title}
                          className="rounded-lg max-h-48 object-cover w-full"
                        />
                      </div>
                    )}
                    
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-700 mb-2">Excerpt:</h4>
                      <p className="text-gray-600">{article.excerpt}</p>
                    </div>
                    
                    <div className="mb-6">
                      <h4 className="font-medium text-gray-700 mb-2">Preview Konten:</h4>
                      <div className="bg-white p-4 rounded border max-h-60 overflow-y-auto">
                        <p className="text-gray-600 whitespace-pre-line">
                          {article.content.length > 500 
                            ? article.content.substring(0, 500) + '...' 
                            : article.content}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4 border-t border-yellow-200">
                      <button
                        onClick={() => router.push(`/article/${article.id}`)}
                        className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-600"
                      >
                        👁️ Lihat Detail
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`Setujui karya "${article.title}"?`)) {
                            await handleApproveArticle(article.id);
                          }
                        }}
                        className="bg-green-500 text-white px-4 py-2 rounded-md text-sm hover:bg-green-600"
                      >
                        ✅ Setujui & Publikasikan
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`Tolak karya "${article.title}"?`)) {
                            await handleRejectArticle(article.id);
                          }
                        }}
                        className="bg-red-500 text-white px-4 py-2 rounded-md text-sm hover:bg-red-600"
                      >
                        ❌ Tolak Karya
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Debug Tab */}
        {activeTab === 'debug' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-6">🔧 Debug Tools</h2>
            
            <div className="space-y-6">
              {/* User Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-2">👤 User Information</h3>
                <div className="text-sm">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(user, null, 2)}</pre>
                </div>
                <button
                  onClick={() => {
                    const token = localStorage.getItem('seija_user');
                    alert(`Token: ${token?.substring(0, 50)}...`);
                    console.log('Full token:', token);
                  }}
                  className="mt-2 px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                >
                  Show Token
                </button>
              </div>

              {/* API Tests */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">🔗 API Tests</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={testDirectApi}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Test Pending API
                  </button>
                  <button
                    onClick={forceRefreshPending}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Force Refresh Pending
                  </button>
                  <button
                    onClick={checkDatabase}
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    Check Database
                  </button>
                  <button
                    onClick={() => {
                      fetch('http://localhost:3002/api/health')
                        .then(r => r.json())
                        .then(data => alert(`Health: ${data.message}`))
                        .catch(err => alert(`Error: ${err.message}`));
                    }}
                    className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                  >
                    Test API Health
                  </button>
                </div>
              </div>

              {/* Data Stats */}
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-medium text-green-800 mb-2">📊 Data Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-white rounded border">
                    <div className="text-2xl font-bold text-gray-900">{pendingArticles.length}</div>
                    <div className="text-sm text-gray-600">Pending</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded border">
                    <div className="text-2xl font-bold text-gray-900">{adminArticles.length}</div>
                    <div className="text-sm text-gray-600">Total Admin</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded border">
                    <div className="text-2xl font-bold text-gray-900">{articles.length}</div>
                    <div className="text-sm text-gray-600">Published</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded border">
                    <div className="text-2xl font-bold text-gray-900">{forceRefreshCount}</div>
                    <div className="text-sm text-gray-600">Refresh Count</div>
                  </div>
                </div>
              </div>

              {/* System Actions */}
              <div className="p-4 bg-red-50 rounded-lg">
                <h3 className="font-medium text-red-800 mb-2">⚙️ System Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={hardReset}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Hard Reset (Clear All)
                  </button>
                  <button
                    onClick={() => {
                      localStorage.removeItem('seija_user');
                      window.location.reload();
                    }}
                    className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                  >
                    Logout & Reload
                  </button>
                  <button
                    onClick={() => {
                      console.clear();
                      alert('Console cleared');
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Clear Console
                  </button>
                </div>
              </div>

              {/* Logs */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-2">📝 Recent Logs</h3>
                <div className="text-xs font-mono bg-black text-green-400 p-3 rounded max-h-60 overflow-y-auto">
                  <div>Last refresh: {new Date().toLocaleString()}</div>
                  <div>User role: {user.role}</div>
                  <div>User ID: {user.id}</div>
                  <div>Pending articles: {pendingArticles.length}</div>
                  <div>Debug info: {debugInfo ? 'Available' : 'None'}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}