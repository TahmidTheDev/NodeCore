import AppError from './appError.js';

class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
    this.pagination = {}; // For sending pagination metadata
  }

  // 🔍 Filtering with operator + injection checks
  filter() {
    const queryObj = { ...this.queryString };
    const excludeFields = ['page', 'sort', 'limit', 'fields', 'search'];
    excludeFields.forEach((el) => delete queryObj[el]);

    const allowedOperators = [
      'gte',
      'gt',
      'lte',
      'lt',
      'ne',
      'in',
      'nin',
      'eq',
    ];

    const finalQueryObj = {};

    for (const key in queryObj) {
      if (!Object.hasOwnProperty.call(queryObj, key)) continue;

      const val = queryObj[key];

      if (key.includes('[')) {
        const [field, rawOperator] = key.replace(']', '').split('[');
        const operator = rawOperator.toLowerCase();

        if (!allowedOperators.includes(operator)) {
          throw new AppError(`Invalid query operator: ${operator}`, 400);
        }

        if (!finalQueryObj[field]) finalQueryObj[field] = {};
        const parsedVal = parseFloat(val);
        finalQueryObj[field][`$${operator}`] = Number.isFinite(parsedVal)
          ? parsedVal
          : val;
      } else {
        const parsedVal = parseFloat(val);
        finalQueryObj[key] = Number.isFinite(parsedVal) ? parsedVal : val;
      }
    }

    // 🔒 Check for dangerous MongoDB operators
    const dangerousOperators = ['$where', '$function', '$accumulator'];

    const hasDangerousOps = (obj) => {
      if (typeof obj !== 'object' || obj === null) return false;
      return Object.entries(obj).some(([key, val]) => {
        if (dangerousOperators.includes(key)) return true;
        if (typeof val === 'object') return hasDangerousOps(val);
        return false;
      });
    };

    if (hasDangerousOps(finalQueryObj)) {
      throw new AppError('Unsafe query parameters detected', 400);
    }

    this.query = this.query.find(finalQueryObj);
    return this;
  }

  // 🔃 Sort by fields (flexible)
  sort() {
    let { sort } = this.queryString;

    if (Array.isArray(sort)) sort = sort.join(',');
    sort = String(sort || '');

    if (sort) {
      const sortBy = sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-updatedAt'); // default fallback
    }

    return this;
  }

  // 🔎 Field limiting with sanitization (flexible)
  limitFields() {
    let { fields } = this.queryString;

    if (Array.isArray(fields)) fields = fields[fields.length - 1];
    fields = String(fields || '');

    if (fields) {
      // Remove dangerous $ chars
      fields = fields.replace(/\$/g, '');

      // Validate characters allowed
      if (!/^[a-zA-Z0-9_,.]+$/.test(fields)) {
        throw new AppError('Invalid fields format', 400);
      }

      this.query = this.query.select(fields.split(',').join(' '));
    } else {
      this.query = this.query.select('-__v');
    }

    return this;
  }

  // 📄 Pagination with max caps and metadata tracking
  paginate() {
    let { page, limit } = this.queryString;

    if (Array.isArray(page)) page = page[page.length - 1];
    if (Array.isArray(limit)) limit = limit[limit.length - 1];

    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || 100;

    const MAX_LIMIT = 500;
    const MAX_PAGE = 10000;

    limit = Math.min(limit, MAX_LIMIT);
    page = Math.min(page, MAX_PAGE);

    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    this.pagination = { page, limit, skip };

    return this;
  }

  // 🔍 Full-text search with RegEx and safe fields
  search(fields = []) {
    let { search } = this.queryString;
    if (!search || fields.length === 0) return this;

    if (search.length > 100) {
      throw new AppError('Search query too long', 400);
    }

    search = String(search).trim();
    if (!search) return this;

    // Escape special regex characters
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const keywords = search.split(/\s+/).map(escapeRegex);

    // Sanitize field names
    const isSafeField = (field) => /^[a-zA-Z0-9_.]+$/.test(field);
    const safeFields = fields.filter(isSafeField);

    if (safeFields.length === 0) return this;

    if (keywords.length === 1) {
      const regex = new RegExp(`^${keywords[0]}`, 'i');
      this.query = this.query.find({
        $or: safeFields.map((field) => ({ [field]: regex })),
      });
    } else {
      const andQueries = keywords.map((word) => {
        const regex = new RegExp(word, 'i');
        return {
          $or: safeFields.map((field) => ({ [field]: regex })),
        };
      });

      this.query = this.query.find({ $and: andQueries });
    }

    return this;
  }
}

export default APIFeatures;

// class APIFeatures {
//   constructor(query, queryString) {
//     this.query = query;
//     this.queryString = queryString;
//   }

//   // ✅ Filtering with deep dangerous operator check and stricter numeric parsing
//   filter() {
//     const queryObj = { ...this.queryString };
//     const excludeFields = ['page', 'sort', 'limit', 'fields', 'search'];
//     excludeFields.forEach((el) => delete queryObj[el]);

//     const finalQueryObj = {};

//     for (const key in queryObj) {
//       const val = queryObj[key];
//       if (key.includes('[')) {
//         const [field, operator] = key.replace(']', '').split('[');
//         if (!finalQueryObj[field]) finalQueryObj[field] = {};
//         finalQueryObj[field][`$${operator}`] =
//           !isNaN(val) && val.trim() !== '' ? Number(val) : val;
//       } else {
//         finalQueryObj[key] =
//           !isNaN(val) && val.trim() !== '' ? Number(val) : val;
//       }
//     }

