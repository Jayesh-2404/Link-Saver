import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LinkCard from '../Links/LinkCard';
import { Plus, Search, Filter, Grid, List, PlusCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import api from '../../api';

interface SavedLink {
  id: string;
  url: string;
  title: string;
  description: string;
  image_url: string;
  domain: string;
  tags: string[];
  created_at: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [links, setLinks] = useState<SavedLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const availableTags = ['Image', 'Video', 'News', 'Blog', 'Music', 'Social Media Post'];

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const response = await api.get('/links');
        setLinks(response.data.links);
      } catch (error) {
        console.error('Failed to fetch links:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchLinks();
    }
  }, [user]);

  const filteredLinks = links.filter(link => {
    const matchesSearch = link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         link.domain.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTags = selectedTags.length === 0 ||
                       selectedTags.some(tag => link.tags.includes(tag));
    return matchesSearch && matchesTags;
  });

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link
          to="/add-link"
          className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-4 rounded-md transition-colors"
        >
          Add New Link
        </Link>
      </div>

      <div className="mb-8">
        <input
          type="text"
          placeholder="Search links by title or domain..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {filteredLinks.length === 0 ? (
        <div className="text-center text-gray-500 border-2 border-dashed border-gray-300 rounded-lg p-12">
          <p className="text-xl mb-2">No links found.</p>
          <p>Try adjusting your search or adding new links.</p>
        </div>
      ) : (
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
        }>
          {filteredLinks.map((link) => (
            <LinkCard key={link.id} link={link} viewMode={viewMode} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
