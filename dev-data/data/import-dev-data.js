import '../../configg/env.js';
import { readFile } from 'fs/promises';

import connectDB from '../../config/db.js';
import Tour from '../../models/tourModel.js';
import Review from '../../models/reviewModel.js';
import User from '../../models/userModel.js';

const importData = async () => {
  try {
    await connectDB();

    const toursData = await readFile(
      'D:/starter12/dev-data/data/tours.json',
      'utf-8'
    );
    const usersData = await readFile(
      'D:/starter12/dev-data/data/users.json',
      'utf-8'
    );
    const reviewsData = await readFile(
      'D:/starter12/dev-data/data/reviews.json',
      'utf-8'
    );

    const tours = JSON.parse(toursData);
    const users = JSON.parse(usersData);
    const reviews = JSON.parse(reviewsData);

    await User.create(users, { validateBeforeSave: false });
    await Tour.create(tours);
    await Review.create(reviews);

    console.log('✅ Data successfully imported!');
    process.exit();
  } catch (err) {
    console.error('❌ Error importing data:', err);
    process.exit(1);
  }
};

const deleteData = async () => {
  try {
    await connectDB();

    await User.deleteMany();
    await Tour.deleteMany();
    await Review.deleteMany();

    console.log('✅ All previous data deleted!');
    process.exit();
  } catch (err) {
    console.error('❌ Error deleting data:', err);
    process.exit(1);
  }
};

// ✅ Only run what the user asked for
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
} else {
  console.log('❓ Please use either --import or --delete');
  process.exit();
}