//     // 🔐 Deep recursive check for dangerous MongoDB operators
//     const dangerousOperators = ['$where', '$function', '$accumulator'];

//     function hasDangerousOps(obj) {
//       if (typeof obj !== 'object' || obj === null) return false;
//       return Object.entries(obj).some(([key, val]) => {
//         if (dangerousOperators.includes(key)) return true;
//         if (typeof val === 'object') return hasDangerousOps(val);
//         return false;
//       });
//     }
//     if (hasDangerousOps(finalQueryObj)) {
//       throw new AppError('Unsafe query parameters detected', 400);
//     }

//     this.query = this.query.find(finalQueryObj);
//     return this;
//   }

//   // ✅ Support multiple sorts joined together
//   sort() {
//     let { sort } = this.queryString;

//     if (Array.isArray(sort)) sort = sort.join(',');
//     sort = String(sort || '');

//     if (sort) {
//       const sortBy = sort.split(',').join(' ');
//       this.query = this.query.sort(sortBy);
//     } else {
//       this.query = this.query.sort('-updatedAt');
//     }

//     return this;
//   }

//   limitFields() {
//     let { fields } = this.queryString;

//     if (Array.isArray(fields)) fields = fields[fields.length - 1];
//     fields = String(fields || '');

//     if (fields) {
//       this.query = this.query.select(fields.split(',').join(' '));
//     } else {
//       this.query = this.query.select('-__v');
//     }

//     return this;
//   }

//   paginate() {
//     let { page, limit } = this.queryString;

//     if (Array.isArray(page)) page = page[page.length - 1];
//     if (Array.isArray(limit)) limit = limit[limit.length - 1];

//     page = parseInt(page, 10) || 1;
//     limit = parseInt(limit, 10) || 100;

//     const skip = (page - 1) * limit;
//     this.query = this.query.skip(skip).limit(limit);

//     return this;
//   }

//   // 🔍 Optional fuzzy search across specified fields
//   search(fields = []) {
//     let { search } = this.queryString;

//     if (!search || fields.length === 0) return this;

//     // Limit length for safety/performance
//     if (search.length > 100) {
//       throw new AppError('Search query too long', 400);
//     }

//     // Sanitize and trim
//     search = String(search).trim();
//     if (!search) return this;

//     // Escape special regex characters
//     const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

//     // Split query into words
//     const keywords = search.split(/\s+/).map(escapeRegex);

//     // If single word, use anchored search for performance
//     if (keywords.length === 1) {
//       const regex = new RegExp(`^${keywords[0]}`, 'i'); // anchored, case-insensitive
//       this.query = this.query.find({
//         $or: fields.map((field) => ({ [field]: regex })),
//       });
//     } else {
//       // Multi-word: use fuzzy (contains anywhere) search combined with AND logic
//       const andQueries = keywords.map((word) => {
//         const regex = new RegExp(word, 'i'); // fuzzy, case-insensitive
//         return {
//           $or: fields.map((field) => ({ [field]: regex })),
//         };
//       });

//       this.query = this.query.find({ $and: andQueries });
//     }

//     return this;
//   }
// }

// export default APIFeatures;

// class APIFeatures {
//   constructor(query, queryString) {
//     this.query = query;
//     this.queryString = queryString;
//   }
//   filter() {
//     // const queryParams = req.aliasQuery || this.queryString;

//     // Copy queryParams for filtering
//     const queryObj = { ...this.queryString };

//     // Exclude fields not related to filtering
//     const excludeFields = ['page', 'sort', 'limit', 'fields'];
//     excludeFields.forEach((el) => delete queryObj[el]);

//     // Convert query string filters to MongoDB format
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
//     this.query = this.query.find(finalQueryObj);
//     return this;
//   }

//   sort() {
//     const rawSort = this.queryString.sort;

//     if (rawSort) {
//       // ✅ Ensure it's a string before calling split
//       const sortStr = Array.isArray(rawSort)
//         ? rawSort[rawSort.length - 1] // if somehow array got through
//         : String(rawSort); // normalize to string

//       const sortBy = sortStr.split(',').join(' ');
//       this.query = this.query.sort(sortBy);
//     } else {
//       this.query = this.query.sort('-updatedAt');
//     }

//     return this;
//   }

//   limitFields() {
//     let fields = this.queryString.fields;

//     if (Array.isArray(fields)) {
//       // take last if multiple fields passed
//       fields = fields[fields.length - 1];
//     }

//     if (fields) {
//       this.query = this.query.select(fields.split(',').join(' '));
//     } else {
//       this.query = this.query.select('-__v');
//     }
//     return this;
//   }

//   paginate() {
//     let page = this.queryString.page;
//     let limit = this.queryString.limit;

//     if (Array.isArray(page)) page = page[page.length - 1];
//     if (Array.isArray(limit)) limit = limit[limit.length - 1];

//     page = page * 1 || 1;
//     limit = limit * 1 || 100;

//     const skip = (page - 1) * limit;

//     this.query = this.query.skip(skip).limit(limit);
//     return this;
//   }
// }
// export default APIFeatures;
