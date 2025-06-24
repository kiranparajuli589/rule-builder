<script setup lang="ts">
import { useFluent } from "fluent-vue";
import { Plus, Brackets, FolderPlus, AlertCircle } from "lucide-vue-next";
import { computed, watch } from "vue";

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

// Calculate current depth of the entire conditions structure
const currentDepth = computed(() =>
	RuleService.calculateDepth(conditions.value)
);

const isAtDepthLimit = computed(() => currentDepth.value >= depthLimit);

// Simulate what depth would be after bracketing
const depthAfterBracketing = computed(() => {
	if (conditions.value.length < 2) return currentDepth.value;

	// Bracketing adds one level of nesting to all current conditions
	return currentDepth.value + 1;
});

// Simulate what depth would be after adding a group
const depthAfterGrouping = computed(() => {
	if (conditions.value.length < 2) return currentDepth.value;

	// Adding a group takes the last condition and nests it one level deeper
	// So we need to check if the last condition, when nested, would exceed the limit
	return currentDepth.value + 1;
});

const canAddBrackets = computed(
	() =>
		conditions.value.length >= 2 &&
		!conditions.value.every((c) => c.isGroup) &&
		depthAfterBracketing.value <= depthLimit
);

const canAddGroup = computed(
	() => conditions.value.length >= 2 && depthAfterGrouping.value <= depthLimit
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
 * Normalizes join operators for a conditions array
 * First condition should never have joinOperator
 * Subsequent conditions should have joinOperator (default to AND)
 */
const normalizeJoinOperators = (
	conditionsArray: ConditionDTO[],
	defaultOperator: JoinOperator = JoinOperator.AND
): ConditionDTO[] =>
	conditionsArray.map((condition, index) => {
		const normalized = { ...condition };

		if (index === 0) {
			// First condition should never have joinOperator
			delete normalized.joinOperator;
		} else if (!normalized.joinOperator) {
			normalized.joinOperator = defaultOperator;
		}

		// Recursively normalize nested conditions
		if (normalized.isGroup && normalized.conditions) {
			normalized.conditions = normalizeJoinOperators(
				normalized.conditions,
				normalized.joinOperator || defaultOperator
			);
		}

		return normalized;
	});

/**
 * Deep clones conditions and ensures all have valid IDs and normalized operators
 */
const cloneConditionsWithIds = (conditions: ConditionDTO[]): ConditionDTO[] => {
	const cloned = conditions.map((condition) => {
		const clonedCondition = JSON.parse(
			JSON.stringify(condition)
		) as ConditionDTO;
		return ensureConditionId(clonedCondition);
	});
	return normalizeJoinOperators(cloned);
};

// Watch for changes and normalize join operators
watch(
	conditions,
	(newConditions) => {
		if (newConditions && newConditions.length > 0) {
			const normalized = normalizeJoinOperators(newConditions);
			// Only update if there are actual changes to prevent infinite loops
			if (JSON.stringify(normalized) !== JSON.stringify(newConditions)) {
				conditions.value = normalized;
			}
		}
	},
	{ deep: true }
);

const addCondition = () => {
	// New condition should have joinOperator since it's not the first
	const newCondition = ConditionService.createEmptyCondition(false);
	const updatedConditions = [...conditions.value, newCondition];
	conditions.value = normalizeJoinOperators(updatedConditions);
};

const removeCondition = (index: number) => {
	const newConditions = [...conditions.value];
	newConditions.splice(index, 1);

	if (newConditions.length === 0) {
		// If no conditions left, add a new one without joinOperator (first condition)
		newConditions.push(ConditionService.createEmptyCondition(false));
	}

	conditions.value = normalizeJoinOperators(newConditions);
};

const updateJoinOperator = (index: number, value: JoinOperator) => {
	const newConditions = [...conditions.value];

	// Update the specific condition's join operator
	if (newConditions[index]) {
		newConditions[index].joinOperator = value;
	}

	// Keep join operators consistent if more than 2 conditions
	if (newConditions.length > 2) {
		newConditions.forEach((condition, i) => {
			if (i > 0) {
				// Skip first condition (should never have joinOperator)
				condition.joinOperator = value;
			}
		});
	}

	conditions.value = normalizeJoinOperators(newConditions, value);
};

const bracketConditions = () => {
	// Double-check depth limit before proceeding
	if (depthAfterBracketing.value > depthLimit) {
		toast({
			title: translate("rule-builder-warnings-cannot-bracket"),
			description: translate(
				"rule-builder-warnings-depth-limit-exceeded",
				{
					limit: depthLimit,
				}
			),
			variant: "destructive",
		});
		return;
	}

	// Clone existing conditions with proper IDs
	const clonedConditions = cloneConditionsWithIds(conditions.value);

	// Create group with cloned conditions - group will get joinOperator since it's not first
	const group = ConditionService.createGroup(clonedConditions, false);

	// Normalize the group's internal conditions
	group.conditions = normalizeJoinOperators(group.conditions || []);

	// Create new condition to go alongside the group
	const newCondition = ConditionService.createEmptyCondition(false);

	// Update conditions with the group and new condition
	const updatedConditions = [group, newCondition];
	conditions.value = normalizeJoinOperators(updatedConditions);
};

const addGroup = () => {
	// Double-check depth limit before proceeding
	if (depthAfterGrouping.value > depthLimit) {
		toast({
			title: translate("rule-builder-warnings-cannot-add-group"),
			description: translate(
				"rule-builder-warnings-depth-limit-exceeded",
				{
					limit: depthLimit,
				}
			),
			variant: "destructive",
		});
		return;
	}

	const lastCondition = conditions.value[conditions.value.length - 1];

	// Validate that the last condition is meaningful
	if (
		!lastCondition.isGroup &&
		(!lastCondition.field ||
			!lastCondition.value ||
			lastCondition.value.trim() === "")
	) {
		toast({
			title: "Cannot add group",
			description:
				"Complete the current condition before adding a new group",
			variant: "destructive",
		});
		return;
	}

	// Clone the last condition with proper ID
	const clonedCondition = ensureConditionId(
		JSON.parse(JSON.stringify(lastCondition))
	);

	// Remove joinOperator from cloned condition as it will be first in group
	delete clonedCondition.joinOperator;

	// Create group with cloned condition and a new one
	const groupConditions = [
		clonedCondition,
		ConditionService.createEmptyCondition(false), // Will get joinOperator in normalization
	];

	const group = ConditionService.createGroup(
		normalizeJoinOperators(groupConditions),
		false
	);

	const newConditions = [...conditions.value];
	newConditions[newConditions.length - 1] = group;
	conditions.value = normalizeJoinOperators(newConditions);
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
				v-model="conditions[index]"
				:nesting-level="1"
				@remove="removeCondition(index)"
			/>

			<!-- Regular condition -->
			<ConditionInputs
				v-else
				v-model="conditions[index]"
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
				type="button"
				variant="outline"
				size="sm"
				:disabled="!canAddBrackets"
				@click="bracketConditions"
			>
				<Brackets class="w-4 h-4 mr-1" />
				{{ $t("rule-builder-actions-bracket-conditions") }}
			</Button>

			<Button
				type="button"
				variant="outline"
				size="sm"
				:disabled="!canAddGroup"
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
