import RuleService from "@/views/domain/rule-builder/RuleService";

const state = {
  showDialog: false,
  rule: null,
  meta: null,
  replacePatternType: 'standard',
}

const mutations = {
  SET_RULE(state, rule) {
    state.rule = rule;
  },
  SET_DIALOG_STATE(state, showDialog) {
    state.showDialog = showDialog;
  },
  SET_META(state, meta) {
    state.meta = meta;
  },
  SET_REPLACE_PATTERN_TYPE(state, type) {
    state.replacePatternType = type;
  },
  UPDATE_CREATE_PATTERN(state, conditions) {
    if (state.rule && state.rule.create_pattern) {
      state.rule.create_pattern.conditions = conditions;
    }
  },
  UPDATE_REPLACE_PATTERN(state, replacePattern) {
    if (state.rule) {
      state.rule.replace_pattern = replacePattern;
    }
  },
  UPDATE_PARAMETERS(state, parameters) {
    if (state.rule) {
      state.rule.parameters = parameters;
    }
  }
}

const actions = {
  setRule({ commit }, rule = null) {
    commit('SET_RULE', rule ? JSON.parse(JSON.stringify(rule)) : RuleService.initializeRule());
  },
  setDialogState({ commit }, showDialog) {
    commit('SET_DIALOG_STATE', showDialog);
  },
  openDialog({ commit }, { rule = null, meta = null, replacePatternType = 'standard' } = {}) {
    commit('SET_RULE', rule ? JSON.parse(JSON.stringify(rule)) : RuleService.initializeRule());
    commit('SET_META', meta);
    commit('SET_REPLACE_PATTERN_TYPE', replacePatternType);
    commit('SET_DIALOG_STATE', true);
  },
  updateCreatePattern({ commit }, conditions) {
    commit('UPDATE_CREATE_PATTERN', conditions);
  },
  updateReplacePattern({ commit }, replacePattern) {
    commit('UPDATE_REPLACE_PATTERN', replacePattern);
  },
  updateParameters({ commit }, parameters) {
    commit('UPDATE_PARAMETERS', parameters);
  }
}

const getters = {
  getDialogState: state => state.showDialog,
  getRule: state => state.rule,
  getMeta: state => state.meta,
  getReplacePatternType: state => state.replacePatternType,
  getCreatePatternConditions: state => state.rule?.create_pattern?.conditions || [],
  getReplacePattern: state => state.rule?.replace_pattern || { field: '', value: '', withFn: false },
  getParameters: state => state.rule?.parameters || []
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}