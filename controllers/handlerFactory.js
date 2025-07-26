import AppError from '../utilis/appError.js';
import catchAsync from '../utilis/catchAsync.js';
import APIFeatures from '../utilis/apiFeatures.js';

export const getAll = (Model) => async (req, res) => {
  const queryObj = req.aliasQuery || req.query;

  //this filter is for nested routes where only give reviews based on specific tourId
  let filter = {};
  if (req.params.tourId) filter = { tour: req.params.tourId };

  const features = new APIFeatures(Model.find(filter), queryObj)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const doc = await features.query;

  // Send successful response
  res.status(200).json({
    status: 'success',
    result: doc.length,
    data: {
      data: doc,
    },
  });
};

export const deleteOne = (Model) =>
  catchAsync(async (req, res) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      throw new AppError('Document could not be found with this ID', 404);
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

export const updateOne = (Model) => async (req, res) => {
  const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    context: 'query',
  });

  if (!doc) {
    throw new AppError('Document could not be found updated this ID', 404);
  }

  res.status(201).json({
    status: 'success',
    data: {
      data: doc,
    },
  });
};

export const createOne = (Model) => async (req, res) => {
  const doc = await Model.create(req.body);

  if (!doc) {
    throw new AppError('Document could not be created', 400);
  }

  res.status(201).json({
    status: 'success',
    data: {
      data: doc,
    },
  });
};

export const getOne = (Model, popOptions) => async (req, res) => {
  let query = Model.findById(req.params.id);

  if (popOptions) query = query.populate(popOptions);

  const doc = await query;

  if (!doc) {
    throw new AppError('document could not be found with this ID', 404);
  }

  res.status(200).json({
    status: 'success',
    data: {
      data: doc,
    },
  });
};
