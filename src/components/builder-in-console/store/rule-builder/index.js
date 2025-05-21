import RuleService from "@/views/domain/rule-builder/RuleService";
import RuleValidationService from "@/views/domain/rule-builder/RuleValidationService";
import {
  SET_RULE,
  SET_DIALOG_STATE,
  SET_META,
  SET_REPLACE_PATTERN_TYPE,
  UPDATE_PARAMETERS,
  UPDATE_NESTED_VALUE,
  SET_VALIDATION_ERRORS
} from "@/store/types";

const state = {
  showDialog: false,
  rule: {},
  meta: null,
  replacePatternType: 'standard',
  validationErrors: [],
}

const mutations = {
  [SET_RULE](state, rule) {
    state.rule = rule;
  },
  [SET_DIALOG_STATE](state, showDialog) {
    state.showDialog = showDialog;
  },
  [SET_META](state, meta) {
    state.meta = meta;
  },
  [SET_REPLACE_PATTERN_TYPE](state, type) {
    state.replacePatternType = type;
  },
  [UPDATE_PARAMETERS](state, parameters) {
    if (state.rule) {
      state.rule.parameters = parameters;
    }
  },
  [UPDATE_NESTED_VALUE](state, { path, value }) {
    let target = state.rule;
    const lastKey = path[path.length - 1];

    // Navigate to the parent object
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (target === null || target === undefined) return;

      if (typeof key === 'number' || !isNaN(parseInt(key))) {
        target = target[parseInt(key)];
      } else {
        target = target[key];
      }
    }

    // Update the value
    if (target !== null && target !== undefined) {
      target[lastKey] = value;
    }
  },
  [SET_VALIDATION_ERRORS](state, errors) {
    state.validationErrors = errors;
  },
}

const actions = {
  setRule({ commit }, rule = null) {
    commit(SET_RULE, rule ? JSON.parse(JSON.stringify(rule)) : RuleService.initializeRule());
    commit(SET_VALIDATION_ERRORS, []);
  },
  setDialogState({ commit }, showDialog) {
    commit(SET_DIALOG_STATE, showDialog);
    if (!showDialog) {
      commit(SET_VALIDATION_ERRORS, []);
    }
  },
  openDialog({ commit }, { rule = null, meta = null, replacePatternType = 'standard' } = {}) {
    commit(SET_RULE, rule ? JSON.parse(JSON.stringify(rule)) : RuleService.initializeRule(replacePatternType));
    commit(SET_META, meta);
    commit(SET_REPLACE_PATTERN_TYPE, replacePatternType);
    commit(SET_DIALOG_STATE, true);
    commit(SET_VALIDATION_ERRORS, []);
  },
  updateNestedValue({ commit }, payload) {
    commit(UPDATE_NESTED_VALUE, payload);
  },
  updateParameters({ commit }, parameters) {
    commit(UPDATE_PARAMETERS, parameters);
  },
  validateRule({ state, commit }) {
    const errors = RuleValidationService.validateRule(state.rule);
    commit(SET_VALIDATION_ERRORS, errors);
    return errors.length === 0;
  }
}

const getters = {
  getDialogState: state => state.showDialog,
  getReplacePatternType: state => state.replacePatternType,
  getNestedValue: state => path => {
    if (!state.rule) return undefined;

    let value = state.rule;
    for (const key of path) {
      if (value === null || value === undefined) return undefined;

      if (typeof key === 'number' || !isNaN(parseInt(key))) {
        value = value[parseInt(key)];
      } else {
        value = value[key];
      }
    }

    return value;
  },
  getFieldError: state => field => {
    const error = state.validationErrors.find(err => err.field === field);
    return error ? error.message : null;
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}