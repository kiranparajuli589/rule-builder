<template>
  <select v-bind="$attrs" v-on="$listeners" class="join-select">
    <option value="&&">AND</option>
    <option value="||">OR</option>
  </select>
</template>
<script>
import RuleService from "@//services/RuleService.js";

export default {
  computed: {
    RuleService() {
      return RuleService
    }
  }
}
</script>