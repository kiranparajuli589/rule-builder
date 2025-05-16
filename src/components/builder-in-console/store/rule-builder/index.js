import Vue from 'vue'
import Vuex from 'vuex'
import security from './modules/security'
import transaction from './modules/transaction'
import websocket from './modules/websocket'
import ruleBuilder from './modules/rule-builder'
import {i18n, selectedLocale} from '@/plugins/i18n'
import Cookies from 'js-cookie'
import {ADJUSTMENT_TYPE, TIME_ADJUSTMENTS} from '@/views/domain/charts/TimeRangePicker';
import {
  subMinutes,
} from 'date-fns';
import axios from '@/plugins/axios';
import {
  FETCH_COIN_SUPPORT, FETCH_COIN_SUPPORT_IF_EMPTY,
  FETCH_SUBSCRIPTIONS, SET_SELECTED_SUBSCRIPTION,
} from '@/store/types';
import {subscriptionPlan} from '@/utilities/api';

Vue.use(Vuex)

const SUBSCRIPTION_CACHE_KEY = 'subscriptions';

let _subscriptions = [];
if (window.localStorage && localStorage[SUBSCRIPTION_CACHE_KEY]) {
  _subscriptions = JSON.parse(localStorage[SUBSCRIPTION_CACHE_KEY]);
}

let _selectedSubscription = null;
if (_subscriptions.length) {
  _selectedSubscription = pickDefaultSelectedSubscription(_subscriptions);
}

const state = {
  sidebarShow: 'responsive',
  sidebarMinimize: false,
  locale: selectedLocale,
  auth: {
    authenticated: false
  },
  balance: 0,
  timeRangePicker: {
    range: {
      start: subMinutes(new Date(), 15),
      end: new Date(),
    },
    adjustment: [ADJUSTMENT_TYPE.RELATIVE, TIME_ADJUSTMENTS.MIN_15]
  },
  coinSupports: [],
  subscriptions: _subscriptions,
  selectedSubscription: _selectedSubscription,
}

const mutations = {
  toggleSidebarDesktop(state) {
    const sidebarOpened = [true, 'responsive'].includes(state.sidebarShow)
    state.sidebarShow = sidebarOpened ? false : 'responsive'
  },
  toggleSidebarMobile(state) {
    const sidebarClosed = [false, 'responsive'].includes(state.sidebarShow)
    state.sidebarShow = sidebarClosed ? true : 'responsive'
  },
  set(state, [variable, value]) {
    state[variable] = value
  },
  setLocale(state, newLocale) {
    state.locale = newLocale
    i18n.locale = state.locale;
    Cookies.set('locale', state.locale)
  },
  setTimeRange(state, newTimeRange) {
    state.timeRangePicker.range = Object.freeze(newTimeRange);
  },
  resetTimeRangePicker(state) {
    state.timeRangePicker.range = {
      start: subMinutes(new Date(), 15),
      end: new Date(),
    };
    state.timeRangePicker.adjustment = [ADJUSTMENT_TYPE.RELATIVE, TIME_ADJUSTMENTS.MIN_15];
  },
  setCoinSupport(state, coinSupport) {
    state.coinSupports = coinSupport;
  },
  setSubscriptions(state, subscriptions) {
    state.subscriptions = subscriptions;
  },
  [SET_SELECTED_SUBSCRIPTION](state, selectedSubscription) {
    state.selectedSubscription = selectedSubscription;
  },
}

function pickDefaultSelectedSubscription(subscriptions) {
  if (!subscriptions.length)
    return null;

  return subscriptions[0];
}

const actions = {
  async initStore(context) {
    await context.dispatch(FETCH_SUBSCRIPTIONS);

    if (!context.state.subscriptions.length) {
      return true;
    }

    window.localStorage && localStorage.setItem(SUBSCRIPTION_CACHE_KEY, JSON.stringify(context.state.subscriptions));

    // select the first subscription as the default selectedSubscription
    context.commit(SET_SELECTED_SUBSCRIPTION, pickDefaultSelectedSubscription(context.state.subscriptions));
  },
  changeLocale({commit}, newLocale) {
    //i18n.locale = newLocale
    commit('setLocale', newLocale)
  },
  [FETCH_COIN_SUPPORT](context) {
    axios.get('plan/coin-support/').then(response => {
      context.commit('setCoinSupport', response.data);
    }).catch(error => {
      console.log(error)
    });
  },
  [FETCH_COIN_SUPPORT_IF_EMPTY](context) {
    if (!state.coinSupports.length) {
      context.dispatch(FETCH_COIN_SUPPORT);
    }
  },
  [FETCH_SUBSCRIPTIONS](context) {
    return subscriptionPlan().then(response => {
      context.commit('setSubscriptions', response.data);
    }).catch(error => {
      console.log(error)
    });
  },
}


const getters = {
  authInfo: state => {
    return state.security.auth.tokenParsed;
  },
  language(state) {
    return state.locale
  },
  cname(state) {
    if (!state.selectedSubscription)
      return null;

    return state.selectedSubscription.cname + "." + state.selectedSubscription.czone;
  }
}

const modules = {
  security,
  transaction,
  websocket,
  ruleBuilder,
}

export default new Vuex.Store({
  state: state,
  getters: getters,
  mutations: mutations,
  actions: actions,
  modules: modules
})
