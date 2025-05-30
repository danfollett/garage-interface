import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Download, Trash2, X, ExternalLink, Search, ChevronRight, ChevronDown, List } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { manualAPI } from '../services/api';
import { formatDate, formatFileSize, ACCEPTED_FILE_TYPES, FILE_SIZE_LIMITS } from '../utils/constants';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.mjs';

const ManualViewer = ({ manuals, vehicleId, onDelete, onUpdate }) => {
  const [selectedManual, setSelectedManual] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfDocument, setPdfDocument] = useState(null);
  const [outline, setOutline] = useState([]);
  const [showOutline, setShowOutline] = useState(true);
  const [expandedOutlineItems, setExpandedOutlineItems] = useState(new Set());
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchResult, setCurrentSearchResult] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [highlightedText, setHighlightedText] = useState('');
  const pageRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    // Validate file size
    if (file.size > FILE_SIZE_LIMITS.MANUAL) {
      alert('File size must be less than 50MB');
      return;
    }

    const formData = new FormData();
    formData.append('manual', file);
    formData.append('title', file.name.replace('.pdf', ''));

    try {
      setUploading(true);
      setUploadProgress(0);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      await manualAPI.upload(vehicleId, formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Reset and refresh
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
        onUpdate();
      }, 500);
    } catch (err) {
      console.error('Error uploading manual:', err);
      alert('Failed to upload manual: ' + err.message);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const onDocumentLoadSuccess = async (pdf) => {
    console.log('PDF loaded successfully:', pdf.numPages);
    setNumPages(pdf.numPages);
    setPageNumber(1);
    setPdfDocument(pdf);
    
    // Load outline (table of contents)
    try {
      const outline = await pdf.getOutline();
      console.log('PDF outline:', outline);
      if (outline) {
        setOutline(outline);
      }
    } catch (error) {
      console.error('Error loading outline:', error);
      setOutline([]);
    }
  };

  const handleOutlineClick = async (item) => {
    if (item.dest) {
      try {
        let destination = item.dest;
        // Handle different destination types
        if (typeof destination === 'string') {
          destination = await pdfDocument.getDestination(destination);
        }
        
        if (destination) {
          const pageRef = destination[0];
          const pageIndex = await pdfDocument.getPageIndex(pageRef);
          setPageNumber(pageIndex + 1);
        }
      } catch (error) {
        console.error('Error navigating to outline item:', error);
        // Try to extract page number from dest if available
        if (item.dest && Array.isArray(item.dest) && item.dest[0]?.num !== undefined) {
          setPageNumber(item.dest[0].num + 1);
        }
      }
    }
  };

  const toggleOutlineItem = (itemId) => {
    const newExpanded = new Set(expandedOutlineItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedOutlineItems(newExpanded);
  };

  const renderOutlineItem = (item, index, level = 0) => {
    const hasChildren = item.items && item.items.length > 0;
    const isExpanded = expandedOutlineItems.has(`${level}-${index}`);
    
    return (
      <div key={`${level}-${index}`} style={{ marginLeft: `${level * 16}px` }}>
        <div 
          className="flex items-center py-1 px-2 hover:bg-gray-700 rounded cursor-pointer group"
          onClick={() => handleOutlineClick(item)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleOutlineItem(`${level}-${index}`);
              }}
              className="mr-1"
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          )}
          <span className="text-sm group-hover:text-garage-accent">{item.title}</span>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {item.items.map((child, childIndex) => 
              renderOutlineItem(child, childIndex, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  const extractTextContext = (text, searchTerm, contextLength = 40) => {
    const lowerText = text.toLowerCase();
    const lowerSearchTerm = searchTerm.toLowerCase();
    const index = lowerText.indexOf(lowerSearchTerm);
    
    if (index === -1) return '';
    
    const start = Math.max(0, index - contextLength);
    const end = Math.min(text.length, index + searchTerm.length + contextLength);
    
    let context = text.substring(start, end);
    
    // Add ellipsis if truncated
    if (start > 0) context = '...' + context;
    if (end < text.length) context = context + '...';
    
    return context;
  };

  const handleSearch = async () => {
    if (!searchText || !pdfDocument) return;

    setIsSearching(true);
    setSearchResults([]);
    setHighlightedText(searchText);
    const results = [];

    try {
      for (let i = 1; i <= numPages; i++) {
        const page = await pdfDocument.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        const lowerPageText = pageText.toLowerCase();
        const lowerSearchText = searchText.toLowerCase();

        // Find all occurrences on this page
        const occurrences = [];
        let startIndex = 0;
        
        while ((startIndex = lowerPageText.indexOf(lowerSearchText, startIndex)) !== -1) {
          const context = extractTextContext(pageText, searchText, 40);
          occurrences.push({
            index: startIndex,
            context: context
          });
          startIndex += lowerSearchText.length;
        }

        if (occurrences.length > 0) {
          results.push({
            page: i,
            occurrences: occurrences.length,
            matches: occurrences
          });
        }
      }

      setSearchResults(results);
      if (results.length > 0) {
        setPageNumber(results[0].page);
        setCurrentSearchResult(0);
      } else {
        alert(`No results found for "${searchText}"`);
      }
    } catch (error) {
      console.error('Error searching PDF:', error);
      alert('Error searching PDF. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const navigateSearchResult = (direction) => {
    if (searchResults.length === 0) return;
    
    let newIndex = currentSearchResult;
    if (direction === 'next') {
      newIndex = (currentSearchResult + 1) % searchResults.length;
    } else {
      newIndex = currentSearchResult === 0 ? searchResults.length - 1 : currentSearchResult - 1;
    }
    
    setCurrentSearchResult(newIndex);
    setPageNumber(searchResults[newIndex].page);
  };

  const clearSearch = () => {
    setSearchText('');
    setSearchResults([]);
    setHighlightedText('');
    setCurrentSearchResult(0);
  };

  // Custom text renderer to highlight search results
  const customTextRenderer = (textItem) => {
    if (!highlightedText) return textItem.str;
    
    const regex = new RegExp(`(${highlightedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = textItem.str.split(regex);
    
    return parts.map((part, index) => {
      if (regex.test(part)) {
        return `<mark style="background-color: #ff6b35; color: white; padding: 2px; border-radius: 2px;">${part}</mark>`;
      }
      return part;
    }).join('');
  };

  if (manuals.length === 0 && !uploading) {
    return (
      <div className="text-center py-12">
        <FileText size={64} className="mx-auto text-gray-600 mb-4" />
        <p className="text-gray-400 text-lg mb-6">No service manuals uploaded yet</p>
        <label className="inline-flex items-center space-x-2 bg-garage-accent hover:bg-orange-600 px-6 py-3 rounded-lg transition-colors cursor-pointer">
          <Upload size={20} />
          <span>Upload Manual</span>
          <input
            type="file"
            accept={ACCEPTED_FILE_TYPES.MANUAL}
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div className="flex justify-end">
        <label className="flex items-center space-x-2 bg-garage-accent hover:bg-orange-600 px-4 py-2 rounded-lg transition-colors cursor-pointer">
          <Upload size={20} />
          <span>Upload Manual</span>
          <input
            type="file"
            accept={ACCEPTED_FILE_TYPES.MANUAL}
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-2">Uploading manual...</p>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-garage-accent h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Manuals List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {manuals.map((manual) => (
          <div
            key={manual.id}
            className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">{manual.title}</h3>
                <p className="text-sm text-gray-400">
                  Uploaded {formatDate(manual.created_at)}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedManual(manual)}
                  className="bg-blue-600 hover:bg-blue-700 p-2 rounded transition-colors touch-target"
                  title="View"
                >
                  <FileText size={20} />
                </button>
                <a
                  href={manualAPI.download(manual.id)}
                  download
                  className="bg-green-600 hover:bg-green-700 p-2 rounded transition-colors touch-target"
                  title="Download"
                >
                  <Download size={20} />
                </a>
                <button
                  onClick={() => onDelete(manual.id)}
                  className="bg-red-600 hover:bg-red-700 p-2 rounded transition-colors touch-target"
                  title="Delete"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* PDF Viewer Modal */}
      {selectedManual && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex z-50">
          <div className="flex flex-1">
            {/* Sidebar with Outline and Search */}
            {showOutline && (
              <div className="w-80 bg-garage-gray border-r border-gray-700 flex flex-col">
                {/* Search */}
                <div className="p-4 border-b border-gray-700">
                  <h3 className="font-semibold mb-3 flex items-center">
                    <Search size={18} className="mr-2" />
                    Search
                  </h3>
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Search in PDF..."
                        className="flex-1 bg-gray-800 text-white px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-garage-accent"
                      />
                      <button
                        onClick={handleSearch}
                        disabled={isSearching || !searchText}
                        className="bg-garage-accent hover:bg-orange-600 px-3 py-2 rounded transition-colors disabled:opacity-50"
                      >
                        {isSearching ? '...' : 'Go'}
                      </button>
                    </div>
                    
                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">
                            {searchResults.reduce((acc, r) => acc + r.occurrences, 0)} results on {searchResults.length} pages
                          </span>
                          <button
                            onClick={clearSearch}
                            className="text-xs text-gray-500 hover:text-gray-300"
                          >
                            Clear
                          </button>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => navigateSearchResult('prev')}
                            className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
                          >
                            Previous
                          </button>
                          <span className="text-xs">{currentSearchResult + 1} / {searchResults.length}</span>
                          <button
                            onClick={() => navigateSearchResult('next')}
                            className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
                          >
                            Next
                          </button>
                        </div>

                        {/* Results List */}
                        <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                          {searchResults.map((result, index) => (
                            <div
                              key={index}
                              className={`p-2 rounded cursor-pointer text-xs ${
                                index === currentSearchResult 
                                  ? 'bg-garage-accent bg-opacity-30 border border-garage-accent' 
                                  : 'bg-gray-800 hover:bg-gray-700'
                              }`}
                              onClick={() => {
                                setCurrentSearchResult(index);
                                setPageNumber(result.page);
                              }}
                            >
                              <div className="font-semibold mb-1">
                                Page {result.page} ({result.occurrences} match{result.occurrences > 1 ? 'es' : ''})
                              </div>
                              {result.matches.slice(0, 2).map((match, matchIndex) => (
                                <div key={matchIndex} className="text-gray-400 italic truncate">
                                  {match.context}
                                </div>
                              ))}
                              {result.matches.length > 2 && (
                                <div className="text-gray-500">
                                  +{result.matches.length - 2} more...
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Table of Contents */}
                <div className="flex-1 overflow-y-auto p-4">
                  <h3 className="font-semibold mb-3 flex items-center">
                    <List size={18} className="mr-2" />
                    Table of Contents
                  </h3>
                  {outline.length > 0 ? (
                    <div className="space-y-1">
                      {outline.map((item, index) => renderOutlineItem(item, index))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">
                      No table of contents available for this PDF
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Main PDF Viewer */}
            <div className="flex-1 flex flex-col bg-garage-gray">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowOutline(!showOutline)}
                    className="bg-gray-700 hover:bg-gray-600 p-2 rounded transition-colors"
                    title="Toggle sidebar"
                  >
                    <List size={20} />
                  </button>
                  <h2 className="text-xl font-bold">{selectedManual.title}</h2>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-400">
                    Page {pageNumber} of {numPages}
                  </div>
                  <a
                    href={`http://localhost:5000${selectedManual.file_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 p-2 rounded transition-colors"
                    title="Open in new tab"
                  >
                    <ExternalLink size={20} />
                  </a>
                  <button
                    onClick={() => {
                      setSelectedManual(null);
                      clearSearch();
                      setOutline([]);
                      setPdfDocument(null);
                    }}
                    className="bg-gray-700 hover:bg-gray-600 p-2 rounded transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* PDF Viewer */}
              <div className="flex-1 overflow-auto p-4 bg-gray-900">
                <Document
                  file={`http://localhost:5000${selectedManual.file_path}`}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={(error) => {
                    console.error('Error loading PDF:', error);
                    alert('Failed to load PDF. Please check the console for details.');
                  }}
                  loading={
                    <div className="text-center py-8">
                      <p className="text-gray-400">Loading PDF...</p>
                    </div>
                  }
                  error={
                    <div className="text-center py-8">
                      <p className="text-red-500">Failed to load PDF</p>
                      <p className="text-gray-400 text-sm mt-2">
                        Try opening in a new tab or downloading the file
                      </p>
                    </div>
                  }
                  className="flex justify-center"
                >
                  <Page 
                    ref={pageRef}
                    pageNumber={pageNumber}
                    className="shadow-lg"
                    width={Math.min(window.innerWidth * 0.6, 1000)}
                    customTextRenderer={highlightedText ? customTextRenderer : undefined}
                    renderTextLayer={true}
                    renderAnnotationLayer={false}
                  />
                </Document>
              </div>

              {/* Navigation */}
              {numPages > 1 && (
                <div className="flex items-center justify-center space-x-4 p-4 border-t border-gray-700">
                  <button
                    onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                    disabled={pageNumber <= 1}
                    className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition-colors disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={numPages}
                    value={pageNumber}
                    onChange={(e) => setPageNumber(Number(e.target.value))}
                    className="bg-gray-800 text-white px-3 py-2 w-20 rounded text-center"
                  />
                  <button
                    onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
                    disabled={pageNumber >= numPages}
                    className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition-colors disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualViewer;