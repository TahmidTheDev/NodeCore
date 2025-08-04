import mongoose from 'mongoose';
import slugify from 'slugify';
// import validator from 'validator'; // Uncomment if needed later

// ------------------------------
// Tour Schema Definition
// ------------------------------
const TourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      trim: true,
      minlength: [3, 'Name must be at least 3 characters'],
      maxlength: [100, 'Name must be less than 100 characters'],
      unique: true,
      // validate: [validator.isAlpha, 'Tour name should contain only characters'],
    },
    slug: String,

    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty must be: easy, medium, or difficult',
      },
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
      min: [0, 'Price must be a positive number'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator(val) {
          return val < this.price;
        },
        message:
          'Discount price ({VALUE}) should be less than the regular price',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10, // Round to 1 decimal
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: {
      type: [String],
    },
    startDates: {
      type: [Date],
    },
    secretTour: {
      type: Boolean,
      default: false,
    },

    // GeoJSON format for geospatial queries
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
        required: [true, 'Start location type is required'],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Start location coordinates are required'],
      },
      address: String,
      description: String,
    },

    // Embedded location data for itinerary
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: {
          type: [Number],
        },
        address: String,
        description: String,
        day: Number,
      },
    ],

    // References to User guides
    guides: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ------------------------------
// Indexes for performance
// ------------------------------
TourSchema.index({ price: 1, ratingsAverage: -1 });
TourSchema.index({ slug: 1 });
TourSchema.index({ startLocation: '2dsphere' });

// ------------------------------
// Virtual fields
// ------------------------------

// Duration in weeks (derived field)
TourSchema.virtual('durationWeeks').get(function () {
  return Number((this.duration / 7).toFixed(1));
});

// Virtual populate: link to reviews
TourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// ------------------------------
// Document Middleware
// ------------------------------

// Generate slug from tour name before saving
TourSchema.pre('save', function () {
  this.slug = slugify(this.name, { lower: true });
});

// ------------------------------
// Query Middleware
// ------------------------------

// Hide secret tours on all find queries
TourSchema.pre(/^find/, function () {
  this.find({ secretTour: { $ne: true } });
});

// Auto-populate guide info on find queries
TourSchema.pre(/^find/, function () {
  this.populate({
    path: 'guides',
    select: 'name email photo role -_id',
  });
});

// ------------------------------
// Aggregation Middleware
// ------------------------------

// Exclude secret tours from aggregations (unless geoNear is first stage)
TourSchema.pre('aggregate', function (next) {
  const firstStage = this.pipeline()[0];
  if (firstStage && firstStage.$geoNear) return next();

  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

// ------------------------------
// Model Export
// ------------------------------
const Tour = mongoose.model('Tour', TourSchema);
export default Tour;
