const Document = require('../../models/GENERAL/document.model');
const Book = require('../../models/GENERAL/book.model');
const Box = require('../../models/GENERAL/box.model');

class ControlNumber {
  constructor(dataRow, configs, _tenantId) {
    this._tenantId = _tenantId;
    this.now = new Date();
    this.dataRow = dataRow;
    this.configs = configs;
    this.controlNumberArray = [];
  }

  fieldBased(path) {
    let config = this.configs.fieldBased;

    let found = false;
    if (this.dataRow[path] && config.logics) {
      let data = this.dataRow[path];
      let logics = config.logics;
      for (let logic of logics) {
        let condition = logic.if.replace(/\//g, '');
        if (eval(condition)) {
          this.controlNumberArray.push({
            separate: config.separate,
            value: logic.then,
          });
          found = true;
          break;
        }
      }
    }

    if (!found) {
      this.controlNumberArray.push({
        separate: config.separate,
        value: config.default,
      });
    }

    return this;
  }

  sequence(reset, queryKey) {
    let config = this.configs.sequence;
    let data = this.dataRow[queryKey];
    let times, from, to;

    //Needs to refactor this part
    if (reset == 'monthly') {
      from = new Date(this.now.getFullYear(), this.now.getMonth(), 2);
      from.setHours(0, 0, 0, 0);
      to = new Date(this.now.getFullYear(), this.now.getMonth() + 1, 0);
      to.setHours(23, 59, 59, 999);

      let start = new Date(this.now.getFullYear(), this.now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      let end = new Date(this.now.getFullYear(), this.now.getMonth(), 1);
      end.setHours(23, 59, 59, 999);

      times = {
        start: start,
        end: end,
      };
    } else if (reset === 'yearly') {
      from = new Date(this.now.getFullYear(), 0, 2);

      to = new Date(this.now.getFullYear(), 11, 31);
      to.setHours(23, 59, 59, 999);

      let start = new Date(this.now.getFullYear(), 0, 1);
      start.setHours(0, 0, 0, 0);
      let end = new Date(this.now.getFullYear(), 0, 1);
      end.setHours(23, 59, 59, 999);

      times = {
        start: start,
        end: end,
      };
    }

    let willResetSeq = times.start <= this.now && times >= this.now;

    let queryConfig = config.queries[queryKey];

    let findQuery = {
      _tenantId: this._tenantId,
      status: { $ne: 'Deleted' },
    };

    let dataRegex = '';
    if (queryConfig.find) {
      if (queryConfig.dataRegex) {
        for (let logic of queryConfig.dataRegex) {
          let condition = logic.if.replace(/\//g, '');
          if (eval(condition)) {
            dataRegex = logic.then;
            break;
          }
        }
      }

      let findConfig = eval(JSON.parse(queryConfig.find));
      for (let [key, val] of Object.entries(findConfig)) {
        if (typeof val === 'object') {
          for (let [key1, val1] of Object.entries(val)) {
            let regex = /\//g;
            let isVariable = val1.match(regex);
            if (isVariable) {
              val[key1] = eval(val1.replace(/\//g, ''));
              if (key1 === '$regex') val[key1] = eval(val[key1]).toString();
            } else {
              val[key1] = val1;
            }
            findConfig[key] = {
              ...findConfig[key],
              ...val,
            };
          }
        } else {
          findConfig[key] = eval(val.replace(/\//g, ''));
        }
      }
      findQuery = {
        ...findConfig,
        ...findQuery,
      };
    }

    let model = eval(queryConfig.collection);
    let query = model.find(findQuery).sort(queryConfig.sort);
    this.controlNumberArray.push({
      separate: config.separate,
      query: query,
      callBack: (result, index) => {
        let currentSequence = parseInt(config.default);
        //Checker if controlNumber will reset or not
        if (result.length !== 0) {
          let previousControlNumber = result[0][this.configs.path].split(
            this.configs.separator
          );
          if (previousControlNumber[index]) {
            if (
              (willResetSeq &&
                previousControlNumber[index] !== currentSequence) ||
              !willResetSeq
            ) {
              currentSequence = parseInt(previousControlNumber[index]);
              currentSequence += parseInt(config.increment);
            }
          }
        }

        currentSequence = currentSequence
          .toString()
          .padStart(eval(config.padding));
        return currentSequence;
      },
    });

    return this;
  }

  month() {
    //Needs moment JS for the format
    let config = this.configs.month;
    this.controlNumberArray.push({
      value: this.now.getMonth() + 1,
      separate: config.separate,
    });
    return this;
  }

  year() {
    //Needs moment JS for the format
    let config = this.configs.year;
    let year = this.now.getFullYear().toString();
    this.controlNumberArray.push({
      value: year.substr(-2),
      separate: config.separate,
    });
    return this;
  }

  async generate() {
    //Refactor for separator
    let controlNumberArray = [];
    let oldVal = '';
    for (let [key, row] of Object.entries(this.controlNumberArray)) {
      let value = row.value;
      if (!row.value && row.query) {
        value = row.callBack(await row.query, key);
      }

      controlNumberArray.push(value);

      // if (row.separate) {
      //   oldVal = '';
      //   controlNumberArray.push(value);
      // } else {
      //   oldVal = value;
      // }
    }
    return controlNumberArray.join(this.configs.separator);
  }
}

module.exports = ControlNumber;
