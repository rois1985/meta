import React, { useState, useEffect } from 'react';
import { ArrowLeft, Database, FileText, Download, Users, Bell, Globe, Target, Settings as SettingsIcon, AlertTriangle, Check, Plus, Trash2, Edit2, X } from 'lucide-react';
import { regulations } from '../data/regulations';

const Settings = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('targeting');
  const [saveMessage, setSaveMessage] = useState({ show: false, text: '', type: 'success' });
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Reviewer');
  const [targetingSettings, setTargetingSettings] = useState({
    regions: {
      global: false,
      unitedKingdom: true,
      unitedStates: true,
      canada: true,
    },
    platforms: {
      googleAds: true,
      metaAds: true,
      linkedinAds: true,
      tiktokAds: true,
      amazonAds: true,
      redditAds: true,
      pinterestAds: true,
      snapchatAds: true,
      microsoftAds: true,
      twitterAds: true,
    },
    productType: 'cryptocurrency'
  });

  const [goalsSettings, setGoalsSettings] = useState({
    targetScore: 85,
    monthlyTarget: 10,
    riskTolerance: 'medium',
  });

  const [preferencesSettings, setPreferencesSettings] = useState({
    notifications: {
      emailUpdates: true,
      highRiskAlerts: true,
      weeklySummary: false,
      regulatoryUpdates: true,
    },
    display: {
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      darkMode: false,
    }
  });

  const [accountSettings, setAccountSettings] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@company.com',
    company: 'Acme Corp',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [teamMembers, setTeamMembers] = useState([
    { id: '1', name: 'John Doe', email: 'john@company.com', role: 'Admin', initials: 'JD' },
    { id: '2', name: 'Jane Smith', email: 'jane@company.com', role: 'Reviewer', initials: 'JS' },
  ]);

  const [teamPermissions, setTeamPermissions] = useState({
    createReviews: true,
    exportReports: true,
    manageSettings: false,
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedTargeting = localStorage.getItem('targetingSettings');
    const savedGoals = localStorage.getItem('goalsSettings');
    const savedPreferences = localStorage.getItem('preferencesSettings');
    const savedAccount = localStorage.getItem('accountSettings');
    const savedTeam = localStorage.getItem('teamMembers');
    const savedPermissions = localStorage.getItem('teamPermissions');

    if (savedTargeting) setTargetingSettings(JSON.parse(savedTargeting));
    if (savedGoals) setGoalsSettings(JSON.parse(savedGoals));
    if (savedPreferences) setPreferencesSettings(JSON.parse(savedPreferences));
    if (savedAccount) {
      const parsed = JSON.parse(savedAccount);
      setAccountSettings({ ...parsed, currentPassword: '', newPassword: '', confirmPassword: '' });
    }
    if (savedTeam) setTeamMembers(JSON.parse(savedTeam));
    if (savedPermissions) setTeamPermissions(JSON.parse(savedPermissions));
  }, []);

  // Show save message helper
  const showSaveMessage = (text, type = 'success') => {
    setSaveMessage({ show: true, text, type });
    setTimeout(() => setSaveMessage({ show: false, text: '', type: 'success' }), 3000);
  };

  // Save functions
  const saveTargetingSettings = () => {
    localStorage.setItem('targetingSettings', JSON.stringify(targetingSettings));
    showSaveMessage('Targeting settings saved successfully!');
  };

  const saveGoalsSettings = () => {
    localStorage.setItem('goalsSettings', JSON.stringify(goalsSettings));
    showSaveMessage('Goals saved successfully!');
  };

  const savePreferencesSettings = () => {
    localStorage.setItem('preferencesSettings', JSON.stringify(preferencesSettings));
    showSaveMessage('Preferences saved successfully!');
  };

  const saveAccountSettings = () => {
    const { currentPassword, newPassword, confirmPassword, ...accountData } = accountSettings;
    localStorage.setItem('accountSettings', JSON.stringify(accountData));
    showSaveMessage('Account updated successfully!');
  };

  const changePassword = () => {
    if (!accountSettings.currentPassword) {
      showSaveMessage('Please enter your current password', 'error');
      return;
    }
    if (accountSettings.newPassword !== accountSettings.confirmPassword) {
      showSaveMessage('New passwords do not match', 'error');
      return;
    }
    if (accountSettings.newPassword.length < 8) {
      showSaveMessage('Password must be at least 8 characters', 'error');
      return;
    }
    setAccountSettings({ ...accountSettings, currentPassword: '', newPassword: '', confirmPassword: '' });
    showSaveMessage('Password changed successfully!');
  };

  const saveTeamPermissions = () => {
    localStorage.setItem('teamPermissions', JSON.stringify(teamPermissions));
    showSaveMessage('Team permissions saved successfully!');
  };

  const inviteTeamMember = () => {
    if (!newMemberEmail || !newMemberEmail.includes('@')) {
      showSaveMessage('Please enter a valid email address', 'error');
      return;
    }
    const initials = newMemberEmail.split('@')[0].slice(0, 2).toUpperCase();
    const newMember = {
      id: Date.now().toString(),
      name: newMemberEmail.split('@')[0],
      email: newMemberEmail,
      role: newMemberRole,
      initials,
    };
    const updatedTeam = [...teamMembers, newMember];
    setTeamMembers(updatedTeam);
    localStorage.setItem('teamMembers', JSON.stringify(updatedTeam));
    setNewMemberEmail('');
    setNewMemberRole('Reviewer');
    setShowInviteModal(false);
    showSaveMessage('Team member invited successfully!');
  };

  const removeTeamMember = (memberId) => {
    const updatedTeam = teamMembers.filter(m => m.id !== memberId);
    setTeamMembers(updatedTeam);
    localStorage.setItem('teamMembers', JSON.stringify(updatedTeam));
    showSaveMessage('Team member removed');
  };

  // Export functions
  const exportToCSV = () => {
    const headers = ['ID', 'Title', 'Description', 'Category', 'Source'];
    const csvContent = [
      headers.join(','),
      ...regulations.map(reg => 
        [reg.id, `"${reg.title}"`, `"${reg.description}"`, reg.category, reg.source].join(',')
      )
    ].join('\n');
    downloadFile(csvContent, 'regulations-export.csv', 'text/csv');
    showSaveMessage(`Exported ${regulations.length} regulations to CSV`);
  };

  const exportToJSON = () => {
    const jsonContent = JSON.stringify(regulations, null, 2);
    downloadFile(jsonContent, 'regulations-export.json', 'application/json');
    showSaveMessage(`Exported ${regulations.length} regulations to JSON`);
  };

  const exportToExcel = () => {
    const headers = ['ID', 'Title', 'Description', 'Category', 'Source'];
    const tsvContent = [
      headers.join('\t'),
      ...regulations.map(reg => 
        [reg.id, reg.title, reg.description, reg.category, reg.source].join('\t')
      )
    ].join('\n');
    downloadFile(tsvContent, 'regulations-export.xls', 'application/vnd.ms-excel');
    showSaveMessage(`Exported ${regulations.length} regulations to Excel`);
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'targeting', label: 'Targeting', icon: Target },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
    { id: 'data', label: 'Data', icon: Database },
    { id: 'account', label: 'Account', icon: Users },
  ];

  const renderTargetingTab = () => (
    <div className="space-y-6">
      {/* Default Target Regions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Default Target Regions</h3>
        <p className="text-sm text-gray-600 mb-4">Pre-selected regions for new reviews (you can change these per review)</p>
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: 'global', label: 'Global' },
            { key: 'unitedStates', label: 'United States' },
            { key: 'unitedKingdom', label: 'United Kingdom' },
            { key: 'canada', label: 'Canada' },
          ].map(region => (
            <label key={region.key} className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={targetingSettings.regions[region.key]}
                onChange={(e) => setTargetingSettings({
                  ...targetingSettings,
                  regions: { ...targetingSettings.regions, [region.key]: e.target.checked }
                })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">{region.label}</span>
            </label>
          ))}
        </div>
        <button 
          onClick={saveTargetingSettings}
          className="mt-4 px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800"
        >
          Save Region Defaults
        </button>
      </div>

      {/* Default Target Platforms */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Default Target Platforms</h3>
        <p className="text-sm text-gray-600 mb-4">Pre-selected platforms for new reviews (all platforms have both general and financial services rules)</p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { key: 'googleAds', label: 'Google Ads' },
            { key: 'metaAds', label: 'Meta Ads' },
            { key: 'linkedinAds', label: 'LinkedIn Ads' },
            { key: 'tiktokAds', label: 'TikTok Ads' },
            { key: 'amazonAds', label: 'Amazon Ads' },
            { key: 'redditAds', label: 'Reddit Ads' },
            { key: 'pinterestAds', label: 'Pinterest Ads' },
            { key: 'snapchatAds', label: 'Snapchat Ads' },
            { key: 'microsoftAds', label: 'Microsoft Ads' },
            { key: 'twitterAds', label: 'Twitter (X) Ads' },
          ].map(platform => (
            <label key={platform.key} className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={targetingSettings.platforms[platform.key]}
                onChange={(e) => setTargetingSettings({
                  ...targetingSettings,
                  platforms: { ...targetingSettings.platforms, [platform.key]: e.target.checked }
                })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">{platform.label}</span>
            </label>
          ))}
        </div>
        <button 
          onClick={saveTargetingSettings}
          className="mt-4 px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800"
        >
          Save Platform Defaults
        </button>
      </div>

      {/* Default Product Type */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Default Product Type</h3>
        <p className="text-sm text-gray-600 mb-4">Select your primary financial services category for compliance analysis</p>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Financial Services Category</label>
          <select
            value={targetingSettings.productType}
            onChange={(e) => setTargetingSettings({ ...targetingSettings, productType: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="cryptocurrency">Cryptocurrency & Digital Assets</option>
            <option value="banking">Banking & Credit Services</option>
            <option value="insurance">Insurance Products</option>
            <option value="investment">Investment Services</option>
            <option value="loans">Lending & Loans</option>
          </select>
        </div>
        <button 
          onClick={saveTargetingSettings}
          className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800"
        >
          Save Product Type Default
        </button>
      </div>
    </div>
  );

  const renderGoalsTab = () => (
    <div className="space-y-6">
      {/* Compliance Goals */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Target className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Compliance Goals</h3>
        </div>
        <p className="text-sm text-gray-600 mb-6">Set your compliance targets and track progress</p>
        
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Compliance Score</label>
            <input
              type="number"
              min="0"
              max="100"
              value={goalsSettings.targetScore}
              onChange={(e) => setGoalsSettings({ ...goalsSettings, targetScore: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Review Target</label>
            <input
              type="number"
              min="1"
              value={goalsSettings.monthlyTarget}
              onChange={(e) => setGoalsSettings({ ...goalsSettings, monthlyTarget: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Risk Tolerance Level</label>
          <select
            value={goalsSettings.riskTolerance}
            onChange={(e) => setGoalsSettings({ ...goalsSettings, riskTolerance: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="low">Low - Conservative approach</option>
            <option value="medium">Medium - Balanced approach</option>
            <option value="high">High - Aggressive approach</option>
          </select>
        </div>

        <button 
          onClick={saveGoalsSettings}
          className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800"
        >
          Save Goals
        </button>
      </div>

      {/* Progress Tracking */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Tracking</h3>
        <p className="text-sm text-gray-600 mb-6">Monitor your compliance performance</p>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Current Month Progress</span>
            <span className="text-sm text-gray-500">6/10 Reviews</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-black h-2 rounded-full" style={{ width: '60%' }}></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-gray-600">Average Score</div>
            <div className="text-2xl font-bold text-green-600">87%</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">High Risk Items</div>
            <div className="text-2xl font-bold text-red-600">3</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-600">Manage your account settings and preferences</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'targeting' && renderTargetingTab()}
        {activeTab === 'goals' && renderGoalsTab()}
        {activeTab === 'team' && (
          <div className="space-y-6">
            {/* Team Management */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Users className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Team Management</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6">Manage team members and their access levels</p>

              {/* Team Members */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-md font-medium text-gray-900">Team Members ({teamMembers.length})</h4>
                  <button 
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Invite Member</span>
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-4">Manage who can access your compliance reviews</p>

                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium text-gray-700">
                          {member.initials}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{member.name}</div>
                          <div className="text-sm text-gray-500">{member.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          member.role === 'Admin' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {member.role}
                        </span>
                        {member.role !== 'Admin' && (
                          <button 
                            onClick={() => removeTeamMember(member.id)}
                            className="text-sm text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Team Permissions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Permissions</h3>
              <p className="text-sm text-gray-600 mb-6">Configure what team members can do</p>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Create Reviews</div>
                    <div className="text-sm text-gray-500">Allow team members to create new compliance reviews</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={teamPermissions.createReviews}
                      onChange={(e) => setTeamPermissions({ ...teamPermissions, createReviews: e.target.checked })}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Export Reports</div>
                    <div className="text-sm text-gray-500">Allow team members to export compliance reports</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={teamPermissions.exportReports}
                      onChange={(e) => setTeamPermissions({ ...teamPermissions, exportReports: e.target.checked })}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Manage Settings</div>
                    <div className="text-sm text-gray-500">Allow team members to modify account settings</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={teamPermissions.manageSettings}
                      onChange={(e) => setTeamPermissions({ ...teamPermissions, manageSettings: e.target.checked })}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <button 
                onClick={saveTeamPermissions}
                className="mt-6 px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800"
              >
                Save Permissions
              </button>
            </div>
          </div>
        )}
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            {/* Notification Preferences */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Notification Preferences</h3>
              <p className="text-sm text-gray-600 mb-6">Choose how and when you want to be notified</p>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Email Notifications</div>
                    <div className="text-sm text-gray-500">Receive email updates about your reviews</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={preferencesSettings.notifications.emailUpdates}
                      onChange={(e) => setPreferencesSettings({
                        ...preferencesSettings,
                        notifications: { ...preferencesSettings.notifications, emailUpdates: e.target.checked }
                      })}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">High Risk Alerts</div>
                    <div className="text-sm text-gray-500">Get notified immediately for high-risk violations</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={preferencesSettings.notifications.highRiskAlerts}
                      onChange={(e) => setPreferencesSettings({
                        ...preferencesSettings,
                        notifications: { ...preferencesSettings.notifications, highRiskAlerts: e.target.checked }
                      })}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Weekly Summary</div>
                    <div className="text-sm text-gray-500">Receive weekly compliance summary reports</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={preferencesSettings.notifications.weeklySummary}
                      onChange={(e) => setPreferencesSettings({
                        ...preferencesSettings,
                        notifications: { ...preferencesSettings.notifications, weeklySummary: e.target.checked }
                      })}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Regulatory Updates</div>
                    <div className="text-sm text-gray-500">Get notified about new regulations and changes</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={preferencesSettings.notifications.regulatoryUpdates}
                      onChange={(e) => setPreferencesSettings({
                        ...preferencesSettings,
                        notifications: { ...preferencesSettings.notifications, regulatoryUpdates: e.target.checked }
                      })}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <button 
                onClick={savePreferencesSettings}
                className="mt-6 px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800"
              >
                Save Preferences
              </button>
            </div>

            {/* Display Preferences */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Display Preferences</h3>
              <p className="text-sm text-gray-600 mb-6">Customize how information is displayed</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                  <select
                    value={preferencesSettings.display.timezone}
                    onChange={(e) => setPreferencesSettings({
                      ...preferencesSettings,
                      display: { ...preferencesSettings.display, timezone: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="UTC">UTC</option>
                    <option value="EST">EST - Eastern Time</option>
                    <option value="PST">PST - Pacific Time</option>
                    <option value="GMT">GMT - Greenwich Mean Time</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
                  <select
                    value={preferencesSettings.display.dateFormat}
                    onChange={(e) => setPreferencesSettings({
                      ...preferencesSettings,
                      display: { ...preferencesSettings.display, dateFormat: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Dark Mode</div>
                    <div className="text-sm text-gray-500">Use dark theme for the interface</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={preferencesSettings.display.darkMode}
                      onChange={(e) => setPreferencesSettings({
                        ...preferencesSettings,
                        display: { ...preferencesSettings.display, darkMode: e.target.checked }
                      })}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <button 
                onClick={savePreferencesSettings}
                className="mt-6 px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800"
              >
                Save Display Settings
              </button>
            </div>
          </div>
        )}
        {activeTab === 'data' && (
          <div className="space-y-6">
            {/* Regulations Database Export */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Database className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Regulations Database Export</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6">Export your complete regulations database in various formats for backup, analysis, or integration with other systems.</p>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Database className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">{regulations.length}</div>
                  <div className="text-sm text-gray-600">Total Regulations</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <FileText className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">12</div>
                  <div className="text-sm text-gray-600">Data Fields</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Download className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">3</div>
                  <div className="text-sm text-gray-600">Export Formats</div>
                </div>
              </div>

              {/* Export Options */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Export Options</h4>
                <div className="grid grid-cols-3 gap-4">
                  {/* CSV Format */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <FileText className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="font-medium text-gray-900">CSV Format</div>
                        <div className="text-sm text-gray-500">Comma-separated values</div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Perfect for spreadsheet applications like Excel, Google Sheets, or data analysis tools.</p>
                    <button 
                      onClick={exportToCSV}
                      className="w-full px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                    >
                      Export CSV
                    </button>
                  </div>

                  {/* Excel Format */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="font-medium text-gray-900">Excel Format</div>
                        <div className="text-sm text-gray-500">Microsoft Excel compatible</div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Optimized for Microsoft Excel with proper formatting and tab-separated values.</p>
                    <button 
                      onClick={exportToExcel}
                      className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                    >
                      Export Excel
                    </button>
                  </div>

                  {/* JSON Format */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <FileText className="w-5 h-5 text-purple-600" />
                      <div>
                        <div className="font-medium text-gray-900">JSON Format</div>
                        <div className="text-sm text-gray-500">JavaScript Object Notation</div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Structured data format ideal for developers, APIs, and programmatic access.</p>
                    <button 
                      onClick={exportToJSON}
                      className="w-full px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700"
                    >
                      Export JSON
                    </button>
                  </div>
                </div>
              </div>

              {/* Export Details */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">Export Details</h4>
                <div className="text-sm text-gray-600 mb-3">
                  <strong>Included Fields:</strong>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm text-gray-600">
                  <div>• ID</div>
                  <div>• Title</div>
                  <div>• Platform</div>
                  <div>• Country</div>
                  <div>• Category</div>
                  <div>• Description</div>
                  <div>• Requirements</div>
                  <div>• Penalties</div>
                  <div>• Tags</div>
                  <div>• Regulation Reference</div>
                  <div>• Source URL</div>
                  <div>• Created Date</div>
                </div>
                <div className="mt-4 p-3 bg-white border border-blue-200 rounded text-sm text-gray-700">
                  <strong>Note:</strong> Exported files include all regulations in your database with complete metadata. Files are named with the current date for easy organization.
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'account' && (
          <div className="space-y-6">
            {/* Account Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Information</h3>
              <p className="text-sm text-gray-600 mb-6">Manage your account details and security settings</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    value={accountSettings.firstName}
                    onChange={(e) => setAccountSettings({ ...accountSettings, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={accountSettings.lastName}
                    onChange={(e) => setAccountSettings({ ...accountSettings, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={accountSettings.email}
                  onChange={(e) => setAccountSettings({ ...accountSettings, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="john@company.com"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                <input
                  type="text"
                  value={accountSettings.company}
                  onChange={(e) => setAccountSettings({ ...accountSettings, company: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Acme Corp"
                />
              </div>

              <button 
                onClick={saveAccountSettings}
                className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800"
              >
                Update Account
              </button>
            </div>

            {/* Security Settings */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Security Settings</h3>
              <p className="text-sm text-gray-600 mb-6">Manage your password and security preferences</p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <input
                    type="password"
                    value={accountSettings.currentPassword}
                    onChange={(e) => setAccountSettings({ ...accountSettings, currentPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    value={accountSettings.newPassword}
                    onChange={(e) => setAccountSettings({ ...accountSettings, newPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={accountSettings.confirmPassword}
                    onChange={(e) => setAccountSettings({ ...accountSettings, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <button 
                onClick={changePassword}
                className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800"
              >
                Change Password
              </button>
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-lg border border-red-200 p-6">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-semibold text-red-900">Danger Zone</h3>
              </div>
              <p className="text-sm text-red-600 mb-6">Irreversible actions that affect your account</p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="text-md font-medium text-red-900 mb-2">Delete Account</h4>
                <p className="text-sm text-red-700 mb-4">
                  Once you delete your account, there is no going back. All your reviews, settings, and data will be permanently deleted.
                </p>
                <button 
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                      showSaveMessage('Account deletion requested. Please contact support.', 'error');
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Message Toast */}
      {saveMessage.show && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 z-50 ${
          saveMessage.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {saveMessage.type === 'success' ? (
            <Check className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
          <span>{saveMessage.text}</span>
        </div>
      )}

      {/* Invite Team Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Invite Team Member</h3>
              <button 
                onClick={() => setShowInviteModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="colleague@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Reviewer">Reviewer</option>
                  <option value="Editor">Editor</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={inviteTeamMember}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
