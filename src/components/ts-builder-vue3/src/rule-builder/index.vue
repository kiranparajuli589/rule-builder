<script setup lang="ts">
import { useFluent } from "fluent-vue";
import { AlertCircle } from "lucide-vue-next";
import { computed } from "vue";

import { useRuleBuilderStore } from "@/domain/store";

import CreatePatternBuilder from "./CreatePatternBuilder.vue";
import RulePreview from "./RulePreview.vue";

const emit = defineEmits<{
	submit: [rule: any];
}>();

const { $t } = useFluent();
const store = useRuleBuilderStore();

const hasNameError = computed(() =>
	store.validationErrors.some((e) => e.field === "name")
);

const nameError = computed(() => {
	const error = store.validationErrors.find((e) => e.field === "name");
	return error?.message || "";
});

const handleSubmit = () => {
	const rule = store.validateAndGetRule();
	if (rule) {
		emit("submit", rule);
		store.closeDialog();
	}
};

const handleReset = () => {
	if (confirm($t("rule-builder.confirm-reset"))) {
		store.resetRule();
	}
};
</script>

<template>
	<Dialog v-model:open="store.isOpen">
		<DialogContent class="max-w-5xl">
			<DialogHeader>
				<DialogTitle>{{ $t("rule-builder.title") }}</DialogTitle>
				<DialogDescription>
					{{ $t("rule-builder.description") }}
				</DialogDescription>
			</DialogHeader>

			<form class="space-y-6" @submit.prevent="handleSubmit">
				<!-- Global validation errors -->
				<Alert v-if="store.hasErrors" variant="destructive">
					<AlertCircle class="h-4 w-4" />
					<AlertTitle>{{
						$t("rule-builder.validation.errors-title")
					}}</AlertTitle>
					<AlertDescription>
						<ul class="list-disc pl-4 space-y-1">
							<li
								v-for="error in store.validationErrors"
								:key="error.field"
							>
								{{ error.message }}
							</li>
						</ul>
					</AlertDescription>
				</Alert>

				<!-- Rule name input -->
				<div v-if="store.rule" class="space-y-2">
					<Label class="required" for="rule-name">
						{{ $t("rule-builder.fields.rule-name") }}
					</Label>
					<Input
						v-model="store.rule.name"
						id="rule-name"
						:placeholder="
							$t('rule-builder.fields.rule-name-placeholder')
						"
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
							{{ $t("rule-builder.conditions-title") }}
						</h3>
						<p class="text-sm text-muted-foreground">
							{{ $t("rule-builder.conditions-description") }}
						</p>
					</div>

					<CreatePatternBuilder
						v-if="store.rule"
						v-model:conditions="store.rule.conditions"
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
						{{ $t("rule-builder.actions.reset") }}
					</Button>
					<Button type="submit" :disabled="!store.isValid">
						{{ $t("rule-builder.actions.save") }}
					</Button>
				</DialogFooter>
			</form>
		</DialogContent>
	</Dialog>
</template>
