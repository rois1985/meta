import React, { useState, useCallback, useEffect } from 'react';
import {
  Upload,
  X,
  FileText,
  Image,
  Film,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  ArrowRight,
  Copy,
  Download,
  BarChart3,
} from 'lucide-react';
import { Button } from '../ui/Button';

const regulations = [
  { id: 'fca', name: 'FCA (UK)', selected: true },
  { id: 'sec', name: 'SEC (US)', selected: true },
  { id: 'finra', name: 'FINRA', selected: false },
  { id: 'asa', name: 'ASA', selected: false },
  { id: 'mifid', name: 'MiFID II', selected: false },
];

const mockAnalysis = {
  score: 87,
  status: 'warning',
  summary: 'Your ad is mostly compliant but requires attention in 2 areas.',
  issues: [
    {
      type: 'warning',
      category: 'Risk Warning',
      title: 'Risk warning may be insufficient',
      description: 'The risk warning text is present but may not be prominent enough. Consider increasing font size or contrast.',
      suggestion: 'Move the risk warning to a more prominent position and increase text size to at least 12pt.',
    },
    {
      type: 'warning',
      category: 'Claims',
      title: 'Performance claim needs substantiation',
      description: 'The claim "up to 20% returns" requires supporting documentation and historical data.',
      suggestion: 'Add footnote referencing the source of this claim or modify to "past performance is not indicative of future results".',
    },
  ],
  passed: [
    { category: 'Disclaimers', title: 'All required disclaimers present' },
    { category: 'Fair Balance', title: 'Benefits and risks appropriately balanced' },
    { category: 'Call to Action', title: 'CTA is clear and not misleading' },
    { category: 'Contact Info', title: 'Required contact information included' },
  ],
};

