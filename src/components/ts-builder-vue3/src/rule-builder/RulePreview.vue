<script setup lang="ts">
import { useFluent } from "fluent-vue";
import { Code2, AlertTriangle } from "lucide-vue-next";
import { storeToRefs } from "pinia";
import { ref, computed } from "vue";

import { Button } from "@/components/ui/button";
import {
	RuleService,
	RuleValidationService,
	RuleDTO,
} from "@/domain/components/rule-builder";
import { useRuleBuilderStore } from "@/domain/store";

interface Props {
	showJsonToggle?: boolean;
}

withDefaults(defineProps<Props>(), {
	showJsonToggle: true,
});

const { $t: translate } = useFluent();
const store = useRuleBuilderStore();

const { rule } = storeToRefs(store);

const showJson = ref(false);

const rulePreview = computed(() => store.readableRule);

const ruleJson = computed(() => {
	if (!rule) return "{}";

	const cleanRule = RuleService.cleanRuleForExport(rule as never as RuleDTO);
	return JSON.stringify(cleanRule, null, 2);
});

const hasStructureWarning = computed(() => {
	const conditions = store?.rule?.create_pattern?.conditions ?? [];
	if (!store.rule || !conditions.length) return false;

	return (
		RuleValidationService.requiresBrackets(conditions) ||
		RuleValidationService.hasCircularDependency(conditions)
	);
});

const structureWarning = computed(() => {
	const conditions = store?.rule?.create_pattern?.conditions ?? [];
	if (!store.rule || conditions) return "";

	if (RuleValidationService.requiresBrackets(conditions)) {
		return translate("rule-builder-warnings-mixed-operators-need-brackets");
	}

	if (RuleValidationService.hasCircularDependency(conditions)) {
		return translate("rule-builder-warnings-circular-dependency");
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
			<div v-if="!showJson" class="space-y-2">
				<code class="text-sm block">{{ rulePreview }}</code>

				<div
					v-if="hasStructureWarning"
					class="flex items-start gap-2 text-warning text-xs mt-2"
				>
					<AlertTriangle class="w-3 h-3 mt-0.5" />
					<span>{{ structureWarning }}</span>
				</div>
			</div>

			<pre v-else class="text-sm overflow-auto max-h-64">
				JSON: {{ ruleJson }}
			</pre
			>
		</div>
	</div>
</template>
