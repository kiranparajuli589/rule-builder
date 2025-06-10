<script setup lang="ts">
import { useFluent } from "fluent-vue";
import { Plus, Brackets, FolderPlus, AlertCircle } from "lucide-vue-next";
import { computed } from "vue";

import { useToast } from "@/components/ui/toast/use-toast";
import {
	ConditionService,
	RuleService,
	type ConditionDTO,
	JoinOperator,
} from "@/domain/components/rule-builder";

import ConditionGroup from "./ConditionGroup.vue";
import ConditionInputs from "./ConditionInputs.vue";

const conditions = defineModel<ConditionDTO[]>("conditions", {
	required: true,
	default: () => [ConditionService.createEmptyCondition(false)], // First condition has no joinOperator
});

const { $t: translate } = useFluent();
const { toast } = useToast();

const joinOperators = ConditionService.getJoinOperators();
const depthLimit = RuleService.DEPTH_LIMIT;

const currentDepth = computed(() =>
	RuleService.calculateDepth(conditions.value)
);

const isAtDepthLimit = computed(() => currentDepth.value >= depthLimit);

const canAddBrackets = computed(
	() =>
		conditions.value.length >= 2 &&
		!conditions.value.every((c) => c.isGroup) &&
		currentDepth.value < depthLimit
);

const canAddGroup = computed(
	() => conditions.value.length >= 2 && currentDepth.value < depthLimit
);

/**
 * Ensures a condition has a valid ID and proper structure
 */
const ensureConditionId = (condition: ConditionDTO): ConditionDTO => {
	if (!condition.id) {
		condition.id = ConditionService.generateId();
	}

	// For regular conditions, ensure they don't have unnecessary conditions array
	if (!condition.isGroup) {
		// Remove conditions array from regular conditions in the working copy
		// but keep it for UI consistency during editing
		if (!condition.conditions) {
			condition.conditions = [];
		}
	}

	// Recursively ensure IDs for nested conditions
	if (condition.isGroup && condition.conditions) {
		condition.conditions = condition.conditions.map(ensureConditionId);
	}

	return condition;
};

/**
 * Deep clones conditions and ensures all have valid IDs
 */
const cloneConditionsWithIds = (conditions: ConditionDTO[]): ConditionDTO[] =>
	conditions.map((condition) => {
		const cloned = JSON.parse(JSON.stringify(condition)) as ConditionDTO;
		return ensureConditionId(cloned);
	});

const addCondition = () => {
	// New condition should have joinOperator since it's not the first
	const newCondition = ConditionService.createEmptyCondition(true);
	conditions.value = [...conditions.value, newCondition];
};

const removeCondition = (index: number) => {
	const newConditions = [...conditions.value];
	newConditions.splice(index, 1);

	if (newConditions.length === 0) {
		// If no conditions left, add a new one without joinOperator (first condition)
		newConditions.push(ConditionService.createEmptyCondition(false));
	} else {
		// Normalize join operators after removal - first condition should not have joinOperator
		newConditions.forEach((condition, i) => {
			if (i === 0) {
				delete condition.joinOperator;
			} else if (!condition.joinOperator) {
				condition.joinOperator = JoinOperator.AND;
			}
		});
	}

	conditions.value = newConditions;
};

const updateJoinOperator = (index: number, value: JoinOperator) => {
	const newConditions = [...conditions.value];
	newConditions[index].joinOperator = value;

	// Keep join operators consistent if more than 2 conditions
	if (newConditions.length > 2) {
		newConditions.forEach((condition, i) => {
			if (i > 0) {
				// Skip first condition
				condition.joinOperator = value;
			}
		});
	}

	conditions.value = newConditions;
};