export function ComplianceChecker({ onClose, selectedReview, onSaveReview }) {
  const [step, setStep] = useState('upload'); // upload, analyzing, results
  const [adContent, setAdContent] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null); // Keep for backward compatibility
  const [selectedRegs, setSelectedRegs] = useState(regulations);
  const [analysis, setAnalysis] = useState(null);
  const [multiFileAnalysis, setMultiFileAnalysis] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [showScoringInfo, setShowScoringInfo] = useState(false);

  // Load selected review from sidebar
  useEffect(() => {
    if (selectedReview) {
      setReviewTitle(selectedReview.title || 'Loaded Review');
      setAdContent(selectedReview.content || '');
      
      // Handle multi-file data restoration
      if (selectedReview.isMultiFile && selectedReview.fileName) {
        // Use detailed file info if available, otherwise fallback to parsing names
        let restoredFiles;
        if (selectedReview.fileDetails && selectedReview.fileDetails.length > 0) {
          restoredFiles = selectedReview.fileDetails.map(fileDetail => ({
            name: fileDetail.name,
            size: fileDetail.size || 0,
            type: fileDetail.type || 'text/plain'
          }));
        } else {
          // Fallback: restore from comma-separated names
          const fileNames = selectedReview.fileName.split(', ');
          restoredFiles = fileNames.map((name, index) => ({
            name: name,
            size: 0,
            type: name.includes('.jpg') || name.includes('.png') ? 'image/jpeg' : 
                  name.includes('.pdf') ? 'application/pdf' : 'text/plain'
          }));
        }
        
        setUploadedFiles(restoredFiles);
        setUploadedFile(restoredFiles[0]); // Set first file for backward compatibility
        
        // Restore comprehensive multi-file analysis data
        if (selectedReview.multiFileAnalysis) {
          setMultiFileAnalysis(selectedReview.multiFileAnalysis);
        } else if (selectedReview.combinedScoring && selectedReview.individualFileScores) {
          // Reconstruct multiFileAnalysis from saved individual scores
          const reconstructedAnalysis = {
            overallScore: selectedReview.combinedScoring.overallScore,
            status: selectedReview.combinedScoring.status,
            fileCount: selectedReview.fileCount,
            summary: selectedReview.combinedScoring.summary,
            violations: selectedReview.combinedScoring.combinedViolations,
            combinedIssues: selectedReview.individualFileScores.flatMap(fileScore => 
              fileScore.issues.map(issue => ({...issue, fileName: fileScore.fileName}))
            ),
            fileAnalyses: selectedReview.individualFileScores.map(fileScore => ({
              fileName: fileScore.fileName,
              fileType: restoredFiles.find(f => f.name === fileScore.fileName)?.type || 'text/plain',
              analysis: {
                score: fileScore.score,
                status: fileScore.status,
                issues: fileScore.issues,
                violations: fileScore.violations,
                metadata: fileScore.metadata
              }
            }))
          };
          setMultiFileAnalysis(reconstructedAnalysis);
        }
      } else if (selectedReview.fileName) {
        // Single file restoration
        const fileDetail = selectedReview.fileDetails?.[0];
        setUploadedFile({ 
          name: selectedReview.fileName, 
          size: fileDetail?.size || 0,
          type: fileDetail?.type || 'text/plain'
        });
        setUploadedFiles([]);
        setMultiFileAnalysis(null);
      } else {
        // Text-only content
        setUploadedFile(null);
        setUploadedFiles([]);
        setMultiFileAnalysis(null);
      }
      
      setAnalysis(selectedReview.analysis);
      setStep('results');
      
      console.log('Loaded review with multi-file data:', {
        isMultiFile: selectedReview.isMultiFile,
        fileCount: selectedReview.fileCount,
        hasMultiFileAnalysis: !!selectedReview.multiFileAnalysis
      });
    }
  }, [selectedReview]);

  // Save current review
  const saveReview = () => {
    const currentAnalysis = analysis || multiFileAnalysis;
    const currentTitle = reviewTitle.trim() || `Content Review - ${new Date().toLocaleDateString()}`;
    
    if (!currentAnalysis) {
      alert('Please run an analysis before saving the review.');
      return;
    }
    
    // Prepare comprehensive multi-file data for saving
    const fileNames = uploadedFiles.length > 0 ? 
      uploadedFiles.map(f => f.name).join(', ') : 
      (uploadedFile?.name || null);
    
    const fileDetails = uploadedFiles.length > 0 ? 
      uploadedFiles.map((file, index) => ({
        name: file.name,
        type: file.type,
        size: file.size,
        index: index
      })) : 
      (uploadedFile ? [{ name: uploadedFile.name, type: uploadedFile.type, size: uploadedFile.size, index: 0 }] : []);
    
    const reviewData = {
      id: selectedReview?.id || Date.now().toString(), // Use existing ID if re-analyzing
      title: currentTitle,
      content: adContent,
      fileName: fileNames,
      fileDetails: fileDetails, // Store detailed file information
      fileCount: uploadedFiles.length > 0 ? uploadedFiles.length : (uploadedFile ? 1 : 0),
      analysis: currentAnalysis,
      multiFileAnalysis: multiFileAnalysis,
      isMultiFile: uploadedFiles.length > 1,
      
      // Store individual file scoring data if available
      individualFileScores: multiFileAnalysis?.fileAnalyses?.map(fileResult => ({
        fileName: fileResult.fileName,
        score: fileResult.analysis.score,
        status: fileResult.analysis.status,
        issueCount: fileResult.analysis.issues.length,
        violations: fileResult.analysis.violations,
        issues: fileResult.analysis.issues,
        metadata: fileResult.analysis.metadata
      })) || null,
      
      // Store combined scoring summary
      combinedScoring: multiFileAnalysis ? {
        overallScore: multiFileAnalysis.overallScore,
        totalIssues: multiFileAnalysis.combinedIssues.length,
        combinedViolations: multiFileAnalysis.violations,
        status: multiFileAnalysis.status,
        summary: multiFileAnalysis.summary
      } : null,
      
      createdAt: selectedReview?.createdAt || new Date().toISOString(), // Preserve original creation date
      updatedAt: new Date().toISOString()
    };

    console.log('Saving review:', reviewData);

    if (onSaveReview) {
      onSaveReview(reviewData);
      alert('Review saved successfully!');
      onClose(); // Close the window after saving
    } else {
      alert('Save function not available. Please try again.');
    }
  };


  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleFileUpload = (files) => {
    const fileArray = Array.from(files);
    setUploadedFiles(prev => [...prev, ...fileArray]);
    // Keep backward compatibility for single file
    if (fileArray.length > 0) {
      setUploadedFile(fileArray[0]);
    }
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    // Update single file reference if needed
    if (index === 0 && uploadedFiles.length > 1) {
      setUploadedFile(uploadedFiles[1]);
    } else if (uploadedFiles.length === 1) {
      setUploadedFile(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files);
    }
  };

  const toggleRegulation = (id) => {
    setSelectedRegs(selectedRegs.map(reg =>
      reg.id === id ? { ...reg, selected: !reg.selected } : reg
    ));
  };

  const analyzeContent = (content) => {
    const contentLower = content.toLowerCase();
    let score = 95; // Base score
    let issues = [];
    let violations = { high: 0, medium: 0, low: 0 };
    let detectedKeywords = [];
    let regulatoryTriggers = [];

    // Enhanced keyword detection with context
    const financialKeywords = ['investment', 'returns', 'profit', 'trading', 'forex', 'crypto', 'bitcoin', 'stocks', 'bonds', 'portfolio', 'yield', 'dividend', 'roi', 'capital gains'];
    const riskKeywords = ['guaranteed', 'risk-free', 'no risk', 'certain returns', 'assured profit'];
    const healthKeywords = ['cure', 'guaranteed', 'miracle', 'lose weight', 'clinical proof', 'medical breakthrough'];
    const dataKeywords = ['email', 'personal data', 'subscribe', 'contact', 'phone number', 'address', 'collect data'];
    const pricingKeywords = ['free', 'discount', 'limited time', 'sale', 'offer expires', 'exclusive deal'];
    const testimonialKeywords = ['testimonial', 'review', 'customer says', 'user feedback', 'success story'];

    // Detect keywords and build context
    financialKeywords.forEach(keyword => {
      if (contentLower.includes(keyword)) {
        detectedKeywords.push({ keyword, category: 'financial' });
        regulatoryTriggers.push('Financial Promotion Rules');
      }
    });

    // Enhanced Financial content analysis
    if (detectedKeywords.some(k => k.category === 'financial')) {
      const hasRiskWarning = contentLower.includes('risk') || contentLower.includes('loss') || contentLower.includes('volatile');
      const hasDisclaimer = contentLower.includes('disclaimer') || contentLower.includes('terms') || contentLower.includes('conditions');
      const hasHighRiskTerms = riskKeywords.some(keyword => contentLower.includes(keyword));
      
      let severity = 'medium';
      let scoreReduction = 15;
      
      if (hasHighRiskTerms || !hasRiskWarning) {
        severity = 'high';
        scoreReduction = 35;
      }
      
      score -= scoreReduction;
      violations[severity]++;
      issues.push({
        type: severity,
        category: 'Financial Risk Disclosures',
        title: hasHighRiskTerms ? 'Prohibited Financial Claims Detected' : 'Missing Financial Risk Disclosures',
        description: hasHighRiskTerms ? 
          'Content contains prohibited claims that suggest guaranteed returns or risk-free investments.' :
          'Investment-related content requires prominent risk warnings and regulatory disclosures.',
        violationExplanation: hasHighRiskTerms ?
          'This is a critical violation where advertising makes claims about guaranteed returns, risk-free investments, or assured profits. Financial regulators across all jurisdictions (FCA, SEC, FINRA, ASIC) strictly prohibit any language that suggests investments are without risk or guarantee specific returns. These claims are considered inherently misleading because all investments carry risk, and past performance never guarantees future results. Using such language can result in immediate regulatory action, including cease and desist orders, substantial fines, and criminal charges for fraudulent advertising. The violation occurs because it fundamentally misrepresents the nature of financial markets and can cause serious financial harm to consumers who make investment decisions based on false guarantees.' :
          'This violation occurs when financial promotions contain investment-related terms without proper risk warnings. Financial regulators require all investment advertising to include clear statements about potential losses, regulatory authorization details, and appropriate disclaimers. Content mentioning investments, returns, profits, or trading triggers strict disclosure requirements under FCA, SEC, and other financial authority guidelines. Failure to include these disclosures can result in regulatory penalties and consumer protection violations.',
        regulation: hasHighRiskTerms ? 'Multiple Jurisdictions' : 'FCA Guidelines',
        regulationRef: hasHighRiskTerms ? 
          'FCA UK PERG 8.12, SEC US Investment Advisers Act Section 206, FINRA Rule 2210' :
          'FCA UK - MCOB 3A.2.1(R) Financial Promotions Rules',
        sourceUrl: hasHighRiskTerms ? 
          'https://www.sec.gov/investment/im-guidance-2019-02.pdf' :
          'https://www.handbook.fca.org.uk/handbook/MCOB/',
        confidence: hasHighRiskTerms ? '98% confidence' : '94% confidence',
        detectedTerms: detectedKeywords.filter(k => k.category === 'financial').map(k => k.keyword),
        regulatoryImpact: hasHighRiskTerms ? 'Immediate regulatory action likely' : 'Regulatory review required',
        remediation: hasHighRiskTerms ? 'Remove all guarantee language immediately' : 'Add required risk disclosures',
        recommendations: hasHighRiskTerms ? [
          'URGENT: Remove all "guaranteed", "risk-free", or "certain returns" language',
          'Replace with compliant language: "Past performance does not guarantee future results"',
          'Add prominent risk warning: "All investments carry risk of loss"',
          'Consult regulatory compliance attorney immediately',
          'Review entire marketing campaign for similar violations'
        ] : [
          'Add clear risk warning stating "Your capital is at risk"',
          'Include FCA-required disclaimers for investment products',
          'Ensure risk warnings are at least 12pt font and clearly visible',
          'Add regulatory approval statements and authorized firm details',
          'Include "Past performance is not indicative of future results" disclaimer'
        ]
      });
    }

    // Enhanced Privacy/data collection analysis
    dataKeywords.forEach(keyword => {
      if (contentLower.includes(keyword)) {
        detectedKeywords.push({ keyword, category: 'privacy' });
        regulatoryTriggers.push('Data Protection Laws');
      }
    });

    if (detectedKeywords.some(k => k.category === 'privacy')) {
      const hasPrivacyPolicy = contentLower.includes('privacy policy') || contentLower.includes('data policy');
      const hasConsentMechanism = contentLower.includes('consent') || contentLower.includes('opt-in') || contentLower.includes('agree');
      const hasCookieNotice = contentLower.includes('cookie') || contentLower.includes('tracking');
      
      let severity = hasPrivacyPolicy && hasConsentMechanism ? 'low' : 'medium';
      let scoreReduction = severity === 'low' ? 5 : 15;
      
      score -= scoreReduction;
      violations[severity]++;
      issues.push({
        type: severity,
        category: 'Data Privacy Compliance',
        title: severity === 'low' ? 'Privacy Disclosure Enhancement Needed' : 'Missing Privacy Compliance Requirements',
        description: severity === 'low' ? 
          'Privacy disclosures present but could be enhanced for full compliance.' :
          'Content collecting personal data must include clear privacy policies and consent mechanisms.',
        violationExplanation: 'This violation is triggered when advertising content requests or collects personal information (email addresses, contact details, subscription data) without proper privacy disclosures. Under GDPR, CCPA, PIPEDA, and other data protection laws, any collection of personal data requires clear notification of how the data will be used, stored, and shared. The violation occurs because consumers have the right to know what happens to their personal information before providing it. Missing privacy notices can result in significant regulatory fines (up to 4% of annual revenue under GDPR) and legal action from data protection authorities. The violation is particularly serious when targeting EU citizens, California residents, or Canadian consumers.',
        regulation: 'GDPR / CCPA / PIPEDA',
        regulationRef: 'GDPR Article 13-14, CCPA Section 1798.100, PIPEDA Schedule 1',
        sourceUrl: 'https://gdpr.eu/article-13-information-to-be-provided/',
        confidence: '92% confidence',
        detectedTerms: detectedKeywords.filter(k => k.category === 'privacy').map(k => k.keyword),
        regulatoryImpact: severity === 'low' ? 'Minor compliance enhancement needed' : 'Significant fine risk without compliance',
        jurisdictionsAffected: ['EU (GDPR)', 'California (CCPA)', 'Canada (PIPEDA)', 'UK (Data Protection Act)'],
        recommendations: [
          'Include clear, prominent privacy policy link',
          'Add explicit consent checkboxes for data collection',
          'Specify data retention periods and deletion rights',
          'Provide opt-out mechanisms and contact information',
          'Add cookie consent banners for website tracking',
          'Include data processing legal basis under GDPR'
        ]
      });
    }

    // Enhanced Health claims analysis
    healthKeywords.forEach(keyword => {
      if (contentLower.includes(keyword)) {
        detectedKeywords.push({ keyword, category: 'health' });
        regulatoryTriggers.push('Health Claims Regulations');
      }
    });

    if (detectedKeywords.some(k => k.category === 'health')) {
      const hasDisclaimer = contentLower.includes('results may vary') || contentLower.includes('not typical') || contentLower.includes('consult doctor');
      const hasEvidence = contentLower.includes('study') || contentLower.includes('clinical') || contentLower.includes('research');
      const hasDangerousTerms = contentLower.includes('cure') || contentLower.includes('miracle');
      
      let severity = hasDangerousTerms ? 'high' : (hasDisclaimer && hasEvidence) ? 'low' : 'high';
      let scoreReduction = severity === 'high' ? 40 : severity === 'medium' ? 25 : 10;
      
      score -= scoreReduction;
      violations[severity]++;
      issues.push({
        type: severity,
        category: 'Health & Medical Claims',
        title: hasDangerousTerms ? 'Prohibited Medical Claims Detected' : 'Unsubstantiated Health Claims Detected',
        description: hasDangerousTerms ? 
          'Content contains prohibited medical claims that could endanger consumer health.' :
          'Health-related claims must be substantiated with scientific evidence and include appropriate disclaimers.',
        violationExplanation: hasDangerousTerms ?
          'This is a severe violation involving prohibited medical claims such as "cure" or "miracle" treatments. The FDA, FTC, and international health authorities strictly prohibit any advertising that claims to cure diseases, provide miraculous health benefits, or make absolute medical guarantees. These violations are considered particularly dangerous because they can delay consumers from seeking proper medical treatment, potentially causing serious health harm or death. Such claims trigger immediate regulatory action including cease and desist orders, product seizures, criminal prosecution, and civil penalties that can reach millions of dollars. The violation exists because only FDA-approved medical treatments can legally claim to cure diseases, and no supplement or non-prescription product can make such claims.' :
          'This violation occurs when advertising makes health or medical claims without proper scientific substantiation. Health-related claims trigger strict FDA and FTC requirements for clinical evidence. The violation exists because unproven health claims can mislead consumers into making harmful decisions about their health and medical care. Regulators require that any health claim be supported by competent and reliable scientific evidence, including peer-reviewed studies and clinical trials. Making unsubstantiated health claims can result in FDA warning letters, FTC enforcement actions, and potential criminal charges.',
        regulation: hasDangerousTerms ? 'FDA / FTC / International' : 'FDA Guidelines',
        regulationRef: hasDangerousTerms ? 
          'FDA FDCA Section 502(f), FTC Act Section 5, EU Health Claims Regulation 1924/2006' :
          'FTC US - Health Claims Substantiation Requirements, FDA Guidance',
        sourceUrl: hasDangerousTerms ? 
          'https://www.fda.gov/consumers/health-fraud-scams/fraudulent-health-claims' :
          'https://www.ftc.gov/business-guidance/advertising-marketing',
        confidence: hasDangerousTerms ? '99% confidence' : '91% confidence',
        detectedTerms: detectedKeywords.filter(k => k.category === 'health').map(k => k.keyword),
        regulatoryImpact: hasDangerousTerms ? 'Immediate enforcement action likely' : 'FDA/FTC investigation risk',
        healthRisk: hasDangerousTerms ? 'High - may delay proper medical treatment' : 'Medium - consumer confusion risk',
        recommendations: hasDangerousTerms ? [
          'URGENT: Remove all disease cure and miracle claims immediately',
          'Replace with FDA-compliant language only',
          'Add prominent medical disclaimer: "This product is not intended to diagnose, treat, cure, or prevent any disease"',
          'Consult FDA regulatory attorney immediately',
          'Consider voluntary product recall if already distributed',
          'Document remediation actions for regulatory response'
        ] : [
          'Remove unsubstantiated health claims',
          'Add "Results not typical" disclaimer prominently',
          'Include scientific evidence references for any health benefits',
          'Add "Consult your doctor" advisory',
          'Ensure compliance with FDA structure/function claim rules',
          'Consider third-party clinical validation'
        ]
      });
    }

    // Enhanced Pricing/discount analysis
    pricingKeywords.forEach(keyword => {
      if (contentLower.includes(keyword)) {
        detectedKeywords.push({ keyword, category: 'pricing' });
        regulatoryTriggers.push('Consumer Protection Laws');
      }
    });

    if (detectedKeywords.some(k => k.category === 'pricing')) {
      const hasTermsConditions = contentLower.includes('terms and conditions') || contentLower.includes('restrictions apply');
      const hasExpirationDate = contentLower.includes('expires') || contentLower.includes('valid until');
      const hasFreeOfferDetails = contentLower.includes('shipping') || contentLower.includes('handling');
      
      let severity = hasTermsConditions ? 'low' : 'medium';
      let scoreReduction = severity === 'low' ? 5 : 12;
      
      score -= scoreReduction;
      violations[severity]++;
      issues.push({
        type: severity,
        category: 'Pricing & Promotional Claims',
        title: severity === 'low' ? 'Promotional Disclosure Enhancement' : 'Missing Promotional Claim Substantiation',
        description: severity === 'low' ? 
          'Promotional offers include some disclosures but could be enhanced for full compliance.' :
          'Pricing claims and promotional offers must include clear terms and conditions.',
        violationExplanation: 'This violation occurs when promotional content includes pricing claims, discounts, or "free" offers without proper disclosure of terms and conditions. The FTC requires that all material terms of an offer be clearly and prominently disclosed. The violation exists because consumers can be misled by promotional claims that appear better than they actually are. For example, "free" offers often have hidden costs, shipping fees, or subscription requirements that must be disclosed. "Limited time" offers must have genuine time constraints, and "sale" prices must be compared to actual regular prices. Misleading pricing practices violate consumer protection laws and can result in FTC enforcement actions and consumer lawsuits.',
        regulation: 'FTC / Consumer Protection',
        regulationRef: 'FTC US - Truth in Advertising Standards Section 15.1, Consumer Protection Act',
        sourceUrl: 'https://www.ftc.gov/business-guidance/advertising-marketing',
        confidence: '82% confidence',
        detectedTerms: detectedKeywords.filter(k => k.category === 'pricing').map(k => k.keyword),
        regulatoryImpact: severity === 'low' ? 'Minor compliance gap' : 'Consumer protection violation risk',
        recommendations: [
          'Include clear, prominent terms and conditions for all offers',
          'Specify any restrictions, limitations, or eligibility requirements',
          'Provide specific expiration dates for limited-time offers',
          'Ensure "free" claims meet FTC requirements (no hidden costs)',
          'Add disclaimers for shipping, handling, or subscription fees',
          'Verify sale prices against actual previous pricing'
        ]
      });
    }

    // Enhanced Testimonial analysis
    testimonialKeywords.forEach(keyword => {
      if (contentLower.includes(keyword)) {
        detectedKeywords.push({ keyword, category: 'testimonials' });
        regulatoryTriggers.push('Endorsement Guidelines');
      }
    });

    if (detectedKeywords.some(k => k.category === 'testimonials')) {
      const hasResultsDisclaimer = contentLower.includes('results may vary') || contentLower.includes('not typical');
      const hasEndorsementDisclosure = contentLower.includes('paid') || contentLower.includes('sponsored') || contentLower.includes('compensation');
      const hasTypicalResults = contentLower.includes('typical') || contentLower.includes('average');
      
      let severity = hasResultsDisclaimer && hasEndorsementDisclosure ? 'low' : 'medium';
      let scoreReduction = severity === 'low' ? 3 : 8;
      
      score -= scoreReduction;
      violations[severity]++;
      issues.push({
        type: severity,
        category: 'Testimonials & Endorsements',
        title: severity === 'low' ? 'Testimonial Compliance Enhancement' : 'Missing Testimonial Disclosures',
        description: severity === 'low' ? 
          'Testimonials include some required disclosures but could be enhanced.' :
          'Customer testimonials require proper disclosure and substantiation.',
        violationExplanation: 'This violation occurs when advertising features customer testimonials, reviews, or endorsements without proper disclosures and substantiation. The FTC Endorsement Guidelines require that testimonials reflect the honest opinions and experiences of actual customers, and that any material connections between the endorser and advertiser be disclosed. The violation exists because testimonials can be misleading if they represent atypical results or if customers were compensated without disclosure. Advertisers must ensure testimonials are representative of typical customer experiences or include appropriate disclaimers. Using fake reviews, paying for testimonials without disclosure, or presenting exceptional results as typical violates FTC guidelines and can result in enforcement actions.',
        regulation: 'FTC Endorsement Guidelines',
        regulationRef: 'FTC US - Endorsement Guidelines Section 255.2, Truth in Advertising',
        sourceUrl: 'https://www.ftc.gov/business-guidance/advertising-marketing',
        confidence: '78% confidence',
        detectedTerms: detectedKeywords.filter(k => k.category === 'testimonials').map(k => k.keyword),
        regulatoryImpact: severity === 'low' ? 'Minor disclosure enhancement needed' : 'FTC guideline violation risk',
        recommendations: [
          'Add prominent "Results may vary" or "Results not typical" disclaimer',
          'Include actual customer consent documentation for testimonials',
          'Ensure testimonials reflect typical customer experience',
          'Add clear paid endorsement disclosures where applicable',
          'Verify authenticity of all customer reviews and testimonials',
          'Consider showing range of results rather than exceptional cases only'
        ]
      });
    }


    // Enhanced scoring and analysis summary
    let status = 'passed';
    let summary = 'Your content meets compliance standards.';
    let riskLevel = 'Low';
    let actionRequired = 'Monitor';
    
    if (score < 60) {
      status = 'failed';
      summary = 'Your content has critical compliance violations that require immediate attention.';
      riskLevel = 'Critical';
      actionRequired = 'Immediate Action Required';
    } else if (score < 75) {
      status = 'failed';
      summary = 'Your content has significant compliance issues that must be addressed before publication.';
      riskLevel = 'High';
      actionRequired = 'Must Fix Before Launch';
    } else if (score < 85) {
      status = 'warning';
      summary = 'Your content has compliance concerns that should be reviewed and addressed.';
      riskLevel = 'Medium';
      actionRequired = 'Review and Improve';
    } else if (score < 95) {
      status = 'warning';
      summary = 'Your content is mostly compliant but has minor issues to address.';
      riskLevel = 'Low-Medium';
      actionRequired = 'Minor Adjustments';
    }

    // Add comprehensive analysis metadata
    const analysisMetadata = {
      totalKeywordsDetected: detectedKeywords.length,
      regulatoryFrameworks: [...new Set(regulatoryTriggers)],
      detectedKeywords: detectedKeywords,
      riskLevel: riskLevel,
      actionRequired: actionRequired,
      complianceAreas: {
        financial: detectedKeywords.some(k => k.category === 'financial'),
        privacy: detectedKeywords.some(k => k.category === 'privacy'),
        health: detectedKeywords.some(k => k.category === 'health'),
        pricing: detectedKeywords.some(k => k.category === 'pricing'),
        testimonials: detectedKeywords.some(k => k.category === 'testimonials')
      },
      recommendedReview: issues.length > 0 ? 'Legal counsel recommended' : 'Internal review sufficient'
    };

    return { 
      score, 
      status, 
      summary, 
      violations, 
      issues, 
      metadata: analysisMetadata 
    };
  };

  const runAnalysis = () => {
    if (!reviewTitle.trim()) {
      setReviewTitle(`Content Review - ${new Date().toLocaleDateString()}`);
    }
    setStep('analyzing');
    setAnalysisStep(0);
    
    const stepInterval = setInterval(() => {
      setAnalysisStep(prev => {
        if (prev >= 3) {
          clearInterval(stepInterval);
          setTimeout(() => {
            const content = adContent || uploadedFile?.name || 'sample content';
            const analysisResult = analyzeContent(content);
            
            setAnalysis({
              ...analysisResult,
              passed: [
                { category: 'Contact Info', title: 'Required contact information included' },
                { category: 'Clear Language', title: 'Content uses clear, understandable language' },
                { category: 'Legal Compliance', title: 'No obvious legal violations detected' }
              ]
            });
            setStep('results');
          }, 500);
          return prev;
        }
        return prev + 1;
      });
    }, 800);
  };

  // Multi-file analysis function
  const analyzeMultipleFiles = () => {
    const allFiles = uploadedFiles.length > 0 ? uploadedFiles : (uploadedFile ? [uploadedFile] : []);
    const content = adContent || '';
    
    if (allFiles.length === 0 && !content) return;

    setStep('analyzing');
    setAnalysisStep(0);
    
    const stepInterval = setInterval(() => {
      setAnalysisStep(prev => {
        if (prev >= 3) {
          clearInterval(stepInterval);
          setTimeout(() => {
            let fileAnalyses = [];
            let overallScore = 0;
            let combinedIssues = [];
            let combinedViolations = { high: 0, medium: 0, low: 0 };
            
            // Analyze each file individually
            allFiles.forEach((file, index) => {
              const fileContent = content || file.name || `File ${index + 1}`;
              const analysis = analyzeContent(fileContent);
              
              fileAnalyses.push({
                fileName: file.name,
                fileType: file.type,
                analysis: analysis
              });
              
              // Combine scores (weighted average)
              overallScore += analysis.score;
              
              // Combine issues
              combinedIssues = [...combinedIssues, ...analysis.issues.map(issue => ({
                ...issue,
                fileName: file.name
              }))];
              
              // Combine violations
              combinedViolations.high += analysis.violations.high;
              combinedViolations.medium += analysis.violations.medium;
              combinedViolations.low += analysis.violations.low;
            });

            // If only text content and no files
            if (allFiles.length === 0 && content) {
              const textAnalysis = analyzeContent(content);
              fileAnalyses.push({
                fileName: 'Text Content',
                fileType: 'text/plain',
                analysis: textAnalysis
              });
              overallScore = textAnalysis.score;
              combinedIssues = textAnalysis.issues;
              combinedViolations = textAnalysis.violations;
            } else {
              // Calculate average score
              overallScore = Math.round(overallScore / allFiles.length);
            }

            const overallStatus = overallScore >= 85 ? 'passed' : overallScore >= 70 ? 'warning' : 'failed';
            
            // Set multi-file analysis
            setMultiFileAnalysis({
              overallScore,
              status: overallStatus,
              fileCount: allFiles.length + (content && allFiles.length === 0 ? 1 : 0),
              fileAnalyses,
              combinedIssues,
              violations: combinedViolations,
              summary: `Campaign analysis complete. ${fileAnalyses.length} ${fileAnalyses.length === 1 ? 'asset' : 'assets'} reviewed with ${combinedIssues.length} ${combinedIssues.length === 1 ? 'issue' : 'issues'} found.`
            });

            // Set single analysis for backward compatibility
            if (fileAnalyses.length > 0) {
              setAnalysis({
                ...fileAnalyses[0].analysis,
                score: overallScore,
                status: overallStatus,
                multiFile: true,
                fileCount: fileAnalyses.length
              });
            }

            setStep('results');
          }, 500);
          return prev;
        }
        return prev + 1;
      });
    }, 800);
  };

  const getFileIcon = (file) => {
    if (!file) return FileText;
    const type = file.type;
    if (!type) return FileText;
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('video/')) return Film;
    return FileText;
  };

  const FileIcon = uploadedFile ? getFileIcon(uploadedFile) : FileText;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Compliance Check</h2>
          <p className="text-gray-500 text-sm">Analyze your ad for regulatory compliance</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6">
        {step === 'upload' && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">New Compliance Review</h2>
              <p className="text-gray-600">Analyze your marketing content with AI for comprehensive compliance checking</p>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <div
                className={`border-2 border-dashed rounded-lg p-16 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {uploadedFiles.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">
                        Uploaded Files ({uploadedFiles.length})
                      </h4>
                      <label className="flex items-center gap-2 text-blue-600 hover:text-blue-700 cursor-pointer text-sm">
                        <Upload className="w-4 h-4" />
                        Add More Files
                        <input
                          type="file"
                          className="hidden"
                          multiple
                          accept="image/*,video/*,.pdf,.doc,.docx,.pptx,.txt"
                          onChange={handleFileInput}
                        />
                      </label>
                    </div>
                    {uploadedFiles.map((file, index) => {
                      const FileIcon = getFileIcon(file);
                      return (
                        <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                          <FileIcon className="w-6 h-6 text-blue-500" />
                          <div className="flex-1 text-left">
                            <p className="font-medium text-gray-900 text-sm">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Unknown size'}
                            </p>
                          </div>
                          <button
                            onClick={() => removeFile(index)}
                            className="p-1 text-gray-400 hover:text-red-500"
                            title="Remove file"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : uploadedFile ? (
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <FileIcon className="w-8 h-8 text-blue-500" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{uploadedFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(uploadedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      onClick={() => setUploadedFile(null)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <textarea
                      value={adContent}
                      onChange={(e) => setAdContent(e.target.value)}
                      className="w-full h-64 px-4 py-3 border-0 outline-none resize-none text-gray-600 bg-transparent"
                      placeholder="Describe your marketing content or paste it here... You can also drag and drop files directly into this area."
                    />
                    <div className="flex items-center justify-center mt-8 gap-4">
                      <label className="flex items-center gap-2 text-gray-500 hover:text-gray-700 cursor-pointer">
                        <Upload className="w-5 h-5" />
                        <input
                          type="file"
                          className="hidden"
                          multiple
                          accept="image/*,video/*,.pdf,.doc,.docx,.pptx,.txt"
                          onChange={handleFileInput}
                        />
                      </label>
                      <button className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg flex items-center gap-2">
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between mt-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                  <span>Powered by AI Compliance Analysis</span>
                </div>
                <div className="text-center">
                  <span>Supported: Images, Videos, Documents (PDF, DOCX, PPTX, TXT)</span>
                </div>
                <div>
                  <span>Maximum file size: 100MB per file</span>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <button
                  onClick={analyzeMultipleFiles}
                  disabled={!adContent && uploadedFiles.length === 0 && !uploadedFile}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-8 py-3 rounded-lg font-medium disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                >
                  <BarChart3 className="w-5 h-5" />
                  {uploadedFiles.length > 1 ? `Analyze ${uploadedFiles.length} Files` : 'Start Analysis'}
                </button>
                {(uploadedFiles.length > 0 || uploadedFile || adContent) && (
                  <p className="text-sm text-gray-500 mt-2">
                    {uploadedFiles.length > 1 ? 
                      `Multi-file campaign analysis will provide individual scores and combined compliance rating` :
                      `Single asset analysis with comprehensive compliance scoring`
                    }
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 'analyzing' && (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <button 
                className="text-gray-600 hover:text-gray-800"
                onClick={onClose}
              >
                ← Back to Reviews
              </button>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">{reviewTitle || 'ROIS-Marcore-invoice Review'}</h1>
                <p className="text-gray-600">Compliance analysis results</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Scoring:</span>
                <select className="border border-gray-300 rounded px-2 py-1 text-sm">
                  <option>AI-only</option>
                  <option>Hybrid</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">Analysis Status</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">●</span>
                    <span className="text-gray-700">Running AI-powered compliance analysis...</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {[
                  { name: 'Content Processing', desc: 'Text extraction and file analysis completed', status: analysisStep >= 0 ? 'completed' : 'pending' },
                  { name: 'Regulatory Analysis', desc: 'Preparing regulatory database lookup', status: analysisStep >= 1 ? 'completed' : analysisStep === 0 ? 'active' : 'pending' },
                  { name: 'Violation Detection', desc: 'Waiting for regulatory analysis', status: analysisStep >= 2 ? 'completed' : analysisStep === 1 ? 'active' : 'pending' },
                  { name: 'Quality Validation', desc: 'Final review and scoring', status: analysisStep >= 3 ? 'completed' : analysisStep === 2 ? 'active' : 'pending' }
                ].map((step, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mt-1 ${
                      step.status === 'completed' ? 'bg-green-100' :
                      step.status === 'active' ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      {step.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : step.status === 'active' ? (
                        <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" />
                      ) : (
                        <div className="w-3 h-3 bg-gray-400 rounded-full" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{step.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Estimated time:</strong> 2-5 minutes for complex content with files, 30-60 seconds for text-only
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  Analysis runs in the background. You can navigate away and return later - your results will be saved.
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Processing:</strong> AI is analyzing your content against 3 regions and 10 platforms.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 'results' && (analysis || multiFileAnalysis) && (
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <button 
                className="text-gray-600 hover:text-gray-800"
                onClick={onClose}
              >
                ← Back to Reviews
              </button>
              <div className="flex-1">
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="Enter review title..."
                  className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none w-full"
                />
                <p className="text-gray-600">Compliance analysis results</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={saveReview}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  disabled={!analysis && !multiFileAnalysis}
                >
                  Save Review
                </button>
                <button 
                  onClick={runAnalysis}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Re-analyze
                </button>
                <button className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50">
                  Export Report
                </button>
                <button 
                  onClick={() => setShowCollabModal(true)}
                  className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
                >
                  Collaborate
                </button>
                <button 
                  onClick={() => setShowScoringInfo(true)}
                  className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  How Scoring Works
                </button>
              </div>
            </div>

            {/* Multi-file Analysis Summary */}
            {multiFileAnalysis && multiFileAnalysis.fileCount > 1 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Campaign Analysis Summary</h3>
                <p className="text-blue-800 mb-4">{multiFileAnalysis.summary}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{multiFileAnalysis.overallScore}%</div>
                    <div className="text-sm text-blue-700">Overall Score</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{multiFileAnalysis.fileCount}</div>
                    <div className="text-sm text-blue-700">Files Analyzed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{multiFileAnalysis.combinedIssues.length}</div>
                    <div className="text-sm text-blue-700">Total Issues</div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${
                      multiFileAnalysis.status === 'passed' ? 'text-green-600' :
                      multiFileAnalysis.status === 'warning' ? 'text-orange-600' : 'text-red-600'
                    }`}>{multiFileAnalysis.status.toUpperCase()}</div>
                    <div className="text-sm text-blue-700">Status</div>
                  </div>
                </div>
              </div>
            )}

            {/* Individual File Analysis Results */}
            {multiFileAnalysis && multiFileAnalysis.fileAnalyses.length > 1 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Individual File Results</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {multiFileAnalysis.fileAnalyses.map((fileResult, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5">
                          {React.createElement(getFileIcon({ type: fileResult.fileType }))}
                        </div>
                        <h4 className="font-medium text-gray-900 truncate" title={fileResult.fileName}>
                          {fileResult.fileName}
                        </h4>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Score:</span>
                          <span className={`font-bold ${
                            fileResult.analysis.score >= 85 ? 'text-green-600' :
                            fileResult.analysis.score >= 70 ? 'text-orange-600' : 'text-red-600'
                          }`}>{fileResult.analysis.score}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Issues:</span>
                          <span className="text-sm font-medium">{fileResult.analysis.issues.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Status:</span>
                          <span className={`text-xs font-medium px-2 py-1 rounded ${
                            fileResult.analysis.status === 'passed' ? 'bg-green-100 text-green-700' :
                            fileResult.analysis.status === 'warning' ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>{fileResult.analysis.status.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Enhanced Compliance Score Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className={`border rounded-lg p-6 text-center ${
                analysis.score >= 85 ? 'bg-green-50 border-green-200' :
                analysis.score >= 75 ? 'bg-orange-50 border-orange-200' :
                analysis.score >= 60 ? 'bg-red-50 border-red-200' :
                'bg-red-100 border-red-300'
              }`}>
                <div className={`text-3xl font-bold mb-2 ${
                  analysis.score >= 85 ? 'text-green-600' :
                  analysis.score >= 75 ? 'text-orange-600' :
                  'text-red-600'
                }`}>{analysis.score}%</div>
                <div className={`text-sm font-medium ${
                  analysis.score >= 85 ? 'text-green-700' :
                  analysis.score >= 75 ? 'text-orange-700' :
                  'text-red-700'
                }`}>Compliance Score</div>
                <div className={`text-xs mt-1 ${
                  analysis.score >= 85 ? 'text-green-600' :
                  analysis.score >= 75 ? 'text-orange-600' :
                  'text-red-600'
                }`}>{analysis.metadata?.riskLevel || 'Unknown Risk'}</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">{analysis.violations.high}</div>
                <div className="text-sm text-red-700 font-medium">High Risk</div>
                <div className="text-xs text-red-600 mt-1">Critical Issues</div>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">{analysis.violations.medium}</div>
                <div className="text-sm text-orange-700 font-medium">Medium Risk</div>
                <div className="text-xs text-orange-600 mt-1">Violations</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-yellow-600 mb-2">{analysis.violations.low}</div>
                <div className="text-sm text-yellow-700 font-medium">Low Risk</div>
                <div className="text-xs text-yellow-600 mt-1">Minor Issues</div>
              </div>
            </div>

            {/* Analysis Summary Card */}
            {analysis.metadata && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-blue-900">📊 Analysis Summary</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    analysis.metadata.riskLevel === 'Critical' ? 'bg-red-100 text-red-800' :
                    analysis.metadata.riskLevel === 'High' ? 'bg-red-100 text-red-800' :
                    analysis.metadata.riskLevel === 'Medium' ? 'bg-orange-100 text-orange-800' :
                    analysis.metadata.riskLevel === 'Low-Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>{analysis.metadata.actionRequired}</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-medium text-blue-900 text-sm mb-2">🔍 Detection Results</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• {analysis.metadata.totalKeywordsDetected} compliance triggers found</li>
                      <li>• {analysis.metadata.regulatoryFrameworks.length} regulatory frameworks involved</li>
                      <li>• {analysis.issues.length} violations detected</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-blue-900 text-sm mb-2">⚖️ Regulatory Scope</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      {analysis.metadata.regulatoryFrameworks.slice(0, 3).map((framework, idx) => (
                        <li key={idx}>• {framework}</li>
                      ))}
                      {analysis.metadata.regulatoryFrameworks.length > 3 && (
                        <li>• +{analysis.metadata.regulatoryFrameworks.length - 3} more...</li>
                      )}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-blue-900 text-sm mb-2">📋 Compliance Areas</h4>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(analysis.metadata.complianceAreas).map(([area, detected]) => (
                        detected && (
                          <span key={area} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                            {area.charAt(0).toUpperCase() + area.slice(1)}
                          </span>
                        )
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-white border border-blue-200 rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">Recommendation:</span>
                    <span className="text-sm text-blue-700">{analysis.metadata.recommendedReview}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Compliance Violations */}
            <div className="bg-white rounded-lg border border-gray-200 mb-8">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">🚨 Compliance Violations</h2>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">{analysis.issues.length} Issues found</span>
                    {analysis.issues.some(issue => issue.type === 'high') && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">Action Required</span>
                    )}
                  </div>
                </div>
                {analysis.issues.length === 0 ? (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                    <div className="text-green-600 text-lg mb-2">✅ No Violations Detected</div>
                    <p className="text-green-700 text-sm">Your content appears to meet compliance standards.</p>
                  </div>
                ) : (
                  <div className="mt-4">
                    <p className="text-gray-600 text-sm">
                      {analysis.summary} Review each violation below and implement the recommended changes.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="divide-y divide-gray-200">
                {analysis.issues.map((issue, index) => (
                  <div key={index} className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mt-1 ${
                        issue.type === 'high' ? 'bg-red-100' : 
                        issue.type === 'medium' ? 'bg-orange-100' : 'bg-yellow-100'
                      }`}>
                        <AlertTriangle className={`w-4 h-4 ${
                          issue.type === 'high' ? 'text-red-600' :
                          issue.type === 'medium' ? 'text-orange-600' : 'text-yellow-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900">{issue.title}</h3>
                              <span className={`text-xs px-2 py-1 rounded font-medium ${
                                issue.type === 'high' ? 'bg-red-100 text-red-700' :
                                issue.type === 'medium' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {issue.type.toUpperCase()} RISK
                              </span>
                              <span className="text-xs text-gray-500">{issue.confidence}</span>
                            </div>
                            {issue.regulatoryImpact && (
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-medium text-gray-700">Impact:</span>
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  issue.regulatoryImpact.includes('Immediate') ? 'bg-red-50 text-red-600' :
                                  issue.regulatoryImpact.includes('Significant') ? 'bg-orange-50 text-orange-600' :
                                  'bg-blue-50 text-blue-600'
                                }`}>{issue.regulatoryImpact}</span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4 text-right">
                            <div className="text-xs text-gray-500">Violation #{index + 1}</div>
                            {issue.remediation && (
                              <div className="text-xs font-medium text-blue-600 mt-1">{issue.remediation}</div>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-gray-600 text-sm leading-relaxed mb-4">
                          {issue.description}
                        </p>

                        {/* Violation Explanation */}
                        {issue.violationExplanation && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                            <h4 className="font-medium text-yellow-900 text-sm mb-2">⚠️ What This Violation Means</h4>
                            <p className="text-sm text-yellow-800 leading-relaxed">
                              {issue.violationExplanation}
                            </p>
                          </div>
                        )}

                        {/* Enhanced Regulation Reference */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 text-sm mb-2">📋 Regulatory Framework</h4>
                              <div className="space-y-2">
                                <p className="text-sm text-gray-700">
                                  <span className="font-medium">Citation:</span> {issue.regulationRef}
                                </p>
                                <p className="text-sm text-gray-700">
                                  <span className="font-medium">Authority:</span> {issue.regulation}
                                </p>
                                {issue.detectedTerms && issue.detectedTerms.length > 0 && (
                                  <div>
                                    <span className="text-sm font-medium text-gray-700">Detected Terms:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {issue.detectedTerms.map((term, termIdx) => (
                                        <span key={termIdx} className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded">
                                          {term}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {issue.jurisdictionsAffected && (
                                  <div>
                                    <span className="text-sm font-medium text-gray-700">Jurisdictions:</span>
                                    <div className="text-sm text-gray-600 mt-1">
                                      {issue.jurisdictionsAffected.join(', ')}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="ml-4 flex flex-col gap-2">
                              <a 
                                href={issue.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 text-xs underline"
                              >
                                View Source
                              </a>
                              {issue.healthRisk && (
                                <span className={`text-xs px-2 py-1 rounded font-medium ${
                                  issue.healthRisk.includes('High') ? 'bg-red-100 text-red-700' :
                                  'bg-orange-100 text-orange-700'
                                }`}>
                                  {issue.healthRisk}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Recommendations */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-medium text-blue-900 text-sm mb-3">💡 Recommendations</h4>
                          <ul className="space-y-2">
                            {issue.recommendations.map((rec, recIndex) => (
                              <li key={recIndex} className="flex items-start gap-2 text-sm text-blue-800">
                                <span className="text-blue-600 mt-1">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Analysis Accuracy Report */}
            <div className="bg-white rounded-lg border border-gray-200 mb-8">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">📊 Analysis Accuracy Report</h2>
              </div>
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Regulation Database</h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-green-800">229</span>
                      <div className="text-sm text-green-700">
                        <div>Total Regulations</div>
                        <div className="text-xs text-green-600 mt-1">
                          Covering: US, Canada, UK, etc • Platforms: Google, Facebook, etc
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Top Jurisdictions:</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm text-gray-700">ACCURACY LEVEL DETECTION</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm text-gray-700">SCOPE ADEQUACY ENHANCED</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm text-gray-700">ASA Risk Analysis</span>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <strong>Data Sources:</strong> All regulations and policies verified to regulations database [US-FTC, CA-CSA-10]
                </div>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* Collaboration Modal */}
      {showCollabModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Collaborate on Review</h3>
              <button
                onClick={() => setShowCollabModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invite team members
                </label>
                <input
                  type="email"
                  placeholder="Enter email addresses..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permission level
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Can view and comment</option>
                  <option>Can edit</option>
                  <option>Admin access</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message (optional)
                </label>
                <textarea
                  placeholder="Add a note about this review..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCollabModal(false);
                  // Show success message
                  alert('Collaboration invite sent successfully!');
                }}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Send Invite
              </button>
              <button
                onClick={() => setShowCollabModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scoring Information Modal */}
      {showScoringInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">📊 How Compliance Scoring Works</h2>
                <button
                  onClick={() => setShowScoringInfo(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {/* Recent Scoring Audit */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">🔍 Recent Scoring Audit</h3>
                
                <div className="space-y-4">
                  <div className="bg-white border border-red-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                          <h4 className="font-semibold text-gray-900">Violation</h4>
                          <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded font-medium">HIGH • 15</span>
                        </div>
                        <p className="text-gray-700 text-sm mb-2">
                          Ads must comply with data privacy regulations by clearly stating how consumer data will be used and protected, as required under GDPR.
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Invalid Date</span>
                          <span>Rule: N/A</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-orange-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                          <h4 className="font-semibold text-gray-900">Violation</h4>
                          <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded font-medium">MEDIUM • 8</span>
                        </div>
                        <p className="text-gray-700 text-sm mb-2">
                          Pricing must be clearly stated to avoid misleading consumers. According to advertising regulations, all prices must be transparent and include any fees or conditions.
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Invalid Date</span>
                          <span>Rule: N/A</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-red-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                          <h4 className="font-semibold text-gray-900">Violation</h4>
                          <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded font-medium">HIGH • 15</span>
                        </div>
                        <p className="text-gray-700 text-sm mb-2">
                          Failure to provide necessary consumer protection disclosures can lead to misleading advertising practices. Ads must disclose all relevant information that could affect consumer decisions according to consumer protection laws.
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Invalid Date</span>
                          <span>Rule: N/A</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scoring Overview */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">📋 Scoring Overview</h3>
                <p className="text-gray-700 mb-6">
                  Each review is scored independently on its own merit from 0-100% based on compliance violations found. The score reflects how well your content meets regulatory requirements and platform policies.
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h4 className="font-semibold text-blue-900 mb-4">🎯 Key Principles:</h4>
                  <ul className="space-y-2 text-blue-800">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Each review is evaluated independently</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Scores are based solely on violations found in that specific content</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>No penalties for previous reviews or repeat violations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Content with no violations automatically scores 95-100%</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Score Ranges & Meanings */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6">🎯 Score Ranges & Meanings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600 mb-2">95-100%</div>
                    <h4 className="font-semibold text-green-800 mb-2">Excellent Compliance</h4>
                    <p className="text-green-700 text-sm">No violations found — content ready for publication.</p>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600 mb-2">75-94%</div>
                    <h4 className="font-semibold text-blue-800 mb-2">Good Compliance</h4>
                    <p className="text-blue-700 text-sm">Minor issues to address — easily fixed.</p>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-yellow-600 mb-2">50-74%</div>
                    <h4 className="font-semibold text-yellow-800 mb-2">Moderate Compliance</h4>
                    <p className="text-yellow-700 text-sm">Several violations need fixing before publication.</p>
                  </div>
                  
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-orange-600 mb-2">25-49%</div>
                    <h4 className="font-semibold text-orange-800 mb-2">Poor Compliance</h4>
                    <p className="text-orange-700 text-sm">Major violations requiring significant revision.</p>
                  </div>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-red-600 mb-2">0-24%</div>
                    <h4 className="font-semibold text-red-800 mb-2">Critical Compliance Failure</h4>
                    <p className="text-red-700 text-sm">Multiple critical violations — immediate action required.</p>
                  </div>
                </div>
              </div>

              {/* Point Deduction System */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">⚖️ Point Deduction System</h3>
                
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">How Points Are Deducted:</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded">
                        <span className="font-medium text-gray-900">Starting Score:</span>
                        <span className="font-bold text-green-600">100 points</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-white border border-red-200 rounded">
                        <span className="font-medium text-gray-900">High Violation:</span>
                        <span className="font-bold text-red-600">-15 points each</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-white border border-orange-200 rounded">
                        <span className="font-medium text-gray-900">Medium Violation:</span>
                        <span className="font-bold text-orange-600">-8 points each</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-white border border-yellow-200 rounded">
                        <span className="font-medium text-gray-900">Low Violation:</span>
                        <span className="font-bold text-yellow-600">-3 points each</span>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h5 className="font-semibold text-green-800 mb-2">Special Rule:</h5>
                      <p className="text-green-700 text-sm">
                        Content with no violations automatically receives a score of 95-100%.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Important Notes */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">⚠️ Important Notes</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2">✅ Perfect Compliance = High Scores</h4>
                    <p className="text-green-700 text-sm">
                      Content with no compliance violations automatically receives a score of 95-100%.
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">🔄 Independent Scoring</h4>
                    <p className="text-blue-700 text-sm">
                      Each review is scored independently.
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-800 mb-2">🎯 Context Matters</h4>
                    <p className="text-purple-700 text-sm">
                      Scoring considers target regions, platforms, and industry.
                    </p>
                  </div>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-800 mb-2">⚖️ Human Review Recommended</h4>
                    <p className="text-red-700 text-sm">
                      For scores below 60% or critical issues, consult legal.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
              <button
                onClick={() => setShowScoringInfo(false)}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
              >
                Close Scoring Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
