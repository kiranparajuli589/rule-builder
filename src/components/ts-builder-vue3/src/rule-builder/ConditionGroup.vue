<template>
	<Card class="relative" :class="`nesting-level-${nestingLevel}`">
		<div class="absolute -left-3 top-4 text-muted-foreground text-lg">
			(
		</div>
		<div class="absolute -right-3 top-4 text-muted-foreground text-lg">
			)
		</div>

		<CardHeader class="pb-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<Badge variant="secondary">
						{{
							$t("rule-builder-labels-group-level", {
								level: nestingLevel,
							})
						}}
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
					</Button>
				</div>

				<Button
					type="button"
					variant="ghost"
					size="icon"
					@click="$emit('remove')"
				>
					<X class="w-4 h-4" />
				</Button>
			</div>

			<p v-if="isCollapsed" class="text-sm text-muted-foreground mt-2">
				{{ groupSummary }}
			</p>
		</CardHeader>

		<CardContent v-if="!isCollapsed" class="space-y-4">
			<div
				v-for="(condition, index) in group.conditions"
				:key="condition.id || `group-condition-${index}`"
				class="space-y-2"
			>
				<!-- Nested group -->
				<ConditionGroup
					v-if="condition.isGroup"
					v-model:group="group.conditions[index]"
					:nesting-level="nestingLevel + 1"
					@remove="removeCondition(index)"
				/>

				<!-- Regular condition -->
				<ConditionInputs
					v-else
					v-model="group.conditions[index]"
					:show-remove="group.conditions.length > 1"
					@remove="removeCondition(index)"
				/>

				<!-- Join operator -->
				<div
					v-if="index < group.conditions.length - 1"
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

			<!-- Group actions -->
			<div class="flex gap-2 pt-2">
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
					v-if="canAddNestedGroup"
					type="button"
					variant="outline"
					size="sm"
					@click="addNestedGroup"
				>
					<FolderPlus class="w-4 h-4 mr-1" />
					{{ $t("rule-builder-actions-add-group") }}
				</Button>
			</div>
		</CardContent>
	</Card>
</template>

<script setup lang="ts">
import { useFluent } from "fluent-vue";
import { X, ChevronDown, Plus, Brackets, FolderPlus } from "lucide-vue-next";
import { ref, computed } from "vue";

import { useToast } from "@/components/ui/toast/use-toast";
import { $t } from "@/core/plugins/fluent.ts";
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

const { $t: translate } = useFluent();
const { toast } = useToast();

const group = defineModel<ConditionDTO>("group", {
	required: true,
});

const isCollapsed = ref(props.nestingLevel > 2);
const joinOperators = ConditionService.getJoinOperators();

const groupSummary = computed(() => {
	const count = group.value.conditions?.length || 0;
	return $t("rule-builder-labels-group-summary", { count });
});

const isAtDepthLimit = computed(
	() => props.nestingLevel >= RuleService.DEPTH_LIMIT
);

const canAddBrackets = computed(
	() =>
		!isAtDepthLimit.value &&
		group.value.conditions &&
		group.value.conditions.length >= 2 &&
		!group.value.conditions.every((c) => c.isGroup)
);

const canAddNestedGroup = computed(
	() =>
		!isAtDepthLimit.value &&
		group.value.conditions &&
		group.value.conditions.length >= 2
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
	group.value.conditions = [...(group.value.conditions || []), newCondition];
};

const removeCondition = (index: number) => {
	const newConditions = [...(group.value.conditions || [])];
	newConditions.splice(index, 1);

	if (newConditions.length === 0) {
		newConditions.push(ConditionService.createEmptyCondition());
	}

	group.value.conditions = newConditions;
};

const updateJoinOperator = (index: number, value: JoinOperator) => {
	const newConditions = [...(group.value.conditions || [])];
	newConditions[index].joinOperator = value;

	// Keep join operators consistent
	if (newConditions.length > 2) {
		newConditions.forEach((condition, i) => {
			if (i !== index) {
				condition.joinOperator = value;
			}
		});
	}

	group.value.conditions = newConditions;
	group.value.joinOperator = value;
};

const bracketConditions = () => {
	if (isAtDepthLimit.value) {
		toast({
			title: translate("rule-builder-warnings-cannot-add-brackets"),
			description: translate("rule-builder-warnings-depth-limit", {
				limit: RuleService.DEPTH_LIMIT,
			}),
			variant: "destructive",
		});
		return;
	}

	// Clone existing conditions with proper IDs
	const clonedConditions = cloneConditionsWithIds(
		group.value.conditions || []
	);

	// Create nested group with cloned conditions
	const nestedGroup = ConditionService.createGroup(clonedConditions);

	// Create new condition to go alongside the nested group
	const newCondition = ConditionService.createEmptyCondition();

	// Update group conditions
	group.value.conditions = [nestedGroup, newCondition];
};

const addNestedGroup = () => {
	if (isAtDepthLimit.value) {
		toast({
			title: translate("rule-builder-warnings-cannot-add-group"),
			description: translate("rule-builder-warnings-depth-limit", {
				limit: RuleService.DEPTH_LIMIT,
			}),
			variant: "destructive",
		});
		return;
	}

	const conditions = group.value.conditions || [];
	const lastCondition = conditions[conditions.length - 1];

	// Clone the last condition with proper ID
	const clonedCondition = ensureConditionId(
		JSON.parse(JSON.stringify(lastCondition))
	);

	// Create nested group with cloned condition and a new one
	const nestedGroup = ConditionService.createGroup([
		clonedCondition,
		ConditionService.createEmptyCondition(),
	]);

	const newConditions = [...conditions];
	newConditions[newConditions.length - 1] = nestedGroup;
	group.value.conditions = newConditions;
};
</script>

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
