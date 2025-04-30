<template>
    <div class="rule-group">
      <div class="bracket left-bracket">[</div>
  
      <div class="rule-rows">
        <RuleRow
          v-for="(rule, index) in group.rules"
          :key="index"
          :rule="rule"
          @update="updateRule(index, $event)"
        />
        <JoinSelector v-if="index < group.rules.length - 1" />
      </div>
  
      <div class="bracket right-bracket">]</div>
    </div>
  </template>