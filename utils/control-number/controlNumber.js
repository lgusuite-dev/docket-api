const Document = require('../../models/GENERAL/document.model');

class ControlNumber {
  constructor(document, configs) {
    this.now = new Date();
    this.document = document;
    this.configs = configs;
    this.controlNumberArray = [];
  }

  fieldBased(path) {
    let data = this.document[path];
    let config = this.configs.fieldBased;
    let logics = config.logics;

    for (let logic of logics) {
      let condition = logic.if.replace(/\//g, '');
      if (eval(condition)) {
        this.controlNumberArray.push({
          separate: config.separate,
          value: logic.then,
        });
        break;
      }
    }
    return this;
  }

  sequence(reset) {
    let config = this.configs.sequence;
    let data = this.document[config.path];
    let times;

    if (reset == 'monthly') {
      let start = new Date(this.now.getFullYear(), this.now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      let end = new Date(this.now.getFullYear(), this.now.getMonth(), 1);
      end.setHours(23, 59, 59, 999);

      times = {
        start: start,
        end: end,
      };
    } else if (reset === 'yearly') {
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

    let queryConfig = config.queries[config.path];

    let { _tenantId } = this.document;
    let findQuery = {
      ...eval(queryConfig.find),
      _tenantId: _tenantId,
      status: { $ne: 'Deleted' },
    };

    let model = eval(queryConfig.collection);

    let query = model.find(findQuery).sort(queryConfig.sort);
    this.controlNumberArray.push({
      separate: config.separate,
      query: query,
      callBack: (result, index) => {
        let currentSequence = config.default;
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
              currentSequence = previousControlNumber[index];
              currentSequence += config.increment;
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
    let config = this.configs.month;
    this.controlNumberArray.push({
      value: this.now.getMonth() + 1,
      separate: config.separate,
    });
    return this;
  }

  year() {
    let config = this.configs.year;
    let year = this.now.getFullYear().toString();
    this.controlNumberArray.push({
      value: year.substr(-2),
      separate: config.separate,
    });
    return this;
  }

  async generate() {
    let controlNumberArray = [];
    let oldVal = '';
    for (let [key, row] of Object.entries(this.controlNumberArray)) {
      let value = oldVal + row.value;
      if (!row.value && row.query) {
        value = row.callBack(await row.query, key);
      }

      if (row.separate) {
        oldVal = '';
        controlNumberArray.push(value);
      } else {
        oldVal = value;
      }
    }
    return controlNumberArray.join(this.configs.separator);
  }
}

module.exports = ControlNumber;
