/**
 * Enhanced Compliance Analyzer with Regulation Scraping Integration
 * Analyzes content against scraped regulatory requirements from authority sources
 */

import { regulationScrapingService } from './regulationScrapingService';

class EnhancedComplianceAnalyzer {
  constructor() {
    this.analysisCache = new Map();
    this.regulationData = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the analyzer with scraped regulation data
   */
  async initialize() {
    if (this.isInitialized) return;
    
    console.log('Initializing Enhanced Compliance Analyzer...');
    
    try {
      // Load existing scraped regulations or scrape them
      this.regulationData = regulationScrapingService.getAllScrapedRegulations();
      
      // If no regulations are cached, scrape them
      if (Object.keys(this.regulationData).length === 0) {
        console.log('No cached regulations found. Starting scraping process...');
        this.regulationData = await regulationScrapingService.scrapeAllRegulations();
      }
      
      this.isInitialized = true;
      console.log(`Compliance Analyzer initialized with ${Object.keys(this.regulationData).length} regulations`);
      
    } catch (error) {
      console.error('Failed to initialize Compliance Analyzer:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Analyze content against relevant regulations
   */
  async analyzeContent(content, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const {
      platforms = [],
      category = 'General Advertising',
      contentType = 'text',
      targetAudience = 'general'
    } = options;

    console.log('Starting enhanced compliance analysis...', { platforms, category, contentType });

    try {
      // Get relevant regulations for analysis
      const relevantRegulations = this.getRelevantRegulations(platforms, category);
      
      // Perform comprehensive analysis
      const analysis = {
        overallScore: 0,
        status: 'analyzing',
        issues: [],
        violations: [],
        recommendations: [],
        complianceBreakdown: {},
        regulationsAnalyzed: relevantRegulations.length,
        detailedFindings: [],
        metadata: {
          analyzedAt: new Date().toISOString(),
          platforms,
          category,
          contentType,
          regulationsChecked: relevantRegulations.map(r => r.id)
        }
      };

      // Analyze against each relevant regulation
      for (const regulation of relevantRegulations) {
        const regulationAnalysis = await this.analyzeAgainstRegulation(content, regulation);
        
        // Aggregate results
        analysis.issues.push(...regulationAnalysis.issues);
        analysis.violations.push(...regulationAnalysis.violations);
        analysis.recommendations.push(...regulationAnalysis.recommendations);
        analysis.detailedFindings.push(regulationAnalysis);
        
        // Update compliance breakdown
        analysis.complianceBreakdown[regulation.id] = {
          authority: regulation.authority || regulation.title.split(' - ')[0],
          score: regulationAnalysis.score,
          status: regulationAnalysis.status,
          issueCount: regulationAnalysis.issues.length,
          violationCount: regulationAnalysis.violations.length
        };
      }

      // Calculate overall score
      analysis.overallScore = this.calculateOverallScore(analysis);
      analysis.status = this.determineOverallStatus(analysis.overallScore, analysis.violations.length);

      // Deduplicate and prioritize issues
      analysis.issues = this.deduplicateIssues(analysis.issues);
      analysis.violations = this.deduplicateViolations(analysis.violations);
      analysis.recommendations = this.prioritizeRecommendations(analysis.recommendations);

      console.log('Enhanced compliance analysis completed:', {
        score: analysis.overallScore,
        issues: analysis.issues.length,
        violations: analysis.violations.length
      });

      return analysis;

    } catch (error) {
      console.error('Compliance analysis failed:', error);
      return this.createErrorAnalysis(error);
    }
  }

  /**
   * Get regulations relevant to the content being analyzed
   */
  getRelevantRegulations(platforms = [], category = 'General Advertising') {
    const relevantRegulations = [];

    for (const [id, regulation] of Object.entries(this.regulationData)) {
      // Include if category matches
      if (regulation.category === category || category === 'All Categories') {
        relevantRegulations.push({ ...regulation, id });
        continue;
      }

      // Include if platform is mentioned in title
      for (const platform of platforms) {
        if (regulation.title.toLowerCase().includes(platform.toLowerCase())) {
          relevantRegulations.push({ ...regulation, id });
          break;
        }
      }

      // Include general advertising regulations for all analyses
      if (regulation.category === 'General Advertising' && category === 'Financial Marketing') {
        relevantRegulations.push({ ...regulation, id });
      }
    }

    // Ensure we have core regulations from major authorities
    this.ensureCoreRegulations(relevantRegulations, platforms);

    return relevantRegulations;
  }

  /**
   * Ensure core regulations are included for comprehensive analysis
   */
  ensureCoreRegulations(relevantRegulations, platforms) {
    const coreRegulationPatterns = [
      'Truth in Advertising',
      'Consumer Protection',
      'Financial Promotions',
      'Advertising Standards'
    ];

    const existingTitles = relevantRegulations.map(r => r.title.toLowerCase());

    for (const [id, regulation] of Object.entries(this.regulationData)) {
      for (const pattern of coreRegulationPatterns) {
        if (regulation.title.includes(pattern) && 
            !existingTitles.some(title => title.includes(pattern.toLowerCase()))) {
          relevantRegulations.push({ ...regulation, id });
          existingTitles.push(regulation.title.toLowerCase());
          break;
        }
      }
    }
  }

  /**
   * Analyze content against a specific regulation
   */
  async analyzeAgainstRegulation(content, regulation) {
    const analysis = {
      regulationId: regulation.id,
      authority: regulation.authority || regulation.title.split(' - ')[0],
      title: regulation.title,
      score: 100,
      status: 'compliant',
      issues: [],
      violations: [],
      recommendations: [],
      checkedRequirements: regulation.requirements || [],
      passedRequirements: [],
      failedRequirements: []
    };

    try {
      // Analyze against requirements
      for (const requirement of regulation.requirements || []) {
        const requirementCheck = this.checkRequirement(content, requirement, regulation);
        
        if (requirementCheck.passed) {
          analysis.passedRequirements.push(requirement);
        } else {
          analysis.failedRequirements.push(requirement);
          analysis.issues.push({
            type: 'requirement_violation',
            severity: requirementCheck.severity,
            authority: analysis.authority,
            requirement,
            description: requirementCheck.description,
            recommendation: requirementCheck.recommendation
          });
        }
      }

      // Check for known violations
      for (const violation of regulation.violations || []) {
        const violationCheck = this.checkForViolation(content, violation, regulation);
        
        if (violationCheck.detected) {
          analysis.violations.push({
            type: 'regulatory_violation',
            severity: 'high',
            authority: analysis.authority,
            violation,
            description: violationCheck.description,
            evidence: violationCheck.evidence,
            recommendation: violationCheck.recommendation
          });
        }
      }

      // Calculate regulation-specific score
      analysis.score = this.calculateRegulationScore(analysis);
      analysis.status = analysis.score >= 80 ? 'compliant' : 
                      analysis.score >= 60 ? 'needs_review' : 'non_compliant';

      // Generate regulation-specific recommendations
      analysis.recommendations = this.generateRegulationRecommendations(analysis, regulation);

    } catch (error) {
      console.error(`Error analyzing against regulation ${regulation.id}:`, error);
      analysis.score = 0;
      analysis.status = 'error';
      analysis.issues.push({
        type: 'analysis_error',
        severity: 'medium',
        authority: analysis.authority,
        description: `Analysis failed: ${error.message}`,
        recommendation: 'Manual review required'
      });
    }

    return analysis;
  }

  /**
   * Check if content meets a specific requirement
   */
  checkRequirement(content, requirement, regulation) {
    const contentLower = content.toLowerCase();
    const requirementLower = requirement.toLowerCase();

    // Disclosure requirements
    if (requirementLower.includes('disclosure') || requirementLower.includes('disclose')) {
      return this.checkDisclosureRequirement(content, requirement);
    }

    // APR and rate requirements
    if (requirementLower.includes('apr') || requirementLower.includes('rate')) {
      return this.checkRateDisclosureRequirement(content, requirement);
    }

    // Fee disclosure requirements
    if (requirementLower.includes('fee')) {
      return this.checkFeeDisclosureRequirement(content, requirement);
    }

    // Risk warning requirements
    if (requirementLower.includes('risk') || requirementLower.includes('warning')) {
      return this.checkRiskWarningRequirement(content, requirement);
    }

    // Substantiation requirements
    if (requirementLower.includes('substantiat') || requirementLower.includes('evidence')) {
      return this.checkSubstantiationRequirement(content, requirement);
    }

    // Clear and prominent requirements
    if (requirementLower.includes('clear') || requirementLower.includes('prominent')) {
      return this.checkClarityRequirement(content, requirement);
    }

    // Generic requirement check
    return this.checkGenericRequirement(content, requirement);
  }

  /**
   * Check disclosure-related requirements
   */
  checkDisclosureRequirement(content, requirement) {
    const disclosureIndicators = [
      'terms and conditions', 'terms & conditions', 'full terms',
      'see details', 'important information', 'disclosure',
      'subject to', 'restrictions apply', 'eligibility',
      'offer expires', 'limited time', 'while supplies last'
    ];

    const hasDisclosure = disclosureIndicators.some(indicator => 
      content.toLowerCase().includes(indicator)
    );

    return {
      passed: hasDisclosure,
      severity: hasDisclosure ? 'low' : 'high',
      description: hasDisclosure ? 
        'Disclosure language found in content' : 
        'Missing required disclosure information',
      recommendation: hasDisclosure ? 
        'Ensure disclosure is clear and prominent' : 
        'Add required disclosure language'
    };
  }

  /**
   * Check rate disclosure requirements (APR, interest rates, etc.)
   */
  checkRateDisclosureRequirement(content, requirement) {
    const ratePatterns = [
      /\d+\.?\d*%?\s*(apr|annual percentage rate)/i,
      /\d+\.?\d*%?\s*interest/i,
      /rate[s]?\s*[:\-]?\s*\d+\.?\d*%?/i
    ];

    const hasRateDisclosure = ratePatterns.some(pattern => pattern.test(content));

    return {
      passed: hasRateDisclosure,
      severity: hasRateDisclosure ? 'low' : 'critical',
      description: hasRateDisclosure ? 
        'Rate information found in content' : 
        'Missing required rate disclosure (APR, interest rate)',
      recommendation: hasRateDisclosure ? 
        'Ensure rate is prominently displayed and accurate' : 
        'Add required APR or interest rate disclosure'
    };
  }

  /**
   * Check fee disclosure requirements
   */
  checkFeeDisclosureRequirement(content, requirement) {
    const feeIndicators = [
      'fee', 'charge', 'cost', 'price', '$', 'payment',
      'monthly', 'annual', 'transaction', 'processing'
    ];

    const hasFeeInfo = feeIndicators.some(indicator => 
      content.toLowerCase().includes(indicator)
    );

    return {
      passed: hasFeeInfo,
      severity: hasFeeInfo ? 'low' : 'high',
      description: hasFeeInfo ? 
        'Fee information found in content' : 
        'Missing required fee disclosure',
      recommendation: hasFeeInfo ? 
        'Ensure all fees are clearly disclosed' : 
        'Add comprehensive fee disclosure'
    };
  }

  /**
   * Check risk warning requirements
   */
  checkRiskWarningRequirement(content, requirement) {
    const riskIndicators = [
      'risk', 'warning', 'caution', 'important',
      'may lose', 'not guaranteed', 'subject to',
      'consult', 'professional advice'
    ];

    const hasRiskWarning = riskIndicators.some(indicator => 
      content.toLowerCase().includes(indicator)
    );

    return {
      passed: hasRiskWarning,
      severity: hasRiskWarning ? 'low' : 'high',
      description: hasRiskWarning ? 
        'Risk warning language found' : 
        'Missing required risk warnings',
      recommendation: hasRiskWarning ? 
        'Ensure risk warnings are prominent and clear' : 
        'Add appropriate risk warnings for the product/service'
    };
  }

  /**
   * Check substantiation requirements
   */
  checkSubstantiationRequirement(content, requirement) {
    const claimPatterns = [
      /best|top|leading|#1|guaranteed|proven/i,
      /save[s]?\s*\d+|up to \d+% off/i,
      /award.{0,20}winning|certified|approved/i
    ];

    const hasClaims = claimPatterns.some(pattern => pattern.test(content));
    
    const substantiationIndicators = [
      'source:', 'study shows', 'research indicates',
      'according to', 'based on', 'verified by'
    ];

    const hasSubstantiation = substantiationIndicators.some(indicator => 
      content.toLowerCase().includes(indicator)
    );

    if (hasClaims && !hasSubstantiation) {
      return {
        passed: false,
        severity: 'high',
        description: 'Claims found without adequate substantiation',
        recommendation: 'Provide evidence or remove unsubstantiated claims'
      };
    }

    return {
      passed: true,
      severity: 'low',
      description: hasClaims ? 
        'Claims appear to have supporting information' : 
        'No specific claims requiring substantiation found',
      recommendation: 'Continue providing evidence for any claims made'
    };
  }

  /**
   * Check clarity and prominence requirements
   */
  checkClarityRequirement(content, requirement) {
    const clarityIssues = [];
    
    // Check for excessive jargon
    const jargonPatterns = [
      /\b[A-Z]{3,}\b/g, // Excessive acronyms
      /\w{15,}/g // Very long words
    ];

    jargonPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches && matches.length > 3) {
        clarityIssues.push('Excessive jargon or acronyms detected');
      }
    });

    // Check for readability
    const sentences = content.split(/[.!?]+/);
    const longSentences = sentences.filter(s => s.split(' ').length > 30);
    if (longSentences.length > 2) {
      clarityIssues.push('Some sentences may be too complex');
    }

    return {
      passed: clarityIssues.length === 0,
      severity: clarityIssues.length > 0 ? 'medium' : 'low',
      description: clarityIssues.length === 0 ? 
        'Content appears clear and readable' : 
        `Clarity issues found: ${clarityIssues.join(', ')}`,
      recommendation: clarityIssues.length === 0 ? 
        'Maintain clear and simple language' : 
        'Simplify language and structure for better clarity'
    };
  }

  /**
   * Generic requirement check
   */
  checkGenericRequirement(content, requirement) {
    // Extract key terms from requirement
    const keyTerms = requirement.toLowerCase()
      .split(/\s+/)
      .filter(term => term.length > 3 && 
        !['must', 'should', 'required', 'need', 'have', 'include'].includes(term));

    const matchedTerms = keyTerms.filter(term => 
      content.toLowerCase().includes(term)
    );

    const matchRatio = matchedTerms.length / Math.max(keyTerms.length, 1);

    return {
      passed: matchRatio >= 0.3,
      severity: matchRatio >= 0.5 ? 'low' : matchRatio >= 0.3 ? 'medium' : 'high',
      description: matchRatio >= 0.3 ? 
        `Requirement elements found (${matchedTerms.length}/${keyTerms.length})` : 
        'Key requirement elements missing from content',
      recommendation: matchRatio >= 0.3 ? 
        'Review requirement compliance details' : 
        `Address requirement: ${requirement}`
    };
  }

  /**
   * Check for specific violations
   */
  checkForViolation(content, violation, regulation) {
    const contentLower = content.toLowerCase();
    const violationLower = violation.toLowerCase();

    // Misleading claims
    if (violationLower.includes('misleading') || violationLower.includes('false')) {
      return this.checkMisleadingClaims(content, violation);
    }

    // Hidden fees
    if (violationLower.includes('hidden') && violationLower.includes('fee')) {
      return this.checkHiddenFees(content, violation);
    }

    // Discrimination
    if (violationLower.includes('discriminat')) {
      return this.checkDiscrimination(content, violation);
    }

    // Missing disclosures
    if (violationLower.includes('missing') && violationLower.includes('disclosure')) {
      return this.checkMissingDisclosures(content, violation);
    }

    // Generic violation check
    return this.checkGenericViolation(content, violation);
  }

  /**
   * Check for misleading claims
   */
  checkMisleadingClaims(content, violation) {
    const misleadingPatterns = [
      /guaranteed\s+returns?/i,
      /risk.free/i,
      /instant\s+approval/i,
      /no\s+credit\s+check/i,
      /100%\s+success/i
    ];

    const detected = misleadingPatterns.some(pattern => pattern.test(content));

    return {
      detected,
      description: detected ? 
        'Potentially misleading claims detected' : 
        'No obvious misleading claims found',
      evidence: detected ? 
        content.match(misleadingPatterns.find(p => p.test(content)))?.[0] : null,
      recommendation: detected ? 
        'Review and substantiate or remove potentially misleading claims' : null
    };
  }

  /**
   * Check for hidden fees
   */
  checkHiddenFees(content, violation) {
    const feePatterns = /\$\d+|\d+\s*fee|\d+\s*charge/gi;
    const fees = content.match(feePatterns) || [];
    
    // Check if fees are mentioned but not prominently disclosed
    const hasFeeMention = fees.length > 0;
    const hasProminentDisclosure = content.toLowerCase().includes('all fees') ||
                                  content.toLowerCase().includes('total cost') ||
                                  content.toLowerCase().includes('fee schedule');

    const detected = hasFeeMention && !hasProminentDisclosure;

    return {
      detected,
      description: detected ? 
        'Fees mentioned but may not be adequately disclosed' : 
        'Fee disclosure appears adequate',
      evidence: detected ? fees.join(', ') : null,
      recommendation: detected ? 
        'Ensure all fees are clearly and prominently disclosed' : null
    };
  }

  /**
   * Check for discrimination issues
   */
  checkDiscrimination(content, violation) {
    const discriminatoryLanguage = [
      /age\s*[:\-]\s*\d+/i,
      /gender\s*[:\-]/i,
      /race\s*[:\-]/i,
      /religion\s*[:\-]/i
    ];

    const detected = discriminatoryLanguage.some(pattern => pattern.test(content));

    return {
      detected,
      description: detected ? 
        'Potentially discriminatory language detected' : 
        'No obvious discriminatory language found',
      evidence: detected ? 
        content.match(discriminatoryLanguage.find(p => p.test(content)))?.[0] : null,
      recommendation: detected ? 
        'Review content for discriminatory language and ensure inclusive messaging' : null
    };
  }

  /**
   * Check for missing disclosures
   */
  checkMissingDisclosures(content, violation) {
    const requiredDisclosures = [
      'terms and conditions',
      'restrictions apply',
      'subject to approval',
      'see full terms'
    ];

    const hasDisclosures = requiredDisclosures.some(disclosure => 
      content.toLowerCase().includes(disclosure)
    );

    return {
      detected: !hasDisclosures,
      description: hasDisclosures ? 
        'Appropriate disclosures found' : 
        'Required disclosures may be missing',
      evidence: !hasDisclosures ? 'No standard disclosure language found' : null,
      recommendation: !hasDisclosures ? 
        'Add appropriate disclosure language (terms and conditions, restrictions, etc.)' : null
    };
  }

  /**
   * Generic violation check
   */
  checkGenericViolation(content, violation) {
    const violationTerms = violation.toLowerCase()
      .split(/\s+/)
      .filter(term => term.length > 3);

    const foundTerms = violationTerms.filter(term => 
      content.toLowerCase().includes(term)
    );

    const detected = foundTerms.length >= Math.min(2, violationTerms.length);

    return {
      detected,
      description: detected ? 
        `Potential violation indicators found: ${foundTerms.join(', ')}` : 
        'No obvious violation indicators found',
      evidence: detected ? foundTerms.join(', ') : null,
      recommendation: detected ? 
        `Review content for: ${violation}` : null
    };
  }

  /**
   * Calculate regulation-specific compliance score
   */
  calculateRegulationScore(analysis) {
    const totalRequirements = analysis.checkedRequirements.length;
    const passedRequirements = analysis.passedRequirements.length;
    const violations = analysis.violations.length;

    if (totalRequirements === 0) return 85; // Default score if no requirements

    let score = (passedRequirements / totalRequirements) * 100;
    
    // Penalty for violations
    score -= violations * 15;

    // Minimum score is 0
    return Math.max(0, Math.round(score));
  }

  /**
   * Calculate overall compliance score
   */
  calculateOverallScore(analysis) {
    const regulationScores = Object.values(analysis.complianceBreakdown)
      .map(reg => reg.score);

    if (regulationScores.length === 0) return 50;

    // Weighted average with penalty for violations
    let averageScore = regulationScores.reduce((sum, score) => sum + score, 0) / regulationScores.length;
    
    // Additional penalty for high-severity violations
    const criticalViolations = analysis.violations.filter(v => v.severity === 'critical').length;
    const highViolations = analysis.violations.filter(v => v.severity === 'high').length;
    
    averageScore -= criticalViolations * 20;
    averageScore -= highViolations * 10;

    return Math.max(0, Math.round(averageScore));
  }

  /**
   * Determine overall compliance status
   */
  determineOverallStatus(score, violationCount) {
    if (violationCount > 3) return 'non_compliant';
    if (score >= 85) return 'compliant';
    if (score >= 70) return 'needs_review';
    return 'non_compliant';
  }

  /**
   * Generate regulation-specific recommendations
   */
  generateRegulationRecommendations(analysis, regulation) {
    const recommendations = [];

    // Failed requirements recommendations
    analysis.failedRequirements.forEach(requirement => {
      recommendations.push({
        type: 'requirement',
        priority: 'high',
        authority: analysis.authority,
        description: `Address requirement: ${requirement}`,
        action: `Review and implement: ${requirement}`
      });
    });

    // Key points recommendations
    regulation.keyPoints?.forEach(keyPoint => {
      recommendations.push({
        type: 'best_practice',
        priority: 'medium',
        authority: analysis.authority,
        description: keyPoint,
        action: `Ensure compliance with: ${keyPoint}`
      });
    });

    return recommendations;
  }

  /**
   * Deduplicate similar issues
   */
  deduplicateIssues(issues) {
    const unique = [];
    const seen = new Set();

    for (const issue of issues) {
      const key = `${issue.type}-${issue.authority}-${issue.requirement || issue.description}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(issue);
      }
    }

    return unique.sort((a, b) => this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity));
  }

  /**
   * Deduplicate similar violations
   */
  deduplicateViolations(violations) {
    const unique = [];
    const seen = new Set();

    for (const violation of violations) {
      const key = `${violation.type}-${violation.authority}-${violation.violation}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(violation);
      }
    }

    return unique.sort((a, b) => this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity));
  }

  /**
   * Prioritize recommendations
   */
  prioritizeRecommendations(recommendations) {
    return recommendations
      .sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority))
      .slice(0, 10); // Limit to top 10 recommendations
  }

  /**
   * Get severity weight for sorting
   */
  getSeverityWeight(severity) {
    const weights = { critical: 4, high: 3, medium: 2, low: 1 };
    return weights[severity] || 0;
  }

  /**
   * Get priority weight for sorting
   */
  getPriorityWeight(priority) {
    const weights = { critical: 4, high: 3, medium: 2, low: 1 };
    return weights[priority] || 0;
  }

  /**
   * Create error analysis response
   */
  createErrorAnalysis(error) {
    return {
      overallScore: 0,
      status: 'error',
      issues: [{
        type: 'analysis_error',
        severity: 'critical',
        authority: 'System',
        description: `Analysis failed: ${error.message}`,
        recommendation: 'Please retry analysis or contact support'
      }],
      violations: [],
      recommendations: [],
      complianceBreakdown: {},
      regulationsAnalyzed: 0,
      detailedFindings: [],
      metadata: {
        analyzedAt: new Date().toISOString(),
        error: error.message
      }
    };
  }

  /**
   * Get analysis summary for display
   */
  getAnalysisSummary(analysis) {
    return {
      score: analysis.overallScore,
      status: analysis.status,
      totalIssues: analysis.issues.length,
      criticalIssues: analysis.issues.filter(i => i.severity === 'critical').length,
      regulationsChecked: analysis.regulationsAnalyzed,
      topAuthorities: this.getTopAuthorities(analysis.complianceBreakdown),
      keyRecommendations: analysis.recommendations.slice(0, 3)
    };
  }

  /**
   * Get top authorities analyzed
   */
  getTopAuthorities(complianceBreakdown) {
    return Object.entries(complianceBreakdown)
      .map(([id, data]) => ({
        authority: data.authority,
        score: data.score,
        issues: data.issueCount
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }
}

// Export singleton instance
export const enhancedComplianceAnalyzer = new EnhancedComplianceAnalyzer();
export default EnhancedComplianceAnalyzer;
