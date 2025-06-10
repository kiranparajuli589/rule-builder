<template>
  <pre><code>
    {{ JSON.stringify(store.rule ?? {}, null, 2) }}
  </code></pre>

  <RuleBuilder />
</template>
<script setup lang="ts">
import RuleBuilder from "@/domain/components/rule-builder";
const store = useRuleBuilderStore();
</script>