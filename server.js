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
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `New Regulation Update: ${notification.title}`,
      text: `
        ${notification.description}
        
        Authority: ${notification.authority}
        Priority: ${notification.priority}
        Type: ${notification.type}
        
        View in dashboard: https://idmeta.onrender.com
      `
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
    url: 'https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds',
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
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    const pageTitle = $('title').text();
    const lastModified = response.headers['last-modified'] || new Date().toISOString();
    
    return {
      source: source.id,
      name: source.name,
      category: source.category,
      url: source.url,
      title: pageTitle,
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
        newNotifications.push({
          id: `notif_${Date.now()}_${source.id}`,
          type: 'Law Change',
          priority: 'High',
          title: `${source.name} Policy Update Detected`,
          description: `New updates detected from ${source.name}. Review for compliance impact.`,
          timestamp: new Date().toISOString(),
          read: false,
          authority: source.name,
          category: source.category,
          url: source.url
        });
        console.log(`New update detected from ${source.name}`);
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
    for (const notification of newNotifications) {
      for (const user of users) {
        await sendEmailNotification(user, notification);
      }
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
