<!-- src/components/gaius-rewrite/RuleList.vue -->
<template>
  <div class="rule-list">
    <div class="rule-list__toolbar">
      <a-button type="primary" ghost @click="$emit('create')">
        <a-icon type="plus-circle" />
        {{ $t('domain.CreateRule') }}
      </a-button>

      <a-input-search
        v-model="search"
        :placeholder="$t('Search')"
        :allow-clear="true"
        @change="handleSearch"
        @search="handleSearch"
      >
        <a-button slot="enterButton" icon="search" />
      </a-input-search>
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
                @change="$emit('toggle-status', rule, configKey)"
              >
                <a-icon slot="checkedChildren" type="check" />
                <a-icon slot="unCheckedChildren" type="close" />
              </a-switch>
            </td>
          </tr>
          <tr v-if="filteredRules.length === 0">
            <td colspan="4" class="empty-message">
              {{ emptyText }}
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
      search: '',
    };
  },
  computed: {
    filteredRules() {
      if (!this.search) {
        return this.rules;
      }

      const searchTerm = this.search.toLowerCase();
      return this.rules.filter(rule => {
        return rule.name.toLowerCase().includes(searchTerm);
      });
    }
  },
  methods: {
    handleSearch() {
      // Method intentionally left empty - the filtered rules are computed
    }
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

    .ant-input-search {
      flex: 1;
      max-width: 300px;
      position: relative;
      display: flex;
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
    max-height: 300px; // Set max height to 300px
    overflow-y: auto; // Enable vertical scrolling
    overflow-x: auto; // Enable horizontal scrolling
    
    scrollbar-width: thin;
  }

  .rule-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
    table-layout: fixed; // Helps with column widths

    th, td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }

    th {
      background-color: #f8f9fa;
      font-weight: 600;
      color: $colorText;
      position: sticky; // Make header sticky
      top: 0; // Stick to the top
      z-index: 1; // Ensure header stays above other content
      box-shadow: 0 1px 0 0 var(--border-color); // Add bottom border to header
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
    flex-wrap: wrap; // Allow buttons to wrap if needed
  }
}

@media (max-width: 768px) {
  .rule-list {
    &__toolbar {
      flex-direction: column;

      .search-container {
        max-width: 100%;
      }
    }

    &__card {
      max-width: 100%; // Allow full width on mobile
    }

    .action-buttons {
      flex-direction: column;
      gap: 4px;
    }

    .rule-table {
      th, td {
        padding: 8px 12px;
      }
    }
  }
}
</style>