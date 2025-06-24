<script setup lang="ts">
import { useFluent } from "fluent-vue";
import { X, ChevronDown, Plus, Brackets, FolderPlus } from "lucide-vue-next";
import { ref, computed, watch } from "vue";

import { useToast } from "@/components/ui/toast/use-toast";
import {
	ConditionService,
	RuleService,
	type ConditionDTO,
	JoinOperator,
} from "@/domain/components/rule-builder";

import ConditionInputs from "./ConditionInputs.vue";

const props = defineProps<{
	nestingLevel: number;
}>();

const emit = defineEmits<{
	remove: [];
}>();

const { $t: translate } = useFluent();
const { toast } = useToast();

// Use defineModel for the group
const group = defineModel<ConditionDTO>({ required: true });

// Use a computed ref to ensure reactive updates for deep nesting
const groupConditions = computed({
	get: () => group.value?.conditions || [],
	set: (value: ConditionDTO[]) => {
		if (group.value) {
			group.value.conditions = value;
		}
	},
});

const isCollapsed = ref(props.nestingLevel > 2);
const joinOperators = ConditionService.getJoinOperators();
const depthLimit = RuleService.DEPTH_LIMIT;

// Calculate the depth of this group's contents
const currentGroupDepth = computed(() =>
	RuleService.calculateDepth(groupConditions.value)
);

// Calculate what the depth would be after bracketing
const depthAfterBracketing = computed(() => {
	if (groupConditions.value.length < 2) return currentGroupDepth.value;
	// Bracketing adds one level of nesting to all current conditions in this group
	return currentGroupDepth.value + 1;
});

// Calculate what the depth would be after adding a nested group
const depthAfterGrouping = computed(() => {
	if (groupConditions.value.length < 2) return currentGroupDepth.value;
	// Adding a group takes the last condition and nests it one level deeper
	return currentGroupDepth.value + 1;
});

// Check if we're at the absolute depth limit considering our current nesting level
const absoluteDepthAfterBracketing = computed(
	() => props.nestingLevel + depthAfterBracketing.value
);

const absoluteDepthAfterGrouping = computed(
	() => props.nestingLevel + depthAfterGrouping.value
);

const groupSummary = computed(() => {
	const count = groupConditions.value.length || 0;
	const hasNestedGroups = groupConditions.value.some((c) => c.isGroup);
	const regularConditions = groupConditions.value.filter(
		(c) => !c.isGroup
	).length;
	const nestedGroups = groupConditions.value.filter((c) => c.isGroup).length;

	let summary = `${count} condition${count !== 1 ? "s" : ""}`;
	if (hasNestedGroups) {
		summary += ` (${regularConditions} direct, ${nestedGroups} group${nestedGroups !== 1 ? "s" : ""})`;
	}

	// Add a preview of the first few conditions
	const preview = groupConditions.value
		.filter((c) => !c.isGroup && c.field && c.value)
		.slice(0, 2)
		.map((c) => `${c.field} ${c.operator} "${c.value}"`)
		.join(", ");

	if (preview) {
		summary += ` - ${preview}${groupConditions.value.length > 2 ? "..." : ""}`;
	}

	return summary;
});

// Check if operations would exceed the absolute depth limit
const canAddBrackets = computed(
	() =>
		groupConditions.value.length >= 2 &&
		!groupConditions.value.every((c) => c.isGroup) &&
		absoluteDepthAfterBracketing.value <= depthLimit
);

const canAddNestedGroup = computed(
	() =>
		groupConditions.value.length >= 2 &&
		absoluteDepthAfterGrouping.value <= depthLimit
);

/**
 * Ensures a condition has a valid ID and proper structure
 */
