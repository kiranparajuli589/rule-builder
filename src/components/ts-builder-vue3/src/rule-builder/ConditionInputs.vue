<template>
	<div class="flex gap-2 items-start">
		<!-- Field selector -->
		<div class="flex-1 space-y-2">
			<Label v-if="showLabels" :for="`field-${condition.id}`">
				{{ $t("rule-builder-labels-field") }}
			</Label>
			<Select
				:id="`field-${condition.id}`"
				:model-value="condition.field"
				@update:model-value="updateField"
			>
				<SelectTrigger>
					<SelectValue
						:placeholder="
							$t('rule-builder-placeholders-select-field')
						"
					/>
				</SelectTrigger>
				<SelectContent>
					<SelectItem
						v-for="field in fields"
						:key="field.value"
						:value="field.value"
					>
						<div>
							<div class="font-medium">{{ field.label }}</div>
							<div class="text-xs text-muted-foreground">
								{{ field.description }}
							</div>
						</div>
					</SelectItem>
				</SelectContent>
			</Select>
		</div>

		<!-- Operator selector -->
		<div class="flex-1 space-y-2">
			<Label v-if="showLabels" :for="`operator-${condition.id}`">
				{{ $t("rule-builder-labels-operator") }}
			</Label>
			<Select
				:id="`operator-${condition.id}`"
				:model-value="condition.operator"
				@update:model-value="updateOperator"
			>
				<SelectTrigger>
					<SelectValue
						:placeholder="
							$t('rule-builder-placeholders-select-operator')
						"
					/>
				</SelectTrigger>
				<SelectContent>
					<SelectItem
						v-for="op in operators"
						:key="op.value"
						:value="op.value"
					>
						{{ op.label }}
					</SelectItem>
				</SelectContent>
			</Select>
		</div>

		<!-- Value input -->
		<div class="flex-1 space-y-2">
			<Label v-if="showLabels" :for="`value-${condition.id}`">
				{{ $t("rule-builder-labels-value") }}
			</Label>

			<!-- Select input for fields with options -->
			<Select
				v-if="fieldMeta?.type === 'select'"
				:id="`value-${condition.id}`"
				:model-value="condition.value"
				@update:model-value="updateValue"
			>
				<SelectTrigger :class="{ 'border-destructive': hasError }">
					<SelectValue :placeholder="fieldMeta.placeholder" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem
						v-for="option in fieldMeta.options"
						:key="option.value"
						:value="option.value"
					>
						{{ option.label }}
					</SelectItem>
				</SelectContent>
			</Select>

			<!-- Number input -->
			<Input
				v-else-if="fieldMeta?.type === 'number'"
				:id="`value-${condition.id}`"
				type="number"
				:model-value="condition.value"
				:placeholder="fieldMeta?.placeholder"
				:min="fieldMeta?.min"
				:max="fieldMeta?.max"
				:step="fieldMeta?.step"
				:class="{ 'border-destructive': hasError }"
				@update:model-value="updateValue"
			/>

			<!-- Text input (default) -->
			<Input
				v-else
				:id="`value-${condition.id}`"
				:model-value="condition.value"
				:placeholder="
					fieldMeta?.placeholder ||
					$t('rule-builder-placeholders-enter-value')
				"
				:class="{ 'border-destructive': hasError }"
				@update:model-value="updateValue"
			/>

			<!-- Field hint -->
			<p
				v-if="fieldMeta?.valueDescription && showLabels"
				class="text-xs text-muted-foreground"
			>
				{{ fieldMeta.valueDescription }}
			</p>

			<!-- Validation error -->
			<p v-if="hasError" class="text-xs text-destructive">
				{{ error }}
			</p>
		</div>

		<!-- Remove button -->
		<Button
			v-if="showRemove"
			class="mt-7"
			type="button"
			variant="ghost"
			size="icon"
			@click="emit('remove')"
		>
			<X class="w-4 h-4" />
		</Button>
	</div>
</template>

<script setup lang="ts">
import { X } from "lucide-vue-next";
import { computed } from "vue";

import {
	ConditionService,
	type ConditionDTO,
	ConditionField,
	ConditionOperator,
} from "@/domain/components/rule-builder";

interface Props {
	showRemove?: boolean;
	showLabels?: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
	remove: [];
}>();

const condition = defineModel<ConditionDTO>("condition", {
	required: true,
});

const fields = ConditionService.getFields();
const operators = ConditionService.getOperators();

const fieldMeta = computed(() => {
	if (!condition.value.field) return null;
	return ConditionService.getFieldDefinition(condition.value.field)?.meta;
});

const error = computed(() => {
	if (!condition.value.field) return null;
	return ConditionService.validateConditionValue(condition.value);
});

const hasError = computed(() => !!error.value);

const updateField = (value: ConditionField) => {
	condition.value = {
		...condition.value,
		field: value,
		value: "", // Reset value when field changes
	};
};

const updateOperator = (value: ConditionOperator) => {
	condition.value = {
		...condition.value,
		operator: value,
	};
};

const updateValue = (value: string) => {
	condition.value = {
		...condition.value,
		value,
	};
};
</script>
