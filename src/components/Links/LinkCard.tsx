import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Calendar, Tag } from 'lucide-react';

interface LinkCardProps {
  link: {
    id: string;
    url: string;
    title: string;
    description: string;
    image_url: string;
    domain: string;
    tags: string[];
    created_at: string;
  };
  viewMode: 'grid' | 'list';
}

export default function LinkCard({ link, viewMode }: LinkCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTagColor = (tag: string) => {
    const colors = {
      'Image': 'bg-red-100 text-red-800',
      'Video': 'bg-purple-100 text-purple-800',
      'News': 'bg-blue-100 text-blue-800',
      'Blog': 'bg-green-100 text-green-800',
      'Music': 'bg-pink-100 text-pink-800',
      'Social Media Post': 'bg-orange-100 text-orange-800'
    };
    return colors[tag as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (viewMode === 'list') {
    return (
      <Link 
        to={`/link/${link.id}`} 
        className="block bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
      >
        <div className="p-4">
          <h3 className="font-bold truncate mb-2">{link.title}</h3>
          <p className="text-sm text-gray-500">{link.domain}</p>
        </div>
      </Link>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden hover:shadow-lg transition-all duration-200 group">
      <div className="relative">
        <img
          src={link.image_url || 'https://images.pexels.com/photos/1036808/pexels-photo-1036808.jpeg'}
          alt={link.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/1036808/pexels-photo-1036808.jpeg';
          }}
        />
        <div className="absolute top-3 right-3 flex gap-2">
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-black/50 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/70 transition-colors duration-200"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
      
      <div className="p-4">
        <Link
          to={`/link/${link.id}`}
          className="block text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors duration-200 line-clamp-2 mb-2"
        >
          {link.title}
        </Link>
        
        <p className="text-gray-600 text-sm line-clamp-3 mb-3">{link.description}</p>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <span className="font-medium text-blue-600">{link.domain}</span>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {formatDate(link.created_at)}
          </div>
        </div>
        
        {link.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {link.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className={`px-2 py-1 rounded-full text-xs font-medium ${getTagColor(tag)}`}
              >
                {tag}
              </span>
            ))}
            {link.tags.length > 3 && (
              <span className="text-xs text-gray-500 px-2 py-1">+{link.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}