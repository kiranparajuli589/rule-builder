import { $i18n as $t } from "@/plugins/i18n";
import countriesJSON from "@/views/domain/CountrySelector/countries.json"

const countryOptions = countriesJSON.map(country => ({
  label: country.name,
  value: country.code
}));

export const JOIN_OPERATOR = {
  AND: '&&',
    OR: '||'
}
export const REWRITE_FUNCTIONS = {
  CONCAT: 'concat',
    SUBSTRING: 'substring',
    REPLACE: 'replace',
    LOWERCASE: 'lowercase'
}
export const RULE_FIELDS = {
  URI_PATH: 'req.uri.path',
    METHOD: 'req.method',
    HOST: 'req.headers.host',
    USER_AGENT: 'req.headers.UserAgent',
    COUNTRY: 'req.geo.country',
    STATUS_CODE: 'req.status'
}
export const CONDITION_OPERATOR = {
  EQUALS: '==',
    NOT_EQUALS: '!=',
    CONTAINS: '~~',
    STARTS_WITH: 'starts_with',
    ENDS_WITH: 'ends_with'
}

export default {
  
  fields: [
    {
      label: $t('ruleBuilder.uriPath'),
      value: RULE_FIELDS.URI_PATH,
      description: $t('ruleBuilder.uriPathDescription'),
    },
    {
      label: $t('ruleBuilder.method'),
      value: RULE_FIELDS.METHOD,
      description: $t('ruleBuilder.methodDescription'),
      meta: {
        type: 'select',
        placeholder: $t('ruleBuilder.selectHttpMethod'),
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
      label: $t('ruleBuilder.host'),
      value: RULE_FIELDS.HOST,
      description: $t('ruleBuilder.hostDescription'),
    },
    {
      label: $t('ruleBuilder.userAgent'),
      value: RULE_FIELDS.USER_AGENT,
      description: $t('ruleBuilder.userAgentDescription'),
    },
    {
      label: $t('ruleBuilder.country'),
      value: RULE_FIELDS.COUNTRY,
      description: $t('ruleBuilder.countryDescription'),
      meta: {
        type: 'select',
        options: countryOptions
      }
    },
    {
      label: $t('ruleBuilder.statusCode'),
      value: RULE_FIELDS.STATUS_CODE,
      description: $t('ruleBuilder.statusCodeDescription'),
      meta: {
        placeholder: $t('ruleBuilder.enterStatusCode'),
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
      label: $t('ruleBuilder.equals'),
      value: CONDITION_OPERATOR.EQUALS,
      description: $t('ruleBuilder.equalsDescription')
    },
    {
      label: $t('ruleBuilder.notEquals'),
      value: CONDITION_OPERATOR.NOT_EQUALS,
      description: $t('ruleBuilder.notEqualsDescription')
    },
    {
      label: $t('ruleBuilder.contains'),
      value: CONDITION_OPERATOR.CONTAINS,
      description: $t('ruleBuilder.containsDescription')
    },
    {
      label: $t('ruleBuilder.startsWith'),
      value: CONDITION_OPERATOR.STARTS_WITH,
      description: $t('ruleBuilder.startsWithDescription')
    },
    {
      label: $t('ruleBuilder.endsWith'),
      value: CONDITION_OPERATOR.ENDS_WITH,
      description: $t('ruleBuilder.endsWithDescription')
    }
  ],
  joinOperators: [
    { value: JOIN_OPERATOR.AND, label: $t('ruleBuilder.AND') },
    { value: JOIN_OPERATOR.OR, label: $t('ruleBuilder.OR') }
  ],
  rewriteFunctions: [
    { value: REWRITE_FUNCTIONS.CONCAT, label: $t('ruleBuilder.concat'), description: $t('ruleBuilder.concatDescription') },
    { value: REWRITE_FUNCTIONS.SUBSTRING, label: $t('ruleBuilder.substring'), description: $t('ruleBuilder.substringDescription') },
    { value: REWRITE_FUNCTIONS.REPLACE, label: $t('ruleBuilder.replace'), description: $t('ruleBuilder.replaceDescription') },
    { value: REWRITE_FUNCTIONS.LOWERCASE, label: $t('ruleBuilder.lowercase'), description: $t('ruleBuilder.lowercaseDescription') },
  ],
}