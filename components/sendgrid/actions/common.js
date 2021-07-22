module.exports = {
  checkValidationResults(validationResults) {
    if (validationResults) {
      const validationErrorMsg = Object.keys(validationResults)
        .map((key) => `\t${validationResults[key]}`)
        .join("\n");
      const errorMsg = `Parameter validation failed with the following errors:\n${validationErrorMsg}`;
      throw new Error(errorMsg);
    }
  },
  integerValueGreaterThan(value1, value2, nameValue1, nameValue2) {
    if (Number.isInteger(value1) && Number.isInteger(value2)) {
      if (value1 <= value2) {
        throw new Error(
          `Parameter ${nameValue1} must be greater than ${nameValue2}.`,
        );
      }
    }
  },
  convertEmptyStringToUndefined(value) {
    return value === "" ?
      undefined :
      value;
  },
};
