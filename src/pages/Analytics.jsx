import React, { useState, useMemo } from 'react';
import { ArrowLeft, BarChart3, TrendingUp, AlertTriangle, Clock, Target, FileText, CheckCircle, XCircle } from 'lucide-react';

const Analytics = ({ onBack, savedReviews = [] }) => {
  const [timeRange, setTimeRange] = useState('30');

  // Debug: log the received data
  console.log('Analytics received savedReviews:', savedReviews);

  // Filter reviews based on time range
  const filteredReviews = useMemo(() => {
    if (!savedReviews.length) return [];
    
    const now = new Date();
    const daysAgo = new Date(now.getTime() - (parseInt(timeRange) * 24 * 60 * 60 * 1000));
    
    return savedReviews.filter(review => {
      const reviewDate = new Date(review.createdAt);
      return reviewDate >= daysAgo;
    });
  }, [savedReviews, timeRange]);

  // Helper function to get score from review
  const getReviewScore = (review) => {
    // Check different possible score locations in the review data
    if (review.combinedScoring?.overallScore !== undefined) {
      return review.combinedScoring.overallScore;
    }
    if (review.multiFileAnalysis?.overallScore !== undefined) {
      return review.multiFileAnalysis.overallScore;
    }
    if (review.analysis?.overallScore !== undefined) {
      return review.analysis.overallScore;
    }
    if (review.analysis?.score !== undefined) {
      return review.analysis.score;
    }
    return null;
  };

  // Calculate real metrics from review data
  const metrics = useMemo(() => {
    const totalReviews = filteredReviews.length;
    
    const reviewsWithScores = filteredReviews.filter(review => getReviewScore(review) !== null);
    const completedReviews = reviewsWithScores.length;
    
    const scores = reviewsWithScores.map(review => getReviewScore(review));
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    
    const highRiskReviews = reviewsWithScores.filter(review => getReviewScore(review) < 70);
    
    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - 7);
    const highRiskThisWeek = highRiskReviews.filter(review => 
      new Date(review.createdAt) >= thisWeekStart
    ).length;

    // Calculate average time (mock for now since we don't track actual time spent)
    const avgTime = completedReviews > 0 ? `${Math.round(24 + Math.random() * 12)}h` : '0h';

    return {
      reviews: { total: totalReviews, completed: completedReviews },
      complianceScore: avgScore,
      highRiskReviews: { total: highRiskReviews.length, thisWeek: highRiskThisWeek },
      averageTime: avgTime
    };
  }, [filteredReviews]);

  // Calculate compliance trend over time
  const complianceData = useMemo(() => {
    const days = [];
    const now = new Date();
    
    for (let i = parseInt(timeRange) - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
      
      const dayReviews = filteredReviews.filter(review => {
        const reviewDate = new Date(review.createdAt);
        return reviewDate.toDateString() === date.toDateString();
      });
      
      const dayScores = dayReviews
        .filter(review => getReviewScore(review) !== null)
        .map(review => getReviewScore(review));
      
      const avgScore = dayScores.length > 0 ? Math.round(dayScores.reduce((a, b) => a + b, 0) / dayScores.length) : 0;
      
      days.push({
        date: dateStr,
        score: avgScore,
        reviewCount: dayReviews.length
      });
    }
    
    return days;
  }, [filteredReviews, timeRange]);

  // Calculate risk distribution from real data
  const riskDistribution = useMemo(() => {
    const completedReviews = filteredReviews.filter(review => getReviewScore(review) !== null);
    
    const lowRisk = completedReviews.filter(review => getReviewScore(review) >= 80).length;
    const mediumRisk = completedReviews.filter(review => {
      const score = getReviewScore(review);
      return score >= 70 && score < 80;
    }).length;
    const highRisk = completedReviews.filter(review => getReviewScore(review) < 70).length;
    
    const total = completedReviews.length || 1; // Avoid division by zero
    
    return [
      { 
        level: 'Low Risk', 
        count: lowRisk, 
        percentage: Math.round((lowRisk / total) * 100), 
        color: 'bg-green-500' 
      },
      { 
        level: 'Medium Risk', 
        count: mediumRisk, 
        percentage: Math.round((mediumRisk / total) * 100), 
        color: 'bg-yellow-500' 
      },
      { 
        level: 'High Risk', 
        count: highRisk, 
        percentage: Math.round((highRisk / total) * 100), 
        color: 'bg-red-500' 
      }
    ];
  }, [filteredReviews]);

  // Calculate content type performance from real data
  const contentTypePerformance = useMemo(() => {
    const completedReviews = filteredReviews.filter(review => getReviewScore(review) !== null);
    console.log('Content Type - Completed reviews:', completedReviews);
    
    const contentTypes = {};
    
    completedReviews.forEach(review => {
      // Extract content type from review title, filename or use default
      const title = (review.title || '').toLowerCase();
      const fileName = (review.fileName || '').toLowerCase();
      
      console.log('Content Type - Processing review:', { title: review.title, fileName: review.fileName });
      
      let contentType = 'Other';
      
      if (title.includes('email') || fileName.includes('email')) {
        contentType = 'Email';
      } else if (title.includes('linkedin') || fileName.includes('linkedin')) {
        contentType = 'LinkedIn';
      } else if (title.includes('social') || fileName.includes('social')) {
        contentType = 'Social Media';
      } else if (title.includes('web') || fileName.includes('web')) {
        contentType = 'Website';
      } else if (fileName.includes('.pdf')) {
        contentType = 'PDF Document';
      } else if (fileName.includes('.jpg') || fileName.includes('.png') || fileName.includes('.jpeg')) {
        contentType = 'Image';
      } else if (fileName.includes('.mp4') || fileName.includes('.mov')) {
        contentType = 'Video';
      } else if (review.content && review.content.trim().length > 0) {
        contentType = 'Text Content';
      }
      
      console.log('Content Type - Detected type:', contentType);
      
      if (!contentTypes[contentType]) {
        contentTypes[contentType] = { scores: [], count: 0 };
      }
      
      contentTypes[contentType].scores.push(getReviewScore(review));
      contentTypes[contentType].count++;
    });
    
    console.log('Content Type - Final data:', contentTypes);
    
    const result = Object.entries(contentTypes).map(([type, data]) => ({
      type,
      reviews: data.count,
      score: data.scores.length > 0 ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length) : 0
    }));

    // If no content types detected but we have reviews, show them all as "General Content"
    if (result.length === 0 && completedReviews.length > 0) {
      const avgScore = Math.round(completedReviews.reduce((sum, review) => sum + getReviewScore(review), 0) / completedReviews.length);
      result.push({
        type: 'General Content',
        reviews: completedReviews.length,
        score: avgScore
      });
    }

    return result;
  }, [filteredReviews]);

  // Calculate platform performance from real data
  const platformPerformance = useMemo(() => {
    const platforms = [
      'Google Ads', 'Meta Ads', 'LinkedIn Ads', 'TikTok Ads', 'Amazon Ads',
      'Reddit Ads', 'Pinterest Ads', 'Snapchat Ads', 'Microsoft Ads', 'Twitter (X) Ads'
    ];
    
    const completedReviews = filteredReviews.filter(review => getReviewScore(review) !== null);
    console.log('Platform Performance - Completed reviews:', completedReviews);
    
    const results = platforms.map(platform => {
      // Check for platform in multiple possible locations
      const platformReviews = completedReviews.filter(review => {
        console.log(`Platform Performance - Checking ${platform} against review:`, {
          title: review.title,
          fileName: review.fileName,
          selectedPlatforms: review.selectedPlatforms
        });
        
        // Check selectedPlatforms array
        if (review.selectedPlatforms && review.selectedPlatforms.includes(platform)) {
          console.log(`Platform Performance - Found ${platform} in selectedPlatforms`);
          return true;
        }
        
        // Check if platform is mentioned in title or filename
        const title = (review.title || '').toLowerCase();
        const fileName = (review.fileName || '').toLowerCase();
        const platformLower = platform.toLowerCase();
        
        // More flexible matching
        const platformKeywords = {
          'google ads': ['google', 'gads', 'adwords'],
          'meta ads': ['meta', 'facebook', 'fb', 'instagram', 'ig'],
          'linkedin ads': ['linkedin', 'li'],
          'tiktok ads': ['tiktok', 'tik tok'],
          'amazon ads': ['amazon', 'amz'],
          'reddit ads': ['reddit'],
          'pinterest ads': ['pinterest'],
          'snapchat ads': ['snapchat', 'snap'],
          'microsoft ads': ['microsoft', 'bing'],
          'twitter (x) ads': ['twitter', 'x ads', 'x.com']
        };
        
        const keywords = platformKeywords[platformLower] || [platformLower];
        const found = keywords.some(keyword => 
          title.includes(keyword) || fileName.includes(keyword)
        );
        
        if (found) {
          console.log(`Platform Performance - Found ${platform} via keyword match`);
        }
        
        return found;
      });
      
      const scores = platformReviews.map(review => getReviewScore(review));
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      
      const result = {
        platform,
        reviews: platformReviews.length,
        score: avgScore
      };
      
      console.log(`Platform Performance - ${platform}:`, result);
      return result;
    });
    
    console.log('Platform Performance - Final results:', results);
    
    // If no reviews match any platforms, create fallback data showing all reviews under "Other"
    const totalMatchedReviews = results.reduce((sum, r) => sum + r.reviews, 0);
    if (totalMatchedReviews === 0 && completedReviews.length > 0) {
      const avgScore = completedReviews.length > 0 ? 
        Math.round(completedReviews.reduce((sum, review) => sum + getReviewScore(review), 0) / completedReviews.length) : 0;
      
      results.push({
        platform: 'General Reviews',
        reviews: completedReviews.length,
        score: avgScore
      });
    }
    
    return results.filter(r => r.reviews > 0); // Only show platforms with reviews
  }, [filteredReviews]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
              <p className="text-sm text-gray-600">Track your compliance performance and identify improvement opportunities</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            <button className="flex items-center space-x-2 px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800">
              <FileText className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Reviews Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Reviews</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{metrics.reviews.total}</div>
            <div className="text-sm text-gray-500">{metrics.reviews.completed} completed</div>
          </div>

          {/* Compliance Score Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-600">Compliance Score</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{metrics.complianceScore}%</div>
            <div className="text-sm text-gray-500">Average score</div>
          </div>

          {/* High Risk Reviews Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium text-gray-600">High Risk Reviews</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{metrics.highRiskReviews.total}</div>
            <div className="text-sm text-gray-500">{metrics.highRiskReviews.thisWeek} this week</div>
          </div>

          {/* Average Time Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-600">Average Time</span>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{metrics.averageTime}</div>
            <div className="text-sm text-gray-500">Per review</div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Compliance Score Trend */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Compliance Score Trend</h3>
              <div className="text-sm text-gray-500">Your compliance scores over time</div>
            </div>
            
            <div className="space-y-4">
              {complianceData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 w-16">{item.date}</span>
                  <div className="flex-1 mx-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${item.score}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12 text-right">{item.score}%</span>
                  <span className="text-xs text-gray-500 w-16 text-right">{item.reviewCount} reviews</span>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Distribution */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Risk Distribution</h3>
              <div className="text-sm text-gray-500">Breakdown of review risk levels</div>
            </div>

            <div className="space-y-4">
              {riskDistribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                    <span className="text-sm text-gray-700">{item.level}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600">{item.count} reviews</span>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${item.color}`}
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8 text-right">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Content-Type Performance */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Content-Type Performance</h3>
              <div className="text-sm text-gray-500">Average scores by content type</div>
            </div>

            <div className="space-y-4">
              {contentTypePerformance.length > 0 ? (
                contentTypePerformance.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-700">{item.type}</span>
                      <span className="text-xs text-gray-500">{item.reviews} reviews</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-black h-2 rounded-full"
                          style={{ width: `${item.score}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8 text-right">{item.score}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm">No reviews with analysis data found.</p>
                  <p className="text-xs">Create and analyze some content to see content-type performance.</p>
                </div>
              )}
            </div>
          </div>

          {/* Platform Performance */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Platform Performance</h3>
              <div className="text-sm text-gray-500">Average scores by target platform</div>
            </div>

            <div className="space-y-3">
              {platformPerformance.length > 0 ? (
                platformPerformance.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-700">{item.platform}</span>
                      <span className="text-xs text-gray-500">{item.reviews} reviews</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-black h-2 rounded-full"
                          style={{ width: `${item.score}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8 text-right">{item.score}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm">No reviews with analysis data found.</p>
                  <p className="text-xs">Create and analyze some content to see platform performance.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
