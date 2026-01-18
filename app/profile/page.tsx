'use client';

import { useEffect, useState } from 'react';

interface User {
  id: string;
  username: string;
  bio?: string;
}

interface Article {
  id: string;
  title: string;
  content: string;
  author_name: string;
  author_bio?: string;
  created_at: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // contoh fetch user
      const userRes = await fetch('/api/user');
      const userData = await userRes.json();

      // contoh fetch artikel
      const articleRes = await fetch('/api/articles');
      const articleData = await articleRes.json();

      setUser(userData);
      setArticles(articleData);
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>User not found</div>;
  }

  // ✅ FILTER YANG VALID SESUAI TYPE
  const userArticles = articles.filter(
    article => article.author_name === user.username
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">{user.username}</h1>
      {user.bio && <p className="text-gray-500 mb-6">{user.bio}</p>}

      <h2 className="text-xl font-semibold mb-4">My Articles</h2>

      {userArticles.length === 0 && (
        <p className="text-gray-400">No articles yet.</p>
      )}

      <ul className="space-y-4">
        {userArticles.map(article => (
          <li
            key={article.id}
            className="border rounded-lg p-4 hover:bg-gray-50 transition"
          >
            <h3 className="font-semibold text-lg">{article.title}</h3>
            <p className="text-sm text-gray-500">
              {new Date(article.created_at).toLocaleDateString()}
            </p>
            <p className="mt-2 line-clamp-3">{article.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
