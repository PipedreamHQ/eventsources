const zoho_crm = require("../zoho_crm.app");

module.exports = {
  props: {
    zoho_crm,
  },
  methods: {
    /**
     * This method takes the result from performing a validation with the `validate.js` library and will generate validation messages accordingly. If the validation results contain only one entry, the same message contained in the result is returned, for multiple results, the messages are concatenated.
     * @params {String} validationResult - An object containing validation results from the `validate.js` library.
     * @returns { validationMessages: string } String with validation messages concatenated, if the input had multiple validation messages, or one validation message when the validation had one result.
     */
    getValidationMessage(validationResult) {
      let validationResultKeys = Object.keys(validationResult);
      let validationMessages;
      if (validationResultKeys.length == 1) {
        validationMessages = validationResult[validationResultKeys[0]];
      } else {
        validationMessages =
          "Parameters validation failed with the following errors:\t";
        validationResultKeys.forEach(
          (validationResultKey) =>
            (validationMessages += `${validationResult[validationResultKey]}\t`)
        );
      }
      return validationMessages;
    },
    /**
     * This method iterates over the generator results returned by the `searchRecords` method and generates an array with all the search records yielded.
     * @params {String} generator - A generator object from the `searchRecords` method.
     * @returns { validationMessages: string } String with validation messages concatenated, if the input had multiple validation messages, or one validation message when the validation had one result.
     */
    async getGeneratorResults(generator) {
      const results = [];
      let result;
      do {
        result = await generator.next();
        if (result.value) {
          results.push(result.value);
        }
      } while (!result.done);
      return results;
    },
  },
};
