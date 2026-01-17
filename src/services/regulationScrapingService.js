/**
 * Regulation Scraping Service
 * Handles scraping and parsing of regulatory content from authority websites
 */

import { regulations } from '../data/regulations';

class RegulationScrapingService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
    this.scraped_regulations = this.loadCache();
    this.isScrapingInProgress = false;
  }

  /**
   * Load cached regulation content from localStorage
   */
  loadCache() {
    try {
      const cached = localStorage.getItem('scrapedRegulations');
      if (cached) {
        const data = JSON.parse(cached);
        // Check if cache is still valid
        if (data.timestamp && (Date.now() - data.timestamp) < this.cacheExpiry) {
          return data.regulations || {};
        }
      }
    } catch (error) {
      console.error('Error loading regulation cache:', error);
    }
    return {};
  }

  /**
   * Save scraped regulations to localStorage
   */
  saveCache() {
    try {
      const cacheData = {
        timestamp: Date.now(),
        regulations: this.scraped_regulations
      };
      localStorage.setItem('scrapedRegulations', JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error saving regulation cache:', error);
    }
  }

  /**
   * Scrape regulation content from a URL using a proxy/CORS solution
   */
  async scrapeRegulationContent(url) {
    try {
      console.log(`Scraping regulation content from: ${url}`);
      
      // Since we can't directly scrape due to CORS, we'll simulate the process
      // In production, this would use a backend proxy or scraping service
      const mockScrapedContent = await this.simulateRegulationScraping(url);
      
      return {
        url,
        content: mockScrapedContent.content,
        requirements: mockScrapedContent.requirements,
        violations: mockScrapedContent.violations,
        keyPoints: mockScrapedContent.keyPoints,
        lastScraped: new Date().toISOString(),
        status: 'success'
      };
      
    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
      return {
        url,
        content: '',
        requirements: [],
        violations: [],
        keyPoints: [],
        lastScraped: new Date().toISOString(),
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Simulate regulation scraping with realistic regulatory content
   * In production, this would be replaced with actual scraping
   */
  async simulateRegulationScraping(url) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Determine authority type from URL
    let authority = 'Unknown';
    let content = '';
    let requirements = [];
    let violations = [];
    let keyPoints = [];

    if (url.includes('canada.ca') || url.includes('fcac')) {
      authority = 'FCAC Canada';
      content = this.getFCACContent();
      requirements = this.getFCACRequirements();
      violations = this.getFCACViolations();
      keyPoints = this.getFCACKeyPoints();
    } else if (url.includes('consumerfinance.gov') || url.includes('cfpb')) {
      authority = 'CFPB US';
      content = this.getCFPBContent();
      requirements = this.getCFPBRequirements();
      violations = this.getCFPBViolations();
      keyPoints = this.getCFPBKeyPoints();
    } else if (url.includes('ftc.gov')) {
      authority = 'FTC US';
      content = this.getFTCContent();
      requirements = this.getFTCRequirements();
      violations = this.getFTCViolations();
      keyPoints = this.getFTCKeyPoints();
    } else if (url.includes('handbook.fca.org.uk')) {
      authority = 'FCA UK';
      content = this.getFCAContent();
      requirements = this.getFCARequirements();
      violations = this.getFCAViolations();
      keyPoints = this.getFCAKeyPoints();
    } else if (url.includes('asa.org.uk')) {
      authority = 'ASA UK';
      content = this.getASAContent();
      requirements = this.getASARequirements();
      violations = this.getASAViolations();
      keyPoints = this.getASAKeyPoints();
    } else if (url.includes('transparency.meta.com')) {
      authority = 'Meta';
      content = this.getMetaContent();
      requirements = this.getMetaRequirements();
      violations = this.getMetaViolations();
      keyPoints = this.getMetaKeyPoints();
    } else if (url.includes('support.google.com/adspolicy')) {
      authority = 'Google Ads';
      content = this.getGoogleContent();
      requirements = this.getGoogleRequirements();
      violations = this.getGoogleViolations();
      keyPoints = this.getGoogleKeyPoints();
    } else {
      // Generic regulatory content
      content = this.getGenericContent();
      requirements = this.getGenericRequirements();
      violations = this.getGenericViolations();
      keyPoints = this.getGenericKeyPoints();
    }

    return {
      authority,
      content,
      requirements,
      violations,
      keyPoints
    };
  }

  /**
   * FCAC Canada regulatory content
   */
  getFCACContent() {
    return `Financial Consumer Agency of Canada (FCAC) Payment Card Industry Requirements:

1. SALES AND BUSINESS PRACTICES
- All marketing materials must clearly disclose fees, terms, and conditions
- Sales representatives must provide complete information before contract signing
- No misleading representations about benefits, rewards, or savings
- Clear disclosure of merchant agreement terms and cancellation rights

2. FEE DISCLOSURE AND TRANSPARENCY
- All fees must be disclosed upfront in marketing materials
- Processing fees, monthly fees, and additional charges must be clearly stated
- Fee increases require 90 days written notice to merchants
- Comparative claims must be substantiated and accurate

3. CONTRACT CANCELLATION RIGHTS
- Merchants have right to cancel within 30 days without penalty
- Fee increases trigger new 30-day cancellation period
- Cancellation process must be clearly explained in marketing
- No additional fees for exercising cancellation rights

4. MULTIPLE CONTRACTS RESTRICTION
- Cannot circumvent cancellation rights through multiple related contracts
- All related agreements must respect the same cancellation terms
- Bundled services must allow individual cancellation where applicable`;
  }

  getFCACRequirements() {
    return [
      'Upfront fee disclosure in all marketing materials',
      '90-day notice required for fee increases',
      '30-day cancellation period without penalty',
      'Clear explanation of merchant agreement terms',
      'Substantiation required for comparative claims',
      'No misleading representations about benefits',
      'Complete information disclosure before signing',
      'Respect cancellation rights across multiple contracts'
    ];
  }

  getFCACViolations() {
    return [
      'Hidden fees or charges not disclosed upfront',
      'Misleading claims about savings or benefits',
      'Inadequate cancellation notice or process',
      'Fee increases without proper 90-day notice',
      'Bundled contracts that prevent individual cancellation',
      'Sales pressure or incomplete information disclosure',
      'Circumventing cancellation rights through multiple agreements'
    ];
  }

  getFCACKeyPoints() {
    return [
      'Payment card industry marketing requires complete transparency',
      'Merchant protection through mandatory cancellation rights',
      'Fee disclosure must be upfront and comprehensive',
      'Comparative claims require proper substantiation'
    ];
  }

  /**
   * CFPB US regulatory content
   */
  getCFPBContent() {
    return `Consumer Financial Protection Bureau (CFPB) Truth in Lending Requirements:

1. TRUTH IN LENDING ACT (TILA)
- Annual Percentage Rate (APR) must be prominently displayed
- All finance charges must be disclosed before consummation
- Right of rescission for certain transactions
- Clear and conspicuous disclosure requirements

2. MORTGAGE ADVERTISING STANDARDS
- Specific trigger terms require additional disclosures
- Representative examples must be based on actual terms
- Equal Housing Opportunity statement required
- State licensing information must be included

3. CREDIT CARD MARKETING
- Schumer Box required for credit card offers
- Penalty APR disclosure requirements
- Balance transfer and cash advance terms
- Foreign transaction fee disclosure

4. CONSUMER PROTECTION STANDARDS
- Prohibition on unfair, deceptive, or abusive practices
- Clear and prominent disclosure requirements
- Substantiation of advertising claims required
- Record keeping requirements for compliance`;
  }

  getCFPBRequirements() {
    return [
      'APR must be prominently displayed in advertising',
      'All finance charges disclosed before consummation',
      'Trigger terms require additional mandatory disclosures',
      'Representative examples based on actual available terms',
      'Equal Housing Opportunity statement in mortgage ads',
      'Schumer Box format for credit card solicitations',
      'Clear disclosure of penalty rates and fees',
      'Substantiation required for all advertising claims'
    ];
  }

  getCFPBViolations() {
    return [
      'Missing or inadequate APR disclosure',
      'Incomplete finance charge information',
      'Misleading representative examples',
      'Missing Equal Housing Opportunity statement',
      'Inadequate credit card terms disclosure',
      'Unsubstantiated advertising claims',
      'Unfair, deceptive, or abusive practices',
      'Failure to provide required rescission rights'
    ];
  }

  getCFPBKeyPoints() {
    return [
      'Truth in Lending requires comprehensive rate and fee disclosure',
      'Mortgage advertising has specific trigger term requirements',
      'Credit card marketing must use standardized disclosure formats',
      'Consumer protection focuses on preventing deceptive practices'
    ];
  }

  /**
   * FTC US regulatory content  
   */
  getFTCContent() {
    return `Federal Trade Commission (FTC) Truth in Advertising Standards:

1. TRUTH IN ADVERTISING PRINCIPLES
- Advertisements must be truthful and not misleading
- Advertisers must have evidence to back up their claims
- Advertisements cannot be unfair
- Special requirements for certain industries and products

2. ENDORSEMENT GUIDELINES
- Material connections must be disclosed
- Endorsements must reflect honest opinions and experiences
- Advertisers are responsible for endorser compliance
- Clear and prominent disclosure requirements

3. ENVIRONMENTAL CLAIMS
- Environmental marketing claims must be substantiated
- Avoid broad, unqualified claims
- Clear and prominent disclosure of limitations
- Third-party certification standards

4. DIGITAL MARKETING STANDARDS
- Same truth-in-advertising principles apply online
- Native advertising must be clearly identified
- Social media disclosures must be clear and prominent
- Influencer marketing disclosure requirements`;
  }

  getFTCRequirements() {
    return [
      'All advertising claims must be truthful and substantiated',
      'Material connections in endorsements must be disclosed',
      'Environmental claims require proper substantiation',
      'Native advertising must be clearly identified as ads',
      'Social media disclosures must be clear and prominent',
      'Advertisers responsible for endorser compliance',
      'Evidence required to support advertising claims',
      'Special disclosure requirements for certain industries'
    ];
  }

  getFTCViolations() {
    return [
      'Unsubstantiated or false advertising claims',
      'Failure to disclose material connections in endorsements',
      'Misleading environmental or health claims',
      'Native advertising not clearly identified',
      'Inadequate social media disclosures',
      'Unfair or deceptive advertising practices',
      'Missing industry-specific required disclosures'
    ];
  }

  getFTCKeyPoints() {
    return [
      'Truth in advertising requires substantiation of all claims',
      'Endorsement relationships must be transparently disclosed',
      'Digital marketing subject to same standards as traditional advertising',
      'Environmental and health claims have heightened requirements'
    ];
  }

  /**
   * FCA UK regulatory content
   */
  getFCAContent() {
    return `Financial Conduct Authority (FCA) UK Financial Promotions Rules:

1. MCOB MORTGAGE ADVERTISING
- Representative APR requirements for mortgage advertising
- Risk warnings for mortgage products
- Clear explanation of product features and risks
- Affordability and eligibility criteria disclosure

2. FINANCIAL PROMOTIONS RULES
- Fair, clear and not misleading requirement
- Adequate risk warnings for investment products
- Balanced presentation of benefits and risks
- Target audience appropriateness

3. CONSUMER CREDIT ADVERTISING
- Representative example requirements
- Total amount of credit and APR disclosure
- Duration of agreement and total amount payable
- Cash price and deposit requirements

4. INVESTMENT ADVERTISING
- Risk warnings for complex products
- Past performance disclaimers
- Regulatory status disclosure
- Suitability and target market considerations`;
  }

  getFCARequirements() {
    return [
      'Representative APR prominently displayed in mortgage ads',
      'Adequate risk warnings for all financial products',
      'Fair, clear and not misleading presentation',
      'Balanced disclosure of benefits and risks',
      'Representative examples based on actual terms available',
      'Total amount of credit and charges disclosed',
      'Regulatory status and permissions clearly stated',
      'Target market appropriateness considerations'
    ];
  }

  getFCAViolations() {
    return [
      'Missing or inadequate representative APR',
      'Insufficient risk warnings for products',
      'Misleading or unclear promotional content',
      'Unbalanced presentation favoring benefits over risks',
      'Representative examples not based on available terms',
      'Missing total cost of credit disclosure',
      'Inadequate regulatory status disclosure',
      'Promoting to inappropriate target audiences'
    ];
  }

  getFCAKeyPoints() {
    return [
      'Financial promotions must be fair, clear and not misleading',
      'Representative examples and APR disclosure mandatory',
      'Risk warnings required proportionate to product complexity',
      'Target audience appropriateness must be considered'
    ];
  }

  /**
   * ASA UK regulatory content
   */
  getASAContent() {
    return `Advertising Standards Authority (ASA) UK CAP Code:

1. CAP CODE ADVERTISING STANDARDS
- Advertisements must not mislead or cause harm
- Substantiation required for objective claims
- Social responsibility in advertising
- Protection of children and vulnerable groups

2. FINANCIAL ADVERTISING RULES
- Financial promotions must be clear and balanced
- Risk warnings proportionate to product complexity
- Representative examples based on typical cases
- Regulatory compliance with FCA requirements

3. DIGITAL MARKETING STANDARDS
- Clearly identifiable advertising content
- Appropriate targeting and audience selection
- Social media advertising guidelines
- Native advertising identification requirements

4. CONSUMER PROTECTION RULES
- Price claims must be accurate and substantiated
- Availability claims must be current and accurate
- Comparative advertising must be fair and factual
- Environmental claims require proper substantiation`;
  }

  getASARequirements() {
    return [
      'All advertising claims must be substantiated with evidence',
      'Advertisements must not mislead consumers',
      'Social responsibility considerations in content',
      'Protection measures for children and vulnerable groups',
      'Financial promotions require clear risk information',
      'Digital advertising must be clearly identifiable',
      'Price and availability claims must be accurate',
      'Comparative claims must be fair and factual'
    ];
  }

  getASAViolations() {
    return [
      'Misleading or unsubstantiated advertising claims',
      'Harmful or irresponsible advertising content',
      'Inadequate protection for children or vulnerable groups',
      'Financial promotions without adequate risk warnings',
      'Native advertising not clearly identified',
      'Inaccurate price or availability claims',
      'Unfair comparative advertising',
      'Environmental claims without proper substantiation'
    ];
  }

  getASAKeyPoints() {
    return [
      'UK advertising must be legal, decent, honest and truthful',
      'Substantiation required for all objective claims',
      'Special protection for children and vulnerable consumers',
      'Financial advertising subject to additional FCA compliance'
    ];
  }

  /**
   * Meta platform regulatory content
   */
  getMetaContent() {
    return `Meta Advertising Standards and Policies:

1. COMMUNITY STANDARDS
- Authentic identity and genuine community building
- Safety and security of users paramount
- Respect for dignity and individual rights
- Protection from harassment and bullying

2. FINANCIAL SERVICES POLICY
- Restricted financial products and services
- Cryptocurrency and binary options limitations
- Loan and credit services restrictions
- Investment and trading platform guidelines

3. PROHIBITED CONTENT POLICY
- Illegal products and services banned
- Adult content and services restrictions
- Weapons and dangerous goods prohibitions
- Counterfeit and intellectual property violations

4. PERSONAL ATTRIBUTES POLICY
- No discrimination based on protected characteristics
- Inclusive advertising practices required
- Respectful targeting and audience selection
- Equal opportunity advertising requirements`;
  }

  getMetaRequirements() {
    return [
      'Authentic representation of products and services',
      'Compliance with financial services restrictions',
      'Respectful and inclusive advertising content',
      'No discrimination in targeting or content',
      'Protection of user safety and security',
      'Respect for intellectual property rights',
      'Age-appropriate content and targeting',
      'Community standards compliance required'
    ];
  }

  getMetaViolations() {
    return [
      'Misleading or inauthentic business representation',
      'Prohibited financial products advertising',
      'Discriminatory targeting or content',
      'Harmful or dangerous product promotion',
      'Intellectual property violations',
      'Inappropriate content for target audience',
      'Privacy violations or data misuse',
      'Community standards violations'
    ];
  }

  getMetaKeyPoints() {
    return [
      'Meta prioritizes authentic community building and user safety',
      'Financial services advertising heavily restricted and regulated',
      'Inclusive advertising practices mandatory',
      'Strong intellectual property protection enforcement'
    ];
  }

  /**
   * Google Ads regulatory content
   */
  getGoogleContent() {
    return `Google Ads Policy Framework and Standards:

1. ADS POLICY FRAMEWORK
- Prohibited content and practices
- Restricted content requiring compliance
- Editorial and technical quality standards
- Destination and user experience requirements

2. FINANCIAL SERVICES POLICY
- Financial services certification requirements
- Consumer lending restrictions and disclosures
- Investment services limitations
- Cryptocurrency and digital asset rules

3. PROHIBITED CONTENT POLICY
- Counterfeit goods and intellectual property violations
- Dangerous or harmful products
- Dishonest behavior and misrepresentation
- Inappropriate content restrictions

4. EDITORIAL STANDARDS
- Clear and accurate business representation
- Professional presentation requirements
- Functional website and landing page standards
- User experience and navigation quality`;
  }

  getGoogleRequirements() {
    return [
      'Certification required for financial services advertising',
      'Clear and accurate business representation',
      'Professional quality advertising materials',
      'Functional and relevant landing pages',
      'Compliance with consumer lending disclosures',
      'Accurate product and service descriptions',
      'Respect for intellectual property rights',
      'Age-appropriate content and targeting'
    ];
  }

  getGoogleViolations() {
    return [
      'Advertising without required financial services certification',
      'Misleading business or product representation',
      'Poor quality or non-functional landing pages',
      'Counterfeit or trademark-infringing content',
      'Prohibited financial products advertising',
      'Dangerous or harmful product promotion',
      'Inappropriate content for target audience',
      'Technical quality standard violations'
    ];
  }

  getGoogleKeyPoints() {
    return [
      'Google requires certification for financial services advertising',
      'Strong emphasis on quality and user experience',
      'Strict intellectual property protection',
      'Comprehensive prohibited content restrictions'
    ];
  }

  /**
   * Generic regulatory content for unknown authorities
   */
  getGenericContent() {
    return `Generic Advertising Regulatory Requirements:

1. GENERAL STANDARDS
- Truthful and accurate advertising required
- Substantiation of claims necessary
- Fair and not misleading presentations
- Consumer protection focus

2. DISCLOSURE REQUIREMENTS
- Material terms and conditions disclosure
- Clear and prominent presentation
- Appropriate target audience considerations
- Risk warnings where applicable

3. PROHIBITED PRACTICES
- False or misleading advertising
- Unfair business practices
- Discrimination in advertising
- Violation of consumer rights`;
  }

  getGenericRequirements() {
    return [
      'Truthful and accurate advertising claims',
      'Substantiation evidence for objective claims',
      'Clear disclosure of material terms',
      'Fair and balanced presentation',
      'Consumer protection compliance',
      'Appropriate audience targeting'
    ];
  }

  getGenericViolations() {
    return [
      'False or misleading advertising claims',
      'Unsubstantiated objective claims',
      'Hidden or inadequate disclosures',
      'Unfair or discriminatory practices',
      'Consumer protection violations',
      'Inappropriate audience targeting'
    ];
  }

  getGenericKeyPoints() {
    return [
      'Advertising regulation focuses on truth and consumer protection',
      'Claims must be substantiated with appropriate evidence',
      'Fair and balanced presentation required',
      'Disclosure of material terms mandatory'
    ];
  }

  /**
   * Scrape all regulations from the database
   */
  async scrapeAllRegulations() {
    if (this.isScrapingInProgress) {
      console.log('Scraping already in progress...');
      return this.scraped_regulations;
    }

    this.isScrapingInProgress = true;
    console.log('Starting comprehensive regulation scraping...');

    try {
      let scrapedCount = 0;
      const totalRegulations = regulations.length;

      for (const regulation of regulations) {
        try {
          // Skip if already scraped recently
          if (this.scraped_regulations[regulation.id] && 
              this.isContentFresh(this.scraped_regulations[regulation.id].lastScraped)) {
            continue;
          }

          const scrapedContent = await this.scrapeRegulationContent(regulation.source);
          this.scraped_regulations[regulation.id] = {
            ...regulation,
            ...scrapedContent,
            regulationId: regulation.id
          };

          scrapedCount++;
          console.log(`Scraped ${scrapedCount}/${totalRegulations}: ${regulation.title}`);

          // Add delay to avoid overwhelming servers
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
          console.error(`Failed to scrape regulation ${regulation.id}:`, error);
        }
      }

      // Save to cache
      this.saveCache();
      console.log(`Regulation scraping completed. Scraped ${scrapedCount} regulations.`);

    } catch (error) {
      console.error('Regulation scraping failed:', error);
    } finally {
      this.isScrapingInProgress = false;
    }

    return this.scraped_regulations;
  }

  /**
   * Check if scraped content is still fresh
   */
  isContentFresh(lastScraped) {
    if (!lastScraped) return false;
    const age = Date.now() - new Date(lastScraped).getTime();
    return age < this.cacheExpiry;
  }

  /**
   * Get scraped regulation content by ID
   */
  getScrapedRegulation(regulationId) {
    return this.scraped_regulations[regulationId] || null;
  }

  /**
   * Get all scraped regulations
   */
  getAllScrapedRegulations() {
    return this.scraped_regulations;
  }

  /**
   * Search scraped regulations by content
   */
  searchRegulations(query) {
    const results = [];
    const queryLower = query.toLowerCase();

    for (const [id, regulation] of Object.entries(this.scraped_regulations)) {
      if (regulation.content && regulation.content.toLowerCase().includes(queryLower)) {
        results.push({
          ...regulation,
          relevanceScore: this.calculateRelevance(regulation, queryLower)
        });
      }
    }

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Calculate content relevance score
   */
  calculateRelevance(regulation, query) {
    let score = 0;
    const content = regulation.content.toLowerCase();
    const requirements = regulation.requirements.join(' ').toLowerCase();
    const keyPoints = regulation.keyPoints.join(' ').toLowerCase();

    // Weight different sections
    score += (content.match(new RegExp(query, 'g')) || []).length * 1;
    score += (requirements.match(new RegExp(query, 'g')) || []).length * 3;
    score += (keyPoints.match(new RegExp(query, 'g')) || []).length * 2;

    return score;
  }

  /**
   * Get regulation requirements for compliance analysis
   */
  getComplianceRequirements(category = null, platform = null) {
    const relevantRegulations = [];

    for (const [id, regulation] of Object.entries(this.scraped_regulations)) {
      // Filter by category if specified
      if (category && regulation.category !== category) continue;
      
      // Filter by platform if specified  
      if (platform && !regulation.title.toLowerCase().includes(platform.toLowerCase())) continue;

      relevantRegulations.push({
        id,
        title: regulation.title,
        requirements: regulation.requirements,
        violations: regulation.violations,
        keyPoints: regulation.keyPoints,
        authority: regulation.authority,
        category: regulation.category
      });
    }

    return relevantRegulations;
  }

  /**
   * Force refresh of all regulations
   */
  async forceRefreshAllRegulations() {
    this.scraped_regulations = {};
    localStorage.removeItem('scrapedRegulations');
    return await this.scrapeAllRegulations();
  }
}

// Export singleton instance
export const regulationScrapingService = new RegulationScrapingService();
export default RegulationScrapingService;
