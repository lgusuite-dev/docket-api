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
          value: logic.then,
          separator: config.separator,
        });
        break;
      }
    }
    return this;
  }

  sequence(reset) {
    let config = this.configs.sequence;
    let dates;
    if (reset == 'monthly') {
      dates = {
        start: new Date(this.now.getFullYear(), this.now.getMonth() + 1, 0),
        end: new Date(this.now.getFullYear(), this.now.getMonth(), 0),
      };
    } else if (reset === 'yearly') {
      dates = {
        start: new Date(this.now.getFullYear(), 0, 1),
        end: new Date(this.now.getFullYear(), 12, 0),
      };
    }

    let willResetSeq = !dates.start >= this.now && dates.end <= this.now;

    let { type, _tenantId } = this.document;
    let findQuery = {
      ...eval(config.query.find),
      _tenantId: _tenantId,
      status: { $ne: 'Deleted' },
    };

    let model = eval(config.query.collection);

    let currentSequence = 100;

    let obj = {
      separator: config.separator,
    };

    if (!willResetSeq) {
      let query = model.count(findQuery);
      this.controlNumberArray.push({
        ...obj,
        query: query,
        callBack: (currentSequence) => {
          currentSequence += config.increment;
          currentSequence = currentSequence.toString().padStart(3, '0');
          return currentSequence;
        },
      });
    } else {
      this.controlNumberArray.push({
        ...obj,
        value: currentSequence,
      });
    }

    return this;
  }

  month() {
    let config = this.configs.month;
    this.controlNumberArray.push({
      value: this.now.getMonth() + 1,
      separator: config.separator,
    });
    return this;
  }

  year() {
    let config = this.configs.year;
    let year = this.now.getFullYear().toString();
    this.controlNumberArray.push({
      value: year.substr(-2),
      separator: config.separator,
    });
    return this;
  }

  async generate() {
    let controlNumber = '';
    for (let row of this.controlNumberArray) {
      let value = row.value;
      if (!value && row.query) {
        value = row.callBack(await row.query);
      }
      controlNumber = controlNumber.concat(value, row.separator || '');
    }
    return controlNumber;
  }
}

module.exports = ControlNumber;
