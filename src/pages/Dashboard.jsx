import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  Compass,
  FileText,
  ChevronDown,
  ChevronLeft,
  ExternalLink,
  Bell,
  HelpCircle,
  BarChart3,
  Settings,
  Loader2,
  LogOut,
  User,
  Trash2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/ui/Logo';
import { ComplianceChecker } from '../components/dashboard/ComplianceChecker';
import { ProfileModal } from '../components/dashboard/ProfileModal';
import SettingsPage from './Settings';
import Analytics from './Analytics';
import { demoUser } from '../data/demoData';
import { regulations, platforms, countries, categories, subverticals } from '../data/regulations';

export function Dashboard() {
  const [showChecker, setShowChecker] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [activeNav, setActiveNav] = useState('explore');
  const [reviewsExpanded, setReviewsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    platform: 'All Platforms',
    country: 'All Countries',
    category: 'All Categories',
    subvertical: 'All Subverticals',
  });
  const [approvalFilters, setApprovalFilters] = useState({
    allReviews: false,
    approved: false,
    needsReview: false,
    rejected: false,
  });
  const [riskFilters, setRiskFilters] = useState({
    lowRisk: false,
    mediumRisk: false,
    highRisk: false,
  });
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [currentUser, setCurrentUser] = useState(demoUser);
  const [savedReviews, setSavedReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const navigate = useNavigate();

  // Load saved reviews on component mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('complianceReviews');
      if (saved && saved !== 'undefined' && saved !== 'null') {
        const reviews = JSON.parse(saved);
        if (Array.isArray(reviews)) {
          setSavedReviews(reviews);
        } else {
          setSavedReviews([]);
          localStorage.removeItem('complianceReviews');
        }
      } else {
        setSavedReviews([]);
      }
    } catch (error) {
      console.error('Error loading reviews from localStorage:', error);
      setSavedReviews([]);
      localStorage.removeItem('complianceReviews');
    }
  }, []);

  // Static notifications (backend API optional)
  const defaultNotifications = [
    {
      id: 'notif_001',
      type: 'Law Change',
      priority: 'High',
      title: 'FDA Updates Supplement Advertising Rules',
      description: 'New FDA guidelines for supplement advertising went into effect.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      read: false,
      authority: 'FDA'
    },
    {
      id: 'notif_002',
      type: 'Compliance Alert',
      priority: 'Medium',
      title: 'Google Ads Policy Update',
      description: 'Google has updated their healthcare advertising policies.',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      read: false,
      authority: 'Google'
    },
    {
      id: 'notif_003',
      type: 'Law Change',
      priority: 'High',
      title: 'FTC Endorsement Guidelines Updated',
      description: 'New FTC requirements for influencer marketing disclosures.',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      read: false,
      authority: 'FTC'
    }
  ];

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      const data = await response.json();
      if (data.success && data.notifications && data.notifications.length > 0) {
        setNotifications(data.notifications);
        setNotificationCount(data.notifications.filter(n => !n.read).length);
        return;
      }
    } catch (error) {
      console.log('Error fetching notifications:', error);
    }
    // Fallback to default notifications
    setNotifications(defaultNotifications);
    setNotificationCount(defaultNotifications.filter(n => !n.read).length);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Delete saved review
  const deleteReview = (reviewId) => {
    const updatedReviews = savedReviews.filter(review => review.id !== reviewId);
    setSavedReviews(updatedReviews);
    localStorage.setItem('complianceReviews', JSON.stringify(updatedReviews));
  };

  // Save review
  const handleSaveReview = (reviewData) => {
    const updatedReviews = [...savedReviews, reviewData];
    setSavedReviews(updatedReviews);
    localStorage.setItem('complianceReviews', JSON.stringify(updatedReviews));
    
    // Create notification for completed analysis - DISABLED
    // notificationService.addAnalysisCompleteNotification(reviewData);
  };

  // Load saved review
  const loadReview = (reviewData) => {
    setSelectedReview(reviewData);
    setShowChecker(true);
  };

  const handleLogout = () => {
    navigate('/login');
  };

  const handleProfileSave = (updatedData) => {
    setCurrentUser(prev => ({
      ...prev,
      ...updatedData,
      initials: updatedData.name.split(' ').map(n => n[0]).join('').toUpperCase()
    }));
  };

  // Filter reviews based on approval status and risk level
  const getFilteredReviews = () => {
    return savedReviews.filter(review => {
      const score = review.analysis?.score || review.multiFileAnalysis?.overallScore || 0;
      
      // Approval Status filtering
      // If "All Reviews" is checked, skip approval filtering
      if (!approvalFilters.allReviews) {
        const hasSpecificApprovalFilter = approvalFilters.approved || approvalFilters.needsReview || approvalFilters.rejected;
        
        if (hasSpecificApprovalFilter) {
          let matchesApprovalFilter = false;
          if (approvalFilters.approved && score >= 85) matchesApprovalFilter = true;
          if (approvalFilters.needsReview && score >= 60 && score < 85) matchesApprovalFilter = true;
          if (approvalFilters.rejected && score < 60) matchesApprovalFilter = true;
          
          if (!matchesApprovalFilter) return false;
        }
      }
      
      // Risk Level filtering
      const hasRiskFilter = riskFilters.lowRisk || riskFilters.mediumRisk || riskFilters.highRisk;
      if (hasRiskFilter) {
        let matchesRiskFilter = false;
        
        if (riskFilters.lowRisk && score >= 85) matchesRiskFilter = true;
        if (riskFilters.mediumRisk && score >= 60 && score < 85) matchesRiskFilter = true;
        if (riskFilters.highRisk && score < 60) matchesRiskFilter = true;
        
        if (!matchesRiskFilter) return false;
      }
      
      return true;
    });
  };

  const filteredRegulations = regulations.filter(reg => {
    const matchesSearch = searchQuery === '' || 
      reg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // More precise platform matching - check if regulation title starts with platform name
    const matchesPlatform = selectedFilters.platform === 'All Platforms' || 
      reg.title.toLowerCase().startsWith(selectedFilters.platform.toLowerCase());
    
    // Country matching - look for country keywords in title and source
    let matchesCountry = selectedFilters.country === 'All Countries';
    if (!matchesCountry) {
      const country = selectedFilters.country.toLowerCase();
      if (country === 'united kingdom') {
        matchesCountry = reg.title.toLowerCase().includes('uk') || 
                        reg.source.toLowerCase().includes('uk') ||
                        reg.title.toLowerCase().includes('united kingdom');
      } else if (country === 'united states') {
        matchesCountry = reg.title.toLowerCase().includes('us') || 
                        reg.source.toLowerCase().includes('us') ||
                        reg.title.toLowerCase().includes('united states') ||
                        reg.title.toLowerCase().includes('ftc') ||
                        reg.title.toLowerCase().includes('cfpb');
      } else if (country === 'canada') {
        matchesCountry = reg.title.toLowerCase().includes('canada') || 
                        reg.source.toLowerCase().includes('canada') ||
                        reg.title.toLowerCase().includes('asc');
      } else {
        matchesCountry = reg.title.toLowerCase().includes(country) ||
                        reg.source.toLowerCase().includes(country);
      }
    }
    
    const matchesCategory = selectedFilters.category === 'All Categories' || 
      reg.category === selectedFilters.category;
    
    const matchesSubvertical = selectedFilters.subvertical === 'All Subverticals' || 
      reg.title.toLowerCase().includes(selectedFilters.subvertical.toLowerCase()) ||
      reg.description.toLowerCase().includes(selectedFilters.subvertical.toLowerCase());
    
    // Debug logging for multiple filter combinations
    if ((selectedFilters.platform !== 'All Platforms' || 
         selectedFilters.country !== 'All Countries' || 
         selectedFilters.category !== 'All Categories' || 
         selectedFilters.subvertical !== 'All Subverticals' || 
         searchQuery) && (reg.id === 'reg_001' || reg.id === 'reg_050' || reg.id === 'reg_100')) {
      console.log(`DEBUG Filter Test for ${reg.id}:`, reg.title);
      console.log('- Applied filters:', {
        platform: selectedFilters.platform !== 'All Platforms' ? selectedFilters.platform : 'ALL',
        country: selectedFilters.country !== 'All Countries' ? selectedFilters.country : 'ALL', 
        category: selectedFilters.category !== 'All Categories' ? selectedFilters.category : 'ALL',
        subvertical: selectedFilters.subvertical !== 'All Subverticals' ? selectedFilters.subvertical : 'ALL',
        search: searchQuery || 'NONE'
      });
      console.log('- Individual matches:');
      console.log(`  * search: ${matchesSearch}`);
      console.log(`  * platform: ${matchesPlatform}`);
      console.log(`  * country: ${matchesCountry}`);
      console.log(`  * category: ${matchesCategory}`);
      console.log(`  * subvertical: ${matchesSubvertical}`);
      console.log('- COMBINED RESULT (ALL must be true):', matchesSearch && matchesPlatform && matchesCountry && matchesCategory && matchesSubvertical);
      console.log('---');
    }
    
    return matchesSearch && matchesPlatform && matchesCountry && matchesCategory && matchesSubvertical;
  });

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Mobile Menu Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-30 md:hidden hidden"
        id="overlay"
        onClick={() => {
          const sidebar = document.getElementById('sidebar');
          const overlay = document.getElementById('overlay');
          sidebar.classList.add('-translate-x-full');
          overlay.classList.add('hidden');
        }}
      />
      
      {/* Sidebar - Dark Blue */}
      <aside className="w-56 lg:w-56 md:w-64 bg-[#1e3a5f] fixed h-full flex flex-col z-40 md:translate-x-0 -translate-x-full transition-transform duration-300" id="sidebar">
        {/* Logo */}
        <div className="p-6 flex items-center justify-center">
          <Logo size="md" />
        </div>

        {/* Search */}
        <div className="px-3 mb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search regulations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white/10 border border-white/10 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-white/30"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="px-3 mb-4">
          <button 
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="flex items-center gap-2 text-white/60 hover:text-white text-sm py-2 w-full"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            <span className="ml-auto bg-white/20 text-white text-xs px-1.5 py-0.5 rounded">
              {(approvalFilters.approved ? 1 : 0) + (approvalFilters.needsReview ? 1 : 0) + (approvalFilters.rejected ? 1 : 0) + Object.values(riskFilters).filter(v => v).length}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${filtersExpanded ? 'rotate-180' : ''}`} />
          </button>
          
          {filtersExpanded && (
            <div className="mt-3 space-y-3">
              {/* Approval Status */}
              <div>
                <div className="text-white/80 text-xs font-medium mb-2 px-1">Approval Status</div>
                <div className="space-y-1">
                  <label className="flex items-center gap-2 px-1 py-1 text-xs text-white/70 hover:text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={approvalFilters.allReviews}
                      onChange={(e) => {
                        if (e.target.checked) {
                          // When All Reviews is checked, uncheck all specific filters
                          setApprovalFilters({
                            allReviews: true,
                            approved: false,
                            needsReview: false,
                            rejected: false,
                          });
                        } else {
                          // When All Reviews is unchecked, just uncheck it
                          setApprovalFilters({
                            ...approvalFilters,
                            allReviews: false
                          });
                        }
                      }}
                      className="w-3 h-3 rounded border-white/30 bg-white/10 text-blue-500 focus:ring-1 focus:ring-blue-500/30"
                    />
                    <span>All Reviews</span>
                  </label>
                  <label className="flex items-center gap-2 px-1 py-1 text-xs text-white/70 hover:text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={approvalFilters.approved}
                      onChange={(e) => setApprovalFilters({
                        ...approvalFilters,
                        approved: e.target.checked,
                        allReviews: false
                      })}
                      className="w-3 h-3 rounded border-white/30 bg-white/10 text-blue-500 focus:ring-1 focus:ring-blue-500/30"
                    />
                    <span>Approved</span>
                  </label>
                  <label className="flex items-center gap-2 px-1 py-1 text-xs text-white/70 hover:text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={approvalFilters.needsReview}
                      onChange={(e) => setApprovalFilters({
                        ...approvalFilters,
                        needsReview: e.target.checked,
                        allReviews: false
                      })}
                      className="w-3 h-3 rounded border-white/30 bg-white/10 text-blue-500 focus:ring-1 focus:ring-blue-500/30"
                    />
                    <span>Needs Review</span>
                  </label>
                  <label className="flex items-center gap-2 px-1 py-1 text-xs text-white/70 hover:text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={approvalFilters.rejected}
                      onChange={(e) => setApprovalFilters({
                        ...approvalFilters,
                        rejected: e.target.checked,
                        allReviews: false
                      })}
                      className="w-3 h-3 rounded border-white/30 bg-white/10 text-blue-500 focus:ring-1 focus:ring-blue-500/30"
                    />
                    <span>Rejected</span>
                  </label>
                </div>
              </div>

              {/* Risk Level */}
              <div>
                <div className="text-white/80 text-xs font-medium mb-2 px-1">Risk Level</div>
                <div className="space-y-1">
                  <label className="flex items-center gap-2 px-1 py-1 text-xs text-white/70 hover:text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={riskFilters.lowRisk}
                      onChange={(e) => setRiskFilters({
                        ...riskFilters,
                        lowRisk: e.target.checked
                      })}
                      className="w-3 h-3 rounded border-white/30 bg-white/10 text-blue-500 focus:ring-1 focus:ring-blue-500/30"
                    />
                    <span>Low Risk</span>
                  </label>
                  <label className="flex items-center gap-2 px-1 py-1 text-xs text-white/70 hover:text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={riskFilters.mediumRisk}
                      onChange={(e) => setRiskFilters({
                        ...riskFilters,
                        mediumRisk: e.target.checked
                      })}
                      className="w-3 h-3 rounded border-white/30 bg-white/10 text-blue-500 focus:ring-1 focus:ring-blue-500/30"
                    />
                    <span>Medium Risk</span>
                  </label>
                  <label className="flex items-center gap-2 px-1 py-1 text-xs text-white/70 hover:text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={riskFilters.highRisk}
                      onChange={(e) => setRiskFilters({
                        ...riskFilters,
                        highRisk: e.target.checked
                      })}
                      className="w-3 h-3 rounded border-white/30 bg-white/10 text-blue-500 focus:ring-1 focus:ring-blue-500/30"
                    />
                    <span>High Risk</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1">
          <button
            onClick={() => setShowChecker(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm font-medium">New Review</span>
          </button>


          <button
            onClick={() => setActiveNav('explore')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              activeNav === 'explore'
                ? 'bg-blue-500 text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Compass className="w-5 h-5" />
            <span className="text-sm font-medium">Explore</span>
          </button>

          <div>
            <button
              onClick={() => setReviewsExpanded(!reviewsExpanded)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <FileText className="w-5 h-5" />
              <span className="text-sm font-medium">Reviews</span>
              {savedReviews.length > 0 && (
                <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 rounded ml-auto mr-2">
                  {getFilteredReviews().length}
                </span>
              )}
              <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${reviewsExpanded ? 'rotate-180' : ''}`} />
            </button>
            {reviewsExpanded && (
              <div className="ml-6 mt-1 space-y-1">
                {savedReviews.length === 0 ? (
                  <div className="text-sm text-white/50 py-2 px-2">
                    No reviews yet
                  </div>
                ) : (
                  getFilteredReviews().map((review, index) => (
                    <div
                      key={review.id || `review-${index}`}
                      className="group flex items-center gap-2 px-2 py-1.5 text-sm text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
                    >
                      <button
                        onClick={() => loadReview(review)}
                        className="flex-1 text-left truncate"
                        title={review.title || 'Untitled Review'}
                      >
                        {review.title || `Review ${index + 1}`}
                      </button>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className={`w-2 h-2 rounded-full ${
                          review.analysis?.status === 'passed' ? 'bg-green-400' :
                          review.analysis?.status === 'warning' ? 'bg-orange-400' : 'bg-red-400'
                        }`} title={`${review.analysis?.score || 0}% - ${review.analysis?.status || 'unknown'}`} />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Delete this review?')) {
                              deleteReview(review.id);
                            }
                          }}
                          className="p-0.5 text-white/40 hover:text-red-400 transition-colors"
                          title="Delete review"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-2 text-white/50 text-xs mb-3">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading usage...</span>
          </div>
                    <div className="flex items-center gap-4 px-2">
            <button 
              onClick={() => setShowAnalytics(true)}
              className="flex items-center gap-2 text-white/60 hover:text-white text-sm"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>
            <button 
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 text-white/60 hover:text-white text-sm"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-white/60 hover:text-white text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-56 lg:ml-56 min-h-screen">
        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden fixed top-4 left-4 z-50 p-2 bg-[#1e3a5f] text-white rounded-lg"
          onClick={() => {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('overlay');
            sidebar.classList.remove('-translate-x-full');
            overlay.classList.remove('hidden');
          }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Top Header - Blue Gradient */}
        <header className="bg-gradient-to-r from-blue-600 to-blue-500 px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-white text-lg md:text-xl font-semibold">Welcome back!</h1>
              <p className="text-white/80 text-xs md:text-sm">Manage your compliance reviews and stay compliant across all platforms</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-white/80 hover:text-white relative transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </span>
                  )}
                </button>
              </div>
              <button className="p-2 text-white/80 hover:text-white">
                <HelpCircle className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setShowProfileModal(true)}
                className="w-9 h-9 bg-yellow-400 rounded-full flex items-center justify-center text-[#1e3a5f] font-semibold text-sm hover:bg-yellow-300 transition-colors cursor-pointer"
                title="Edit Profile"
              >
                {currentUser.initials}
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-4 md:p-8 pb-20 md:pb-8">
          {showChecker ? (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-6xl max-h-[90vh] overflow-auto">
                <ComplianceChecker 
                  onClose={() => {
                    setShowChecker(false);
                    setSelectedReview(null);
                  }}
                  selectedReview={selectedReview}
                  onSaveReview={(reviewData) => {
                    const existingIndex = savedReviews.findIndex(review => review.id === reviewData.id);
                    let updatedReviews;
                    
                    if (existingIndex !== -1) {
                      // Update existing review
                      updatedReviews = [...savedReviews];
                      updatedReviews[existingIndex] = reviewData;
                    } else {
                      // Add new review
                      updatedReviews = [...savedReviews, reviewData];
                    }
                    
                    setSavedReviews(updatedReviews);
                    localStorage.setItem('complianceReviews', JSON.stringify(updatedReviews));
                  }}
                />
              </div>
            </div>
          ) : showAnalytics ? (
            <Analytics 
              onBack={() => setShowAnalytics(false)} 
              savedReviews={savedReviews}
            />
          ) : showSettings ? (
            <SettingsPage onBack={() => setShowSettings(false)} />
          ) : (
            <>
              {/* Explore Header */}
              <div className="mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Explore</h2>
                <p className="text-gray-500 text-sm md:text-base">Discover fintech ads for inspiration and stay updated on compliance regulations</p>
              </div>

              {/* Tabs */}
              <div className="mb-6">
                <div className="border-b border-gray-200">
                  <button className="px-4 md:px-6 py-3 text-sm font-medium text-gray-900 border-b-2 border-gray-900">
                    Regulations
                  </button>
                </div>
              </div>

              {/* Filter Bar */}
              <div className="space-y-4 md:space-y-0 md:flex md:flex-row md:items-center md:gap-4 mb-6">
                <div className="relative w-full md:flex-1 md:max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search regulations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 md:flex md:gap-4">
                  {[
                    { key: 'platform', options: platforms },
                    { key: 'country', options: countries },
                    { key: 'category', options: categories },
                    { key: 'subvertical', options: subverticals },
                  ].map(({ key, options }) => (
                    <div key={key} className="relative">
                      <select
                        value={selectedFilters[key]}
                        onChange={(e) => {
                          console.log(`Filter changed: ${key} = ${e.target.value}`);
                          setSelectedFilters({ ...selectedFilters, [key]: e.target.value });
                        }}
                        className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer w-full"
                      >
                        {options.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Results Count */}
              <p className="text-sm text-gray-500 mb-6">
                Showing {filteredRegulations.length} of {regulations.length} regulations
                {(selectedFilters.platform !== 'All Platforms' || 
                  selectedFilters.country !== 'All Countries' || 
                  selectedFilters.category !== 'All Categories' || 
                  selectedFilters.subvertical !== 'All Subverticals' || 
                  searchQuery) && (
                  <span className="ml-2 text-blue-600 text-xs">
                    (Filters: {selectedFilters.platform !== 'All Platforms' ? selectedFilters.platform : ''}
                    {selectedFilters.country !== 'All Countries' ? (selectedFilters.platform !== 'All Platforms' ? ', ' : '') + selectedFilters.country : ''}
                    {selectedFilters.category !== 'All Categories' ? (selectedFilters.platform !== 'All Platforms' || selectedFilters.country !== 'All Countries' ? ', ' : '') + selectedFilters.category : ''}
                    {selectedFilters.subvertical !== 'All Subverticals' ? (selectedFilters.platform !== 'All Platforms' || selectedFilters.country !== 'All Countries' || selectedFilters.category !== 'All Categories' ? ', ' : '') + selectedFilters.subvertical : ''}
                    {searchQuery ? (selectedFilters.platform !== 'All Platforms' || selectedFilters.country !== 'All Countries' || selectedFilters.category !== 'All Categories' || selectedFilters.subvertical !== 'All Subverticals' ? ', ' : '') + 'Search: "' + searchQuery + '"' : ''})
                  </span>
                )}
              </p>

              {/* Regulations Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filteredRegulations.map((reg) => (
                  <div key={reg.id} className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-sm md:text-base font-semibold text-gray-900 leading-tight pr-4">
                        {reg.title}
                      </h3>
                      <a href={reg.source} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 shrink-0">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    <p className="text-xs md:text-sm text-gray-500 mb-4 line-clamp-2">
                      {reg.description}
                    </p>
                    <div className="mb-4">
                      <span className="inline-block bg-gray-100 text-gray-800 text-xs font-semibold px-2 md:px-3 py-1 rounded-md">
                        {reg.category}
                      </span>
                    </div>
                    <a 
                      href={reg.source} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-full py-2 md:py-2.5 border border-gray-200 rounded-lg text-xs md:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Official Source
                    </a>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal
          user={currentUser}
          onClose={() => setShowProfileModal(false)}
          onSave={handleProfileSave}
        />
      )}

      {/* Notification Sidebar - Real-time from Scraping System */}
      {showNotifications && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setShowNotifications(false)}
          />
          <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="w-5 h-5 text-gray-700" />
                  <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                  {notificationCount > 0 && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">{notificationCount}</span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={async () => {
                      try {
                        await fetch('/api/notifications/mark-all-read', { method: 'POST' });
                        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                        setNotificationCount(0);
                      } catch (e) {
                        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                        setNotificationCount(0);
                      }
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Mark all read
                  </button>
                  <button 
                    onClick={() => setShowNotifications(false)} 
                    className="p-1 hover:bg-gray-100 rounded-full"
                  >
                    <span className="text-gray-500 text-xl leading-none">&times;</span>
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Real-time updates from regulation sources
              </p>
              <button
                onClick={async () => {
                  if (isCheckingUpdates) return;
                  setIsCheckingUpdates(true);
                  try {
                    const response = await fetch('/api/check-updates', { method: 'POST' });
                    const data = await response.json();
                    console.log('Update check result:', data);
                    await fetchNotifications();
                    alert(`Update check complete! ${data.newNotifications || 0} new notifications found.`);
                  } catch (e) {
                    console.log('Error checking updates:', e);
                    // Refresh with default notifications
                    setNotifications(defaultNotifications);
                    setNotificationCount(defaultNotifications.filter(n => !n.read).length);
                    alert('Notifications refreshed!');
                  } finally {
                    setIsCheckingUpdates(false);
                  }
                }}
                disabled={isCheckingUpdates}
                className={`mt-2 text-xs flex items-center gap-1 ${isCheckingUpdates ? 'text-gray-400' : 'text-blue-600 hover:text-blue-800'}`}
              >
                <span className={isCheckingUpdates ? 'animate-spin' : ''}>↻</span> 
                {isCheckingUpdates ? 'Checking...' : 'Check for updates now'}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No notifications yet</p>
                  <p className="text-xs mt-1">Updates will appear when new regulations are detected</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const typeColors = {
                    'Law Change': { text: 'text-red-600', bg: 'bg-red-100', badge: 'text-red-700' },
                    'Compliance Alert': { text: 'text-orange-600', bg: 'bg-orange-100', badge: 'text-orange-700' },
                    'System': { text: 'text-blue-600', bg: 'bg-blue-100', badge: 'text-blue-700' },
                    'Account': { text: 'text-purple-600', bg: 'bg-purple-100', badge: 'text-purple-700' }
                  };
                  const priorityColors = {
                    'High': { bg: 'bg-red-100', text: 'text-red-700' },
                    'Medium': { bg: 'bg-orange-100', text: 'text-orange-700' },
                    'Low': { bg: 'bg-blue-100', text: 'text-blue-700' }
                  };
                  const colors = typeColors[notif.type] || typeColors['System'];
                  const priorityColor = priorityColors[notif.priority] || priorityColors['Low'];
                  
                  const timeAgo = (timestamp) => {
                    const now = new Date();
                    const time = new Date(timestamp);
                    const diff = Math.floor((now - time) / 1000);
                    if (diff < 60) return 'Just now';
                    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
                    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
                    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
                    return time.toLocaleDateString();
                  };
                  
                  return (
                    <div 
                      key={notif.id}
                      className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${!notif.read ? 'bg-blue-50/50' : ''}`}
                      onClick={async () => {
                        if (!notif.read) {
                          try {
                            await fetch(`/api/notifications/${notif.id}/read`, { method: 'POST' });
                          } catch (e) {}
                          setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
                          setNotificationCount(prev => Math.max(0, prev - 1));
                        }
                      }}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`text-xs font-medium ${colors.text}`}>{notif.type}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColor.bg} ${priorityColor.text}`}>
                          {notif.priority}
                        </span>
                        <span className="text-xs text-gray-400">{timeAgo(notif.timestamp)}</span>
                        {!notif.read && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
                      </div>
                      <h4 className="font-medium text-gray-900 text-sm">{notif.title}</h4>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notif.description}</p>
                      {notif.authority && (
                        <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                          {notif.authority}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
