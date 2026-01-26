// Wrap everything in try-catch for debugging
try {
  console.log('Starting server initialization...');
  console.log('Node version:', process.version);
  console.log('Current directory:', __dirname);

const express = require('express');
console.log('Express loaded');
const path = require('path');
const cron = require('node-cron');
console.log('node-cron loaded');
const axios = require('axios');
console.log('axios loaded');
const cheerio = require('cheerio');
console.log('cheerio loaded');
const fs = require('fs');
const bcrypt = require('bcryptjs');
console.log('bcryptjs loaded');
const jwt = require('jsonwebtoken');
console.log('jsonwebtoken loaded');
const cookieParser = require('cookie-parser');
console.log('All dependencies loaded successfully');
const nodemailer = require('nodemailer');
console.log('nodemailer loaded');

const app = express();
const PORT = process.env.PORT || 3000;
console.log('Will use port:', PORT);
const JWT_SECRET = process.env.JWT_SECRET || 'idmeta-secret-key-change-in-production-2024';
const JWT_EXPIRES_IN = '7d';

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send email notification
async function sendEmailNotification(user, notification) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email credentials not configured, skipping email notification');
    return;
  }
  
  try {
    let emailText = `${notification.description}\n\n`;
    
    // Add compliance requirements if available
    if (notification.requirements && notification.requirements.length > 0) {
      emailText += "COMPLIANCE REQUIREMENTS:\n";
      notification.requirements.slice(0, 3).forEach((req, i) => {
        emailText += `${i + 1}. ${req}\n`;
      });
      emailText += "\n";
    }
    
    // Add detected changes if available
    if (notification.changes && notification.changes.length > 0) {
      emailText += "KEY CHANGES:\n";
      notification.changes.forEach((change, i) => {
        emailText += `${i + 1}. ${change}\n`;
      });
      emailText += "\n";
    }
    
    emailText += `Authority: ${notification.authority}\n`;
    emailText += `Priority: ${notification.priority}\n`;
    emailText += `Category: ${notification.category}\n\n`;
    emailText += `View full details in dashboard: https://idmeta.onrender.com`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `New Regulation Update: ${notification.title}`,
      text: emailText
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${user.email} for notification: ${notification.title}`);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

// JSON file-based user storage (no native modules needed)
const USERS_FILE = path.join(__dirname, 'users.json');

function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading users:', error);
  }
  return { users: [], nextId: 1 };
}

function saveUsers(data) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving users:', error);
  }
}

function findUserByEmail(email) {
  const data = loadUsers();
  return data.users.find(u => u.email === email.toLowerCase());
}

function findUserById(id) {
  const data = loadUsers();
  return data.users.find(u => u.id === id);
}

function createUser(userData) {
  const data = loadUsers();
  const newUser = {
    id: data.nextId++,
    ...userData,
    email: userData.email.toLowerCase(),
    role: 'user',
    createdAt: new Date().toISOString(),
    lastLogin: null
  };
  data.users.push(newUser);
  saveUsers(data);
  return newUser;
}

function updateUser(id, updates) {
  const data = loadUsers();
  const index = data.users.findIndex(u => u.id === id);
  if (index !== -1) {
    data.users[index] = { ...data.users[index], ...updates };
    saveUsers(data);
    return data.users[index];
  }
  return null;
}

// Middleware
app.use(express.json());
app.use(cookieParser());

// Health check endpoint (test if server is running)
app.get('/health', (req, res) => {
  const distDir = path.join(__dirname, 'dist');
  const assetsDir = path.join(distDir, 'assets');
  const indexPath = path.join(distDir, 'index.html');
  
  let assetsFiles = [];
  try {
    if (fs.existsSync(assetsDir)) {
      assetsFiles = fs.readdirSync(assetsDir);
    }
  } catch (e) {
    assetsFiles = ['ERROR: ' + e.message];
  }
  
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    distPath: distDir,
    distExists: fs.existsSync(distDir),
    indexExists: fs.existsSync(indexPath),
    assetsExists: fs.existsSync(assetsDir),
    assetsFiles: assetsFiles
  });
});

// Check if dist folder exists
const distPath = path.join(__dirname, 'dist');
const distExists = fs.existsSync(distPath);
console.log('Dist folder path:', distPath);
console.log('Dist folder exists:', distExists);
if (distExists) {
  const distFiles = fs.readdirSync(distPath);
  console.log('Dist folder contents:', distFiles);
}

// Serve assets with explicit MIME types (bypass Apache)
app.get('/assets/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(distPath, 'assets', filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }
  
  // Set correct MIME type
  if (filename.endsWith('.js')) {
    res.type('application/javascript');
  } else if (filename.endsWith('.css')) {
    res.type('text/css');
  }
  
  res.sendFile(filePath);
});

// Serve other static files
app.get('/favicon.svg', (req, res) => {
  res.type('image/svg+xml');
  res.sendFile(path.join(distPath, 'favicon.svg'));
});

app.get('/idmeta-logo.svg', (req, res) => {
  res.type('image/svg+xml');
  res.sendFile(path.join(distPath, 'idmeta-logo.svg'));
});

// Serve index.html for root and SPA routes
app.get('/', (req, res) => {
  res.type('text/html');
  res.sendFile(path.join(distPath, 'index.html'));
});

// Auth middleware
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};

// Optional auth - doesn't fail if no token
const optionalAuth = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Token invalid, but continue without user
    }
  }
  next();
};

// Data storage file
const DATA_FILE = path.join(__dirname, 'regulation-updates.json');

// Regulation sources to scrape
const REGULATION_SOURCES = [
  {
    id: 'fda',
    name: 'FDA',
    url: 'https://www.fda.gov/news-events/rss-feeds',
    category: 'Healthcare'
  },
  {
    id: 'ftc',
    name: 'FTC',
    url: 'https://www.ftc.gov/news-events/news/press-releases',
    category: 'Advertising'
  },
  {
    id: 'fca_uk',
    name: 'FCA UK',
    url: 'https://www.fca.org.uk/news',
    category: 'Financial'
  },
  {
    id: 'google_ads',
    name: 'Google Ads',
    url: 'https://support.google.com/adspolicy/answer/6008942',
    category: 'Platform Policy'
  },
  {
    id: 'meta_ads',
    name: 'Meta Ads',
    url: 'https://transparency.fb.com/policies/ad-standards/',
    category: 'Platform Policy'
  }
];

// Load existing data
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
  return {
    lastUpdate: null,
    notifications: [],
    updates: []
  };
}

// Save data
function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// Scrape a single source
async function scrapeSource(source) {
  try {
    console.log(`Scraping ${source.name}...`);
    const response = await axios.get(source.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(response.data);
    const pageTitle = $('title').text();
    const lastModified = response.headers['last-modified'] || new Date().toISOString();
    
    // Extract regulation content based on source
    let regulationContent = '';
    let complianceRequirements = [];
    let changes = [];
    
    if (source.id === 'fda') {
      // FDA specific extraction
      regulationContent = extractFDAContent($);
      complianceRequirements = extractFDARequirements($);
      changes = extractFDAChanges($);
    } else if (source.id === 'ftc') {
      // FTC specific extraction
      regulationContent = extractFTCContent($);
      complianceRequirements = extractFTCRequirements($);
      changes = extractFTCChanges($);
    } else {
      // Generic extraction
      regulationContent = extractGenericContent($);
      complianceRequirements = extractGenericRequirements($);
      changes = extractGenericChanges($);
    }
    
    return {
      source: source.id,
      name: source.name,
      category: source.category,
      url: source.url,
      title: pageTitle,
      content: regulationContent,
      requirements: complianceRequirements,
      changes: changes,
      lastChecked: new Date().toISOString(),
      lastModified: lastModified,
      status: 'success'
    };
  } catch (error) {
    console.error(`Error scraping ${source.name}:`, error.message);
    return {
      source: source.id,
      name: source.name,
      category: source.category,
      url: source.url,
      lastChecked: new Date().toISOString(),
      status: 'error',
      error: error.message
    };
  }
}

// FDA specific extraction functions
function extractFDAContent($) {
  const content = [];
  
  // Extract main content areas
  $('.field--name-field-body, .field--name-body, .article-content, .main-content').each((i, elem) => {
    const text = $(elem).text().trim();
    if (text.length > 100) {
      content.push(text.substring(0, 500) + '...');
    }
  });
  
  // Extract headings and descriptions
  $('h1, h2, h3').each((i, elem) => {
    const heading = $(elem).text().trim();
    const nextPara = $(elem).next('p').text().trim();
    if (heading && nextPara && heading.length < 200) {
      content.push(`${heading}: ${nextPara.substring(0, 300)}`);
    }
  });
  
  return content.slice(0, 3).join('\n\n');
}

function extractFDARequirements($) {
  const requirements = [];
  
  // Look for compliance-related text
  const complianceKeywords = ['must', 'shall', 'required', 'compliance', 'regulation', 'guideline'];
  
  $('p, li').each((i, elem) => {
    const text = $(elem).text().trim();
    if (text.length > 50 && text.length < 300) {
      const hasKeyword = complianceKeywords.some(keyword => 
        text.toLowerCase().includes(keyword.toLowerCase())
      );
      if (hasKeyword) {
        requirements.push(text);
      }
    }
  });
  
  return requirements.slice(0, 5);
}

function extractFDAChanges($) {
  const changes = [];
  
  // Look for update indicators
  const updateKeywords = ['update', 'new', 'revised', 'changed', 'effective', 'implementation'];
  
  $('h2, h3, .update, .news-item, .press-release').each((i, elem) => {
    const text = $(elem).text().trim();
    const hasKeyword = updateKeywords.some(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
    if (hasKeyword && text.length < 200) {
      changes.push(text);
    }
  });
  
  return changes.slice(0, 3);
}

// FTC specific extraction functions
function extractFTCContent($) {
  const content = [];
  
  $('.field--name-field-body, .press-release-body, .article-content').each((i, elem) => {
    const text = $(elem).text().trim();
    if (text.length > 100) {
      content.push(text.substring(0, 500) + '...');
    }
  });
  
  return content.slice(0, 2).join('\n\n');
}

function extractFTCRequirements($) {
  const requirements = [];
  const ftcKeywords = ['advertising', 'marketing', 'disclosure', 'endorsement', 'compliance'];
  
  $('p, li').each((i, elem) => {
    const text = $(elem).text().trim();
    if (text.length > 50 && text.length < 300) {
      const hasKeyword = ftcKeywords.some(keyword => 
        text.toLowerCase().includes(keyword.toLowerCase())
      );
      if (hasKeyword) {
        requirements.push(text);
      }
    }
  });
  
  return requirements.slice(0, 5);
}

function extractFTCChanges($) {
  const changes = [];
  
  $('.news-item, .press-release, h2').each((i, elem) => {
    const text = $(elem).text().trim();
    if (text.includes('new') || text.includes('update') || text.includes('rule')) {
      changes.push(text);
    }
  });
  
  return changes.slice(0, 3);
}

// Generic extraction functions
function extractGenericContent($) {
  const content = [];
  
  $('main, article, .content, .main-content').each((i, elem) => {
    const text = $(elem).text().trim();
    if (text.length > 100) {
      content.push(text.substring(0, 500) + '...');
    }
  });
  
  return content.slice(0, 2).join('\n\n');
}

function extractGenericRequirements($) {
  const requirements = [];
  const keywords = ['required', 'must', 'shall', 'compliance'];
  
  $('p, li').each((i, elem) => {
    const text = $(elem).text().trim();
    if (text.length > 50 && text.length < 300) {
      const hasKeyword = keywords.some(keyword => 
        text.toLowerCase().includes(keyword.toLowerCase())
      );
      if (hasKeyword) {
        requirements.push(text);
      }
    }
  });
  
  return requirements.slice(0, 3);
}

function extractGenericChanges($) {
  const changes = [];
  
  $('h2, h3, .update, .news').each((i, elem) => {
    const text = $(elem).text().trim();
    if (text.includes('new') || text.includes('update') || text.includes('change')) {
      changes.push(text);
    }
  });
  
  return changes.slice(0, 2);
}

// Check all sources for updates
async function checkAllSources() {
  console.log('Starting regulation update check...');
  const data = loadData();
  const results = [];
  const newNotifications = [];
  
  for (const source of REGULATION_SOURCES) {
    const result = await scrapeSource(source);
    results.push(result);
    
    // Check if this is a new update
    const previousUpdate = data.updates.find(u => u.source === source.id);
    if (result.status === 'success') {
      if (!previousUpdate || previousUpdate.lastModified !== result.lastModified) {
        // New or updated content detected
        const notificationTitle = result.changes.length > 0 
          ? `${source.name}: ${result.changes[0]}`
          : `${source.name} Policy Update Detected`;
        
        const notificationDescription = result.content 
          ? result.content.substring(0, 300) + '...'
          : `New updates detected from ${source.name}. Review for compliance impact.`;
        
        newNotifications.push({
          id: `notif_${Date.now()}_${source.id}`,
          type: 'Law Change',
          priority: 'High',
          title: notificationTitle,
          description: notificationDescription,
          timestamp: new Date().toISOString(),
          read: false,
          authority: source.name,
          category: source.category,
          url: source.url,
          content: result.content,
          requirements: result.requirements,
          changes: result.changes
        });
        console.log(`New update detected from ${source.name} with ${result.changes.length} changes`);
      }
    }
  }
  
  // Update stored data
  data.lastUpdate = new Date().toISOString();
  data.updates = results;
  data.notifications = [...newNotifications, ...data.notifications].slice(0, 50); // Keep last 50
  
  saveData(data);
  console.log(`Update check complete. ${newNotifications.length} new notifications.`);
  
  // Send email notifications to all users for new updates
  if (newNotifications.length > 0) {
    const users = loadUsers();
    if (Array.isArray(users) && users.length > 0) {
      for (const notification of newNotifications) {
        for (const user of users) {
          await sendEmailNotification(user, notification);
        }
      }
    } else {
      console.log('No users found for email notifications');
    }
  }
  
  return {
    lastUpdate: data.lastUpdate,
    newNotifications: newNotifications.length,
    results
  };
}

// ==================== AUTH API ROUTES ====================

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, company } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }
    
    // Check if user exists
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const newUser = createUser({
      email,
      password: hashedPassword,
      firstName: firstName || '',
      lastName: lastName || '',
      company: company || ''
    });
    
    // Generate token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: 'user' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.json({
      success: true,
      message: 'Registration successful',
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        company: newUser.company
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }
    
    // Find user
    const user = findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }
    
    // Update last login
    updateUser(user.id, { lastLogin: new Date().toISOString() });
    
    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        company: user.company,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// Logout user
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
});

// Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = findUserById(req.user.userId);
  
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  
  const { password, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
});

// Update user profile
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, company } = req.body;
    
    const updatedUser = updateUser(req.user.userId, {
      firstName: firstName || '',
      lastName: lastName || '',
      company: company || ''
    });
    
    if (!updatedUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    const { password, ...safeUser } = updatedUser;
    res.json({ success: true, user: safeUser });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ success: false, error: 'Profile update failed' });
  }
});

// Change password
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Current and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
    }
    
    const user = findUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    updateUser(req.user.userId, { password: hashedPassword });
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ success: false, error: 'Password change failed' });
  }
});

// ==================== NOTIFICATION API ROUTES ====================

// Get all notifications (requires authentication)
app.get('/api/notifications', authenticateToken, (req, res) => {
  const data = loadData();
  res.json({
    success: true,
    notifications: data.notifications,
    lastUpdate: data.lastUpdate
  });
});

// Get update status
app.get('/api/status', authenticateToken, (req, res) => {
  const data = loadData();
  res.json({
    success: true,
    lastUpdate: data.lastUpdate,
    sourcesCount: REGULATION_SOURCES.length,
    notificationsCount: data.notifications.length,
    updates: data.updates
  });
});

// Force check for updates
app.post('/api/check-updates', authenticateToken, async (req, res) => {
  try {
    const result = await checkAllSources();
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Mark notification as read
app.post('/api/notifications/:id/read', authenticateToken, (req, res) => {
  const data = loadData();
  const notif = data.notifications.find(n => n.id === req.params.id);
  if (notif) {
    notif.read = true;
    saveData(data);
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, error: 'Notification not found' });
  }
});

// Mark all as read
app.post('/api/notifications/mark-all-read', authenticateToken, (req, res) => {
  const data = loadData();
  data.notifications.forEach(n => n.read = true);
  saveData(data);
  res.json({ success: true });
});

// ==================== URL MONITORING API ROUTES ====================

// URL Monitoring data storage
const URL_MONITORING_FILE = path.join(__dirname, 'url-monitoring.json');

function loadUrlMonitoringData() {
  try {
    if (fs.existsSync(URL_MONITORING_FILE)) {
      return JSON.parse(fs.readFileSync(URL_MONITORING_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading URL monitoring data:', error);
  }
  return { monitoredUrls: [], scanHistory: [], lastScan: null };
}

function saveUrlMonitoringData(data) {
  try {
    fs.writeFileSync(URL_MONITORING_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving URL monitoring data:', error);
  }
}

// Get all monitored URLs
app.get('/api/url-monitoring/urls', authenticateToken, (req, res) => {
  const data = loadUrlMonitoringData();
  res.json({
    success: true,
    urls: data.monitoredUrls,
    count: data.monitoredUrls.length
  });
});

// Add URL to monitoring
app.post('/api/url-monitoring/urls', authenticateToken, (req, res) => {
  try {
    const { url, name, scanFrequency, complianceRules, priority } = req.body;
    
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }
    
    const data = loadUrlMonitoringData();
    
    // Check if URL already exists
    if (data.monitoredUrls.find(u => u.url === url)) {
      return res.status(400).json({ success: false, error: 'URL is already being monitored' });
    }
    
    const newUrl = {
      id: `url_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url,
      name: name || new URL(url).hostname,
      platform: detectPlatform(url),
      scanFrequency: scanFrequency || 3600000, // 1 hour default
      complianceRules: complianceRules || [],
      priority: priority || 'medium',
      status: 'active',
      createdAt: new Date().toISOString(),
      lastScan: null,
      currentScore: null,
      violationCount: 0,
      scanCount: 0
    };
    
    data.monitoredUrls.push(newUrl);
    saveUrlMonitoringData(data);
    
    res.json({ success: true, url: newUrl });
  } catch (error) {
    console.error('Error adding URL to monitoring:', error);
    res.status(500).json({ success: false, error: 'Failed to add URL' });
  }
});

