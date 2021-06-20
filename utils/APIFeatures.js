class APIFeatures {
  // This gets automatically called when we create a new object with this class
  constructor(mongoQuery, urlQuery) {
    this.mongoQuery = mongoQuery;
    this.urlQuery = urlQuery;
  }

  filter() {
    // 1A. Filtering, we skip page sort as those are not explicitly related to the data
    // Primitives and references, objects reference, variables are primitive. (Shallow vs Deep vs Hard Copy)

    const queryObj = { ...this.urlQuery };
    const excludeFields = ["page", "sort", "limit", "fields"];
    excludeFields.forEach((el) => delete queryObj[el]);

    // 1B. Advanced Filtering
    // The following code returns { difficulty: 'easy', duration: { gte: '5' } }
    let queryStr = JSON.stringify(queryObj);

    // \b matches the exact str, the name can also contain lt. /g is global, multiple replaces. The callback function takes each match and returns the replaced value.
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    // Returning a promise instead of a return value, so that sort and limit etc can be chained.
    this.mongoQuery = this.mongoQuery.find(JSON.parse(queryStr));

    return this;

    // We already have a query in the constructor function, hence we dont create a new one obvio.
    // let query = Tour.find(JSON.parse(queryStr));
  }

  sort() {
    // 2. Sorting
    if (this.urlQuery.sort) {
      // Sort the sort query by the comma, and rejoin with a space
      const sortBy = this.urlQuery.sort.split(",").join(" ");

      // The value of the request.query.sort is sorted, eg. "price ratingsAverage" sorts by both in order.
      this.mongoQuery = this.mongoQuery.sort(sortBy);
    } else {
      this.mongoQuery = this.mongoQuery.sort("name");
    }
    return this;
  }

  limitFields() {
    // 3. Limiting Fields
    if (this.urlQuery.fields) {
      // Sort the sort query by the comma, and rejoin with a space
      const fields = this.urlQuery.fields.split(",").join(" ");

      // The value of the request.query.sort is sorted, eg. "price ratingsAverage" sorts by both in order.
      this.mongoQuery = this.mongoQuery.select(fields);
    } else {
      // The minus sign to exclude fields.
      this.mongoQuery = this.mongoQuery.select("-__v");
    }

    return this;
  }

  paginate() {
    // 4. Pagination, skip is way abstract for the user
    // page 1--> 1 - 10, page 2 --> 11-20, page 3 --> 21-30

    // Method 2, default value is 1 if nothing is passed in url. Also * 1 to convert to string.
    const pageNo = this.urlQuery.page * 1 || 1;
    const limit = this.urlQuery.limit * 1 || 100;

    const skip = (pageNo - 1) * limit;

    this.mongoQuery = this.mongoQuery.skip(skip).limit(limit);

    // if (this.urlQuery.page) {
    //   const numTours = this.urlQuery.countDocuments((num) => {
    //     console.log(num);
    //   });

    //   // We throw error, so that it immediately goes to the catch block and executes the code there.
    //   if (skip >= numTours) throw new Error("This page no does not exist");
    // }
    return this;
  }
}

module.exports = APIFeatures;
