class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }
  filter() {
    // const queryParams = req.aliasQuery || this.queryString;

    // Copy queryParams for filtering
    const queryObj = { ...this.queryString };

    // Exclude fields not related to filtering
    const excludeFields = ['page', 'sort', 'limit', 'fields'];
    excludeFields.forEach((el) => delete queryObj[el]);

    // Convert query string filters to MongoDB format
    const finalQueryObj = {};

    for (const key in queryObj) {
      if (key.includes('[')) {
        const [field, operator] = key.replace(']', '').split('[');
        if (!finalQueryObj[field]) finalQueryObj[field] = {};
        finalQueryObj[field][`$${operator}`] = Number(queryObj[key]);
      } else {
        finalQueryObj[key] = queryObj[key];
      }
    }
    this.query = this.query.find(finalQueryObj);
    return this;
  }

  sort() {
    const rawSort = this.queryString.sort;

    if (rawSort) {
      // ✅ Ensure it's a string before calling split
      const sortStr = Array.isArray(rawSort)
        ? rawSort[rawSort.length - 1] // if somehow array got through
        : String(rawSort); // normalize to string

      const sortBy = sortStr.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-updatedAt');
    }

    return this;
  }

  limitFields() {
    let fields = this.queryString.fields;

    if (Array.isArray(fields)) {
      // take last if multiple fields passed
      fields = fields[fields.length - 1];
    }

    if (fields) {
      this.query = this.query.select(fields.split(',').join(' '));
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    let page = this.queryString.page;
    let limit = this.queryString.limit;

    if (Array.isArray(page)) page = page[page.length - 1];
    if (Array.isArray(limit)) limit = limit[limit.length - 1];

    page = page * 1 || 1;
    limit = limit * 1 || 100;

    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}
export default APIFeatures;

//  const rawSort = this.queryString.sort;

// if (rawSort) {
//   // ✅ Ensure it's a string before calling split
//   const sortStr = Array.isArray(rawSort)
//     ? rawSort[rawSort.length - 1] // if somehow array got through
//     : String(rawSort); // normalize to string

//   const sortBy = sortStr.split(',').join(' ');
//   this.query = this.query.sort(sortBy);
// } else {
//   this.query = this.query.sort('-updatedAt');
// }

// return this;
//  sort() {
//     if (this.queryString.sort) {
//       const sortBy = this.queryString.sort.split(',').join(' ');
//       this.query = this.query.sort(sortBy);
//     } else {
//       this.query = this.query.sort('-updatedAt');
//     }
//     return this;
//   }
// filter() {
//   const queryObj = { ...this.queryString };
//   const excludeFields = ['page', 'sort', 'limit', 'fields'];
//   excludeFields.forEach(el => delete queryObj[el]);

//   // Handle whitelist fields that may be arrays
//   if (Array.isArray(queryObj.duration)) {
//     queryObj.duration = { $in: queryObj.duration.map(Number) };
//   }
//   if (Array.isArray(queryObj.difficulty)) {
//     queryObj.difficulty = { $in: queryObj.difficulty };
//   }

//   // Handle other filters, including Mongo operators in queryObj...

//   this.query = this.query.find(queryObj);

//   return this;
// }
// limitFields() { if (this.queryString.fields) { const fields = this.queryString.fields.split(',').join(' '); this.query = this.query.select(fields); } else { this.query = this.query.select('-__v'); } return this; } paginate() { const page = this.queryString.page * 1 || 1; const limit = this.queryString.limit * 1 || 100; const skip = (page - 1) * limit; this.query = this.query.skip(skip).limit(limit); return this;