// Remove URL from monitoring
app.delete('/api/url-monitoring/urls/:id', authenticateToken, (req, res) => {
  const data = loadUrlMonitoringData();
  const index = data.monitoredUrls.findIndex(u => u.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'URL not found' });
  }
  
  data.monitoredUrls.splice(index, 1);
  saveUrlMonitoringData(data);
  
  res.json({ success: true });
});

// Scan a specific URL
app.post('/api/url-monitoring/scan/:id', authenticateToken, async (req, res) => {
  try {
    const data = loadUrlMonitoringData();
    const urlConfig = data.monitoredUrls.find(u => u.id === req.params.id);
    
    if (!urlConfig) {
      return res.status(404).json({ success: false, error: 'URL not found' });
    }
    
    // Perform scan
    const scanResult = await performUrlScan(urlConfig);
    
    // Update URL config
    urlConfig.lastScan = scanResult.timestamp;
    urlConfig.currentScore = scanResult.overallScore;
    urlConfig.scanCount++;
    if (scanResult.violations && scanResult.violations.length > 0) {
      urlConfig.violationCount += scanResult.violations.length;
    }
    
    // Add to scan history
    data.scanHistory.unshift(scanResult);
    if (data.scanHistory.length > 100) {
      data.scanHistory = data.scanHistory.slice(0, 100);
    }
    
    saveUrlMonitoringData(data);
    
    res.json({ success: true, result: scanResult });
  } catch (error) {
    console.error('Error scanning URL:', error);
    res.status(500).json({ success: false, error: 'Scan failed' });
  }
});

