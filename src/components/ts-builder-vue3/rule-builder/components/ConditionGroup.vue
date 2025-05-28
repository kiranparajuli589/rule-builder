<script lang="ts" setup>
import { computed, ref } from "vue";
import { toast } from "vue-sonner";

import { generateId } from "@/domain/components/rule-builder/ConditionService.ts";
import {
	RuleService,
	JoinOperator,
	ConditionService,
} from "@/domain/components/rule-builder/index.ts";
import { ConditionDTO } from "@/domain/components/rule-builder/types.ts";

const props = defineProps<{
	nestingLevel: number;
}>();

const group = defineModel<ConditionDTO>("group", {
	required: true,
});

const groupConditions = computed(() => group.value.conditions || []);
const conditionCount = computed(() => {
	if (!groupConditions.value || groupConditions.value.length === 0) {
		return 0;
	}
	let count = 0;
	for (const condition of groupConditions.value) {
		if (condition.isGroup && condition.conditions?.length) {
			count += condition.conditions.length;
		} else {
			count++;
		}
	}

	return count;
});
const groupSummary = computed(
	() =>
		`Contains ${conditionCount.value} condition${
			conditionCount.value > 1 ? "s" : ""
		}`
);
const hasOnlyGroupsInGroup = computed(
	() =>
		conditionCount.value > 0 &&
		groupConditions.value.every((c) => c?.isGroup)
);

const isAtDepthLimit = computed(
	() => props.nestingLevel >= RuleService.DEPTH_LIMIT
);

const canAddBrackets = computed(
	() =>
		!isAtDepthLimit.value &&
		conditionCount.value >= 2 &&
		!groupConditions.value.every((c) => c.isGroup)
);

const canAddNestedGroup = computed(
	() => !isAtDepthLimit.value && conditionCount.value >= 2
);

const isCollapsed = ref(false);
const toggleCollapsed = () => {
	isCollapsed.value = !isCollapsed.value;
};

const isGroupCondition = (index: number) =>
	groupConditions.value[index]?.isGroup;

const updateJoinOperator = (index: number, value: JoinOperator) => {
	group.value.joinOperator = value;

	// if more than 2 conditions, keep join operator consistent
	if (groupConditions.value.length > 2) {
		groupConditions.value.forEach((condition, i) => {
			if (i !== index && condition.joinOperator !== value) {
				condition.joinOperator = value;
			}
		});
	}
};

const createNewCondition = () =>
	ConditionService.createNewCondition({
		joinOperator: group.value.joinOperator,
	});

const addCondition = () => {
	const newCondition = createNewCondition();
	group.value.conditions = [...groupConditions.value, newCondition];

	// todo: validate
};

const removeCondition = (index: number) => {
	const newConditions = [...groupConditions.value];
	if (newConditions[index]) {
		newConditions.splice(index, 1);
	}
	if (newConditions.length === 0) {
		newConditions.push(createNewCondition());
	}
	group.value.conditions = newConditions;

	// todo: validate
};

const bracketGroupConditions = () => {
	if (isAtDepthLimit.value) {
		toast.warning("Cannot add brackets at maximum nesting level.");

		return;
	}

	const nestedGroup = {
		id: generateId(),
		isGroup: true,
		joinOperator: group.value.joinOperator || JoinOperator.AND,
		conditions: JSON.parse(JSON.stringify(groupConditions.value)),
	} as ConditionDTO;

	const newConditions = [nestedGroup, createNewCondition()];
};
</script>

<template>
	<div class="condition_group group" :class="[`level-${nestingLevel}`]">
		<div class="group__header">
			<div class="group__marker">
				<Tooltip>
					<TooltipTrigger as-child>
						<Button v-if="nestingLevel > 1"> </Button>
					</TooltipTrigger>
				</Tooltip>
			</div>
		</div>
	</div>
</template>
