<script>
export default {
    name: 'PatternBuilder',
    props: {
        rule: {
            type: Object,
            required: true
        },
        join: {
            type: Object || undefined,
            required: false
        },
        conditions: {
            type: Array,
            default: () => []
        },
        noLabels: {
            type: Boolean,
            default: false
        },
    },
    data() {
        return {
            localRule: this.rule,
            localJoin: this.join || {
                operator: '',
            },
            localConditions: this.conditions,
        };
    },
    methods: {
        updateRule() {
            this.$emit('update', this.localRule);
        },
        updateJoin() {
            this.$emit('update:join', this.localJoin);
        },
        updateConditions() {
            this.$emit('update:conditions', this.localConditions);
        },
        assignJoin(value) {
            this.localJoin.operator = value;
            this.localConditions.push({
                field: '',
                operator: '',
                value: '',
            });
        },
    },
    watch: {
        localRule: {
            handler() {
                this.updateRule();
            },
            deep: true,
        },
        localJoin: {
            handler() {
                this.updateJoin();
            },
            deep: true,
        },
        localConditions: {
            handler() {
                this.updateConditions();
            },
            deep: true,
        },
    },
}
</script>
<template>
    <div class="row">
    <div class="form-group">
    <label for="selectId">
      <span v-if="!noLabels">Select Label</span>
      <select id="selectId" v-model="localRule.field">
        <option value="" disabled>Select</option>
        <option value="req.path.uri">Path URI</option>
        <option value="req.method">METHOD</option>
        <option value="req.agent">AGENT</option>
      </select>
    </label>
   </div>
   <div class="form-group">
    <label for="operators">
      <span v-if="!noLabels">Operators</span>
      <select id="operators" v-model="localRule.operator">
        <option value="" disabled>Select</option>
        <option value="equals">Equals</option>
        <option value="not-equals">Not Equals</option>
        <option value="greater-than">Greater Than</option>
        <option value="less-than">Less Than</option>
        <option value="contains">Contains</option>
        <option value="not-contains">Not Contains</option>
        <option value="starts-with">Starts With</option>
        <option value="ends-with">Ends With</option>
        <option value="is-empty">Is Empty</option>
        <option value="is-not-empty">Is Not Empty</option>
      </select>
    </label>
   </div>
    <div class="form-group">
      <label for="inputId">
        <span v-if="!noLabels">Input Label</span>
        <input type="text" id="inputId" v-model="localRule.value"  />
      </label>
    </div>
    <div class="form-group">
      <label for="join-op">
        <span v-if="!noLabels">Join Operator</span>
        <select
          id="join-op" :value="localJoin.operator"
          @change="assignJoin($event.target.value)"
        >
          <option value="" disabled>Select Join</option>
          <option value="AND">AND</option>
          <option value="OR">OR</option>
        </select>
      </label>
   </div>
  </div>
</template>
