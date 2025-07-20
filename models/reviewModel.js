import mongoose from 'mongoose';
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
    // Auto add createdAt and updatedAt fields
    timestamps: true,

    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false },
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function () {
  this.populate({
    path: 'user',
    select: 'name email role ',
  });
});

const Review = mongoose.model('Review', reviewSchema);
export default Review;
