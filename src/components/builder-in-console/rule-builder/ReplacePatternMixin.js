export const ReplacePatternMixin = {
  data: () => ({
    replace_pattern: {
      field: 'req.uri.path',
      value: '',
      fn: undefined,
      fnArg: undefined,
      withFn: false,
    },
    ex_rewrite: {
      parameters: []
    }
  }),
  methods: {
    updateReplacePattern(pattern) {
      this.replace_pattern = pattern;
    },
  }
}