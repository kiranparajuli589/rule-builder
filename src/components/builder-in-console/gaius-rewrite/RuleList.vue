<template>
  <div class="rule-list">
    <div class="rule-list__toolbar">
      <a-button type="primary" ghost @click="$emit('create')">
        <a-icon type="plus-circle" />
        {{ $t('domain.CreateRule') }}
      </a-button>

      <div class="search-container">
        <a-input-search
          v-model="searchQuery"
          :placeholder="$t('Search')"
          :allow-clear="true"
          @search="applySearch"
        >
          <a-button slot="enterButton" icon="search" />
        </a-input-search>
      </div>
    </div>

    <div class="rule-list__card">
      <div class="table-container">
        <table class="rule-table">
          <thead>
          <tr>
            <th width="80">{{ $t('ruleBuilder.sn') }}</th>
            <th>{{ $t('ruleBuilder.RuleName') }}</th>
            <th width="200">{{ $t('domain.Action') }}</th>
            <th width="100">{{ $t('domain.Status') }}</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(rule, index) in filteredRules" :key="rule.id">
            <td>{{ index + 1 }}</td>
            <td>{{ rule.name }}</td>
            <td>
              <div class="action-buttons">
                <a-button type="primary" ghost size="small" @click="$emit('edit', rule)">
                  <a-icon type="edit" />
                  {{ $t('domain.Edit') }}
                </a-button>
                <a-button type="danger" ghost size="small" @click="$emit('delete', rule, configKey)">
                  <a-icon type="delete" />
                  {{ $t('Delete') }}
                </a-button>
              </div>
            </td>
            <td>
              <a-switch
                :checked="rule.enabled"
                @change="(checked) => $emit('toggle-status', rule, configKey, checked)"
              >
                <a-icon slot="checkedChildren" type="check" />
                <a-icon slot="unCheckedChildren" type="close" />
              </a-switch>
            </td>
          </tr>
          <tr v-if="filteredRules.length === 0">
            <td colspan="4" class="empty-message">
              {{ activeSearch ? $t('domain.NoSearchResults') : emptyText }}
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RuleList',
  props: {
    rules: {
      type: Array,
      default: () => []
    },
    configKey: {
      type: String,
      required: true
    },
    emptyText: {
      type: String,
      default: 'No Rules'
    }
  },
  data() {
    return {
      searchQuery: '',
      search: '',
    };
  },
  computed: {
    activeSearch() {
      return this.search !== '';
    },
    filteredRules() {
      if (!this.search) {
        return this.rules;
      }

      const searchTerm = this.search.toLowerCase();
      return this.rules.filter(rule => {
        return rule.name && rule.name.toLowerCase().includes(searchTerm);
      });
    }
  },
  methods: {
    applySearch() {
      this.search = this.searchQuery.trim();
    },
  }
};
</script>

<style lang="scss">
.rule-list {
  $colorBg: #fff;
  $colorText: #262626;
  $colorTextLight: #8c8c8c;
  $boxShadow: 0 2px 8px rgba(0, 0, 0, 0.09);

  &__toolbar {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1rem;
    gap: 1rem;
    flex-wrap: wrap;

    .search-container {
      flex: 1;
      max-width: 300px;
      position: relative;

      .ant-input-search {
        width: 100%;
        display: flex;
      }

      .clear-button {
        margin-left: 4px;
        border: none;
        background: transparent;

        &:hover {
          color: #1890ff;
        }
      }
    }
  }

  &__card {
    border-radius: 4px;
    overflow: hidden;
    background: $colorBg;
    width: 100%;
    border: 1px solid var(--border-color);
  }

  .table-container {
    width: 100%;
    max-height: 300px;
    overflow-y: auto;
    overflow-x: auto;

    scrollbar-width: thin;

    @media screen and (min-width: 600px) and (max-width: 1400px) {
      max-width: 512px;
    }

    @media screen and (max-width: 768px) {
      max-width: 100%;
    }
  }

  .rule-table {
    width: 100%;
    min-width: 600px;
    border-collapse: collapse;
    font-size: 14px;
    table-layout: fixed;

    th, td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }

    th {
      background-color: #f8f9fa;
      font-weight: 600;
      color: $colorText;
      position: sticky;
      top: 0;
      z-index: 1;
      box-shadow: 0 1px 0 0 var(--border-color);
    }

    tr:hover {
      background-color: #f5f5f5;
    }

    .empty-message {
      text-align: center;
      padding: 24px;
      color: $colorTextLight;
      font-style: italic;
    }
  }

  .action-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
}
</style>