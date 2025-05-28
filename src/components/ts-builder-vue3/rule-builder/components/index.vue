<script setup lang="ts">
import { useForm } from "vee-validate";
import { ref, inject } from "vue";

import { toTypedSchema } from "@vee-validate/zod";

import CreatePatternBuilder from "@/domain/components/rule-builder/CreatePatternBuilder.vue";
import { RuleSchema } from "@/domain/schema/plugins/gaius-blackrules.schema.ts";

import RuleService from "./RuleService";
import {
	RuleBuilderInject,
	type RuleBuilderState,
	CreatePatternDTO,
} from "./types";

const state =
	inject<RuleBuilderState>(RuleBuilderInject) ?? ({} as RuleBuilderState);

const handleClose = () => {
	state.setState({
		...state,
		open: false,
	});
};

const handleSubmit = (values: any) => {
	console.log("submit", values);
};

const showDepthWarning = ref(false);

const form = useForm({
	validationSchema: toTypedSchema(RuleSchema),
	initialValues: {
		name: "",
		create_pattern: {
			conditions: [],
		},
	},
});
</script>

<template>
	<Dialog :open="state.open" modal>
		<DialogContent class="max-w-5xl w-full">
			<template #close>
				<Button
					class="absolute text-black w-8 h-8 p-0 m-0 hover:text-white right-6 top-4 rounded-full bg-transparent opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
					type="button"
					@click="handleClose"
				>
					<icon-lucide-x class="w-4 h-4" />
				</Button>
			</template>
			<DialogHeader>
				<DialogTitle>
					{{ $t("rule-builder") }}
				</DialogTitle>
			</DialogHeader>

			<form class="rule_builder__form" @submit.prevent="handleSubmit">
				<div class="rule_builder__form__content">
					<TipsCard />

					<Alert
						v-if="showDepthWarning"
						class="rule_builder__depth_warning"
						variant="warning"
					>
						<AlertTitle>
							<strong>{{ $t("warning") }}</strong>
						</AlertTitle>
						<AlertDescription>
							{{
								$t("DepthLimitWarning", {
									limit: RuleService.DEPTH_LIMIT,
								})
							}}
						</AlertDescription>
					</Alert>

					<Alert
						v-if="state.errors.length > 0"
						class="rule_builder__global_errors"
						variant="destructive"
					>
						<AlertTitle>
							<strong>{{ $t("validation-errors") }}</strong>
						</AlertTitle>
						<AlertDescription>
							<ul>
								<li
									v-for="error in state.errors"
									:key="error.field"
								>
									{{ error.message }}
								</li>
							</ul>
						</AlertDescription>
					</Alert>

					<form-text-field
						id="rule-name"
						name="name"
						:placeholder="$t('rule-name-placeholder')"
						:label="$t('rule-name')"
						:required="true"
						:description="$t('rule-name-description')"
					/>

					<create-pattern-builder
						:pattern="form.values.create_pattern"
						@update:pattern="
							form.setFieldValue('create_pattern', $event)
						"
					/>

					<slot name="secondary-form-content"></slot>
				</div>

				<div class="rule_builder__form__actions">
					<Button type="submit">
						{{ $t("save") }}
					</Button>
					<!-- reset button -->
					<Button type="reset" variant="secondary">
						{{ $t("reset") }}
					</Button>
				</div>
			</form>
		</DialogContent>
	</Dialog>
</template>
