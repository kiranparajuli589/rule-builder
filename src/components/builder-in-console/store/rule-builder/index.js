import { SET_RULE_BUILDER_DIALOG_STATE, SET_RULE_BUILDER_META, SET_RULE_FOR_BUILDER } from "@/store/types";

const state = {
  showDialog: false,
  rule: undefined,
  meta: undefined,
}
const mutations = {
  [SET_RULE_FOR_BUILDER](state, rule) {
    state.rule = rule
  },
  [SET_RULE_BUILDER_DIALOG_STATE](state, showDialog) {
    state.showDialog = showDialog
  },
  [SET_RULE_BUILDER_META](state, meta) {
    state.meta = meta
  }
}

const actions = {
  setRule({ commit }, rule = undefined) {
    commit(SET_RULE_FOR_BUILDER, rule)
  },
  setDialogState({ commit }, showDialog) {
    commit(SET_RULE_BUILDER_DIALOG_STATE, showDialog)
  },
  openDialog({ commit }, { rule, meta } = {}) {
    commit(SET_RULE_FOR_BUILDER, rule)
    commit(SET_RULE_BUILDER_META, meta)
    commit(SET_RULE_BUILDER_DIALOG_STATE, true)
  },
}

const getters = {
  getDialogState(state) {
    return state.showDialog
  },
  getRule(state) {
    return state.rule
  },
  getMeta(state) {
    return state.meta
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
}