const ensureConditionId = (condition: ConditionDTO): ConditionDTO => {
	if (!condition.id) {
		condition.id = ConditionService.generateId();
	}

	// Ensure conditions array exists for all conditions (for UI consistency)
	if (!condition.conditions) {
		condition.conditions = [];
	}

	// Recursively ensure IDs for nested conditions
	if (condition.isGroup && condition.conditions.length > 0) {
		condition.conditions = condition.conditions.map(ensureConditionId);
	}

	return condition;
};

/**
 * Normalizes join operators for THIS GROUP ONLY
 * First condition should never have joinOperator
 * Subsequent conditions should have joinOperator
 * DOES NOT affect nested groups - only this level
 */
const normalizeJoinOperatorsThisGroupOnly = (
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

		return normalized;
	});

/**
 * Deep clones conditions and ensures all have valid IDs
 */
const cloneConditionsWithIds = (conditions: ConditionDTO[]): ConditionDTO[] => {
	const cloned = conditions.map((condition) => {
		const clonedCondition = JSON.parse(
			JSON.stringify(condition)
		) as ConditionDTO;
		return ensureConditionId(clonedCondition);
	});
	return normalizeJoinOperatorsThisGroupOnly(cloned);
};

// Ensure group has proper ID and structure when mounted/updated
watch(
	group,
	(newGroup) => {
		if (newGroup && !newGroup.id) {
			newGroup.id = ConditionService.generateId();
		}
		if (newGroup && !newGroup.conditions) {
			newGroup.conditions = [];
		}
	},
	{ immediate: true }
);

const addCondition = () => {
	const newCondition = ConditionService.createEmptyCondition(false);
	const updatedConditions = [...groupConditions.value, newCondition];
	groupConditions.value =
		normalizeJoinOperatorsThisGroupOnly(updatedConditions);
};

const removeCondition = (index: number) => {
	const newConditions = [...groupConditions.value];
	newConditions.splice(index, 1);

	if (newConditions.length === 0) {
		newConditions.push(ConditionService.createEmptyCondition(false));
	}

	groupConditions.value = normalizeJoinOperatorsThisGroupOnly(newConditions);
};

const updateJoinOperator = (index: number, value: JoinOperator) => {
	const newConditions = [...groupConditions.value];

	// Update the specific condition's join operator
	if (newConditions[index]) {
		newConditions[index].joinOperator = value;
	}

	// ONLY keep join operators consistent within THIS GROUP - don't affect nested groups
	if (newConditions.length > 2) {
		newConditions.forEach((condition, i) => {
			if (i > 0 && !condition.isGroup) {
				// Skip first condition and don't change nested groups
				condition.joinOperator = value;
			}
		});
	}

	groupConditions.value = normalizeJoinOperatorsThisGroupOnly(
		newConditions,
		value
	);
};

const bracketConditions = () => {
	// Double-check depth limit before proceeding
	if (absoluteDepthAfterBracketing.value > depthLimit) {
		toast({
			title: translate("rule-builder-warnings-cannot-bracket"),
			description: translate(
				"rule-builder-warnings-depth-limit-exceeded",
				{
					limit: depthLimit,
					currentLevel: props.nestingLevel,
				}
			),
			variant: "destructive",
		});
		return;
	}

	// Clone existing conditions with proper IDs
	const clonedConditions = cloneConditionsWithIds(groupConditions.value);

	// Create nested group with cloned conditions
	const nestedGroup = ConditionService.createGroup(clonedConditions, false);

	// Normalize only the nested group's internal conditions
	nestedGroup.conditions = normalizeJoinOperatorsThisGroupOnly(
		nestedGroup.conditions || []
	);

	// Create new condition to go alongside the nested group
	const newCondition = ConditionService.createEmptyCondition(false);

	// Update group conditions
	const updatedConditions = [nestedGroup, newCondition];
	groupConditions.value =
		normalizeJoinOperatorsThisGroupOnly(updatedConditions);
};

