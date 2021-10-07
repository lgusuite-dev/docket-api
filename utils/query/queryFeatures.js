const _ = require('lodash');

class QueryFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    let queryObj = { ...this.queryString };
    const removeField = [
      'page',
      'sort',
      'limit',
      'fields',
      'populate',
      'popField',
    ];

    queryObj = _.omit(queryObj, removeField);

    // manipulate "in" and "nin" operator value to array if available
    for (let key of Object.keys(queryObj)) {
      if (typeof queryObj[key] === 'object') {
        for (let objKey of Object.keys(queryObj[key])) {
          if (
            (objKey === 'in' || objKey === 'nin') &&
            typeof queryObj[key][objKey] === 'string'
          )
            queryObj[key][objKey] = queryObj[key][objKey].split(',');
        }
      }
    }

    const orQuery = [];

    // normal query
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(
      /\b(gte|gt|lte|lt|ne|eq|in|nin)\b/g,
      (match) => `$${match}`
    );
    if (orQuery.length)
      this.query.find({ ...JSON.parse(queryStr), $or: orQuery });
    else this.query.find({ ...JSON.parse(queryStr) });

    return this;
  }

  count() {
    this.query = this.query.countDocuments();
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }

    return this;
  }

  paginate() {
    const page = +this.queryString.page || 1;
    const limit = +this.queryString.limit || 1500;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }

  populate() {
    const populateDB = this.queryString.populate;
    const field = this.queryString.popField;

    if (populateDB) {
      if (Array.isArray(populateDB)) {
        for (let [index, populate] of populateDB.entries()) {
          const select = Array.isArray(field)
            ? // if field is array
              field[index]
              ? // if field[index] is not undefined
                field[index].split(',').join(' ')
              : // use field[0] if field[index] is undefined
                field[0].split(',').join(' ')
            : // if field is not array
              field && field.split(',').join(' ');

          this.query = this.query.populate({
            path: populate,
            select,
          });
        }
      } else {
        if (Array.isArray(field)) {
          const select = [];

          for (let key of field) {
            const currentKey = key.split(',');

            for (let str of currentKey)
              if (!select.includes(str)) select.push(str);
          }

          this.query = this.query.populate({
            path: populateDB,
            select: select.join(' '),
          });
        } else {
          this.query = this.query.populate({
            path: populateDB,
            select: field && field.split(',').join(' '),
          });
        }
      }
    }

    return this;
  }
}

module.exports = QueryFeatures;
