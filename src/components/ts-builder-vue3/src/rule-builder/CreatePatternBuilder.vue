<template>
	<div class="space-y-4">
		<pre><code>
			{{ JSON.stringify(cloneConditionsWithIds(conditions), null, 2) }}
		</code></pre>
		<div
			v-for="(condition, index) in conditions"
			:key="condition.id || `condition-${index}`"
			class="space-y-2"
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

			<!-- Join operator -->
			<div
				v-if="index < conditions.length - 1"
				class="flex justify-center py-2"
			>
				<Select
					class="w-24"
					:model-value="condition.joinOperator"
					@update:model-value="updateJoinOperator(index, $event)"
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
							{{ op.label }}
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
	default: () => [ConditionService.createEmptyCondition()],
});

const { $t } = useFluent();
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
 * Ensures a condition has a valid ID
 */
const ensureConditionId = (condition: ConditionDTO): ConditionDTO => {
	if (!condition.id) {
		condition.id = ConditionService.generateId();
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
	const newCondition = ConditionService.createEmptyCondition();
	conditions.value = [...conditions.value, newCondition];
};

const removeCondition = (index: number) => {
	const newConditions = [...conditions.value];
	newConditions.splice(index, 1);

	if (newConditions.length === 0) {
		newConditions.push(ConditionService.createEmptyCondition());
	}

	conditions.value = newConditions;
};

const updateJoinOperator = (index: number, value: JoinOperator) => {
	const newConditions = [...conditions.value];
	newConditions[index].joinOperator = value;

	// Keep join operators consistent if more than 2 conditions
	if (newConditions.length > 2) {
		newConditions.forEach((condition, i) => {
			if (i !== index) {
				condition.joinOperator = value;
			}
		});
	}

	conditions.value = newConditions;
};

const bracketConditions = () => {
	if (isAtDepthLimit.value) {
		toast({
			title: $t("rule-builder-warnings-cannot-add-brackets"),
			description: $t("rule-builder-warnings-depth-limit", {
				limit: depthLimit,
			}),
			variant: "destructive",
		});
		return;
	}

	// Clone existing conditions with proper IDs
	const clonedConditions = cloneConditionsWithIds(conditions.value);

	// Create group with cloned conditions
	const group = ConditionService.createGroup(clonedConditions);

	// Create new condition to go alongside the group
	const newCondition = ConditionService.createEmptyCondition();

	// Update conditions with the group and new condition
	conditions.value = [group, newCondition];
};

const addGroup = () => {
	if (isAtDepthLimit.value) {
		toast({
			title: $t("rule-builder-warnings-cannot-add-group"),
			description: $t("rule-builder-warnings-depth-limit", {
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

	// Create group with cloned condition and a new one
	const group = ConditionService.createGroup([
		clonedCondition,
		ConditionService.createEmptyCondition(),
	]);

	const newConditions = [...conditions.value];
	newConditions[newConditions.length - 1] = group;
	conditions.value = newConditions;
};
</script>
