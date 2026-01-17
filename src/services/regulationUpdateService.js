/**
 * Regulation Update Service
 * Handles fetching and updating regulation data from various authorities
 */

class RegulationUpdateService {
  constructor() {
    this.lastUpdate = localStorage.getItem('regulationsLastUpdate') || null;
    this.updateInterval = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    this.regulationSources = this.initializeSources();
  }

  /**
   * Initialize regulation source endpoints and patterns
   */
  initializeSources() {
    return {
      // Canadian authorities
      'ASC Canada - FCAC': {
        baseUrl: 'https://www.canada.ca/en/financial-consumer-agency',
        endpoints: [
          '/services/industry/guidance-regulations.html',
          '/corporate/supervision/guidance-regulations.html'
        ],
        lastChecked: null
      },
      'ASC Canada - CRTC': {
        baseUrl: 'https://crtc.gc.ca',
        endpoints: [
          '/eng/television/publicit.htm',
          '/eng/archive/acrtc/eng/acts/broadcasting.htm'
        ],
        lastChecked: null
      },
      'ASC Canada - Competition Bureau': {
        baseUrl: 'https://www.competitionbureau.gc.ca',
        endpoints: [
          '/eic/site/cb-bc.nsf/eng/home',
          '/eic/site/cb-bc.nsf/eng/04014.html'
        ],
        lastChecked: null
      },
      'ASC Canada - Ad Standards': {
        baseUrl: 'https://adstandards.ca',
        endpoints: [
          '/code/',
          '/about/canadian-code-of-advertising-standards/'
        ],
        lastChecked: null
      },

      // US authorities
      'CFPB US': {
        baseUrl: 'https://www.consumerfinance.gov',
        endpoints: [
          '/policy-compliance/rulemaking/rules-in-effect/',
          '/compliance/compliance-resources/mortgage-resources/tila-respa-integrated-disclosures/'
        ],
        lastChecked: null
      },
      'FTC US': {
        baseUrl: 'https://www.ftc.gov',
        endpoints: [
          '/business-guidance/advertising-marketing',
          '/business-guidance/advertising-marketing/truth-advertising',
          '/business-guidance/advertising-marketing/endorsements-testimonials'
        ],
        lastChecked: null
      },

      // UK authorities
      'FCA UK': {
        baseUrl: 'https://www.handbook.fca.org.uk',
        endpoints: [
          '/handbook/MCOB/',
          '/handbook/COBS/',
          '/handbook/PERG/'
        ],
        lastChecked: null
      },
      'ASA UK': {
        baseUrl: 'https://www.asa.org.uk',
        endpoints: [
          '/codes-and-rulings/advertising-codes.html',
          '/codes-and-rulings/advertising-codes/cap-code.html',
          '/codes-and-rulings/advertising-codes/bcap-code.html'
        ],
        lastChecked: null
      },
      'CMA UK': {
        baseUrl: 'https://www.gov.uk/government/organisations/competition-and-markets-authority',
        endpoints: [
          '/guidance',
          '/policy-papers-and-consultations'
        ],
        lastChecked: null
      },

      // Platform-specific
      'Meta': {
        baseUrl: 'https://transparency.meta.com',
        endpoints: [
          '/policies/ad-standards/',
          '/policies/ad-standards/financial-products-and-services/',
          '/policies/community-standards/'
        ],
        lastChecked: null
      },
      'Google': {
        baseUrl: 'https://support.google.com',
        endpoints: [
          '/adspolicy/answer/6008942',
          '/adspolicy/answer/2464998',
          '/adspolicy/answer/143465'
        ],
        lastChecked: null
      },
      'Amazon': {
        baseUrl: 'https://advertising.amazon.com',
        endpoints: [
          '/resources/ad-policy/general-policies',
          '/resources/ad-policy/creative-acceptance-policies'
        ],
        lastChecked: null
      },
      'Microsoft': {
        baseUrl: 'https://about.ads.microsoft.com',
        endpoints: [
          '/en-us/policies/editorial',
          '/en-us/policies/advertising-policies'
        ],
        lastChecked: null
      },
      'TikTok': {
        baseUrl: 'https://ads.tiktok.com',
        endpoints: [
          '/help/article/tiktok-ads-policies',
          '/help/article/creative-policies'
        ],
        lastChecked: null
      },
      'Twitter/X': {
        baseUrl: 'https://business.twitter.com',
        endpoints: [
          '/en/help/ads-policies.html',
          '/en/help/ads-policies/ads-content-policies.html'
        ],
        lastChecked: null
      },
      'Reddit': {
        baseUrl: 'https://www.redditinc.com',
        endpoints: [
          '/policies/advertising-policy',
          '/policies/content-policy'
        ],
        lastChecked: null
      },
      'Pinterest': {
        baseUrl: 'https://policy.pinterest.com',
        endpoints: [
          '/en/advertising-guidelines',
          '/en/community-guidelines'
        ],
        lastChecked: null
      },
      'Snapchat': {
        baseUrl: 'https://values.snap.com',
        endpoints: [
          '/policy/advertising-policies',
          '/policy/community-guidelines'
        ],
        lastChecked: null
      }
    };
  }