// Get scan history
app.get('/api/url-monitoring/history', authenticateToken, (req, res) => {
  const data = loadUrlMonitoringData();
  const limit = parseInt(req.query.limit) || 20;
  const urlId = req.query.urlId;
  
  let history = data.scanHistory;
  if (urlId) {
    history = history.filter(s => s.urlId === urlId);
  }
  
  res.json({
    success: true,
    history: history.slice(0, limit),
    total: history.length
  });
});

// Get monitoring statistics
app.get('/api/url-monitoring/stats', authenticateToken, (req, res) => {
  const data = loadUrlMonitoringData();
  const urls = data.monitoredUrls;
  
  const stats = {
    totalUrls: urls.length,
    activeUrls: urls.filter(u => u.status === 'active').length,
    totalScans: data.scanHistory.length,
    averageScore: urls.length > 0 
      ? Math.round(urls.reduce((sum, u) => sum + (u.currentScore || 0), 0) / urls.length)
      : 0,
    urlsWithViolations: urls.filter(u => u.violationCount > 0).length,
    platformBreakdown: getPlatformBreakdown(urls),
    complianceDistribution: getComplianceDistribution(urls)
  };
  
  res.json({ success: true, stats });
});

// Scan all monitored URLs
app.post('/api/url-monitoring/scan-all', authenticateToken, async (req, res) => {
  try {
    const data = loadUrlMonitoringData();
    const activeUrls = data.monitoredUrls.filter(u => u.status === 'active');
    const results = [];
    
    for (const urlConfig of activeUrls) {
      try {
        const scanResult = await performUrlScan(urlConfig);
        urlConfig.lastScan = scanResult.timestamp;
        urlConfig.currentScore = scanResult.overallScore;
        urlConfig.scanCount++;
        if (scanResult.violations && scanResult.violations.length > 0) {
          urlConfig.violationCount += scanResult.violations.length;
        }
        data.scanHistory.unshift(scanResult);
        results.push(scanResult);
      } catch (error) {
        results.push({ urlId: urlConfig.id, status: 'error', error: error.message });
      }
    }
    
    // Trim history
    if (data.scanHistory.length > 100) {
      data.scanHistory = data.scanHistory.slice(0, 100);
    }
    
    saveUrlMonitoringData(data);
    
    res.json({ success: true, results, scannedCount: results.length });
  } catch (error) {
    console.error('Error scanning all URLs:', error);
    res.status(500).json({ success: false, error: 'Bulk scan failed' });
  }
});

