import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertTriangle, Clock, ExternalLink } from 'lucide-react';
import { regulationUpdateService, updatedRegulationUrls } from '../../services/regulationUpdateService';

const RegulationUpdateManager = ({ onClose }) => {
  const [updateStatus, setUpdateStatus] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdateResults, setLastUpdateResults] = useState(null);

  useEffect(() => {
    // Load initial status
    setUpdateStatus(regulationUpdateService.getUpdateStatus());
    setLastUpdateResults(regulationUpdateService.getLastUpdateResults());
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      const results = await regulationUpdateService.updateAllRegulations();
      setLastUpdateResults(results);
      setUpdateStatus(regulationUpdateService.getUpdateStatus());
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleForceUpdate = async () => {
    setIsUpdating(true);
    try {
      const results = await regulationUpdateService.forceUpdate();
      setLastUpdateResults(results);
      setUpdateStatus(regulationUpdateService.getUpdateStatus());
    } catch (error) {
      console.error('Force update failed:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Regulation Update Manager</h1>
              <p className="text-gray-600">Manage and update advertising regulation links</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
              {isUpdating ? 'Updating...' : 'Check Updates'}
            </button>
            <button
              onClick={handleForceUpdate}
              disabled={isUpdating}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
              Force Update
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Update Status Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Update Status</h2>
          
          {updateStatus && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Last Update</span>
                </div>
                <p className="text-blue-700 mt-1">
                  {updateStatus.lastUpdate ? 
                    new Date(updateStatus.lastUpdate).toLocaleDateString() : 
                    'Never'
                  }
                </p>
              </div>

              <div className={`p-4 rounded-lg ${updateStatus.needsUpdate ? 'bg-yellow-50' : 'bg-green-50'}`}>
                <div className="flex items-center space-x-2">
                  {updateStatus.needsUpdate ? (
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  <span className={`text-sm font-medium ${updateStatus.needsUpdate ? 'text-yellow-900' : 'text-green-900'}`}>
                    Status
                  </span>
                </div>
                <p className={updateStatus.needsUpdate ? 'text-yellow-700' : 'text-green-700'}>
                  {updateStatus.needsUpdate ? 'Needs Update' : 'Up to Date'}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Sources</span>
                </div>
                <p className="text-gray-700 mt-1">{updateStatus.sources} authorities</p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">Next Update</span>
                </div>
                <p className="text-purple-700 mt-1">
                  {updateStatus.nextUpdate === 'immediate' ? 
                    'Immediate' : 
                    new Date(updateStatus.nextUpdate).toLocaleDateString()
                  }
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Latest Update Results */}
        {lastUpdateResults && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Latest Update Results</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Update completed:</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(lastUpdateResults.timestamp).toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">
                    {lastUpdateResults.updatedRegulations.length}
                  </div>
                  <div className="text-sm text-green-600">Updated Regulations</div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">
                    {lastUpdateResults.newRegulations.length}
                  </div>
                  <div className="text-sm text-blue-600">New Regulations</div>
                </div>

                <div className={`p-4 rounded-lg ${lastUpdateResults.errors.length > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <div className={`text-2xl font-bold ${lastUpdateResults.errors.length > 0 ? 'text-red-700' : 'text-gray-700'}`}>
                    {lastUpdateResults.errors.length}
                  </div>
                  <div className={`text-sm ${lastUpdateResults.errors.length > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    Errors
                  </div>
                </div>
              </div>

              {lastUpdateResults.errors.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-red-900 mb-2">Errors</h3>
                  <div className="space-y-2">
                    {lastUpdateResults.errors.map((error, index) => (
                      <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="font-medium text-red-800">{error.authority}</div>
                        <div className="text-sm text-red-600">{error.error}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Updated URLs Preview */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Updated Regulation URLs</h2>
          
          <div className="space-y-6">
            {Object.entries(updatedRegulationUrls).map(([authority, urls]) => (
              <div key={authority} className="border-b border-gray-200 pb-4 last:border-b-0">
                <h3 className="font-semibold text-gray-900 mb-3">{authority}</h3>
                <div className="space-y-2">
                  {urls.map((url, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                      <a 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline flex-1"
                      >
                        {url}
                      </a>
                      <span className="text-gray-500">Active</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Auto-Update Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Auto-Update Settings</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Automatic Updates</h3>
                <p className="text-sm text-gray-600">Check for regulation updates every 24 hours</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Update Notifications</h3>
                <p className="text-sm text-gray-600">Show notifications when new regulations are found</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Active Sources: {updateStatus?.sources || 0}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Update Interval: 24 hours</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Validation: Enabled</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegulationUpdateManager;