  /**
   * Check if regulations need updating
   */
  needsUpdate() {
    if (!this.lastUpdate) return true;
    
    const lastUpdateTime = new Date(this.lastUpdate).getTime();
    const now = Date.now();
    
    return (now - lastUpdateTime) > this.updateInterval;
  }

  /**
   * Fetch latest regulation updates from all sources
   */
  async updateAllRegulations() {
    console.log('Starting regulation update process...');
    
    const updates = {
      timestamp: new Date().toISOString(),
      updatedRegulations: [],
      newRegulations: [],
      errors: []
    };

    try {
      // Check each regulation source
      for (const [authority, source] of Object.entries(this.regulationSources)) {
        try {
          const sourceUpdates = await this.checkAuthorityUpdates(authority, source);
          updates.updatedRegulations.push(...sourceUpdates.updated);
          updates.newRegulations.push(...sourceUpdates.new);
          
          // Update last checked timestamp
          source.lastChecked = new Date().toISOString();
          
          // Add small delay to avoid overwhelming servers
          await this.delay(1000);
          
        } catch (error) {
          console.error(`Error updating ${authority}:`, error);
          updates.errors.push({
            authority,
            error: error.message
          });
        }
      }

      // Save update timestamp
      this.lastUpdate = updates.timestamp;
      localStorage.setItem('regulationsLastUpdate', this.lastUpdate);
      localStorage.setItem('regulationUpdateResults', JSON.stringify(updates));

      console.log('Regulation update completed:', updates);
      return updates;

    } catch (error) {
      console.error('Regulation update failed:', error);
      updates.errors.push({
        authority: 'System',
        error: error.message
      });
      return updates;
    }
  }

  /**
   * Check for updates from a specific authority
   */
  async checkAuthorityUpdates(authority, source) {
    const updates = {
      updated: [],
      new: []
    };

    // For now, return updated URLs for known authorities
    // In production, this would fetch and parse actual regulation pages
    const updatedUrls = await this.getUpdatedUrls(authority, source);
    
    if (updatedUrls.length > 0) {
      updates.updated.push({
        authority,
        urls: updatedUrls,
        timestamp: new Date().toISOString()
      });
    }

    return updates;
  }

  /**
   * Get updated URLs for a specific authority
   */
  async getUpdatedUrls(authority, source) {
    const updatedUrls = [];

    try {
      // Build full URLs from source endpoints
      for (const endpoint of source.endpoints) {
        const fullUrl = source.baseUrl + endpoint;
        
        // In production, you would fetch the URL and check for updates
        // For now, we'll return the constructed URLs
        updatedUrls.push({
          url: fullUrl,
          lastModified: new Date().toISOString(),
          status: 'active'
        });
      }
    } catch (error) {
      console.error(`Error getting URLs for ${authority}:`, error);
    }

    return updatedUrls;
  }

  /**
   * Get regulation update status
   */
  getUpdateStatus() {
    return {
      lastUpdate: this.lastUpdate,
      needsUpdate: this.needsUpdate(),
      sources: Object.keys(this.regulationSources).length,
      nextUpdate: this.lastUpdate ? 
        new Date(new Date(this.lastUpdate).getTime() + this.updateInterval).toISOString() : 
        'immediate'
    };
  }

  /**
   * Force update of regulations
   */
  async forceUpdate() {
    this.lastUpdate = null;
    localStorage.removeItem('regulationsLastUpdate');
    return await this.updateAllRegulations();
  }

  /**
   * Get cached update results
   */
  getLastUpdateResults() {
    const cached = localStorage.getItem('regulationUpdateResults');
    return cached ? JSON.parse(cached) : null;
  }