const addNestedGroup = () => {
	// Double-check depth limit before proceeding
	if (absoluteDepthAfterGrouping.value > depthLimit) {
		toast({
			title: translate("rule-builder-warnings-cannot-add-group"),
			description: translate(
				"rule-builder-warnings-depth-limit-exceeded",
				{
					limit: depthLimit,
					currentLevel: props.nestingLevel,
				}
			),
			variant: "destructive",
		});
		return;
	}

	const conditions = groupConditions.value;
	const lastCondition = conditions[conditions.length - 1];

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

	// Create nested group with cloned condition and a new one
	const groupConditionsArray = [
		clonedCondition,
		ConditionService.createEmptyCondition(false),
	];

	const nestedGroup = ConditionService.createGroup(
		normalizeJoinOperatorsThisGroupOnly(groupConditionsArray),
		false
	);

	const newConditions = [...conditions];
	newConditions[newConditions.length - 1] = nestedGroup;
	groupConditions.value = normalizeJoinOperatorsThisGroupOnly(newConditions);
};
</script>

<template>
	<Card
		class="relative"
		:class="[
			`nesting-level-${nestingLevel}`,
			nestingLevel >= 1 ? 'mb-4' : '',
		]"
	>
		<CardHeader class="py-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<Badge variant="secondary">
						Level {{ nestingLevel }}
					</Badge>
					<Button
						v-if="nestingLevel > 1"
						type="button"
						variant="ghost"
						size="sm"
						@click="isCollapsed = !isCollapsed"
					>
						<ChevronDown
							class="w-4 h-4 transition-transform"
							:class="{ 'rotate-180': isCollapsed }"
						/>
						<span class="sr-only">
							{{ isCollapsed ? "Expand" : "Collapse" }} group
						</span>
					</Button>
				</div>

				<Button
					type="button"
					variant="ghost"
					size="icon"
					@click="emit('remove')"
				>
					<X class="w-4 h-4" />
				</Button>
			</div>

			<!-- Summary when collapsed -->
			<div
				v-if="isCollapsed"
				class="mt-3 p-4 bg-muted/50 rounded-md border"
			>
				<div class="text-sm font-medium mb-2">Group Summary</div>
				<p class="text-sm text-muted-foreground mb-2">
					{{ groupSummary }}
				</p>
				<div class="text-xs text-muted-foreground">
					<Badge variant="outline" size="sm">
						Click chevron to expand and edit
					</Badge>
				</div>
			</div>
		</CardHeader>

		<CardContent v-show="!isCollapsed" class="space-y-4">
			<div
				v-for="(condition, index) in groupConditions"
				:key="`${group.id}-${condition.id || index}-${nestingLevel}`"
			>
				<!-- Nested group -->
				<ConditionGroup
					v-if="condition.isGroup"
					v-model="groupConditions[index]"
					:nesting-level="nestingLevel + 1"
					@remove="removeCondition(index)"
				/>

				<!-- Regular condition -->
				<ConditionInputs
					v-else
					v-model="groupConditions[index]"
					:show-remove="groupConditions.length > 1"
					@remove="removeCondition(index)"
				/>

				<!-- Join operator -->
				<div
					v-if="index < groupConditions.length - 1"
					class="flex justify-center my-2"
				>
					<div class="max-w-24">
						<Select
							:model-value="
								groupConditions[index + 1]?.joinOperator ||
								JoinOperator.AND
							"
							@update:model-value="
								updateJoinOperator(index + 1, $event)
							"
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
			</div>

			<!-- Group actions -->
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
					:disabled="!canAddNestedGroup"
					@click="addNestedGroup"
				>
					<FolderPlus class="w-4 h-4 mr-1" />
					{{ $t("rule-builder-actions-add-group") }}
				</Button>
			</div>
		</CardContent>
	</Card>
</template>

<style scoped>
.nesting-level-1 {
	@apply border-blue-200 bg-blue-50;
}

.nesting-level-2 {
	@apply border-green-200 bg-green-50;
}

.nesting-level-3 {
	@apply border-orange-200 bg-orange-50;
}
</style>
