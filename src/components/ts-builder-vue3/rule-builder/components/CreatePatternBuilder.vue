<script setup lang="ts">
import { computed } from "vue";
import { toast } from "vue-sonner";

import ConditionGroup from "./ConditionGroup.vue";
import ConditionInputs from "./ConditionInputs.vue";
import ConditionService, { generateId } from "./ConditionService";
import RuleService from "./RuleService";
import { RuleExpressionDTO, ConditionDTO, JoinOperator } from "./types.ts";

const pattern = defineModel<RuleExpressionDTO>("pattern", {
	required: true,
	default: {
		conditions: [],
	},
});

const conditions = computed(() => pattern.value.conditions);

const canAddBrackets = computed(
	() =>
		conditions.value.length >= 2 &&
		!hasOnlyGroups.value &&
		!wouldExceedDepthLimit.value
);

const canAddGroup = computed(
	() => conditions.value.length >= 2 && !wouldExceedDepthLimit.value
);

const depthLimitReached = computed(
	() => wouldExceedDepthLimit.value && conditions.value.length >= 2
);

const hasOnlyGroups = computed(
	() =>
		conditions.value.length > 0 && conditions.value.every((c) => c.isGroup)
);

const wouldExceedDepthLimit = computed(() => {
	const currentDepth = RuleService.calculateDepth(conditions.value);
	return currentDepth + 1 > RuleService.DEPTH_LIMIT;
});

const updateJoinOperator = (index: number, value: JoinOperator) => {
	if (conditions.value[index]) {
		const newConditions = [...conditions.value];
		newConditions[index].joinOperator = value;

		pattern.value.conditions = newConditions;
	}
};

const joinOperatorPreview = (index: number) => {
	if (conditions.value[index]) {
		return conditions.value[index].joinOperator;
	}
	return "Select join operator";
};

const addCondition = () => {
	const newCondition = ConditionService.createNewCondition();
	const newConditions = [...conditions.value, newCondition];
	pattern.value.conditions = newConditions;
};

const removeCondition = (index: number) => {
	if (conditions.value[index]) {
		const newConditions = [...conditions.value];
		newConditions.splice(index, 1);

		// ensure at least one condition exists
		if (newConditions.length === 0) {
			newConditions.push(ConditionService.createNewCondition());
		}

		pattern.value.conditions = newConditions;
	}
};

const addGroup = () => {
	if (wouldExceedDepthLimit.value) {
		toast.warning(
			`Cannot add group - maximum nesting depth of ${RuleService.DEPTH_LIMIT} reached.`
		);
		return;
	}

	let newConditions;

	if (conditions.value.length >= 1) {
		// If we already have conditions, create a group with the last condition and a new one
		const lastCondition = conditions.value[conditions.value.length - 1];

		// Create a new group
		const newGroup = {
			id: generateId(),
			isGroup: true,
			joinOperator: JoinOperator.AND,
			conditions: [lastCondition, ConditionService.createNewCondition()],
		};

		// Replace the last condition with the group
		newConditions = [...conditions.value, newGroup];
	} else {
		// Just add a new group with two empty conditions
		const newGroup = {
			id: generateId(),
			isGroup: true,
			joinOperator: JoinOperator.AND,
			conditions: [
				ConditionService.createNewCondition(),
				ConditionService.createNewCondition(),
			],
		} as ConditionDTO;
		newConditions = [newGroup];
	}

	pattern.value.conditions = newConditions;
};

const bracketExistingConditions = () => {
	if (wouldExceedDepthLimit.value) {
		toast.warning(
			`Cannot bracket conditions - maximum nesting depth of ${RuleService.DEPTH_LIMIT} reached.`
		);
		return;
	}

	// Create a group from all existing conditions
	const groupedConditions = {
		id: generateId(),
		isGroup: true,
		joinOperator: conditions.value[0]?.joinOperator || JoinOperator.AND,
		conditions: JSON.parse(JSON.stringify(conditions.value)),
	};

	// Replace with group and add a new condition
	pattern.value.conditions = [
		groupedConditions,
		ConditionService.createNewCondition(),
	];
};
</script>

<template>
	<div class="create_pattern">
		<div
			v-for="(condition, index) in conditions"
			:key="condition.id"
			class="create_pattern__condition_container"
		>
			<ConditionGroup
				v-if="condition.isGroup"
				v-model:group="condition"
				@remove="removeCondition(index)"
			/>

			<ConditionInputs
				v-else
				v-model:condition="condition"
				class="create_pattern__condition_row"
				:show-remove="conditions.length > 1"
				:show-labels="conditions.length <= 1"
				@remove="removeCondition(index)"
			/>

			<div
				v-if="index < conditions.length - 1"
				class="create_pattern__join_row"
			>
				<Select @update:model-value="updateJoinOperator(index, $event)">
					<SelectTrigger>
						<SelectValue
							:placeholder="joinOperatorPreview(index)"
						/>
						<SelectContent>
							<SelectGroup>
								<SelectItem
									v-for="operator in ConditionService.JOIN_OPERATORS"
									:key="operator.value"
									:value="operator.value"
								>
									{{ operator.label }}
								</SelectItem>
							</SelectGroup>
						</SelectContent>
					</SelectTrigger>
				</Select>
			</div>
		</div>

		<div class="create_pattern__actions">
			<Button @click="addCondition">
				<i-lucide-plus />
				{{ $t("add-condition") }}
			</Button>

			<Button v-if="canAddBrackets" @click="bracketExistingConditions">
				<i-lucide-brackets />
				{{ $t("bracket-conditions") }}
			</Button>

			<Button v-if="canAddGroup" @click="addGroup">
				<i-lucide-group />
				{{ $t("add-group") }}
			</Button>

			<div
				v-if="depthLimitReached"
				class="create_pattern__depth_limit_notice"
			>
				{{ $t("depth-limit-notice") }}
			</div>
		</div>
	</div>
</template>
