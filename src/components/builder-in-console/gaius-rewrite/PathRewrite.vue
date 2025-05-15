<template>
  <div class="path_rewrite">
    <header class="path_rewrite__toolbar">
      <a-button type="primary" ghost @click="handleCreateRuleClick()">
        <a-icon type="plus-circle"/>
        {{ $t('domain.CreateRule') }}
      </a-button>
      <a-input-search
        class="path_rewrite__search"
        v-model="search"
        :placeholder="$t('Search')"
        :allow-clear="false"
        @press-enter="handleSearch()"
        @search="handleSearch()"
      >
        <a-button slot="enterButton" icon="search"/>
      </a-input-search>
    </header>
    
    <a-card class="path_rewrite__tw">
      <table class="path_rewrite__table" aria-label="Rewrite Rules">
        <thead>
          <tr>
            <th
              v-for="column in tableColumns"
              :key="column.key"
              :id="column.key"
              :style="{ width: column.width }"
            >
              {{ column.title }}
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-if="filteredRules.length">
            <tr v-for="(rule, index) in filteredRules" :key="rule.name">
              <td>{{ index + 1 }}</td>
              <td>{{ rule.name }}</td>
              <td>
                <div class="w-100 d-flex align-items-center gap-2">
                  <a-button type="primary" ghost size="small" @click="handleEditRuleClick(rule)">
                    <a-icon type="edit"/>
                    {{ $t('domain.Edit') }}
                  </a-button>
                  <a-button type="danger" ghost size="small" @click="handleDeleteRuleClick(rule)">
                    <a-icon type="delete"/>
                    {{ $t('Delete') }}
                  </a-button>
                </div>
              </td>
              <td>
                <a-switch :checked="rule.enabled" @change="handleRuleStatusToggle" class="mr-2">
                  <a-icon slot="checkedChildren" type="check"/>
                  <a-icon slot="unCheckedChildren" type="close"/>
                </a-switch>
              </td>
            </tr>
          </template>
          <template v-else>
            <tr>
              <td colspan="4">
                <div class="path_rewrite__empty">
                  <simple-empty>
                    <span slot="description">{{meta.emptyText}}</span>
                  </simple-empty>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </a-card>
  </div>
</template>

<script>
import { mapActions } from "vuex";

export default  {
  name: 'PathRewrite',
  props: {
    config: {
      type: Array,
      default: () => ([])
    },
    meta: {
      type: Object,
      default: () => {},
    }
  },
  components: {
    SimpleEmpty: () => import("@/views/domain/SimpleEmpty")
  },
  data() {
    return {
      search: '',
      // rules: [],
    }
  },
  created() {
    if (this.config && this.config.length > 0) {
      // this.rules = this.config;
    }
  },
  computed: {
    rules() {
      return this.config || [];
    },
    filteredRules() {
      if (this.search) {
        return this.rules.filter(rule => {
          return rule.name.toLowerCase().includes(this.search.toLowerCase());
        });
      }
      return this.rules;
    },
    tableColumns() {
      return [
        {
          title: this.$t('ruleBuilder.sn'),
          dataIndex: 'sn',
          key: 'sn',
          width: 'fit-content',
        },
        {
          title: this.$t('domain.RuleName'),
          dataIndex: 'name',
          key: 'name',
          width: '100%',
        },
        {
          title: this.$t('domain.Action'),
          dataIndex: 'action',
          key: 'action',
          width: 'fit-content',
        },
        {
          title: this.$t('domain.Status'),
          dataIndex: 'status',
          key: 'status',
          width: 'fit-content',
        },
      ]
    }
  },
  methods: {
    ...mapActions({
      setRule: 'ruleBuilder/setRule',
      openRuleBuilder: 'ruleBuilder/openDialog',
      setDialogState: 'ruleBuilder/setDialogState',
    }),
    handleSearch() {
      // Implement search logic here
    },
    handleRuleStatusToggle(checked, rule) {
      rule.enabled = checked;
      this.$emit('update:config', this.config);
    },
    handleCreateRuleClick() {
      console.log(this.meta)
      this.openRuleBuilder({
        rule: {},
        meta: this.meta,
      })
    },
    handleEditRuleClick(rule) {
      this.openRuleBuilder({
        rule: {
          name: rule.name,
          create_pattern: {
            conditions: []
          },
          replace_pattern: {
            field: 'req.uri.path',
            value: '',
            fn: "concat",
            fnArg: "test",
            withFn: true,
          }
        },
        meta: this.meta,
      })
    },
    handleDeleteRuleClick(rule) {
      // Remove the rule from the config
      const updatedRules = this.rules.filter(r => r !== rule);
      this.$emit('update:config', updatedRules);
    }
  }
}
</script>