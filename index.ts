import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './src/config/database';
import { ImportOrchestrator } from './src/importer';
import apiRoutes from './src/routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CORS Configuration - Allow Next.js frontend
app.use(cors({
  origin: [
    'http://localhost:3001',      // Next.js dev server
    'http://localhost:3002',      // Alternative port
    'https://your-frontend.vercel.app',  // Production (update with your actual URL)
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));

app.use(express.json());

// Health check route
app.get('/', (req, res) => {
  res.json({
    message: '✅ LearninBites API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Mount API routes
app.use('/api', apiRoutes);

/**
 * Server Startup Sequence
 * 
 * CRITICAL ORDER:
 * 1. Connect to database
 * 2. Import content from Excel files
 * 3. Start HTTP server
 * 
 * If import fails, server still starts but logs errors
 */
const startServer = async () => {
  try {
    // STEP 1: Connect to MongoDB
    console.log('🔌 Connecting to database...');
    await connectDatabase();

    // STEP 2: Import content
    console.log('\n📚 Starting content import...');
    const orchestrator = new ImportOrchestrator();
    const importSummary = await orchestrator.importAll();

    // Log import results
    if (importSummary.failureCount > 0) {
      console.log('\n⚠️  Some files failed to import. Check errors above.');
    }

    // STEP 3: Start Express server
    app.listen(PORT, () => {
      console.log('\n' + '='.repeat(50));
      console.log('🚀 SERVER READY');
      console.log('='.repeat(50));
      console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
      console.log('\n📖 Available Endpoints:');
      console.log(`   GET  http://localhost:${PORT}/api/subjects`);
      console.log(`   GET  http://localhost:${PORT}/api/subjects/:code`);
      console.log(`   GET  http://localhost:${PORT}/api/subjects/:code/topics`);
      console.log(`   GET  http://localhost:${PORT}/api/topics/:topicId/concepts`);
      console.log(`   GET  http://localhost:${PORT}/api/concepts/:id/lesson`);
      console.log(`   GET  http://localhost:${PORT}/api/concepts/:id/questions`);
      console.log(`   GET  http://localhost:${PORT}/api/past-questions/:board/:subject`);
      console.log('='.repeat(50) + '\n');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();