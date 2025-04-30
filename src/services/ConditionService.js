export default {
  fields: [
    'req.uri.path',
    'req.method',
    'req.headers["host"]',
    'req.headers["user-agent"]',
    'req.geo.country',
    'req.status'
  ],
  operators: [
    '==',
    '!=',
    '~~',
    'starts_with',
    'ends_with'
  ],
  rewriteFunctions: [
    { value: 'concat', label: 'Concatenate', description: 'Concatenates the argument to the end of the field value' },
    { value: 'substring', label: 'Substring', description: 'Returns a subset of the field value from index 0 to the argument value' },
    { value: 'replace', label: 'Replace', description: 'Replaces all occurrences of a string with another string' },
    { value: 'lowercase', label: 'Lowercase', description: 'Converts the string to lowercase' }
  ]
}