// Helper function to detect platform from URL
function detectPlatform(url) {
  const platforms = {
    facebook: { patterns: [/facebook\.com/, /fb\.com/], name: 'Facebook' },
    instagram: { patterns: [/instagram\.com/], name: 'Instagram' },
    twitter: { patterns: [/twitter\.com/, /x\.com/], name: 'Twitter/X' },
    linkedin: { patterns: [/linkedin\.com/], name: 'LinkedIn' },
    youtube: { patterns: [/youtube\.com/, /youtu\.be/], name: 'YouTube' },
    tiktok: { patterns: [/tiktok\.com/], name: 'TikTok' }
  };
  
  for (const [id, platform] of Object.entries(platforms)) {
    for (const pattern of platform.patterns) {
      if (pattern.test(url)) {
        return { id, name: platform.name };
      }
    }
  }
  
  return { id: 'website', name: 'Website' };
}

// Helper function to perform URL scan
async function performUrlScan(urlConfig) {
  const scanStartTime = Date.now();
  
  try {
    // Attempt to fetch the URL
    const response = await axios.get(urlConfig.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(response.data);
    
    // Analyze content
    const contentAnalysis = {
      pageTitle: $('title').text().trim(),
      metaDescription: $('meta[name="description"]').attr('content') || '',
      hasRiskWarning: checkForRiskWarnings($),
      hasDisclaimer: checkForDisclaimers($),
      hasCTA: checkForCTAs($),
      textContent: extractMainText($),
      imageCount: $('img').length,
      linkCount: $('a').length
    };
    
    // Check compliance
    const complianceResult = analyzeCompliance(contentAnalysis, urlConfig);
    
    return {
      id: `scan_${Date.now()}_${urlConfig.id}`,
      urlId: urlConfig.id,
      url: urlConfig.url,
      platform: urlConfig.platform,
      timestamp: new Date().toISOString(),
      duration: Date.now() - scanStartTime,
      status: 'completed',
      contentAnalysis,
      overallScore: complianceResult.score,
      violations: complianceResult.violations,
      warnings: complianceResult.warnings,
      recommendations: complianceResult.recommendations
    };
    
  } catch (error) {
    return {
      id: `scan_${Date.now()}_${urlConfig.id}`,
      urlId: urlConfig.id,
      url: urlConfig.url,
      timestamp: new Date().toISOString(),
      duration: Date.now() - scanStartTime,
      status: 'error',
      error: error.message,
      overallScore: 0,
      violations: [],
      warnings: []
    };
  }
}

// Check for risk warnings in page content
function checkForRiskWarnings($) {
  const warningPatterns = [
    /capital at risk/i,
    /you may lose/i,
    /risk of loss/i,
    /past performance/i,
    /not guaranteed/i
  ];
  
  const pageText = $('body').text();
  return warningPatterns.some(pattern => pattern.test(pageText));
}

// Check for disclaimers in page content
function checkForDisclaimers($) {
  const disclaimerPatterns = [
    /terms and conditions/i,
    /disclaimer/i,
    /not financial advice/i,
    /regulated by/i
  ];
  
  const pageText = $('body').text();
  return disclaimerPatterns.some(pattern => pattern.test(pageText));
}

// Check for CTAs in page content
function checkForCTAs($) {
  const ctaPatterns = [
    /apply now/i,
    /sign up/i,
    /get started/i,
    /learn more/i
  ];
  
  const pageText = $('body').text();
  return ctaPatterns.some(pattern => pattern.test(pageText));
}

// Extract main text content
function extractMainText($) {
  return $('main, article, .content, .main-content, body')
    .first()
    .text()
    .trim()
    .substring(0, 1000);
}

// Analyze compliance of content
function analyzeCompliance(contentAnalysis, urlConfig) {
  const result = {
    score: 100,
    violations: [],
    warnings: [],
    recommendations: []
  };
  
  // Check for missing risk warnings
  if (!contentAnalysis.hasRiskWarning) {
    result.violations.push({
      type: 'missing_risk_warning',
      severity: 'high',
      title: 'Missing Risk Warning',
      description: 'Financial content should include appropriate risk warnings',
      regulation: 'FCA COBS 4.5'
    });
    result.score -= 25;
  }
  
  // Check for missing disclaimers
  if (!contentAnalysis.hasDisclaimer) {
    result.warnings.push({
      type: 'missing_disclaimer',
      severity: 'medium',
      title: 'Missing Disclaimer',
      description: 'Content should include appropriate disclaimers',
      regulation: 'ASA CAP Code'
    });
    result.score -= 15;
  }
  
  // Add recommendations
  if (result.score < 100) {
    result.recommendations.push({
      priority: 'high',
      title: 'Add Required Disclosures',
      description: 'Ensure all required risk warnings and disclaimers are present'
    });
  }
  
  return result;
}

// Get platform breakdown
function getPlatformBreakdown(urls) {
  const breakdown = {};
  for (const url of urls) {
    const platformName = url.platform?.name || 'Unknown';
    breakdown[platformName] = (breakdown[platformName] || 0) + 1;
  }
  return breakdown;
}

// Get compliance distribution
function getComplianceDistribution(urls) {
  const distribution = { compliant: 0, needs_review: 0, non_compliant: 0, not_scanned: 0 };
  
  for (const url of urls) {
    if (!url.currentScore) {
      distribution.not_scanned++;
    } else if (url.currentScore >= 80 && url.violationCount === 0) {
      distribution.compliant++;
    } else if (url.currentScore >= 60) {
      distribution.needs_review++;
    } else {
      distribution.non_compliant++;
    }
  }
  
  return distribution;
}

// ==================== OMNICHANNEL ANALYSIS API ROUTES ====================

// Omnichannel analysis data storage
const OMNICHANNEL_FILE = path.join(__dirname, 'omnichannel-analysis.json');

function loadOmnichannelData() {
  try {
    if (fs.existsSync(OMNICHANNEL_FILE)) {
      return JSON.parse(fs.readFileSync(OMNICHANNEL_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading omnichannel data:', error);
  }
  return { analyses: [], templates: [] };
}

function saveOmnichannelData(data) {
  try {
    fs.writeFileSync(OMNICHANNEL_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving omnichannel data:', error);
  }
}

// Get supported media types
app.get('/api/omnichannel/media-types', authenticateToken, (req, res) => {
  const mediaTypes = {
    text: { name: 'Text Content', extensions: ['.txt', '.doc', '.docx', '.pdf'], icon: 'FileText' },
    image: { name: 'Image Content', extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'], icon: 'Image' },
    video: { name: 'Video Content', extensions: ['.mp4', '.mov', '.avi', '.webm'], icon: 'Video' },
    audio: { name: 'Audio/Voice-Over', extensions: ['.mp3', '.wav', '.aac', '.ogg'], icon: 'Volume2' }
  };
  
  res.json({ success: true, mediaTypes });
});

// Get available channels
app.get('/api/omnichannel/channels', authenticateToken, (req, res) => {
  const channels = {
    website: { name: 'Website', regulations: ['ASA UK', 'FCA UK', 'CMA UK'] },
    social_media: { name: 'Social Media', regulations: ['ASA UK', 'Meta', 'Google', 'TikTok'] },
    tv_broadcast: { name: 'TV Broadcast', regulations: ['Ofcom UK', 'ASA UK', 'BCAP'] },
    radio_broadcast: { name: 'Radio Broadcast', regulations: ['Ofcom UK', 'ASA UK', 'RACC'] },
    streaming: { name: 'Streaming/VOD', regulations: ['Ofcom UK', 'ASA UK'] },
    podcast: { name: 'Podcast', regulations: ['Ofcom UK', 'ASA UK'] },
    print: { name: 'Print Media', regulations: ['ASA UK', 'CAP Code'] },
    email: { name: 'Email Marketing', regulations: ['ASA UK', 'ICO UK', 'GDPR'] }
  };
  
  res.json({ success: true, channels });
});

// Get Ofcom Broadcasting Code sections
app.get('/api/omnichannel/ofcom-sections', authenticateToken, (req, res) => {
  const ofcomSections = {
    section1: { title: 'Protecting the Under-Eighteens', description: 'Content scheduling and age-appropriate warnings' },
    section2: { title: 'Harm and Offence', description: 'Content must not cause harm or offence' },
    section3: { title: 'Crime, Disorder, Hatred and Abuse', description: 'Content must not incite crime or promote hatred' },
    section4: { title: 'Religion', description: 'Religious content handled responsibly' },
    section5: { title: 'Due Impartiality and Due Accuracy', description: 'News accuracy and political impartiality' },
    section9: { title: 'Commercial References in TV', description: 'Product placement and editorial independence' },
    section10: { title: 'Commercial Communications in Radio', description: 'Commercial content distinction and sponsorship' }
  };
  
  res.json({ success: true, ofcomSections });
});

// Get BCAP Code categories
app.get('/api/omnichannel/bcap-categories', authenticateToken, (req, res) => {
  const bcapCategories = {
    general: { title: 'General Rules', description: 'Legal, decent, honest and truthful advertising' },
    financial: { title: 'Financial Advertising', description: 'Fair, clear financial promotions with risk warnings' },
    children: { title: 'Children', description: 'Protection of children in advertising' },
    health: { title: 'Health and Beauty', description: 'Substantiated health claims' }
  };
  
  res.json({ success: true, bcapCategories });
});

// Analyze content (omnichannel)
app.post('/api/omnichannel/analyze', authenticateToken, async (req, res) => {
  try {
    const { content, mediaType, channel, options } = req.body;
    
    if (!content) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }
    
    const analysis = await performOmnichannelAnalysis(content, mediaType || 'text', channel || 'website', options || {});
    
    // Save analysis
    const data = loadOmnichannelData();
    data.analyses.unshift(analysis);
    if (data.analyses.length > 50) {
      data.analyses = data.analyses.slice(0, 50);
    }
    saveOmnichannelData(data);
    
    res.json({ success: true, analysis });
  } catch (error) {
    console.error('Error performing omnichannel analysis:', error);
    res.status(500).json({ success: false, error: 'Analysis failed' });
  }
});

// Get analysis history
app.get('/api/omnichannel/history', authenticateToken, (req, res) => {
  const data = loadOmnichannelData();
  const limit = parseInt(req.query.limit) || 20;
  
  res.json({
    success: true,
    analyses: data.analyses.slice(0, limit),
    total: data.analyses.length
  });
});

// Perform omnichannel analysis
async function performOmnichannelAnalysis(content, mediaType, channel, options) {
  const analysis = {
    id: `analysis_${Date.now()}`,
    timestamp: new Date().toISOString(),
    mediaType,
    channel,
    status: 'completed',
    overallScore: 0,
    results: {},
    ofcomCompliance: null,
    bcapCompliance: null,
    violations: [],
    warnings: [],
    recommendations: []
  };
  
  // Analyze based on media type
  switch (mediaType) {
    case 'text':
      analysis.results.text = analyzeTextContent(content);
      break;
    case 'image':
      analysis.results.image = analyzeImageContent(content);
      break;
    case 'video':
      analysis.results.video = analyzeVideoContent(content, channel);
      break;
    case 'audio':
      analysis.results.audio = analyzeAudioContent(content, channel);
      break;
  }
  
  // Check Ofcom compliance for broadcast channels
  if (['tv_broadcast', 'radio_broadcast', 'streaming', 'podcast'].includes(channel)) {
    analysis.ofcomCompliance = checkOfcomCompliance(mediaType, channel);
    analysis.violations.push(...analysis.ofcomCompliance.violations);
    analysis.warnings.push(...analysis.ofcomCompliance.warnings);
  }
  
  // Check BCAP compliance for advertising
  if (options.isAdvertising) {
    analysis.bcapCompliance = checkBCAPCompliance(mediaType, options);
    analysis.violations.push(...analysis.bcapCompliance.violations);
    analysis.warnings.push(...analysis.bcapCompliance.warnings);
  }
  
  // Calculate overall score
  let totalScore = 0;
  let count = 0;
  
  for (const result of Object.values(analysis.results)) {
    if (result && result.score !== undefined) {
      totalScore += result.score;
      count++;
    }
  }
  
  if (analysis.ofcomCompliance) {
    totalScore += analysis.ofcomCompliance.score;
    count++;
  }
  
  if (analysis.bcapCompliance) {
    totalScore += analysis.bcapCompliance.score;
    count++;
  }
  
  analysis.overallScore = count > 0 ? Math.round(totalScore / count) : 0;
  
  // Generate recommendations
  for (const violation of analysis.violations) {
    analysis.recommendations.push({
      priority: violation.severity === 'critical' ? 'urgent' : 'high',
      title: `Address: ${violation.title}`,
      description: violation.description
    });
  }
  
  return analysis;
}

// Text content analysis
function analyzeTextContent(content) {
  const text = typeof content === 'string' ? content : content.text || '';
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  
  const hasRiskWarning = /capital at risk|you may lose|past performance/i.test(text);
  const hasDisclaimer = /terms and conditions|disclaimer|not financial advice/i.test(text);
  const hasUnsubstantiatedClaims = /guaranteed|best in class|number one/i.test(text);
  
  let score = 100;
  const issues = [];
  
  if (!hasRiskWarning) {
    score -= 20;
    issues.push({ type: 'missing_risk_warning', severity: 'high' });
  }
  
  if (!hasDisclaimer) {
    score -= 15;
    issues.push({ type: 'missing_disclaimer', severity: 'medium' });
  }
  
  if (hasUnsubstantiatedClaims) {
    score -= 15;
    issues.push({ type: 'unsubstantiated_claims', severity: 'medium' });
  }
  
  return { type: 'text', wordCount, score, issues, hasRiskWarning, hasDisclaimer };
}

// Image content analysis
function analyzeImageContent(content) {
  let score = 100;
  const issues = [];
  
  // Simulated image analysis
  const hasAltText = Math.random() > 0.5;
  const hasDisclaimer = Math.random() > 0.4;
  
  if (!hasAltText) {
    score -= 5;
    issues.push({ type: 'missing_alt_text', severity: 'low' });
  }
  
  if (!hasDisclaimer) {
    score -= 15;
    issues.push({ type: 'missing_image_disclaimer', severity: 'medium' });
  }
  
  return { type: 'image', score, issues, hasAltText, hasDisclaimer };
}

// Video content analysis
function analyzeVideoContent(content, channel) {
  let score = 100;
  const issues = [];
  
  // Simulated video analysis
  const hasSubtitles = Math.random() > 0.5;
  const hasDisclaimer = Math.random() > 0.5;
  const suitableForPreWatershed = Math.random() > 0.8;
  
  if (!hasSubtitles) {
    score -= 15;
    issues.push({ type: 'missing_subtitles', severity: 'medium', regulation: 'Ofcom Accessibility' });
  }
  
  if (!hasDisclaimer) {
    score -= 20;
    issues.push({ type: 'missing_video_disclaimer', severity: 'high', regulation: 'BCAP Code' });
  }
  
  if (!suitableForPreWatershed && channel === 'tv_broadcast') {
    score -= 25;
    issues.push({ type: 'watershed_restriction', severity: 'high', regulation: 'Ofcom Section 1' });
  }
  
  return { type: 'video', score, issues, hasSubtitles, hasDisclaimer, suitableForPreWatershed };
}

// Audio content analysis
function analyzeAudioContent(content, channel) {
  let score = 100;
  const issues = [];
  
  // Simulated audio analysis
  const hasTranscript = Math.random() > 0.5;
  const disclaimerClear = Math.random() > 0.6;
  const meetsRACCStandards = Math.random() > 0.7;
  
  if (!hasTranscript) {
    score -= 5;
    issues.push({ type: 'missing_transcript', severity: 'low', regulation: 'Accessibility' });
  }
  
  if (!disclaimerClear) {
    score -= 20;
    issues.push({ type: 'unclear_disclaimer', severity: 'high', regulation: 'RACC/Ofcom' });
  }
  
  if (!meetsRACCStandards && channel === 'radio_broadcast') {
    score -= 25;
    issues.push({ type: 'racc_non_compliance', severity: 'high', regulation: 'RACC Guidelines' });
  }
  
  return { type: 'audio', score, issues, hasTranscript, disclaimerClear, meetsRACCStandards };
}

// Check Ofcom compliance
function checkOfcomCompliance(mediaType, channel) {
  const compliance = {
    authority: 'Ofcom UK',
    score: 100,
    violations: [],
    warnings: []
  };
  
  // Simulated Ofcom checks
  if (Math.random() > 0.9) {
    compliance.violations.push({
      type: 'under18_protection',
      severity: 'high',
      title: 'Under-18 Protection Issue',
      description: 'Content may not be appropriately scheduled',
      regulation: 'Ofcom Section 1'
    });
    compliance.score -= 20;
  }
  
  if (mediaType === 'video' && Math.random() > 0.85) {
    compliance.warnings.push({
      type: 'product_placement',
      severity: 'medium',
      title: 'Product Placement Disclosure',
      description: 'Product placement may require clearer identification',
      regulation: 'Ofcom Section 9'
    });
    compliance.score -= 10;
  }
  
  if (mediaType === 'audio' && Math.random() > 0.85) {
    compliance.warnings.push({
      type: 'commercial_distinction',
      severity: 'medium',
      title: 'Commercial Content Distinction',
      description: 'Commercial content may need clearer distinction',
      regulation: 'Ofcom Section 10'
    });
    compliance.score -= 10;
  }
  
  return compliance;
}

// Check BCAP compliance
function checkBCAPCompliance(mediaType, options) {
  const compliance = {
    authority: 'BCAP',
    score: 100,
    violations: [],
    warnings: []
  };
  
  // Simulated BCAP checks
  if (options.isFinancial && Math.random() > 0.7) {
    compliance.violations.push({
      type: 'financial_bcap',
      severity: 'high',
      title: 'Financial Advertising Compliance',
      description: 'Financial content requires enhanced compliance measures',
      regulation: 'BCAP Financial Section'
    });
    compliance.score -= 20;
  }
  
  if (Math.random() > 0.95) {
    compliance.violations.push({
      type: 'children_bcap',
      severity: 'critical',
      title: 'Children Protection Issue',
      description: 'Content may not be appropriate for children',
      regulation: 'BCAP Children Section'
    });
    compliance.score -= 30;
  }
  
  return compliance;
}

// Schedule automatic checks every 6 hours
cron.schedule('0 */6 * * *', () => {
  console.log('Running scheduled regulation check...');
  checkAllSources();
});

// Initial check on startup (after 30 seconds)
setTimeout(() => {
  console.log('Running initial regulation check...');
  checkAllSources();
}, 30000);

// Handle SPA routing - send all non-API requests to index.html
app.get('*', (req, res) => {
  res.type('text/html');
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Regulation scraping backend active');
  console.log('API endpoints:');
  console.log('  GET  /api/notifications - Get all notifications');
  console.log('  GET  /api/status - Get update status');
  console.log('  POST /api/check-updates - Force check for updates');
});

} catch (error) {
  console.error('FATAL ERROR during server startup:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}
