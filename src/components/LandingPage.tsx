import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Tags, BookOpen } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="bg-white text-gray-800">
      {/* Hero Section */}
      <section className="text-center py-16 px-4">
        <h1 className="text-5xl font-bold mb-4">Your Intelligent Link Saver</h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Automatically organize, summarize, and tag your links with the power of AI.
        </p>
        <Link
          to="/register"
          className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-6 rounded-md transition-colors text-lg inline-flex items-center"
        >
          Get Started for Free <ArrowRight className="ml-2" />
        </Link>
        <div className="mt-12">
          <img 
            src="/landing.png" 
            alt="Link Saver Dashboard Preview" 
            className="w-full max-w-4xl mx-auto rounded-lg shadow-xl border border-gray-200"
          />
        </div>
      </section>

      {/* Minimalist Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-12">Simple, Powerful, Fast.</h2>
          <div className="flex flex-wrap justify-center gap-12">
            <div className="flex items-center gap-4 max-w-xs">
              <Zap className="text-blue-500 w-8 h-8 flex-shrink-0" />
              <p className="text-lg text-gray-700">Instantly get AI-powered summaries of any article.</p>
            </div>
            <div className="flex items-center gap-4 max-w-xs">
              <Tags className="text-green-500 w-8 h-8 flex-shrink-0" />
              <p className="text-lg text-gray-700">Links are automatically tagged and categorized.</p>
            </div>
            <div className="flex items-center gap-4 max-w-xs">
              <BookOpen className="text-purple-500 w-8 h-8 flex-shrink-0" />
              <p className="text-lg text-gray-700">All your content, beautifully organized in one place.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-10 bg-gray-50">
        <p className="text-gray-600">&copy; {new Date().getFullYear()} Link Saver. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage; 