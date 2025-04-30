<script>
export default {
  name: 'App',
  components: {
    PatternBuilder: () => import('../components/rule-builder/PatternBuilder.vue'),
    JoinSelector: () => import('../components/rule-builder/JoinSelector.vue'),
  },
  data: () => ({
    rules: [
      {
        conditions: [
          {
            field: 'req.path.uri',
            operator: 'equals',
            value: '/api/v1/users',
          },
        ],
        joins: [
          {
            operator: '',
            brackets: 0,
          },
        ]
      },
    ],
  }),
}
</script>

<template>
  <div class="builder">
    <div
      v-for="(rule, index) in rules"
      :key="index"
      class="rule-block"
    >

      <template v-for="(_, index) in rule.conditions.length">
        <PatternBuilder
          :rule.sync="rule.conditions[index]"
          :join.sync="rule.joins[index]"
          :conditions.sync="rule.conditions"
          :noLabels="(index) > 0"
        />

        <!-- <pre><code>
          {{ JSON.stringify({
            index,
            existJoin: rule.joins[index],
          }, null, 2) }}
        </code></pre> -->

        <JoinSelector
          v-if="rule.joins[index]?.operator"
          :join.sync="rule.joins[index]"
          :key="index"
        />

      </template>

    </div>

    <pre><code>
    {{ JSON.stringify(rules, null, 2) }}
  </code></pre>
  </div>
</template>
<style lang="scss">
.builder {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.form-group {
  display: flex;
  flex-direction: column;

  label {
    display: flex;
    flex-direction: column;
    font-weight: bold;
  }

  select,
  input {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    width: 200px;
  }
}
.row {
  display: flex;
  justify-content: center;
  gap: 1rem;
}
.rule-block {
  display: flex;
  flex-direction: column;
}

</style>
