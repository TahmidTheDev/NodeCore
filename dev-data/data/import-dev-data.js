import '../../configg/env.js';
import { readFile } from 'fs/promises';

import connectDB from '../../config/db.js';
import Tour from '../../models/tourModel.js';

const importData = async () => {
  try {
    // 1. Connect to the database
    await connectDB();

    // 2. Read the data file asynchronously using ES modules
    const data = await readFile(
      'D:/starter12/dev-data/data/tours-simple.json',
      'utf-8'
    );
    const tours = JSON.parse(data);

    // 3. Delete all data from the Tour collection
    await Tour.deleteMany(); // This will delete all documents in the collection
    console.log('✅ All previous data deleted!');

    // 4. Insert the new data into the database
    await Tour.create(tours);
    console.log('✅ Data successfully imported!');

    // 5. Exit
    process.exit();
  } catch (err) {
    console.error('❌ Error importing data:', err);
    process.exit(1);
  }
};

importData();
