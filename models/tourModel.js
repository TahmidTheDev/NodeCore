import mongoose from 'mongoose';
import slugify from 'slugify';
// import validator from 'validator';

const TourSchmea = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      trim: true,
      minlength: [3, 'Name must be at least 3 characters'],
      maxlength: [100, 'Name must be less than 100 characters'],
      unique: true,
      // validate: [validator.isAlpha, 'tour name only contain character'],
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
        message: 'Difficulty is either: easy, medium, or difficult',
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
        validator: function (val) {
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

TourSchmea.virtual('durationWeeks').get(function () {
  return Number((this.duration / 7).toFixed(1));
});

//document middleware
TourSchmea.pre('save', async function () {
  this.slug = slugify(this.name, { lower: true });
});

//query middleware
TourSchmea.pre(/^find/, async function () {
  // TourSchmea.pre('find', function (next) {
  this.find({ secretTour: { $ne: true } });
});

//aggretation middleware
TourSchmea.pre('aggregate', async function () {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
});

// TourSchmea.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

const Tour = mongoose.model('Tour', TourSchmea);

export default Tour;
