<script setup lang="ts">
import { useFluent } from "fluent-vue";
import { computed } from "vue";

import { useRuleBuilderStore } from "@/domain/store";

import CreatePatternBuilder from "./CreatePatternBuilder.vue";
import RulePreview from "./RulePreview.vue";

const emit = defineEmits<{
	submit: [rule: any];
}>();

const { $t: translate } = useFluent();
const store = useRuleBuilderStore();

const hasNameError = computed(() =>
	store.validationErrors.some((e) => e.field === "name")
);

const nameError = computed(() => {
	const error = store.validationErrors.find((e) => e.field === "name");
	return error?.message || "";
});

// Computed property to handle the create_pattern.conditions binding
const createPatternConditions = computed({
	get() {
		return store.rule?.create_pattern?.conditions || [];
	},
	set(value) {
		if (store.rule) {
			if (!store.rule.create_pattern) {
				store.rule.create_pattern = { conditions: [] };
			}
			store.rule.create_pattern.conditions = value;
		}
	},
});

const handleSubmit = () => {
	const rule = store.validateAndGetRule();
	if (rule) {
		emit("submit", rule);
		store.closeDialog();
	}
};

const handleReset = () => {
	if (confirm(translate("rule-builder-confirm-reset"))) {
		store.resetRule();
	}
};
</script>

<template>
	<Dialog v-model:open="store.isOpen">
		<DialogContent class="max-w-5xl">
			<DialogHeader>
				<DialogTitle>{{ $t("rule-builder-title") }}</DialogTitle>
				<DialogDescription>
					{{ $t("rule-builder-description") }}
				</DialogDescription>
			</DialogHeader>

			<form
				class="space-y-6 px-6 py-2 max-h-[80vh] overflow-y-auto"
				@submit.prevent="handleSubmit"
			>
				<!-- Rule name input -->
				<div v-if="store.rule" class="space-y-2">
					<Label class="required" for="rule-name">
						{{ $t("rule-builder-rule-name") }}
					</Label>
					<Input
						v-model="store.rule.name"
						id="rule-name"
						:placeholder="$t('rule-builder-rule-name-placeholder')"
						:class="{ 'border-destructive': hasNameError }"
					/>
					<p v-if="hasNameError" class="text-sm text-destructive">
						{{ nameError }}
					</p>
				</div>

				<!-- Conditions section -->
				<div class="space-y-4">
					<div>
						<h3 class="text-lg font-semibold">
							{{ $t("rule-builder-conditions-title") }}
						</h3>
						<p class="text-sm text-muted-foreground">
							{{ $t("rule-builder-conditions-description") }}
						</p>
					</div>

					<CreatePatternBuilder
						v-if="store.rule"
						v-model:conditions="createPatternConditions"
					/>
				</div>

				<!-- Extra inputs slot -->
				<slot name="extra-inputs" :extra-inputs="store.extraInputs" />

				<!-- Rule preview -->
				<RulePreview />

				<!-- Form actions -->
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						@click="handleReset"
					>
						{{ $t("reset") }}
					</Button>
					<Button type="submit" :disabled="!store.isValid">
						{{ $t("save") }}
					</Button>
				</DialogFooter>
			</form>
		</DialogContent>
	</Dialog>
</template>
