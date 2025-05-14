<template>
  <div>
    <div v-if="showTips" class="tips-card">
      <div class="tips-header">
        <h3>Rule Builder Tips</h3>
        <div class="tips-controls">
          <label class="hide-tips-label">
            <input type="checkbox" v-model="hideTips" @change="toggleTips">
            <span>Hide tips</span>
          </label>
          <button class="tips-close-btn" @click="toggleTips">×</button>
        </div>
      </div>
      <div class="tips-content">
        <div class="tip-section">
          <h4>How to build rules</h4>
          <ul>
            <li>Start with a simple condition (field, operator, value)</li>
            <li>Add a second condition and join them with AND/OR</li>
            <li>Use "Bracket These Conditions" to group related conditions</li>
            <li>Add groups to create complex logic (maximum 2 conditions per level)</li>
          </ul>
        </div>
        <div class="tip-section">
          <h4>Rule Structure</h4>
          <ul>
            <li><strong>Create Pattern:</strong> Defines when the rule should trigger</li>
            <li><strong>Replace Pattern:</strong> Defines what action to take when triggered</li>
            <li>Nested conditions are evaluated from innermost to outermost</li>
          </ul>
        </div>
        <div class="tip-section">
          <h4>Operators</h4>
          <ul>
            <li><code>==</code>: Equal to</li>
            <li><code>!=</code>: Not equal to</li>
            <li><code>~~</code>: Contains</li>
            <li><code>starts_with</code>: String starts with</li>
            <li><code>ends_with</code>: String ends with</li>
          </ul>
        </div>
      </div>
      <div class="tips-footer">
        <a href="https://www.lua.org/manual/5.3/manual.html#3.4.4" target="_blank" class="tips-link">
          <span>Lua Documentation for Conditions</span>
          <span class="external-icon">↗</span>
        </a>
        <a href="#" class="tips-link">
          <span>Rule Building Tutorial</span>
          <span class="external-icon">↗</span>
        </a>
      </div>
    </div>

    <div v-else class="tips-badge" @click="toggleTips">
      <span class="tips-badge-icon">💡</span>
      <span class="tips-badge-text">Show Tips</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TipsCard',
  data() {
    return {
      showTips: true,
      hideTips: false
    };
  },
  created() {
    // Check localStorage to see if the user has previously hidden the tips
    const hideTips = localStorage.getItem('ruleTipsHidden');
    if (hideTips === 'true') {
      this.showTips = false;
      this.hideTips = true;
    }
  },
  methods: {
    toggleTips() {
      this.showTips = !this.showTips;
      this.hideTips = !this.showTips;

      // Save preference to localStorage
      localStorage.setItem('ruleTipsHidden', this.hideTips);
    }
  }
}
</script>

<style lang="scss" scoped>
// Variables
$color-primary: #4299e1;
$color-secondary: #805ad5;
$color-border: #e2e8f0;
$color-text: #4a5568;
$color-text-light: #718096;
$color-bg: #fff;
$color-bg-light: #f7fafc;

.tips-card {
  background-color: $color-bg;
  border: 1px solid $color-border;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 25px;
  transition: all 0.2s ease;
  overflow: hidden;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
}

.tips-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: $color-bg-light;
  border-bottom: 1px solid $color-border;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: $color-text;
  }
}

.tips-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hide-tips-label {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  font-size: 14px;
  color: $color-text-light;

  input {
    margin: 0;
  }
}

.tips-close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: $color-text-light;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
    color: $color-text;
  }
}

.tips-content {
  padding: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}

.tip-section {
  flex: 1;
  min-width: 200px;

  h4 {
    margin: 0 0 8px 0;
    font-size: 14px;
    font-weight: 600;
    color: $color-text;
  }

  ul {
    margin: 0;
    padding-left: 18px;

    li {
      margin-bottom: 4px;
      font-size: 14px;
      color: $color-text;
      line-height: 1.4;
    }
  }

  code {
    background-color: $color-bg-light;
    padding: 2px 4px;
    border-radius: 3px;
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    font-size: 13px;
  }
}

.tips-footer {
  padding: 12px 16px;
  background-color: $color-bg-light;
  border-top: 1px solid $color-border;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.tips-link {
  display: flex;
  align-items: center;
  gap: 5px;
  color: $color-primary;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.2s ease;

  &:hover {
    color: darken($color-primary, 10%);
    text-decoration: underline;
  }

  .external-icon {
    font-size: 12px;
  }
}

.tips-badge {
  display: inline-flex;
  align-items: center;
  background-color: $color-primary;
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(66, 153, 225, 0.3);
  margin-bottom: 15px;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(66, 153, 225, 0.4);
  }

  .tips-badge-icon {
    margin-right: 5px;
  }
}
</style>