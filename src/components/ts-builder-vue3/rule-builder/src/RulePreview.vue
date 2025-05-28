<script setup lang="ts">
import { useFluent } from "fluent-vue";
import { Code2, AlertTriangle } from "lucide-vue-next";
import { ref, computed } from "vue";

import { Button } from "@/components/ui/button";
import { RuleService } from "@/domain/components/rule-builder";
import { useRuleBuilderStore } from "@/domain/store";

interface Props {
	showJsonToggle?: boolean;
}

withDefaults(defineProps<Props>(), {
	showJsonToggle: true,
});

const { $t } = useFluent();
const store = useRuleBuilderStore();

const showJson = ref(false);

const hasValidRule = computed(
	() =>
		store.rule && store.rule.conditions && store.rule.conditions.length > 0
);

const rulePreview = computed(() => {
	if (!hasValidRule.value) return "";
	return RuleService.formatReadableRule(store.rule?.conditions);
});

const ruleJson = computed(() => {
	if (!store.rule) return "{}";

	const cleanRule = RuleService.cleanRuleForExport(store.rule);
	return JSON.stringify(cleanRule, null, 2);
});

const hasStructureWarning = computed(() => {
	if (!store.rule || !store.rule.conditions) return false;

	return (
		RuleService.requiresBrackets(store.rule.conditions) ||
		RuleService.hasCircularDependency(store.rule.conditions)
	);
});

const structureWarning = computed(() => {
	if (!store.rule || !store.rule.conditions) return "";

	if (RuleService.requiresBrackets(store.rule.conditions)) {
		return $t("rule-builder.warnings.mixed-operators-need-brackets");
	}

	if (RuleService.hasCircularDependency(store.rule.conditions)) {
		return $t("rule-builder.warnings.circular-dependency");
	}

	return "";
});
</script>

<template>
	<div class="space-y-2">
		<div class="flex items-center justify-between">
			<h3 class="text-lg font-semibold">
				{{ $t("rule-builder.preview-title") }}
			</h3>
			<div class="flex gap-2">
				<Button
					v-if="showJsonToggle"
					variant="ghost"
					size="sm"
					@click="showJson = !showJson"
				>
					<Code2 class="w-4 h-4 mr-1" />
					{{
						showJson
							? $t("rule-builder.preview.show-expression")
							: $t("rule-builder.preview.show-json")
					}}
				</Button>
			</div>
		</div>

		<div class="p-4 bg-muted rounded-lg">
			<div v-if="!hasValidRule" class="text-muted-foreground text-sm">
				{{ $t("rule-builder.preview.empty") }}
			</div>

			<div v-else-if="!showJson" class="space-y-2">
				<code class="text-sm block">{{ rulePreview }}</code>

				<div
					v-if="hasStructureWarning"
					class="flex items-start gap-2 text-warning text-xs mt-2"
				>
					<AlertTriangle class="w-3 h-3 mt-0.5" />
					<span>{{ structureWarning }}</span>
				</div>
			</div>

			<pre v-else class="text-sm overflow-auto max-h-64">{{
				ruleJson
			}}</pre>
		</div>
	</div>
</template>
