import countriesJSON from "@/views/domain/CountrySelector/countries.json"

const countryOptions = countriesJSON.map(country => ({
  label: country.name,
  value: country.code
}));

export default {
  fields: [
    {
      label: 'URI Path',
      value: 'req.uri.path',
      description: 'Requested URI path',
    },
    {
      label: 'Method',
      value: 'req.method',
      description: 'Request HTTP method',
      meta: {
        type: 'select',
        options: [
          "GET",
          "POST",
          "PUT",
          "DELETE",
          "PATCH",
          "OPTIONS",
        ]
      }
    },
    {
      label: 'Host',
      value: 'req.headers["host"]',
      description: 'Request Host header',
    },
    {
      label: 'User Agent',
      value: 'req.headers["user-agent"]',
      description: 'User-Agent header',
    },
    {
      label: 'Country',
      value: 'req.geo.country',
      description: 'Country of the request origin',
      meta: {
        type: 'select',
        options: countryOptions
      }
    },
    {
      label: 'Status Code',
      value: 'req.status',
      description: 'HTTP status code of the response',
      meta: {
        type: 'number',
        min: 100,
        max: 599,
        step: 1,
      },
      validate: (value) => {
        // Skip validation for empty values
        if (value === '' || value === null || value === undefined) {
          return "This field is required";
        }

        // Parse to number
        const statusCode = parseInt(value, 10);

        // Check if it's a valid number
        if (isNaN(statusCode)) {
          return 'Status code must be a number';
        }

        // Check range
        if (statusCode < 100 || statusCode > 599) {
          return `Status code must be between 100 and 599, got ${statusCode}`;
        }

        // Valid
        return undefined;
      }
    }
  ],
  operators: [
    {
      label: 'Equals',
      value: '==',
      description: 'Checks if the field is equal to the value'
    },
    {
      label: 'Not Equals',
      value: '!=',
      description: 'Checks if the field is not equal to the value'
    },
    {
      label: 'Contains',
      value: '~~',
      description: 'Checks if the field contains the value'
    },
    {
      label: 'Starts With',
      value: 'starts_with',
      description: 'Checks if the field starts with the value'
    },
    {
      label: 'Ends With',
      value: 'ends_with',
      description: 'Checks if the field ends with the value'
    }
  ],
  joinOperators: [
    { value: "&&", label: "AND" },
    { value: "||", label: "OR" }
  ],
  rewriteFunctions: [
    { value: 'concat', label: 'Concatenate', description: 'Concatenates the argument to the end of the field value' },
    { value: 'substring', label: 'Substring', description: 'Returns a subset of the field value from index 0 to the argument value' },
    { value: 'replace', label: 'Replace', description: 'Replaces all occurrences of a string with another string' },
    { value: 'lowercase', label: 'Lowercase', description: 'Converts the string to lowercase' }
  ],
  getFieldValidationError(fieldValue, value) {
    // Find the field definition
    const fieldDef = this.fields.find(f => f.value === fieldValue);

    // If no field definition or no validate function, consider it valid
    if (!fieldDef || !fieldDef.validate) {
      return undefined;
    }

    // Call the field's validate function
    return fieldDef.validate(value);
  },
}