const bracketConditions = () => {
	if (isAtDepthLimit.value) {
		toast({
			title: translate("rule-builder-warnings-cannot-add-brackets"),
			description: translate("rule-builder-warnings-depth-limit", {
				limit: depthLimit,
			}),
			variant: "destructive",
		});
		return;
	}

	// Clone existing conditions with proper IDs
	const clonedConditions = cloneConditionsWithIds(conditions.value);

	// Normalize join operators within the group (first should not have joinOperator)
	const normalizedGroupConditions = clonedConditions.map((condition, i) => {
		const normalized = { ...condition };
		if (i === 0) {
			delete normalized.joinOperator;
		} else if (!normalized.joinOperator) {
			normalized.joinOperator = JoinOperator.AND;
		}
		return normalized;
	});

	// Create group with cloned conditions - group will get joinOperator since it's not first
	const group = ConditionService.createGroup(normalizedGroupConditions, true);

	// Create new condition to go alongside the group
	const newCondition = ConditionService.createEmptyCondition(false); // This will be second, but group takes precedence

	// Update conditions with the group and new condition
	conditions.value = [group, newCondition];
};

const addGroup = () => {
	if (isAtDepthLimit.value) {
		toast({
			title: translate("rule-builder-warnings-cannot-add-group"),
			description: translate("rule-builder-warnings-depth-limit", {
				limit: depthLimit,
			}),
			variant: "destructive",
		});
		return;
	}

	const lastCondition = conditions.value[conditions.value.length - 1];

	// Clone the last condition with proper ID
	const clonedCondition = ensureConditionId(
		JSON.parse(JSON.stringify(lastCondition))
	);

	// Remove joinOperator from cloned condition as it will be first in group
	delete clonedCondition.joinOperator;

	// Create group with cloned condition and a new one
	const group = ConditionService.createGroup(
		[
			clonedCondition,
			ConditionService.createEmptyCondition(true), // Second condition in group has joinOperator
		],
		true
	); // Group itself has joinOperator since it replaces the last condition

	const newConditions = [...conditions.value];
	newConditions[newConditions.length - 1] = group;
	conditions.value = newConditions;
};
</script>

<template>
	<div class="space-y-4">
		<div
			v-for="(condition, index) in conditions"
			:key="condition.id || `condition-${index}`"
		>
			<!-- Group condition -->
			<ConditionGroup
				v-if="condition.isGroup"
				v-model:group="conditions[index]"
				:nesting-level="1"
				@remove="removeCondition(index)"
			/>

			<!-- Regular condition -->
			<ConditionInputs
				v-else
				v-model:condition="conditions[index]"
				:show-remove="conditions.length > 1"
				:show-labels="index === 0"
				@remove="removeCondition(index)"
			/>

			<!-- Join operator - only show between conditions (not after the last one) -->
			<div
				v-if="index < conditions.length - 1"
				class="flex justify-center max-w-24"
			>
				<Select
					:model-value="
						conditions[index + 1]?.joinOperator || JoinOperator.AND
					"
					@update:model-value="updateJoinOperator(index + 1, $event)"
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem
							v-for="op in joinOperators"
							:key="op.value"
							:value="op.value"
						>
							{{ $t(op.label) }}
						</SelectItem>
					</SelectContent>
				</Select>
			</div>
		</div>

		<!-- Action buttons -->
		<div class="flex gap-2 pt-4">
			<Button
				type="button"
				variant="outline"
				size="sm"
				@click="addCondition"
			>
				<Plus class="w-4 h-4 mr-1" />
				{{ $t("rule-builder-actions-add-condition") }}
			</Button>

			<Button
				v-if="canAddBrackets"
				type="button"
				variant="outline"
				size="sm"
				@click="bracketConditions"
			>
				<Brackets class="w-4 h-4 mr-1" />
				{{ $t("rule-builder-actions-bracket-conditions") }}
			</Button>

			<Button
				v-if="canAddGroup"
				type="button"
				variant="outline"
				size="sm"
				@click="addGroup"
			>
				<FolderPlus class="w-4 h-4 mr-1" />
				{{ $t("rule-builder-actions-add-group") }}
			</Button>
		</div>

		<!-- Depth limit warning -->
		<Alert v-if="isAtDepthLimit" variant="warning">
			<AlertCircle class="h-4 w-4" />
			<AlertDescription>
				{{
					$t("rule-builder-warnings-depth-limit", {
						limit: depthLimit,
					})
				}}
			</AlertDescription>
		</Alert>
	</div>
</template>
