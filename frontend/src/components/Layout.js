import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Plus, Search, Menu, X } from 'lucide-react';

const Layout = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // TODO: Implement search functionality
      console.log('Searching for:', searchQuery);
    }
  };

  return (
    <div className="min-h-screen bg-garage-dark text-white">
      {/* Header */}
      <header className="bg-garage-gray border-b border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Title */}
            <Link to="/" className="flex items-center space-x-3">
              <div className="bg-garage-accent rounded-lg p-2">
                <Home size={24} className="text-white" />
              </div>
              <h1 className="text-xl font-bold">AutoCare
              </h1>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link
                to="/"
                className="hover:text-garage-accent transition-colors touch-target"
              >
                Home
              </Link>
              <Link
                to="/add-vehicle"
                className="hover:text-garage-accent transition-colors touch-target"
              >
                Add Vehicle
              </Link>
              
              {/* Search */}
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="bg-gray-800 text-white px-4 py-2 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-garage-accent"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  <Search size={20} className="text-gray-400 hover:text-white" />
                </button>
              </form>

              <Link
                to="/add-vehicle"
                className="bg-garage-accent hover:bg-orange-600 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors touch-target"
              >
                <Plus size={20} />
                <span>Add Vehicle</span>
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden touch-target"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-garage-gray border-t border-gray-700">
            <div className="container mx-auto px-4 py-4 space-y-4">
              <Link
                to="/"
                className="block py-2 hover:text-garage-accent transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/add-vehicle"
                className="block py-2 hover:text-garage-accent transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Add Vehicle
              </Link>
              
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full bg-gray-800 text-white px-4 py-2 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-garage-accent"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  <Search size={20} className="text-gray-400 hover:text-white" />
                </button>
              </form>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-garage-gray border-t border-gray-700 mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <p className="text-gray-400 text-sm">
              © 2024 Garage Interface. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <span className="text-gray-400 text-sm">
                Optimized for 23" Touch Display
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;