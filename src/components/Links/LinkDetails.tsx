import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface LinkDetails {
  id: string;
  url: string;
  title: string;
  description: string;
  image_url: string;
  domain: string;
  tags: string[];
  summary: string;
  created_at: string;
}

const LinkDetails = () => {
  const { id } = useParams();
  const [link, setLink] = useState<LinkDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLink = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/links/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLink(response.data.link);
      } catch (error) {
        console.error('Failed to fetch link:', error);
        toast.error('Failed to fetch link details.');
      } finally {
        setLoading(false);
      }
    };
    fetchLink();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this link?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/links/${link.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Link deleted successfully');
        navigate('/dashboard');
      } catch (error) {
        toast.error('Failed to delete link');
      }
    }
  };

  const getTagColor = (tag: string) => {
    const colors = {
      'Image': 'bg-red-100 text-red-800 border-red-200',
      'Video': 'bg-purple-100 text-purple-800 border-purple-200',
      'News': 'bg-blue-100 text-blue-800 border-blue-200',
      'Blog': 'bg-green-100 text-green-800 border-green-200',
      'Music': 'bg-pink-100 text-pink-800 border-pink-200',
      'Social Media Post': 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[tag as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="text-center p-8">Loading...</div>;
  }

  if (!link) {
    return <div className="text-center p-8">Link not found.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
        <img 
          src={link.image_url || 'https://via.placeholder.com/400x200?text=No+Image'} 
          alt={link.title} 
          className="w-full h-auto object-cover rounded-md mb-6"
          onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/400x200?text=No+Image'; }}
        />
        <h1 className="text-3xl font-bold mb-4">{link.title}</h1>
        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all mb-6 block">
          {link.url}
        </a>
        
        {link.summary && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">Summary</h2>
            <p className="text-gray-700 leading-relaxed">{link.summary}</p>
          </div>
        )}

        <div className="text-right">
          <button
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
          >
            Delete Link
          </button>
        </div>
      </div>
    </div>
  );
};

export default LinkDetails;