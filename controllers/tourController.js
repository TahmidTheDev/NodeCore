import Tour from '../models/tourModel.js';
import APIFeatures from '../utilis/apiFeatures.js';
import AppError from '../utilis/appError.js';

// Middleware to preset query parameters for top 5 cheap tours
export const aliasTopTours = (req, res, next) => {
  console.log('✅ aliasTopTours middleware TRIGGERED');

  req.aliasQuery = {
    limit: 5,
    sort: '-ratingsAverage,price',
    fields: 'name,price,ratingsAverage,difficulty,summary',
  };

  next();
};

export const getAllTours = async (req, res) => {
  const queryObj = req.aliasQuery || req.query;

  const features = new APIFeatures(Tour.find(), queryObj)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const tours = await features.query;

  // Send successful response
  res.status(200).json({
    status: 'success',
    result: tours.length,
    data: {
      tours,
    },
  });
};

// //app.get('/api/v1/tours', getAllTours);

export const getTour = async (req, res) => {
  const tour = await Tour.findById(req.params.id).populate('reviews');

  if (!tour) {
    throw new AppError('tour could not be found with this ID', 404);
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
};
// //app.get('/api/v1/tours/:id', getTour);

//Create request
export const createtour = async (req, res) => {
  const newTour = await Tour.create(req.body);

  if (!newTour) {
    throw new AppError('tour could not be created', 400);
  }

  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour,
    },
  });
};
//app.post('/api/v1/tours', createtour);
export const updatetour = async (req, res) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    context: 'query',
  });

  if (!tour) {
    throw new AppError('tour could not be found updated this ID', 404);
  }

  res.status(201).json({
    status: 'success',
    data: {
      tour,
    },
  });
};
//Update

//app.patch('/api/v1/tours/:id', updatetour);

//Delete
export const deletetour = async (req, res) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    throw new AppError('tour could not be found with this ID', 404);
  }

  res.status(201).json({
    status: 'success',
    data: null,
  });
};

export const getTourStats = async (req, res) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { minPrice: -1 },
    },
    // {
    //   $match: { _id: { $ne: 'EASY' } },
    // },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
};

export const getMonthlyPlan = async (req, res) => {
  const year = Number(req.params.year);
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        numTourStarts: -1,
      },
    },
    {
      $limit: 12,
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
};

// export const getAllTours = async (req, res) => {
//   try {
//     console.log('Query parameters:', req.query);

//     // Use aliasQuery if provided (for top tours), otherwise use req.query
//     const queryParams = req.aliasQuery || req.query;

//     // Copy queryParams for filtering
//     const queryObj = { ...queryParams };

//     // Exclude special query params not used for filtering
//     const excludeFields = ['page', 'sort', 'limit', 'fields'];
//     excludeFields.forEach((el) => delete queryObj[el]);

//     // Convert to MongoDB filter format
//     const finalQueryObj = {};
//     for (const key in queryObj) {
//       if (key.includes('[')) {
//         const [field, operator] = key.replace(']', '').split('[');
//         if (!finalQueryObj[field]) finalQueryObj[field] = {};
//         finalQueryObj[field][`$${operator}`] = Number(queryObj[key]);
//       } else {
//         finalQueryObj[key] = queryObj[key];
//       }
//     }

//     // Start building the query
//     let query = Tour.find(finalQueryObj);

//     // Apply sorting
//     if (queryParams.sort) {
//       const sortBy = queryParams.sort.split(',').join(' ');
//       query = query.sort(sortBy);
//     } else {
//       query = query.sort('-updatedAt');
//     }

//     // Apply field limiting
//     if (queryParams.fields) {
//       const fields = queryParams.fields.split(',').join(' ');
//       query = query.select(fields);
//     } else {
//       query = query.select('-__v');
//     }

//     // Apply pagination
//     const page = queryParams.page * 1 || 1;
//     const limit = queryParams.limit * 1 || 100;
//     const skip = (page - 1) * limit;

//     query = query.skip(skip).limit(limit);

//     // Check if page exists
//     if (queryParams.page) {
//       const numTours = await Tour.countDocuments();
//       if (skip >= numTours) throw new Error('The page does not exist');
//     }

//     // Execute the query
//     const tours = await query.clone();  // clone to avoid reusing query in dev

//     // Send response
//     res.status(200).json({
//       status: 'success',
//       result: tours.length,
//       data: {
//         tours,
//       },
//     });
//   } catch (err) {
//     console.error(err);

//     res.status(404).json({
//       status: 'fail',
//       message: err.message,
//     });
//   }
// };

// import { readFile } from 'fs/promises';
// import { fileURLToPath } from 'url';

//read and write file
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const tours = JSON.parse(
//   await readFile(path.join(__dirname, '../dev-data/data/tours-simple.json'))
// );

// export const checkId = (req, res, next, val) => {
//   if (req.params.id * 1 > tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Invalid id',
//     });
//   }
//   next();
// };
// export const checkBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       status: 'fail',
//       message: 'missing name or price',
//     });
//   }
//   next();
// };