  /**
   * Utility function to add delays
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate regulation URL accessibility
   */
  async validateUrl(url) {
    try {
      // In production, this would make actual HTTP requests to validate URLs
      // For now, we'll simulate validation
      return {
        url,
        accessible: true,
        lastChecked: new Date().toISOString(),
        redirectUrl: null
      };
    } catch (error) {
      return {
        url,
        accessible: false,
        lastChecked: new Date().toISOString(),
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const regulationUpdateService = new RegulationUpdateService();

// Export updated regulation URLs with latest endpoints
export const updatedRegulationUrls = {
  // Canadian authorities - updated to more specific regulation pages
  'ASC Canada - FCAC': [
    'https://www.canada.ca/en/financial-consumer-agency/services/industry/guidance-regulations.html',
    'https://www.canada.ca/en/financial-consumer-agency/corporate/supervision/guidance-regulations.html',
    'https://www.canada.ca/en/financial-consumer-agency/services/industry/commissioner-guidance/guidance-payment-card-networks-payment-service-providers.html'
  ],
  'ASC Canada - CRTC': [
    'https://crtc.gc.ca/eng/television/publicit.htm',
    'https://crtc.gc.ca/eng/statutes/CRTC.htm'
  ],
  'ASC Canada - Competition Bureau': [
    'https://www.competitionbureau.gc.ca/eic/site/cb-bc.nsf/eng/04014.html',
    'https://www.competitionbureau.gc.ca/eic/site/cb-bc.nsf/eng/03133.html'
  ],
  'ASC Canada - Ad Standards': [
    'https://adstandards.ca/about/canadian-code-of-advertising-standards/',
    'https://adstandards.ca/code/section-1-accuracy-and-clarity/'
  ],

  // US authorities - updated to specific regulation documents
  'CFPB US': [
    'https://www.consumerfinance.gov/policy-compliance/rulemaking/rules-in-effect/truth-in-lending-act/',
    'https://www.consumerfinance.gov/policy-compliance/rulemaking/rules-in-effect/mortgage-servicing/',
    'https://www.consumerfinance.gov/policy-compliance/rulemaking/rules-in-effect/fair-credit-reporting-act/'
  ],
  'FTC US': [
    'https://www.ftc.gov/business-guidance/advertising-marketing/truth-advertising',
    'https://www.ftc.gov/business-guidance/advertising-marketing/endorsements-testimonials',
    'https://www.ftc.gov/business-guidance/advertising-marketing/environmental-claims'
  ],

  // UK authorities - updated to specific handbook sections
  'FCA UK': [
    'https://www.handbook.fca.org.uk/handbook/MCOB/3/',
    'https://www.handbook.fca.org.uk/handbook/COBS/4/',
    'https://www.handbook.fca.org.uk/handbook/PERG/8/'
  ],
  'ASA UK': [
    'https://www.asa.org.uk/codes-and-rulings/advertising-codes/cap-code.html',
    'https://www.asa.org.uk/codes-and-rulings/advertising-codes/bcap-code.html'
  ],
  'CMA UK': [
    'https://www.gov.uk/government/publications/consumer-protection-from-unfair-trading-regulations-2008',
    'https://www.gov.uk/government/publications/pricing-practices-guide'
  ],

  // Platform-specific - updated to latest policy pages
  'Meta': [
    'https://transparency.meta.com/policies/ad-standards/',
    'https://transparency.meta.com/policies/ad-standards/financial-products-and-services/',
    'https://www.facebook.com/business/help/2050652021924714'
  ],
  'Google': [
    'https://support.google.com/adspolicy/answer/6008942?hl=en',
    'https://support.google.com/adspolicy/answer/2464998?hl=en',
    'https://support.google.com/adspolicy/answer/143465?hl=en'
  ],
  'Amazon': [
    'https://advertising.amazon.com/resources/ad-policy/general-policies',
    'https://advertising.amazon.com/resources/ad-policy/creative-acceptance-policies',
    'https://advertising.amazon.com/resources/ad-policy/restricted-products'
  ],
  'Microsoft': [
    'https://about.ads.microsoft.com/en-us/policies/editorial',
    'https://about.ads.microsoft.com/en-us/policies/advertising-policies',
    'https://about.ads.microsoft.com/en-us/policies/prohibited-content'
  ],
  'TikTok': [
    'https://ads.tiktok.com/help/article/tiktok-ads-policies?lang=en',
    'https://ads.tiktok.com/help/article/creative-policies?lang=en',
    'https://www.tiktok.com/community-guidelines/en/'
  ],
  'Twitter/X': [
    'https://business.twitter.com/en/help/ads-policies/ads-content-policies.html',
    'https://business.twitter.com/en/help/ads-policies/restricted-content-policies.html',
    'https://business.twitter.com/en/help/ads-policies/prohibited-content-policies.html'
  ],
  'Reddit': [
    'https://www.redditinc.com/policies/advertising-policy',
    'https://www.redditinc.com/policies/content-policy',
    'https://www.reddit.com/help/healthycommunities/'
  ],
  'Pinterest': [
    'https://policy.pinterest.com/en/advertising-guidelines',
    'https://policy.pinterest.com/en/community-guidelines',
    'https://policy.pinterest.com/en/advertising-standards'
  ],
  'Snapchat': [
    'https://values.snap.com/policy/advertising-policies',
    'https://values.snap.com/policy/community-guidelines',
    'https://businesshelp.snapchat.com/s/article/ad-policies'
  ]
};

export default RegulationUpdateService;
