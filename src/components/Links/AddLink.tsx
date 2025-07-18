import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api';


const AddLink = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

   const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
     
      await api.post('/links', { url });
      toast.success('Link saved successfully');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to save link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">Add & Save Link</h1>
      <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
        <form onSubmit={handleSubmit}>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
            Paste Link
          </label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            placeholder="https://example.com"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-4 rounded-md transition-colors"
          >
            {loading ? 'Saving...' : 'Save Link'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddLink;
