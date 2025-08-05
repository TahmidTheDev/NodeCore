import mongoose from 'mongoose';
import Tour from './tourModel.js';

// ------------------------------
// Review Schema Definition
// ------------------------------
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty.'],
      trim: true,
      minlength: [3, 'Review must be at least 3 characters.'],
      maxlength: [1000, 'Review must be less than 1000 characters.'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required.'],
      min: [1, 'Rating must be at least 1.'],
      max: [5, 'Rating must be at most 5.'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must have an author.'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false },
  }
);

// ------------------------------
// Compound index to prevent duplicate reviews per tour per user
// ------------------------------
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// ------------------------------
//Query Middleware: runs before any 'find' query (find, findOne, etc.)
//Populates the 'user' field with 'name' and 'photo' from referenced user documents
// ------------------------------
reviewSchema.pre(/^find/, function () {
  this.populate({
    path: 'user',
    select: 'name photo',
  });
});

// ------------------------------
// Static method to calculate tour average rating and quantity
// ------------------------------
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    { $match: { tour: tourId } },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: stats[0].avgRating,
      ratingsQuantity: stats[0].nRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 4.5,
      ratingsQuantity: 0,
    });
  }
};

// ------------------------------
// Middleware: Update tour stats after review creation
//Document Middleware: runs after a new review document is saved
// ------------------------------
reviewSchema.post('save', async function () {
  await this.constructor.calcAverageRatings(this.tour);
});

// ------------------------------
// Middleware: Track doc on update/delete to recalculate ratings
// ------------------------------
// Query Middleware: runs before findOneAndUpdate/findOneAndDelete
// Saves the document being updated/deleted for use in post middleware
reviewSchema.pre(/^findOneAnd/, async function () {
  this.r = await this.clone().findOne(); // Save doc reference before update/delete
});

// Query Middleware: runs after findOneAndUpdate/findOneAndDelete
// Uses saved doc reference to recalculate tour ratings
reviewSchema.post(/^findOneAnd/, async function () {
  if (this.r) {
    await this.r.constructor.calcAverageRatings(this.r.tour);
  }
});

// ------------------------------
// Export model
// ------------------------------
const Review = mongoose.model('Review', reviewSchema);
export default Review;
