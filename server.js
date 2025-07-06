// import './configg/env.js';

// import app from './app.js';
// import connectDB from './config/db.js'; // Import the DB connection

// const port = 3000;

// connectDB().then(() => {
//   app.listen(port, () => {
//     console.log(`🚀 App running on port ${port}...`);
//   });
// });
// server.js

import './configg/env.js';
import app from './app.js';
import connectDB from './config/db.js';

// Handle uncaught exceptions (sync code errors like undefined vars)
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

const port = 3000 || process.env.PORT;

let server;

const startServer = async () => {
  try {
    await connectDB(); // Try to connect to DB first
    console.log('✅ DB connected');

    server = app.listen(port, () => {
      console.log(`🚀 App running on port ${port}...`);
    });
  } catch (err) {
    console.error('❌ Failed to connect to database');
    console.error(err);
    process.exit(1); // Stop the app if DB fails on startup
  }
};

startServer();

// Handle unhandled promise rejections (e.g. DB disconnects later)
process.on('unhandledRejection', (err) => {
  console.error('❌ UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);

  if (server) {
    server.close(() => {
      process.exit(1); // Close server first, then exit
    });
  } else {
    process.exit(1);
  }
});
